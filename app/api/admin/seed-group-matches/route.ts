import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type Team = {
  id: string;
  name: string;
  code: string;
  group_name: string;
};

type ScheduleMatch = {
  fifa_match_number: number;
  group_name: string;
  home_team_code: string;
  away_team_code: string;
  kickoff_utc: string;
  stadium: string;
  city: string;
  country: string;
};

const schedule: ScheduleMatch[] = [
  {
    fifa_match_number: 49,
    group_name: "C",
    home_team_code: "SCO",
    away_team_code: "BRA",
    kickoff_utc: "2026-06-24T16:00:00.000Z",
    stadium: "Miami Stadium",
    city: "Miami",
    country: "USA",
  },
  {
    fifa_match_number: 50,
    group_name: "C",
    home_team_code: "MAR",
    away_team_code: "HAI",
    kickoff_utc: "2026-06-24T16:00:00.000Z",
    stadium: "Atlanta Stadium",
    city: "Atlanta",
    country: "USA",
  },
  {
    fifa_match_number: 51,
    group_name: "B",
    home_team_code: "SUI",
    away_team_code: "CAN",
    kickoff_utc: "2026-06-24T19:00:00.000Z",
    stadium: "BC Place Vancouver",
    city: "Vancouver",
    country: "Canada",
  },
  {
    fifa_match_number: 52,
    group_name: "B",
    home_team_code: "BIH",
    away_team_code: "QAT",
    kickoff_utc: "2026-06-24T19:00:00.000Z",
    stadium: "Seattle Stadium",
    city: "Seattle",
    country: "USA",
  },
  {
    fifa_match_number: 53,
    group_name: "A",
    home_team_code: "CZE",
    away_team_code: "MEX",
    kickoff_utc: "2026-06-24T22:00:00.000Z",
    stadium: "Mexico City Stadium",
    city: "Mexico City",
    country: "Mexico",
  },
  {
    fifa_match_number: 54,
    group_name: "A",
    home_team_code: "RSA",
    away_team_code: "KOR",
    kickoff_utc: "2026-06-24T22:00:00.000Z",
    stadium: "Estadio Monterrey",
    city: "Monterrey",
    country: "Mexico",
  },
  {
    fifa_match_number: 55,
    group_name: "E",
    home_team_code: "CUW",
    away_team_code: "CIV",
    kickoff_utc: "2026-06-25T16:00:00.000Z",
    stadium: "Philadelphia Stadium",
    city: "Philadelphia",
    country: "USA",
  },
  {
    fifa_match_number: 56,
    group_name: "E",
    home_team_code: "ECU",
    away_team_code: "GER",
    kickoff_utc: "2026-06-25T16:00:00.000Z",
    stadium: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    country: "USA",
  },
  {
    fifa_match_number: 57,
    group_name: "F",
    home_team_code: "JPN",
    away_team_code: "SWE",
    kickoff_utc: "2026-06-25T19:00:00.000Z",
    stadium: "Dallas Stadium",
    city: "Dallas",
    country: "USA",
  },
  {
    fifa_match_number: 58,
    group_name: "F",
    home_team_code: "TUN",
    away_team_code: "NED",
    kickoff_utc: "2026-06-25T19:00:00.000Z",
    stadium: "Kansas City Stadium",
    city: "Kansas City",
    country: "USA",
  },
  {
    fifa_match_number: 59,
    group_name: "D",
    home_team_code: "TUR",
    away_team_code: "USA",
    kickoff_utc: "2026-06-25T22:00:00.000Z",
    stadium: "Los Angeles Stadium",
    city: "Los Angeles",
    country: "USA",
  },
  {
    fifa_match_number: 60,
    group_name: "D",
    home_team_code: "PAR",
    away_team_code: "AUS",
    kickoff_utc: "2026-06-25T22:00:00.000Z",
    stadium: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    country: "USA",
  },
  {
    fifa_match_number: 61,
    group_name: "I",
    home_team_code: "NOR",
    away_team_code: "FRA",
    kickoff_utc: "2026-06-26T16:00:00.000Z",
    stadium: "Boston Stadium",
    city: "Boston",
    country: "USA",
  },
  {
    fifa_match_number: 62,
    group_name: "I",
    home_team_code: "SEN",
    away_team_code: "IRQ",
    kickoff_utc: "2026-06-26T16:00:00.000Z",
    stadium: "Toronto Stadium",
    city: "Toronto",
    country: "Canada",
  },
  {
    fifa_match_number: 63,
    group_name: "G",
    home_team_code: "EGY",
    away_team_code: "IRN",
    kickoff_utc: "2026-06-26T19:00:00.000Z",
    stadium: "Seattle Stadium",
    city: "Seattle",
    country: "USA",
  },
  {
    fifa_match_number: 64,
    group_name: "G",
    home_team_code: "NZL",
    away_team_code: "BEL",
    kickoff_utc: "2026-06-26T19:00:00.000Z",
    stadium: "BC Place Vancouver",
    city: "Vancouver",
    country: "Canada",
  },
  {
    fifa_match_number: 65,
    group_name: "H",
    home_team_code: "CPV",
    away_team_code: "KSA",
    kickoff_utc: "2026-06-26T22:00:00.000Z",
    stadium: "Houston Stadium",
    city: "Houston",
    country: "USA",
  },
  {
    fifa_match_number: 66,
    group_name: "H",
    home_team_code: "URU",
    away_team_code: "ESP",
    kickoff_utc: "2026-06-26T22:00:00.000Z",
    stadium: "Estadio Guadalajara",
    city: "Guadalajara",
    country: "Mexico",
  },
  {
    fifa_match_number: 67,
    group_name: "L",
    home_team_code: "PAN",
    away_team_code: "ENG",
    kickoff_utc: "2026-06-27T16:00:00.000Z",
    stadium: "New York New Jersey Stadium",
    city: "New York/New Jersey",
    country: "USA",
  },
  {
    fifa_match_number: 68,
    group_name: "L",
    home_team_code: "CRO",
    away_team_code: "GHA",
    kickoff_utc: "2026-06-27T16:00:00.000Z",
    stadium: "Philadelphia Stadium",
    city: "Philadelphia",
    country: "USA",
  },
  {
    fifa_match_number: 69,
    group_name: "J",
    home_team_code: "ALG",
    away_team_code: "AUT",
    kickoff_utc: "2026-06-27T19:00:00.000Z",
    stadium: "Kansas City Stadium",
    city: "Kansas City",
    country: "USA",
  },
  {
    fifa_match_number: 70,
    group_name: "J",
    home_team_code: "JOR",
    away_team_code: "ARG",
    kickoff_utc: "2026-06-27T19:00:00.000Z",
    stadium: "Dallas Stadium",
    city: "Dallas",
    country: "USA",
  },
  {
    fifa_match_number: 71,
    group_name: "K",
    home_team_code: "COL",
    away_team_code: "POR",
    kickoff_utc: "2026-06-27T22:00:00.000Z",
    stadium: "Miami Stadium",
    city: "Miami",
    country: "USA",
  },
  {
    fifa_match_number: 72,
    group_name: "K",
    home_team_code: "COD",
    away_team_code: "UZB",
    kickoff_utc: "2026-06-27T22:00:00.000Z",
    stadium: "Atlanta Stadium",
    city: "Atlanta",
    country: "USA",
  },
];

