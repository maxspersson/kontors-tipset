import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PredictionRow = {
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

type MatchRow = {
  id: string;
  home_score: number | null;
  away_score: number | null;
};

function getMatchPoints(prediction: PredictionRow, match: MatchRow) {
  if (match.home_score === null || match.away_score === null) {
    return 0;
  }

  let points = 0;

  if (prediction.predicted_home_score === match.home_score) {
    points += 2;
  }

  if (prediction.predicted_away_score === match.away_score) {
    points += 2;
  }

  const predictedDiff =
    prediction.predicted_home_score - prediction.predicted_away_score;

  const actualDiff = match.home_score - match.away_score;

  const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
  const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

  if (predictedSign === actualSign) {
    points += 3;
  }

  return points;
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

  if (!leagueId) {
    return new NextResponse("leagueId krävs", { status: 400 });
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return new NextResponse("Ej medlem", { status: 403 });
  }

  // Bara användare som faktiskt har skickat in turneringstipset ska synas i tabellen.
  const { data: submissions, error: submissionsError } = await supabase
    .from("league_submissions")
    .select("user_id")
    .eq("league_id", leagueId);

  if (submissionsError) {
    return new NextResponse(
      `Kunde inte hämta inskickade tips: ${submissionsError.message}`,
      { status: 500 }
    );
  }

  const submittedUserIds = (submissions ?? []).map((submission) => submission.user_id);
  const submittedUserSet = new Set(submittedUserIds);

  if (submittedUserIds.length === 0) {
    return NextResponse.json({
      success: true,
      standings: [],
    });
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("user_id, match_id, predicted_home_score, predicted_away_score")
    .eq("league_id", leagueId)
    .in("user_id", submittedUserIds);

  if (predictionsError) {
    return new NextResponse(
      `Kunde inte hämta tips: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, home_score, away_score");

  if (matchesError) {
    return new NextResponse(
      `Kunde inte hämta matcher: ${matchesError.message}`,
      { status: 500 }
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", submittedUserIds);

  if (profilesError) {
    return new NextResponse(
      `Kunde inte hämta profiler: ${profilesError.message}`,
      { status: 500 }
    );
  }

  const matchMap = new Map((matches ?? []).map((match) => [match.id, match]));
  const scoreMap = new Map<string, number>();

  (predictions ?? []).forEach((prediction) => {
    if (!submittedUserSet.has(prediction.user_id)) return;

    const match = matchMap.get(prediction.match_id);
    if (!match) return;

    const points = getMatchPoints(prediction, match);

    scoreMap.set(
      prediction.user_id,
      (scoreMap.get(prediction.user_id) ?? 0) + points
    );
  });

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const standings = submittedUserIds.map((userId) => {
    const profile = profileMap.get(userId);

    return {
      user_id: userId,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      points: scoreMap.get(userId) ?? 0,
    };
  });

  standings.sort((a, b) => b.points - a.points);

  return NextResponse.json({
    success: true,
    standings,
  });
}