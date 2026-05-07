import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/liga", request.url), 303);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const code = formData.get("code")?.toString().trim().toUpperCase();

  if (!code) {
    return new NextResponse("Ingen kod skickades med", { status: 400 });
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id")
    .eq("invite_code", code)
    .single();

  if (leagueError || !league) {
    return new NextResponse("Kunde inte hitta ligan", { status: 404 });
  }

  const { data: existingMembership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMembership) {
    const { error: insertError } = await supabase
      .from("league_members")
      .insert({
        id: crypto.randomUUID(),
        league_id: league.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      return new NextResponse(
        `Kunde inte gå med i ligan: ${insertError.message}`,
        { status: 500 }
      );
    }
  }

  return NextResponse.redirect(new URL("/liga", request.url), 303);
}