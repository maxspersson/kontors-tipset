import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type ExternalMatchResult = {
  fifa_match_number: number;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
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
    const rawStatus = String(
      match.status || match.state || ""
    ).toLowerCase();

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
        match.match_number ??
        match.matchNumber ??
        match.fifa_match_number,

      home_score:
        match.home_score ??
        match.homeScore ??
        match.home_goals ??
        null,

      away_score:
        match.away_score ??
        match.awayScore ??
        match.away_goals ??
        null,

      status: normalizedStatus,
    };
  });
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
      source: "wc2026-api",
      updated: updatedMatches.length,
      skipped: skippedMatches.length,
      updatedMatches,
      skippedMatches,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Okänt sync-fel",
      },
      { status: 500 }
    );
  }
}