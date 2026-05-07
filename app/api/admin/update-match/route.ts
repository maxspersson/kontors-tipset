import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type UpdateMatchPayload = {
  fifa_match_number?: number;
  home_score?: number;
  away_score?: number;
  status?: "scheduled" | "live" | "finished";
};

export async function POST(request: Request) {
  const body = (await request.json()) as UpdateMatchPayload;

  if (!body.fifa_match_number) {
    return new NextResponse("fifa_match_number saknas", { status: 400 });
  }

  if (
    typeof body.home_score !== "number" ||
    typeof body.away_score !== "number"
  ) {
    return new NextResponse("home_score och away_score krävs", { status: 400 });
  }

  const status = body.status ?? "finished";

  const { data, error } = await supabase
    .from("matches")
    .update({
      home_score: body.home_score,
      away_score: body.away_score,
      status,
    })
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("fifa_match_number", body.fifa_match_number)
    .select("id, fifa_match_number, home_team, away_team, home_score, away_score, status")
    .single();

  if (error) {
    return new NextResponse(`Kunde inte uppdatera match: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({
    success: true,
    match: data,
  });
}