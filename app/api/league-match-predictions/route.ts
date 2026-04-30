import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
};

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
    return new NextResponse("Du är inte medlem i den här ligan", {
      status: 403,
    });
  }

  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_utc")
    .eq("id", matchId)
    .single();

  if (matchError || !matchRow) {
    return new NextResponse("Matchen hittades inte", { status: 404 });
  }

  const isLocked = new Date(matchRow.kickoff_utc) <= new Date();

  if (!isLocked) {
    return new NextResponse(
      "Andras tips kan bara visas när matchen är låst",
      { status: 403 }
    );
  }

  const { data: predictionRows, error: predictionsError } = await supabase
    .from("predictions")
    .select(
      "user_id, predicted_home_score, predicted_away_score, updated_at"
    )
    .eq("league_id", leagueId)
    .eq("match_id", matchId)
    .order("updated_at", { ascending: true });

  if (predictionsError) {
    return new NextResponse(
      `Kunde inte hämta tips: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  const userIds = (predictionRows ?? []).map((row) => row.user_id);

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    if (profilesError) {
      return new NextResponse(
        `Kunde inte hämta profiler: ${profilesError.message}`,
        { status: 500 }
      );
    }

    profiles = profileRows ?? [];
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  const results = (predictionRows ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);

    return {
      user_id: row.user_id,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      predicted_home_score: row.predicted_home_score,
      predicted_away_score: row.predicted_away_score,
      updated_at: row.updated_at,
    };
  });

  return NextResponse.json({
    success: true,
    locked: true,
    predictions: results,
  });
}