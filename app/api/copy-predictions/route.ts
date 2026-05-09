import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type PredictionRow = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  advancing_team: "home" | "away" | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const body = await request.json();
  const sourceLeagueId = body.sourceLeagueId;
  const targetLeagueId = body.targetLeagueId;

  if (!sourceLeagueId || !targetLeagueId) {
    return new NextResponse("sourceLeagueId och targetLeagueId krävs", {
      status: 400,
    });
  }

  if (sourceLeagueId === targetLeagueId) {
    return new NextResponse("Du kan inte kopiera tips från samma liga.", {
      status: 400,
    });
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id)
    .in("league_id", [sourceLeagueId, targetLeagueId]);

  if (membershipsError) {
    return new NextResponse(
      `Kunde inte kontrollera ligamedlemskap: ${membershipsError.message}`,
      { status: 500 }
    );
  }

  const leagueIds = new Set((memberships ?? []).map((item) => item.league_id));

  if (!leagueIds.has(sourceLeagueId) || !leagueIds.has(targetLeagueId)) {
    return new NextResponse("Du måste vara medlem i båda ligorna.", {
      status: 403,
    });
  }

  const { data: targetSubmission } = await supabase
    .from("league_submissions")
    .select("id, submitted_at")
    .eq("league_id", targetLeagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (targetSubmission?.submitted_at) {
    return new NextResponse(
      "Tipset i den här ligan är redan inskickat och kan inte skrivas över.",
      { status: 400 }
    );
  }

  const { data: sourcePredictions, error: sourceError } = await supabase
    .from("predictions")
    .select("match_id, predicted_home_score, predicted_away_score, advancing_team")
    .eq("league_id", sourceLeagueId)
    .eq("user_id", user.id);

  if (sourceError) {
    return new NextResponse(
      `Kunde inte hämta tips från källigan: ${sourceError.message}`,
      { status: 500 }
    );
  }

  const predictions = (sourcePredictions ?? []) as PredictionRow[];

  if (predictions.length === 0) {
    return new NextResponse("Det finns inga tips att kopiera från den ligan.", {
      status: 400,
    });
  }

  const rows = predictions
    .filter(
      (prediction) =>
        prediction.predicted_home_score !== null &&
        prediction.predicted_away_score !== null
    )
    .map((prediction) => ({
      user_id: user.id,
      league_id: targetLeagueId,
      match_id: prediction.match_id,
      predicted_home_score: prediction.predicted_home_score,
      predicted_away_score: prediction.predicted_away_score,
      advancing_team: prediction.advancing_team,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return new NextResponse("Det finns inga kompletta tips att kopiera.", {
      status: 400,
    });
  }

  const { error: upsertError } = await supabase.from("predictions").upsert(rows, {
    onConflict: "user_id,league_id,match_id",
  });

  if (upsertError) {
    return new NextResponse(`Kunde inte kopiera tips: ${upsertError.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({
    success: true,
    copiedCount: rows.length,
  });
}