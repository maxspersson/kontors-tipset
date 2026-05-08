import { NextRequest, NextResponse } from "next/server";
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
 * Sen byter vi ut detta mot riktig extern resultat-API.
 */
async function fetchExternalResults(): Promise<ExternalMatchResult[]> {
  const response = await fetch("https://api.wc2026api.com/matches", {
    headers: {
      Authorization: `Bearer ${process.env.WC2026_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kunde inte hämta matcher från WC2026 API");
  }

  const data = await response.json();

  return data.matches.map((match: any) => ({
    fifa_match_number: match.match_number,
    home_score: match.home_score,
    away_score: match.away_score,
    status:
      match.status === "completed"
        ? "finished"
        : match.status === "live"
          ? "live"
          : "scheduled",
  }));
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_SYNC_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const querySecret =
  request.nextUrl.searchParams.get("secret") ||
  request.headers.get("x-cron-secret");

  if (authHeader === `Bearer ${expectedSecret}`) {
    return true;
  }

  if (querySecret === expectedSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  return syncResults();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

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
          message: error.message,
          failedMatchNumber: result.fifa_match_number,
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