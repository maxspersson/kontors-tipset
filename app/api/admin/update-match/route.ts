import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { calculateStandings } from "@/app/lib/scoring";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type AdvancingTeam = "home" | "away";

type UpdateMatchPayload = {
  fifa_match_number?: number;
  home_score?: number | null;
  away_score?: number | null;
  home_pen?: number | null;
  away_pen?: number | null;
  actual_advancing_team?: AdvancingTeam | null;
  status?: "scheduled" | "live" | "finished";
  secret?: string;
};

function getActualAdvancingTeam({
  stage,
  homeScore,
  awayScore,
  homePen,
  awayPen,
  actualAdvancingTeam,
}: {
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  homePen: number | null;
  awayPen: number | null;
  actualAdvancingTeam?: AdvancingTeam | null;
}) {
  if (stage === "group") return null;
  if (actualAdvancingTeam) return actualAdvancingTeam;
  if (homeScore === null || awayScore === null) return null;

  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";

  if (homePen === null || awayPen === null) return null;

  if (homePen > awayPen) return "home";
  if (awayPen > homePen) return "away";

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as UpdateMatchPayload;

  if (body.secret !== process.env.ADMIN_SYNC_SECRET) {
    return new NextResponse("Obehörig", { status: 401 });
  }

  if (!body.fifa_match_number) {
    return new NextResponse("fifa_match_number saknas", { status: 400 });
  }

  const status = body.status ?? "finished";

  if (
    status !== "scheduled" &&
    (typeof body.home_score !== "number" ||
      typeof body.away_score !== "number")
  ) {
    return new NextResponse("home_score och away_score krävs", { status: 400 });
  }

  const { data: currentMatch, error: currentMatchError } = await supabase
    .from("matches")
    .select("stage")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("fifa_match_number", body.fifa_match_number)
    .single();

  if (currentMatchError) {
    return new NextResponse(
      `Kunde inte hämta match: ${currentMatchError.message}`,
      { status: 500 }
    );
  }

  const homeScore = status === "scheduled" ? null : body.home_score ?? null;
  const awayScore = status === "scheduled" ? null : body.away_score ?? null;
  const homePen = status === "scheduled" ? null : body.home_pen ?? null;
  const awayPen = status === "scheduled" ? null : body.away_pen ?? null;

  const actualAdvancingTeam =
    status === "scheduled"
      ? null
      : getActualAdvancingTeam({
          stage: currentMatch.stage,
          homeScore,
          awayScore,
          homePen,
          awayPen,
          actualAdvancingTeam: body.actual_advancing_team ?? null,
        });

  const { data: updatedMatch, error: updateError } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_pen: homePen,
      away_pen: awayPen,
      actual_advancing_team: actualAdvancingTeam,
      status,
    })
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("fifa_match_number", body.fifa_match_number)
    .select(
      "id, fifa_match_number, home_team, away_team, home_score, away_score, home_pen, away_pen, actual_advancing_team, status"
    )
    .single();

  if (updateError) {
    return new NextResponse(
      `Kunde inte uppdatera match: ${updateError.message}`,
      { status: 500 }
    );
  }

  if (status === "scheduled") {
    return NextResponse.json({
      success: true,
      match: updatedMatch,
      snapshotsCreated: 0,
      message: "Matchen återställdes till scheduled och resultatet rensades.",
    });
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("league_submissions")
    .select("league_id, user_id, group_snapshot, playoff_snapshot")
    .not("submitted_at", "is", null);

  if (submissionsError) {
    return new NextResponse(
      `Matchen uppdaterades men snapshots kunde inte hämtas: ${submissionsError.message}`,
      { status: 500 }
    );
  }

  const submittedLeagueIds = Array.from(
    new Set((submissions ?? []).map((submission) => submission.league_id))
  );

  if (submittedLeagueIds.length === 0) {
    return NextResponse.json({
      success: true,
      match: updatedMatch,
      snapshotsCreated: 0,
      message: "Matchen uppdaterades. Inga inskickade tips finns ännu.",
    });
  }

  const submittedUserIds = Array.from(
    new Set((submissions ?? []).map((submission) => submission.user_id))
  );

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select(
      "league_id, user_id, match_id, predicted_home_score, predicted_away_score"
    )
    .in("league_id", submittedLeagueIds);

  if (predictionsError) {
    return new NextResponse(
      `Matchen uppdaterades men tips kunde inte hämtas: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, fifa_match_number, stage, group_name, home_team, away_team, home_team_code, away_team_code, home_fifa_ranking, away_fifa_ranking, home_score, away_score, home_pen, away_pen, actual_advancing_team"
    )
    .eq("tournament_id", TOURNAMENT_ID);

  if (matchesError) {
    return new NextResponse(
      `Matchen uppdaterades men matcher kunde inte hämtas: ${matchesError.message}`,
      { status: 500 }
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", submittedUserIds);

  if (profilesError) {
    return new NextResponse(
      `Matchen uppdaterades men profiler kunde inte hämtas: ${profilesError.message}`,
      { status: 500 }
    );
  }

  const { data: leagues, error: leaguesError } = await supabase
    .from("leagues")
    .select("id, name")
    .in("id", submittedLeagueIds)
    .eq("is_archived", false);

  if (leaguesError) {
    return new NextResponse(
      `Matchen uppdaterades men ligor kunde inte hämtas: ${leaguesError.message}`,
      { status: 500 }
    );
  }

  const allStandings = calculateStandings({
    submissions: submissions ?? [],
    predictions: predictions ?? [],
    matches: matches ?? [],
    profiles: profiles ?? [],
    leagues: leagues ?? [],
  });

  const now = new Date().toISOString();

  const snapshotRows = submittedLeagueIds.flatMap((leagueId) => {
    const leagueStandings = allStandings.filter(
      (standing) => standing.league_id === leagueId
    );

    return leagueStandings.map((standing, index) => ({
      league_id: standing.league_id,
      user_id: standing.user_id,
      rank: index + 1,
      points: standing.points,
      created_at: now,
    }));
  });

  if (snapshotRows.length > 0) {
    const { error: snapshotError } = await supabase
      .from("league_standing_snapshots")
      .insert(snapshotRows);

    if (snapshotError) {
      return new NextResponse(
        `Matchen uppdaterades men snapshot kunde inte sparas: ${snapshotError.message}`,
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    match: updatedMatch,
    snapshotsCreated: snapshotRows.length,
  });
}