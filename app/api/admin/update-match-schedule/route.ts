import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type ScheduleItem = {
  fifa_match_number: number;
  kickoff_utc: string;
  stadium: string;
  city: string;
  country: string;
};

/**
 * Här lägger vi in korrekt VM-schema.
 * Viktigt: detta ska vara verifierat innan vi kör.
 */
const schedule = [
  {
    fifa_match_number: 1,
    kickoff_utc: "2026-06-11T19:00:00.000Z",
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
  },
  {
    fifa_match_number: 2,
    kickoff_utc: "2026-06-12T16:00:00.000Z",
    stadium: "MetLife Stadium",
    city: "New York",
    country: "USA",
  },
  {
    fifa_match_number: 3,
    kickoff_utc: "2026-06-12T19:00:00.000Z",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
  },
  {
    fifa_match_number: 4,
    kickoff_utc: "2026-06-12T22:00:00.000Z",
    stadium: "BC Place",
    city: "Vancouver",
    country: "Canada",
  },
];

export async function GET() {
  return updateMatchSchedule();
}

export async function POST() {
  return updateMatchSchedule();
}

async function updateMatchSchedule() {
  const results = [];

  for (const item of schedule) {
    const { error } = await supabase
      .from("matches")
      .update({
        kickoff_utc: item.kickoff_utc,
        stadium: item.stadium,
        city: item.city,
        country: item.country,
      })
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("fifa_match_number", item.fifa_match_number);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          failed_match_number: item.fifa_match_number,
        },
        { status: 500 }
      );
    }

    results.push(item.fifa_match_number);
  }

  return NextResponse.json({
    success: true,
    updated: results.length,
    matches: results,
  });
}