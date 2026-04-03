"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Container from "@/app/components/Container";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrorMessage("");

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="mx-auto max-w-md py-16">
          <h1 className="text-4xl font-bold tracking-tight">Logga in</h1>
          <p className="mt-4 text-neutral-400">
            Logga in för att skapa ligor, gå med i ligor och lämna dina tips.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-3 font-semibold text-neutral-100 disabled:opacity-50"
            >
              {googleLoading ? "Öppnar Google..." : "Logga in med Google"}
            </button>
          </div>

          <div className="my-8 h-px bg-neutral-800" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-neutral-400">
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none"
                placeholder="dinmail@foretag.se"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-900 bg-neutral-900 p-4 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Loggar in..." : "Logga in med e-post"}
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}