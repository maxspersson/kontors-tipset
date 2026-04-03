import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const code = formData.get("code")?.toString().trim();

  if (!code) {
    return new NextResponse("Ingen kod skickades med", { status: 400 });
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (leagueError || !league) {
    return new NextResponse("Kunde inte hitta ligan", { status: 404 });
  }

  const { error: insertError } = await supabase
    .from("league_members")
    .upsert(
      {
        league_id: league.id,
        user_id: user.id,
      },
      {
        onConflict: "league_id,user_id",
      }
    );

  if (insertError) {
    return new NextResponse(`Insert error: ${insertError.message}`, {
      status: 500,
    });
  }

  return NextResponse.redirect(new URL(`/liga/${league.slug}`, request.url));
}