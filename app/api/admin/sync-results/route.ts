import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type ExternalMatchResult = {
  fifa_match_number: number;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
};

/**
 * Tillfällig testkälla.
 * Sen byter vi ut detta mot riktig extern API-hämtning.
 */
async function fetchExternalResults(): Promise<ExternalMatchResult[]> {
  return [
    {
      fifa_match_number: 1,
      home_score: 2,
      away_score: 1,
      status: "finished",
    },
  ];
}

export async function GET() {
  return syncResults();
}

export async function POST() {
  return syncResults();
}

async function syncResults() {
  const results = await fetchExternalResults();

  const updatedMatches: number[] = [];
  const skippedMatches: number[] = [];

  for (const result of results) {
    if (
      result.status !== "finished" ||
      result.home_score === null ||
      result.away_score === null
    ) {
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
          error: error.message,
          failed_match_number: result.fifa_match_number,
        },
        { status: 500 }
      );
    }

    updatedMatches.push(result.fifa_match_number);
  }

  return NextResponse.json({
    success: true,
    source: "temporary-test-source",
    updated: updatedMatches.length,
    skipped: skippedMatches.length,
    updatedMatches,
    skippedMatches,
  });
}