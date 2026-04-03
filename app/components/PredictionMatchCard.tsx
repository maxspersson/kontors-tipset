"use client";

import { useState } from "react";

type PredictionMatchCardProps = {
  leagueId: string;
  matchId: string;
  stage: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  stadium: string | null;
  city: string | null;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
};

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function PredictionMatchCard({
  leagueId,
  matchId,
  stage,
  groupName,
  homeTeam,
  awayTeam,
  kickoffUtc,
  stadium,
  city,
  initialHomeScore,
  initialAwayScore,
}: PredictionMatchCardProps) {
  const [homeScore, setHomeScore] = useState(
    initialHomeScore !== null ? String(initialHomeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    initialAwayScore !== null ? String(initialAwayScore) : ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setMessage("");

    if (homeScore === "" || awayScore === "") {
      setMessage("Fyll i båda resultaten");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/save-prediction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId,
        matchId,
        predictedHomeScore: Number(homeScore),
        predictedAwayScore: Number(awayScore),
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      setMessage(text);
      setSaving(false);
      return;
    }

    setMessage("Sparat!");
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neutral-400">
            {stage === "group" ? `Grupp ${groupName}` : stage}
          </span>
        </div>

        <p className="text-sm text-neutral-400">{formatKickoff(kickoffUtc)}</p>
      </div>

      <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <p className="text-sm text-neutral-500">Hemmalag</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">
            {homeTeam}
          </p>
        </div>

        <div className="text-center text-xl text-neutral-500">vs</div>

        <div className="md:text-right">
          <p className="text-sm text-neutral-500">Bortalag</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">
            {awayTeam}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-neutral-400">
            {homeTeam}
          </label>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-neutral-400">
            {awayTeam}
          </label>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none"
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-neutral-400">
          {stadium || "Okänd arena"}
          {city ? ` · ${city}` : ""}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Sparar..." : "Spara tips"}
        </button>
      </div>

      {message && (
        <p className="mt-4 text-sm text-neutral-300">{message}</p>
      )}
    </div>
  );
}