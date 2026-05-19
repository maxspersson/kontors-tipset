import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/app/lib/supabase/admin";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_SYNC_SECRET;
  if (!expectedSecret) return false;

  const authHeader = request.headers.get("authorization");
  const querySecret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-cron-secret");

  return authHeader === `Bearer ${expectedSecret}` || querySecret === expectedSecret;
}

function getActualAdvancingTeam({
  stage,
  homeScore,
  awayScore,
  homePen,
  awayPen,
}: {
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  homePen: number | null;
  awayPen: number | null;
}) {
  if (stage === "group") return null;
  if (homeScore === null || awayScore === null) return null;

  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";

  if (homePen === null || awayPen === null) return null;

  if (homePen > awayPen) return "home";
  if (awayPen > homePen) return "away";

  return null;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const matchNumber = Number(body.fifa_match_number);
    const homeScore = body.home_score === null ? null : Number(body.home_score);
    const awayScore = body.away_score === null ? null : Number(body.away_score);
    const homePen = body.home_pen === null || body.home_pen === undefined ? null : Number(body.home_pen);
    const awayPen = body.away_pen === null || body.away_pen === undefined ? null : Number(body.away_pen);
    const status = body.status || "finished";

    if (!matchNumber || Number.isNaN(matchNumber)) {
      return NextResponse.json(
        { success: false, message: "Missing fifa_match_number" },
        { status: 400 }
      );
    }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, stage")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("fifa_match_number", matchNumber)
      .maybeSingle();

    if (matchError || !match) {
      return NextResponse.json(
        { success: false, message: matchError?.message || "Match not found" },
        { status: 404 }
      );
    }

    const actualAdvancingTeam = getActualAdvancingTeam({
      stage: match.stage,
      homeScore,
      awayScore,
      homePen,
      awayPen,
    });

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        home_pen: homePen,
        away_pen: awayPen,
        actual_advancing_team: actualAdvancingTeam,
        status,
      })
      .eq("id", match.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 }
      );
    }

        let snapshots = 0;
    let snapshotWarning: string | null = null;

    try {
      const snapshotResponse = await fetch(
        `${request.nextUrl.origin}/api/admin/save-standing-snapshots?secret=${process.env.ADMIN_SYNC_SECRET}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const snapshotData = await snapshotResponse.json().catch(() => null);

      if (!snapshotResponse.ok || !snapshotData?.success) {
        snapshotWarning =
          snapshotData?.message || "Manual result saved, but snapshots were not updated.";
      } else {
        snapshots = snapshotData.insertedSnapshots ?? snapshotData.snapshots ?? 0;
      }
    } catch {
      snapshotWarning =
        "Manual result saved, but snapshots could not be updated.";
    }

        return NextResponse.json({
      success: true,
      source: "manual-override",
      matchNumber,
      homeScore,
      awayScore,
      homePen,
      awayPen,
      actualAdvancingTeam,
      status,
      snapshots,
      snapshotWarning,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown manual override error",
      },
      { status: 500 }
    );
  }
}