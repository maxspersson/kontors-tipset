import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

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

function getMatchPoints(
  prediction: PredictionRow,
  match: MatchRow
) {
  if (
    match.home_score === null ||
    match.away_score === null
  ) {
    return 0;
  }

  let points = 0;

  // rätt mål
  if (prediction.predicted_home_score === match.home_score) {
    points += 2;
  }

  if (prediction.predicted_away_score === match.away_score) {
    points += 2;
  }

  // rätt tecken
  const predictedDiff =
    prediction.predicted_home_score -
    prediction.predicted_away_score;

  const actualDiff = match.home_score - match.away_score;

  const predictedSign =
    predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;

  const actualSign =
    actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

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

  // kontroll medlemskap
  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return new NextResponse("Ej medlem", { status: 403 });
  }

  // hämta predictions
  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      "user_id, match_id, predicted_home_score, predicted_away_score"
    )
    .eq("league_id", leagueId);

  // hämta matcher (med resultat)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_score, away_score");

  // hämta profiler
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);

  const userIds = (members ?? []).map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds);

  const matchMap = new Map(
    (matches ?? []).map((m) => [m.id, m])
  );

  const scoreMap = new Map<string, number>();

  (predictions ?? []).forEach((prediction) => {
    const match = matchMap.get(prediction.match_id);

    if (!match) return;

    const points = getMatchPoints(prediction, match);

    scoreMap.set(
      prediction.user_id,
      (scoreMap.get(prediction.user_id) ?? 0) + points
    );
  });

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const standings = userIds.map((userId) => {
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