import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase/admin";
import {
  calculateStandings,
  type MatchRow,
  type PredictionRow,
  type ProfileRow,
  type SubmissionRow,
} from "../../../lib/scoring";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

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
      "id, fifa_match_number, stage, group_name, home_team, away_team, home_score, away_score, home_pen, away_pen, actual_advancing_team"
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
        "league_id, user_id, match_id, predicted_home_score, predicted_away_score, advancing_team"
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
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const snapshots = await saveStandingSnapshots();

    return NextResponse.json({
      success: true,
      snapshots,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Okänt snapshot-fel",
      },
      { status: 500 }
    );
  }
}