export async function GET() {
  return seedOfficialMatches();
}

export async function POST() {
  return seedOfficialMatches();
}

async function seedOfficialMatches() {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, code, group_name")
    .eq("tournament_id", TOURNAMENT_ID);

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const teamByCode = new Map<string, Team>();

  for (const team of (teams ?? []) as Team[]) {
    teamByCode.set(team.code, team);
  }

  const matches = [];

  for (const item of schedule) {
    const home = teamByCode.get(item.home_team_code);
    const away = teamByCode.get(item.away_team_code);

    if (!home || !away) {
      return NextResponse.json(
        {
          error: "Team code not found",
          match: item.fifa_match_number,
          home_team_code: item.home_team_code,
          away_team_code: item.away_team_code,
        },
        { status: 400 }
      );
    }

    matches.push({
      tournament_id: TOURNAMENT_ID,
      fifa_match_number: item.fifa_match_number,
      stage: "group",
      group_name: item.group_name,

      home_team_id: home.id,
      away_team_id: away.id,

      home_team: home.name,
      away_team: away.name,
      home_team_code: home.code,
      away_team_code: away.code,

      kickoff_utc: item.kickoff_utc,
      stadium: item.stadium,
      city: item.city,
      country: item.country,

      status: "scheduled",
      home_score: null,
      away_score: null,
    });
  }

  const matchNumbers = schedule.map((match) => match.fifa_match_number);

  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("stage", "group")
    .in("fifa_match_number", matchNumbers);

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
    note: "Seeded official schedule block 3, matches 49-72 only.",
  });
}