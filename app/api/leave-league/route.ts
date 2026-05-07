import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const leagueId = formData.get("leagueId")?.toString();

  if (!leagueId) {
    return new NextResponse("leagueId saknas", { status: 400 });
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, owner_user_id")
    .eq("id", leagueId)
    .maybeSingle();

  if (!league) {
    return new NextResponse("Ligan hittades inte", { status: 404 });
  }

  if (league.owner_user_id === user.id) {
    return new NextResponse(
      "Du äger ligan. Arkivera ligan istället för att lämna den.",
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id);

  if (error) {
    return new NextResponse(`Kunde inte lämna ligan: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.redirect(new URL("/liga", request.url), 303);
}