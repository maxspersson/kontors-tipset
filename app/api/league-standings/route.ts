import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  calculateStandings,
  type MatchRow,
  type ProfileRow,
  type SubmissionRow,
} from "@/app/lib/scoring";

type StandingSnapshot = {
  user_id: string;
  rank: number;
  created_at: string;
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
    return new NextResponse("Ej medlem i ligan", { status: 403 });
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("league_submissions")
    .select("league_id, user_id, group_snapshot, playoff_snapshot")
    .eq("league_id", leagueId)
    .not("submitted_at", "is", null);

  if (submissionsError) {
    return new NextResponse(
      `Kunde inte hämta inskickade tips: ${submissionsError.message}`,
      { status: 500 }
    );
  }

  const submissionRows = (submissions ?? []) as SubmissionRow[];

  const submittedUserIds = Array.from(
    new Set(submissionRows.map((submission) => submission.user_id))
  );

  if (submittedUserIds.length === 0) {
    return NextResponse.json({
      success: true,
      standings: [],
    });
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, fifa_match_number, stage, group_name, home_team, away_team, home_team_code, away_team_code, home_fifa_ranking, away_fifa_ranking, home_score, away_score, home_pen, away_pen, actual_advancing_team"
    );

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

  const standings = calculateStandings({
  submissions: submissionRows,
  predictions: [],
  matches: (matches ?? []) as MatchRow[],
  profiles: (profiles ?? []) as ProfileRow[],
});

  const { data: snapshots } = await supabase
    .from("league_standing_snapshots")
    .select("user_id, rank, created_at")
    .eq("league_id", leagueId)
    .in("user_id", submittedUserIds)
    .order("created_at", { ascending: false })
    .limit(5000);

  const snapshotRows = (snapshots ?? []) as StandingSnapshot[];

  const snapshotTimes = Array.from(
    new Set(snapshotRows.map((snapshot) => snapshot.created_at))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const comparisonTime = snapshotTimes[snapshotTimes.length - 1] ?? null;
  const previousRankByUserId = new Map<string, number>();

  if (comparisonTime) {
    snapshotRows
      .filter((snapshot) => snapshot.created_at === comparisonTime)
      .forEach((snapshot) => {
        previousRankByUserId.set(snapshot.user_id, snapshot.rank);
      });
  }

  const standingsWithMovement = standings.map((player, index) => {
    const currentRank = index + 1;
    const previousRank = previousRankByUserId.get(player.user_id) ?? null;

    return {
      ...player,
      rank: currentRank,
      previousRank,
      movement: previousRank ? previousRank - currentRank : 0,
    };
  });

  return NextResponse.json({
    success: true,
    standings: standingsWithMovement,
  });
}