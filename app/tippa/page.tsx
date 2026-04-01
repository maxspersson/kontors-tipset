"use client";

import { useState } from "react";
import Container from "../components/Container";

const groupedMatches = {
  "Grupp A": [
    { id: 1, home: "Sverige", away: "Tyskland", time: "12 juni · 19:00" },
    { id: 2, home: "Japan", away: "Mexiko", time: "13 juni · 21:00" },
    { id: 3, home: "Sverige", away: "Japan", time: "17 juni · 18:00" },
  ],
  "Grupp B": [
    { id: 4, home: "Frankrike", away: "Portugal", time: "12 juni · 18:00" },
    { id: 5, home: "USA", away: "Nederländerna", time: "14 juni · 20:00" },
    { id: 6, home: "Frankrike", away: "USA", time: "18 juni · 21:00" },
  ],
  "Grupp C": [
    { id: 7, home: "England", away: "Danmark", time: "13 juni · 19:00" },
    { id: 8, home: "Brasilien", away: "Belgien", time: "15 juni · 21:00" },
    { id: 9, home: "England", away: "Brasilien", time: "19 juni · 20:00" },
  ],
};

type GroupName = keyof typeof groupedMatches;

export default function TippaPage() {
  const [activeGroup, setActiveGroup] = useState<GroupName>("Grupp A");
  const [predictions, setPredictions] = useState<{
    [key: number]: { home: string; away: string };
  }>({});

  const handleChange = (
    id: number,
    team: "home" | "away",
    value: string
  ) => {
    setPredictions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [team]: value,
      },
    }));
  };

  const groups = Object.keys(groupedMatches) as GroupName[];
  const matches = groupedMatches[activeGroup];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Förhandstips
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Tippa hela VM
            </h1>
            <p className="mt-4 max-w-2xl text-neutral-400">
              Fyll i alla matcher innan turneringen startar. Börja med
              gruppspelet och gå sedan vidare till slutspelet.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Status
            </p>
            <p className="mt-1 font-medium text-neutral-100">Utkast sparat</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {groups.map((group) => {
            const isActive = activeGroup === group;

            return (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={
                  isActive
                    ? "rounded-full border border-neutral-700 bg-white px-4 py-2 text-sm font-medium text-neutral-950"
                    : "rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-700"
                }
              >
                {group}
              </button>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Gruppspel
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{activeGroup}</h2>
            </div>

            <p className="text-sm text-neutral-500">
              {matches.length} matcher
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">{match.time}</p>
                    <p className="mt-2 text-lg font-medium text-neutral-100">
                      {match.home} vs {match.away}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={predictions[match.id]?.home || ""}
                      onChange={(e) =>
                        handleChange(match.id, "home", e.target.value)
                      }
                      className="h-12 w-14 rounded-xl border border-neutral-700 bg-neutral-900 text-center text-base text-neutral-100 outline-none"
                    />

                    <span className="text-neutral-500">-</span>

                    <input
                      type="number"
                      min="0"
                      value={predictions[match.id]?.away || ""}
                      onChange={(e) =>
                        handleChange(match.id, "away", e.target.value)
                      }
                      className="h-12 w-14 rounded-xl border border-neutral-700 bg-neutral-900 text-center text-base text-neutral-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-100"
          >
            Spara utkast
          </button>

          <button
            type="button"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950"
          >
            Gå vidare till slutspel
          </button>
        </div>
      </Container>
    </main>
  );
}