import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

function getSafeNext(next: string | null) {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();

    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const email = user.email || null;
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        formatDisplayName(email);

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email,
          display_name: displayName,
        },
        {
          onConflict: "id",
        }
      );
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}