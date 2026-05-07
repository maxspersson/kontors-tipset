import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type PredictionRow = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

type MatchRow = {
  id: string;
  fifa_match_number: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
};

type SnapshotRow = PredictionRow & {
  match: MatchRow;
};

const TOTAL_REQUIRED_PREDICTIONS = 104;
const SUBMISSION_DEADLINE_UTC = Date.UTC(2026, 5, 10, 21, 59, 59, 999);

function isAfterSubmissionDeadline() {
  return Date.now() > SUBMISSION_DEADLINE_UTC;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const body = await request.json();
  const leagueId = body.leagueId;

  if (!leagueId) {
    return new NextResponse("leagueId saknas", { status: 400 });
  }

  if (isAfterSubmissionDeadline()) {
    return new NextResponse(
      "Deadline har passerat. Hela tipset skulle vara inskickat senast 10 juni 2026 kl. 23:59.",
      { status: 403 }
    );
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return new NextResponse("Du är inte medlem i den här ligan.", {
      status: 403,
    });
  }

  const { data: existingSubmission } = await supabase
    .from("league_submissions")
    .select("id, submitted_at")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingSubmission?.submitted_at) {
    return new NextResponse("Tipset är redan inskickat.", { status: 400 });
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("match_id, predicted_home_score, predicted_away_score")
    .eq("user_id", user.id)
    .eq("league_id", leagueId);

  if (predictionsError) {
    return new NextResponse(
      `Kunde inte hämta tips: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  const predictionRows = (predictions ?? []) as PredictionRow[];

  const completePredictions = predictionRows.filter(
    (prediction) =>
      prediction.match_id &&
      prediction.predicted_home_score !== null &&
      prediction.predicted_away_score !== null
  );

  if (completePredictions.length < TOTAL_REQUIRED_PREDICTIONS) {
    return new NextResponse(
      `Du måste fylla i alla ${TOTAL_REQUIRED_PREDICTIONS} matcher innan du kan skicka in tipset. Just nu är ${completePredictions.length}/${TOTAL_REQUIRED_PREDICTIONS} ifyllda.`,
      { status: 400 }
    );
  }

  const matchIds = completePredictions.map((prediction) => prediction.match_id);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, fifa_match_number, stage, group_name, home_team, away_team")
    .in("id", matchIds);

  if (matchesError) {
    return new NextResponse(
      `Kunde inte hämta matcher: ${matchesError.message}`,
      { status: 500 }
    );
  }

  const matchMap = new Map<string, MatchRow>();

  ((matches ?? []) as MatchRow[]).forEach((match) => {
    matchMap.set(match.id, match);
  });

  const snapshotRows: SnapshotRow[] = completePredictions
    .map((prediction) => {
      const match = matchMap.get(prediction.match_id);

      if (!match) {
        return null;
      }

      return {
        ...prediction,
        match,
      };
    })
    .filter((row): row is SnapshotRow => row !== null)
    .sort(
      (a, b) =>
        (a.match.fifa_match_number ?? 0) - (b.match.fifa_match_number ?? 0)
    );

  if (snapshotRows.length < TOTAL_REQUIRED_PREDICTIONS) {
    return new NextResponse(
      `Kunde inte skapa komplett snapshot. ${snapshotRows.length}/${TOTAL_REQUIRED_PREDICTIONS} matcher hittades.`,
      { status: 400 }
    );
  }

  const groupSnapshot = snapshotRows.filter(
    (prediction) => prediction.match.stage === "group"
  );

  const playoffSnapshot = snapshotRows.filter(
    (prediction) => prediction.match.stage !== "group"
  );

  const { error: submissionError } = await supabase
    .from("league_submissions")
    .upsert(
      {
        league_id: leagueId,
        user_id: user.id,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        group_snapshot: groupSnapshot,
        playoff_snapshot: playoffSnapshot,
        bonus_snapshot: null,
        total_predictions_count: snapshotRows.length,
        is_locked: true,
      },
      {
        onConflict: "league_id,user_id",
      }
    );

  if (submissionError) {
    return new NextResponse(
      `Kunde inte skicka in tipset: ${submissionError.message}`,
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    totalPredictionsCount: snapshotRows.length,
    groupPredictionsCount: groupSnapshot.length,
    playoffPredictionsCount: playoffSnapshot.length,
  });
}