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
  const displayName = formData.get("display_name")?.toString().trim();

  if (!displayName) {
    return new NextResponse("Användarnamn saknas", { status: 400 });
  }

  if (displayName.length > 24) {
    return new NextResponse("Användarnamnet får max vara 24 tecken", {
      status: 400,
    });
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: displayName,
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    return new NextResponse(`Kunde inte spara profilen: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.redirect(new URL("/profil", request.url), 303);
}