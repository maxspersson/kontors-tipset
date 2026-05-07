import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type MatchRow = {
  id: string;
  home_score: number | null;
  away_score: number | null;
};

type PredictionRow = {
  league_id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

function getMatchPoints(prediction: PredictionRow, match: MatchRow) {
  if (
    match.home_score === null ||
    match.away_score === null ||
    prediction.predicted_home_score === null ||
    prediction.predicted_away_score === null
  ) {
    return 0;
  }

  let points = 0;

  if (prediction.predicted_home_score === match.home_score) points += 2;
  if (prediction.predicted_away_score === match.away_score) points += 2;

  const predictedDiff =
    prediction.predicted_home_score - prediction.predicted_away_score;
  const actualDiff = match.home_score - match.away_score;

  const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
  const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

  if (predictedSign === actualSign) points += 3;

  return points;
}

export async function GET() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: nextMatch, error: nextMatchError } = await supabase
    .from("matches")
    .select(
      "id, home_team, away_team, home_team_code, away_team_code, kickoff_utc"
    )
    .gte("kickoff_utc", now)
    .order("kickoff_utc", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextMatchError) {
    return new NextResponse(
      `Kunde inte hämta nästa match: ${nextMatchError.message}`,
      { status: 500 }
    );
  }

  const { data: submissions } = await supabase
    .from("league_submissions")
    .select("league_id, user_id")
    .not("submitted_at", "is", null);

  const submissionKeys = new Set(
    (submissions ?? []).map(
      (submission) => `${submission.league_id}:${submission.user_id}`
    )
  );

  let globalTop: {
    user_id: string;
    display_name: string;
    points: number;
    exactScores: number;
  }[] = [];

  if (submissionKeys.size > 0) {
    const submittedUserIds = Array.from(
      new Set((submissions ?? []).map((submission) => submission.user_id))
    );

    const { data: predictions } = await supabase
      .from("predictions")
      .select(
        "league_id, user_id, match_id, predicted_home_score, predicted_away_score"
      )
      .in("user_id", submittedUserIds);

    const { data: matches } = await supabase
      .from("matches")
      .select("id, home_score, away_score");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", submittedUserIds);

    const matchMap = new Map<string, MatchRow>(
      ((matches ?? []) as MatchRow[]).map((match) => [match.id, match])
    );

    const profileMap = new Map<string, ProfileRow>(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ])
    );

    const scoreMap = new Map<
      string,
      {
        user_id: string;
        points: number;
        exactScores: number;
      }
    >();

    for (const submission of submissions ?? []) {
      const key = `${submission.league_id}:${submission.user_id}`;
      scoreMap.set(key, {
        user_id: submission.user_id,
        points: 0,
        exactScores: 0,
      });
    }

    for (const prediction of (predictions ?? []) as PredictionRow[]) {
      const key = `${prediction.league_id}:${prediction.user_id}`;
      if (!submissionKeys.has(key)) continue;

      const match = matchMap.get(prediction.match_id);
      if (!match) continue;

      const points = getMatchPoints(prediction, match);
      const current = scoreMap.get(key);
      if (!current) continue;

      current.points += points;
      if (points === 7) current.exactScores += 1;
    }

    globalTop = Array.from(scoreMap.values())
      .map((score) => {
        const profile = profileMap.get(score.user_id);

        return {
          user_id: score.user_id,
          display_name:
            profile?.display_name || profile?.email?.split("@")[0] || "Spelare",
          points: score.points,
          exactScores: score.exactScores,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.exactScores !== a.exactScores) {
          return b.exactScores - a.exactScores;
        }
        return a.display_name.localeCompare(b.display_name);
      })
      .slice(0, 3);
  }

  return NextResponse.json({
    success: true,
    nextMatch,
    globalTop,
  });
}