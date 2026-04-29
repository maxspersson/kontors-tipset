import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type IncomingPrediction = {
  matchId?: string;
  homeScore?: string;
  awayScore?: string;
};

type MatchRow = {
  id: string;
  kickoff_utc: string;
};

const LOCK_MINUTES_BEFORE_KICKOFF = 60;

function isPredictionLocked(kickoffUtc: string) {
  const kickoffTime = new Date(kickoffUtc).getTime();
  const lockTime = kickoffTime - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000;
  return Date.now() >= lockTime;
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

  const validPredictions = predictions.filter(
    (prediction) =>
      prediction.matchId &&
      prediction.homeScore !== "" &&
      prediction.awayScore !== ""
  );

  if (validPredictions.length === 0) {
    return new NextResponse("Inga tips att spara", { status: 400 });
  }

  const matchIds = validPredictions.map((prediction) => prediction.matchId!) as string[];

  const { data: matchRows, error: matchesError } = await supabase
    .from("matches")
    .select("id, kickoff_utc")
    .in("id", matchIds);

  if (matchesError) {
    return new NextResponse(`Kunde inte hämta matcher: ${matchesError.message}`, {
      status: 500,
    });
  }

  const openMatchMap = new Map<string, MatchRow>();

  (matchRows ?? []).forEach((match) => {
    if (!isPredictionLocked(match.kickoff_utc)) {
      openMatchMap.set(match.id, match);
    }
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
      `Alla valda matcher är låsta. Tips låses ${LOCK_MINUTES_BEFORE_KICKOFF} minuter före avspark.`,
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
  });
}