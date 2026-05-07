import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const formData = await request.formData();
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    return new NextResponse("E-post saknas", { status: 400 });
  }

  const redirectTo = new URL("/reset-password", request.url).toString();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return new NextResponse(
      `Kunde inte skicka återställningslänk: ${error.message}`,
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/forgot-password?sent=1", request.url),
    303
  );
}