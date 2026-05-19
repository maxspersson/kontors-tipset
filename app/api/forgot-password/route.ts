import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

function getBaseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const formData = await request.formData();
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=missing-email", request.url),
      303
    );
  }

  const baseUrl = getBaseUrl(request);
  const redirectTo = `${baseUrl}/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    const isRateLimit =
      error.message.toLowerCase().includes("security purposes") ||
      error.message.toLowerCase().includes("rate limit");

    return NextResponse.redirect(
      new URL(
        `/forgot-password?error=${isRateLimit ? "rate-limit" : "send-failed"}`,
        request.url
      ),
      303
    );
  }

  return NextResponse.redirect(
    new URL("/forgot-password?sent=1", request.url),
    303
  );
}