import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import {
  calculateStandings,
  type MatchRow,
  type PredictionRow,
  type ProfileRow,
  type SubmissionRow,
} from "../../../lib/scoring";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type ExternalMatchResult = {
  fifa_match_number: number;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
};

type LeagueRow = {
  id: string;
};

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_SYNC_SECRET;

  if (!expectedSecret) return false;

  const authHeader = request.headers.get("authorization");

  const querySecret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-cron-secret");

  return (
    authHeader === `Bearer ${expectedSecret}` ||
    querySecret === expectedSecret
  );
}

async function fetchExternalResults(): Promise<ExternalMatchResult[]> {
  const apiKey = process.env.WC2026_API_KEY;

  if (!apiKey) {
    throw new Error("Missing WC2026_API_KEY");
  }

  const response = await fetch("https://api.wc2026api.com/matches", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Kunde inte hämta matcher från WC2026 API"
    );
  }

  const matches = Array.isArray(data?.matches)
    ? data.matches
    : Array.isArray(data)
      ? data
      : Array.isArray(data?.response)
        ? data.response
        : [];

  return matches.map((match: any) => {
    const rawStatus = String(match.status || match.state || "").toLowerCase();

    const normalizedStatus =
      rawStatus.includes("complete") ||
      rawStatus.includes("finish") ||
      rawStatus === "ft"
        ? "finished"
        : rawStatus.includes("live") ||
            rawStatus.includes("progress") ||
            rawStatus.includes("playing")
          ? "live"
          : "scheduled";

    return {
      fifa_match_number:
        match.match_number ?? match.matchNumber ?? match.fifa_match_number,

      home_score:
        match.home_score ?? match.homeScore ?? match.home_goals ?? null,

      away_score:
        match.away_score ?? match.awayScore ?? match.away_goals ?? null,

      status: normalizedStatus,
    };
  });
}

async function saveStandingSnapshots() {
  const { data: leagues, error: leaguesError } = await supabase
    .from("leagues")
    .select("id")
    .eq("is_archived", false);

  if (leaguesError) {
    throw new Error(leaguesError.message);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, fifa_match_number, stage, group_name, home_team, away_team, home_score, away_score, kickoff_utc"
    )
    .eq("tournament_id", TOURNAMENT_ID);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as MatchRow[];
  const leagueRows = (leagues ?? []) as LeagueRow[];

  let insertedSnapshots = 0;

  for (const league of leagueRows) {
    const { data: submissions, error: submissionsError } = await supabase
      .from("league_submissions")
      .select("league_id, user_id, group_snapshot, playoff_snapshot, submitted_at")
      .eq("league_id", league.id)
      .not("submitted_at", "is", null);

    if (submissionsError) {
      throw new Error(submissionsError.message);
    }

    const submissionRows = (submissions ?? []) as SubmissionRow[];

    if (submissionRows.length === 0) continue;

    const submittedUserIds = submissionRows.map(
      (submission) => submission.user_id
    );

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select(
        "league_id, user_id, match_id, predicted_home_score, predicted_away_score"
      )
      .eq("league_id", league.id)
      .in("user_id", submittedUserIds);

    if (predictionsError) {
      throw new Error(predictionsError.message);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", submittedUserIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    const standings = calculateStandings({
      submissions: submissionRows,
      predictions: (predictions ?? []) as PredictionRow[],
      matches: matchRows,
      profiles: (profiles ?? []) as ProfileRow[],
    });

    if (standings.length === 0) continue;

    const snapshotRows = standings.map((player, index) => ({
      league_id: league.id,
      user_id: player.user_id,
      rank: index + 1,
      points: player.points,
    }));

    const { error: insertError } = await supabase
      .from("league_standing_snapshots")
      .insert(snapshotRows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    insertedSnapshots += snapshotRows.length;
  }

  return insertedSnapshots;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  return syncResults();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  return syncResults();
}

async function syncResults() {
  try {
    const results = await fetchExternalResults();

    const { data: currentMatches, error: currentMatchesError } = await supabase
      .from("matches")
      .select("fifa_match_number, home_score, away_score, status")
      .eq("tournament_id", TOURNAMENT_ID);

    if (currentMatchesError) {
      throw new Error(currentMatchesError.message);
    }

    const currentMatchMap = new Map(
      (currentMatches ?? []).map((match) => [
        match.fifa_match_number,
        {
          home_score: match.home_score,
          away_score: match.away_score,
          status: match.status,
        },
      ])
    );

    const updatedMatches: number[] = [];
    const skippedMatches: number[] = [];

    for (const result of results) {
      if (
        !result.fifa_match_number ||
        result.home_score === null ||
        result.away_score === null
      ) {
        if (result.fifa_match_number) {
          skippedMatches.push(result.fifa_match_number);
        }

        continue;
      }

      const currentMatch = currentMatchMap.get(result.fifa_match_number);

      const hasChanged =
        !currentMatch ||
        currentMatch.home_score !== result.home_score ||
        currentMatch.away_score !== result.away_score ||
        currentMatch.status !== result.status;

      if (!hasChanged) {
        skippedMatches.push(result.fifa_match_number);
        continue;
      }

      const { error } = await supabase
        .from("matches")
        .update({
          home_score: result.home_score,
          away_score: result.away_score,
          status: result.status,
        })
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("fifa_match_number", result.fifa_match_number);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            failedMatchNumber: result.fifa_match_number,
          },
          { status: 500 }
        );
      }

      updatedMatches.push(result.fifa_match_number);
    }

    const insertedSnapshots =
      updatedMatches.length > 0 ? await saveStandingSnapshots() : 0;

    return NextResponse.json({
      success: true,
      source: "wc2026-api",
      updated: updatedMatches.length,
      skipped: skippedMatches.length,
      snapshots: insertedSnapshots,
      updatedMatches,
      skippedMatches,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Okänt sync-fel",
      },
      { status: 500 }
    );
  }
}