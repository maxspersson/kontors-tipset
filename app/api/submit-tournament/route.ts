import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const leagueId = body?.leagueId;

  if (!leagueId) {
    return new NextResponse("League ID saknas", { status: 400 });
  }

  const { data: leagueRow, error: leagueError } = await supabase
    .from("leagues")
    .select("submission_deadline")
    .eq("id", leagueId)
    .single();

  if (leagueError || !leagueRow) {
    return new NextResponse("Kunde inte hämta ligan", { status: 500 });
  }

  if (leagueRow.submission_deadline) {
    const deadlineTs = new Date(leagueRow.submission_deadline).getTime();

    if (Date.now() > deadlineTs) {
      return NextResponse.json(
        {
          success: false,
          message: "Deadline för att skicka in turneringstips har passerat.",
        },
        { status: 400 }
      );
    }
  }

  const { count: totalMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true });

  if (matchesError) {
    return new NextResponse(`Kunde inte räkna matcher: ${matchesError.message}`, {
      status: 500,
    });
  }

  const { count: userPredictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .eq("user_id", user.id);

  if (predictionsError) {
    return new NextResponse(
      `Kunde inte räkna dina tips: ${predictionsError.message}`,
      { status: 500 }
    );
  }

  if ((userPredictions ?? 0) < (totalMatches ?? 0)) {
    return NextResponse.json(
      {
        success: false,
        message: `Du behöver tippa alla matcher innan du kan skicka in. Du har tippat ${
          userPredictions ?? 0
        } av ${totalMatches ?? 0}.`,
        totalMatches: totalMatches ?? 0,
        userPredictions: userPredictions ?? 0,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { error: submissionError } = await supabase
    .from("league_submissions")
    .upsert(
      {
        league_id: leagueId,
        user_id: user.id,
        submitted_at: now,
        updated_at: now,
      },
      {
        onConflict: "league_id,user_id",
      }
    );

  if (submissionError) {
    return new NextResponse(
      `Kunde inte skicka in turneringstipset: ${submissionError.message}`,
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Turneringstipset är inskickat.",
    totalMatches: totalMatches ?? 0,
    userPredictions: userPredictions ?? 0,
  });
}