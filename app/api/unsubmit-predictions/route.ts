import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const SUBMISSION_DEADLINE_UTC = Date.UTC(2026, 5, 11, 18, 30, 0, 0);

function isAfterSubmissionDeadline() {
  return Date.now() >= SUBMISSION_DEADLINE_UTC;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const { leagueId } = await request.json();

  if (!leagueId) {
    return new NextResponse("leagueId saknas", { status: 400 });
  }

  if (isAfterSubmissionDeadline()) {
    return new NextResponse(
      "Deadline har passerat. Det går inte längre att redigera ett inskickat tips.",
      { status: 403 }
    );
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return new NextResponse(
      `Kunde inte kontrollera medlemskap: ${membershipError.message}`,
      { status: 500 }
    );
  }

  if (!membership) {
    return new NextResponse("Du är inte medlem i den här ligan.", {
      status: 403,
    });
  }

  const { data: existingSubmission, error: existingError } = await supabaseAdmin
    .from("league_submissions")
    .select("id, submitted_at")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return new NextResponse(
      `Kunde inte kontrollera inskickat tips: ${existingError.message}`,
      { status: 500 }
    );
  }

  if (!existingSubmission?.submitted_at) {
    return new NextResponse("Det finns inget inskickat tips att låsa upp.", {
      status: 400,
    });
  }

  const { data: updatedSubmission, error: updateError } = await supabaseAdmin
    .from("league_submissions")
    .update({
      submitted_at: null,
      updated_at: new Date().toISOString(),
      group_snapshot: null,
      playoff_snapshot: null,
      bonus_snapshot: null,
      is_locked: false,
    })
    .eq("id", existingSubmission.id)
    .select("id, submitted_at, is_locked")
    .single();

  if (updateError) {
    return new NextResponse(`Kunde inte låsa upp tipset: ${updateError.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({
    success: true,
    submission: updatedSubmission,
  });
}