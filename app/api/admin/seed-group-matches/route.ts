import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type Team = {
  id: string;
  name: string;
  code: string;
  group_name: string;
};

type MatchInsert = {
  tournament_id: string;
  fifa_match_number: number;
  stage: string;
  group_name: string;
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  home_team_code: string;
  away_team_code: string;
  kickoff_utc: string;
  status: string;
  home_score: null;
  away_score: null;
};

const groupPairings: [number, number][] = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [3, 0],
  [1, 2],
];

export async function GET() {
  return seedGroupMatches();
}

export async function POST() {
  return seedGroupMatches();
}

async function seedGroupMatches() {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, code, group_name")
    .eq("tournament_id", TOURNAMENT_ID)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const typedTeams = teams as Team[] | null;

  if (!typedTeams || typedTeams.length !== 48) {
    return NextResponse.json(
      { error: `Expected 48 teams, found ${typedTeams?.length ?? 0}` },
      { status: 400 }
    );
  }

  const groups: Record<string, Team[]> = {};

  for (const team of typedTeams) {
    if (!groups[team.group_name]) {
      groups[team.group_name] = [];
    }

    groups[team.group_name].push(team);
  }

  const matches: MatchInsert[] = [];
  let matchNumber = 1;

  for (const groupName of Object.keys(groups).sort()) {
    const groupTeams = groups[groupName];

    if (!groupTeams || groupTeams.length !== 4) {
      return NextResponse.json(
        { error: `Group ${groupName} has ${groupTeams?.length ?? 0} teams` },
        { status: 400 }
      );
    }

    for (const [homeIndex, awayIndex] of groupPairings) {
      const home = groupTeams[homeIndex];
      const away = groupTeams[awayIndex];

      matches.push({
        tournament_id: TOURNAMENT_ID,
        fifa_match_number: matchNumber,
        stage: "group",
        group_name: groupName,

        home_team_id: home.id,
        away_team_id: away.id,

        home_team: home.name,
        away_team: away.name,
        home_team_code: home.code,
        away_team_code: away.code,

        kickoff_utc: "2026-06-11T18:00:00.000Z",

        status: "scheduled",
        home_score: null,
        away_score: null,
      });

      matchNumber++;
    }
  }

  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("stage", "group");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from("matches")
    .insert(matches)
    .select("id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    inserted: data?.length ?? 0,
  });
}