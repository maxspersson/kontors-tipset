import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
};

type PredictionRow = {
  user_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

const LOCK_MINUTES_BEFORE_KICKOFF = 5;

function isPredictionLocked(kickoffUtc: string) {
  const kickoffTime = new Date(kickoffUtc).getTime();
  const lockTime = kickoffTime - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000;
  return Date.now() >= lockTime;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");
  const matchId = searchParams.get("matchId");

  if (!leagueId || !matchId) {
    return new NextResponse("leagueId och matchId krävs", { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return new NextResponse(
      `Kunde inte kontrollera medlemskap: ${membershipError.message}`,
      { status: 500 }
    );
  }

  if (!membership) {
    return new NextResponse("Du är inte medlem i ligan", { status: 403 });
  }

  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_utc")
    .eq("id", matchId)
    .single();

  if (matchError || !matchRow) {
    return new NextResponse("Matchen hittades inte", { status: 404 });
  }

  const locked = isPredictionLocked(matchRow.kickoff_utc);

  const { data: members, error: membersError } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);

  if (membersError) {
    return new NextResponse(
      `Kunde inte hämta medlemmar: ${membersError.message}`,
      { status: 500 }
    );
  }

  const userIds = (members ?? []).map((m) => m.user_id);

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    if (profileError) {
      return new NextResponse(
        `Kunde inte hämta profiler: ${profileError.message}`,
        { status: 500 }
      );
    }

    profiles = profileRows ?? [];
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("user_id, predicted_home_score, predicted_away_score")
    .eq("league_id", leagueId)
    .eq("match_id", matchId);

  if (predictionsError) {
    return new NextResponse(
      `Kunde inte hämta tips: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  const predictionMap = new Map(
    (predictions ?? []).map((p: PredictionRow) => [p.user_id, p])
  );

  const result = userIds.map((id) => {
    const profile = profileMap.get(id);
    const prediction = predictionMap.get(id);

    return {
      user_id: id,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      has_prediction: Boolean(prediction),
      predicted_home_score: locked ? prediction?.predicted_home_score ?? null : null,
      predicted_away_score: locked ? prediction?.predicted_away_score ?? null : null,
    };
  });

  return NextResponse.json({
    success: true,
    locked,
    lockMinutesBeforeKickoff: LOCK_MINUTES_BEFORE_KICKOFF,
    members: result,
  });
}