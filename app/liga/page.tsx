"use client";

import { useState } from "react";
import Container from "@/app/components/Container";

export default function CreateLeaguePage() {
  const [name, setName] = useState("");

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="mx-auto max-w-xl py-16">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Ny liga
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Skapa liga
          </h1>

          <p className="mt-4 text-neutral-400">
            Skapa en liga för kontoret, kompisgänget eller familjen och bjud in
            andra med en kod.
          </p>

          <form
            action="/api/create-league"
            method="POST"
            className="mt-8 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm text-neutral-400">
                Namn på ligan
              </label>

              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Till exempel: Marknadsteamet VM 2026"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:opacity-90"
            >
              Skapa liga
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}