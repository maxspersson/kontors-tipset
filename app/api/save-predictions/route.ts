import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type IncomingPrediction = {
  matchId?: string;
  homeScore?: string;
  awayScore?: string;
};

type MatchRow = {
  id: string;
  kickoff_utc: string;
  stage: string;
};

const LOCK_MINUTES_BEFORE_KICKOFF = 60;
const SUBMISSION_DEADLINE_UTC = Date.UTC(2026, 5, 10, 21, 59, 59, 999);

function isAfterSubmissionDeadline() {
  return Date.now() > SUBMISSION_DEADLINE_UTC;
}

function isPredictionLocked(kickoffUtc: string) {
  const kickoffTime = new Date(kickoffUtc).getTime();
  const lockTime = kickoffTime - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000;

  return Date.now() >= lockTime;
}

function isValidScore(value: string | undefined) {
  if (value === undefined || value === "") return false;
  return /^\d+$/.test(value);
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
  const predictions: IncomingPrediction[] = body.predictions;

  if (!leagueId || !Array.isArray(predictions)) {
    return new NextResponse("Ogiltig payload", { status: 400 });
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

  const { data: submission } = await supabase
    .from("league_submissions")
    .select("id, submitted_at")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  const hasSubmitted = Boolean(submission?.submitted_at);
  const isDeadlinePassed = isAfterSubmissionDeadline();

  const validPredictions = predictions.filter(
    (prediction) =>
      prediction.matchId &&
      isValidScore(prediction.homeScore) &&
      isValidScore(prediction.awayScore)
  );

  if (validPredictions.length === 0) {
    return new NextResponse("Inga giltiga tips att spara", { status: 400 });
  }

  const matchIds = validPredictions.map((prediction) => prediction.matchId!);

  const { data: matchRows, error: matchesError } = await supabase
    .from("matches")
    .select("id, kickoff_utc, stage")
    .in("id", matchIds);

  if (matchesError) {
    return new NextResponse(`Kunde inte hämta matcher: ${matchesError.message}`, {
      status: 500,
    });
  }

  const openMatchMap = new Map<string, MatchRow>();

  ((matchRows ?? []) as MatchRow[]).forEach((match) => {
    const isGroupMatch = match.stage === "group";
    const isPlayoffMatch = match.stage !== "group";

    if (isGroupMatch && isPredictionLocked(match.kickoff_utc)) {
      return;
    }

    if (isPlayoffMatch && (hasSubmitted || isDeadlinePassed)) {
      return;
    }

    openMatchMap.set(match.id, match);
  });

  const rows = validPredictions
    .filter((prediction) => openMatchMap.has(prediction.matchId!))
    .map((prediction) => ({
      user_id: user.id,
      league_id: leagueId,
      match_id: prediction.matchId!,
      predicted_home_score: Number(prediction.homeScore),
      predicted_away_score: Number(prediction.awayScore),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return new NextResponse(
      "Inga tips kunde sparas. Gruppspelsmatcher låses 60 minuter före avspark och slutspelet är låst efter inskickat tips eller efter deadline.",
      { status: 400 }
    );
  }

  const { error } = await supabase.from("predictions").upsert(rows, {
    onConflict: "user_id,league_id,match_id",
  });

  if (error) {
    return new NextResponse(`Kunde inte spara tipsen: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({
    success: true,
    savedCount: rows.length,
    skippedCount: validPredictions.length - rows.length,
    lockMinutesBeforeKickoff: LOCK_MINUTES_BEFORE_KICKOFF,
    hasSubmitted,
    isDeadlinePassed,
  });
}