import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Inte inloggad", { status: 401 });
  }

  const body = await request.json();

  const leagueId = body.leagueId;

  if (!leagueId) {
    return new NextResponse("League ID saknas", { status: 400 });
  }

  const row = {
    league_id: leagueId,
    user_id: user.id,
    tournament_id: TOURNAMENT_ID,

    top_scorer: body.topScorer || null,
    champion: body.champion || null,
    most_group_goals_team: body.mostGroupGoalsTeam || null,
    most_group_goals_conceded_team:
      body.mostGroupGoalsConcededTeam || null,

    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("bonus_predictions")
    .upsert(row, {
      onConflict: "league_id,user_id",
    });

  if (error) {
    return new NextResponse(
      `Kunde inte spara bonusfrågorna: ${error.message}`,
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}