import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

function loginRedirect(request: Request, nextPath: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl, 303);
}

function formatDisplayName(email?: string | null) {
  if (!email) return "Spelare";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function joinLeagueByCode(request: Request, code: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return new NextResponse("Ingen kod skickades med", { status: 400 });
  }

  const nextPath = `/api/join?code=${encodeURIComponent(cleanCode)}`;

  if (!user) {
    return loginRedirect(request, nextPath);
  }

  const email = user.email || null;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    formatDisplayName(email);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      display_name: displayName,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    return new NextResponse(
      `Kunde inte uppdatera profilen: ${profileError.message}`,
      { status: 500 }
    );
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id")
    .eq("invite_code", cleanCode)
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
    const { error: insertError } = await supabase.from("league_members").insert({
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/liga", request.url), 303);
  }

  return joinLeagueByCode(request, code);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = formData.get("code")?.toString();

  if (!code) {
    return new NextResponse("Ingen kod skickades med", { status: 400 });
  }

  return joinLeagueByCode(request, code);
}