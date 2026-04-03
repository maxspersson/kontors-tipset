import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateInviteCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const rawName = formData.get("name")?.toString().trim();

  if (!rawName) {
    return new NextResponse("Ligan måste ha ett namn", { status: 400 });
  }

  const baseSlug = slugify(rawName);
  let finalSlug = baseSlug;
  let slugCounter = 1;

  while (true) {
    const { data: existingLeague } = await supabase
      .from("leagues")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (!existingLeague) {
      break;
    }

    slugCounter += 1;
    finalSlug = `${baseSlug}-${slugCounter}`;
  }

  let inviteCode = generateInviteCode();

  while (true) {
    const { data: existingInvite } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (!existingInvite) {
      break;
    }

    inviteCode = generateInviteCode();
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert({
      name: rawName,
      slug: finalSlug,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (leagueError || !league) {
    return new NextResponse(
      `Kunde inte skapa ligan: ${leagueError?.message ?? "okänt fel"}`,
      { status: 500 }
    );
  }

  const membershipPayload = {
    id: crypto.randomUUID(),
    league_id: league.id,
    user_id: user.id,
    created_at: new Date().toISOString(),
  };

  const { data: membership, error: membershipError } = await supabase
    .from("league_members")
    .insert(membershipPayload)
    .select()
    .single();

  if (membershipError || !membership) {
    await supabase.from("leagues").delete().eq("id", league.id);

    return new NextResponse(
      `Kunde inte lägga till dig i ligan: ${
        membershipError?.message ?? "okänt fel"
      }`,
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL(`/liga/${league.slug}`, request.url));
}