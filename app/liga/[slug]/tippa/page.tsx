"use client";

import Container from "@/app/components/Container";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type League = {
  id: string;
  name: string;
  slug: string;
};

type MatchRow = {
  id: string;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_utc: string;
  stadium: string | null;
  city: string | null;
};

type PredictionRow = {
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

type TipState = Record<string, { home: string; away: string }>;

type MatchMemberStatus = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  has_prediction: boolean;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

type MatchStatusState = Record<
  string,
  {
    loading: boolean;
    error: string;
    locked: boolean;
    members: MatchMemberStatus[];
  }
>;

const LOCK_MINUTES_BEFORE_KICKOFF = 5;

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function getLockTimestamp(kickoffUtc: string) {
  const kickoffTime = new Date(kickoffUtc).getTime();
  return kickoffTime - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000;
}

function formatLockTime(kickoffUtc: string) {
  const lockTime = new Date(getLockTimestamp(kickoffUtc));

  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(lockTime);
}

function isMatchLocked(kickoffUtc: string, nowTs: number) {
  return nowTs >= getLockTimestamp(kickoffUtc);
}

function getCountdownLabel(kickoffUtc: string, nowTs: number) {
  const msLeft = getLockTimestamp(kickoffUtc) - nowTs;

  if (msLeft <= 0) {
    return "Tipset är låst";
  }

  const totalMinutes = Math.floor(msLeft / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // 👉 Om mer än 24 timmar kvar → visa inte countdown
  if (hours >= 24) {
    return null;
  }

  if (totalMinutes < 1) {
    return "Låser om mindre än 1 min";
  }

  if (hours >= 1) {
    return `Låser om ${hours} tim ${minutes} min`;
  }

  return `Låser om ${totalMinutes} min`;
}

export default function LeagueTippaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tips, setTips] = useState<TipState>({});
  const [matchStatuses, setMatchStatuses] = useState<MatchStatusState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setPageError("");
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: leagueRow, error: leagueError } = await supabase
        .from("leagues")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();

      if (leagueError || !leagueRow) {
        setPageError("Vi kunde inte hitta ligan.");
        setLoading(false);
        return;
      }

      setLeague(leagueRow);

      const { data: matchRows, error: matchesError } = await supabase
        .from("matches")
        .select("id, stage, group_name, home_team, away_team, kickoff_utc, stadium, city")
        .order("kickoff_utc", { ascending: true });

      if (matchesError) {
        setPageError("Kunde inte hämta matcher.");
        setLoading(false);
        return;
      }

      setMatches(matchRows ?? []);

      const { data: predictionRows, error: predictionsError } = await supabase
        .from("predictions")
        .select("match_id, predicted_home_score, predicted_away_score")
        .eq("league_id", leagueRow.id)
        .eq("user_id", user.id);

      if (predictionsError) {
        setPageError("Kunde inte hämta dina sparade tips.");
        setLoading(false);
        return;
      }

      const initialTips: TipState = {};

      (predictionRows ?? []).forEach((prediction: PredictionRow) => {
        initialTips[prediction.match_id] = {
          home: prediction.predicted_home_score.toString(),
          away: prediction.predicted_away_score.toString(),
        };
      });

      setTips(initialTips);

      const nextStatuses: MatchStatusState = {};

      (matchRows ?? []).forEach((match) => {
        nextStatuses[match.id] = {
          loading: true,
          error: "",
          locked: false,
          members: [],
        };
      });

      setMatchStatuses(nextStatuses);
      setLoading(false);

      for (const match of matchRows ?? []) {
        try {
          const response = await fetch(
            `/api/league-match-status?leagueId=${leagueRow.id}&matchId=${match.id}`
          );

          const result = await response.json().catch(() => null);

          if (!response.ok) {
            setMatchStatuses((prev) => ({
              ...prev,
              [match.id]: {
                loading: false,
                error:
                  typeof result === "object" && result?.message
                    ? result.message
                    : "Kunde inte hämta status för matchen.",
                locked: false,
                members: [],
              },
            }));
            continue;
          }

          setMatchStatuses((prev) => ({
            ...prev,
            [match.id]: {
              loading: false,
              error: "",
              locked: Boolean(result?.locked),
              members: Array.isArray(result?.members) ? result.members : [],
            },
          }));
        } catch {
          setMatchStatuses((prev) => ({
            ...prev,
            [match.id]: {
              loading: false,
              error: "Kunde inte hämta status för matchen.",
              locked: false,
              members: [],
            },
          }));
        }
      }
    }

    loadPage();
  }, [slug, supabase]);

  function updateHomeScore(matchId: string, value: string) {
    setTips((prev) => ({
      ...prev,
      [matchId]: {
        home: value,
        away: prev[matchId]?.away ?? "",
      },
    }));
  }

  function updateAwayScore(matchId: string, value: string) {
    setTips((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? "",
        away: value,
      },
    }));
  }

  async function refreshMatchStatuses(currentLeagueId: string, currentMatches: MatchRow[]) {
    for (const match of currentMatches) {
      try {
        const response = await fetch(
          `/api/league-match-status?leagueId=${currentLeagueId}&matchId=${match.id}`
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setMatchStatuses((prev) => ({
            ...prev,
            [match.id]: {
              loading: false,
              error:
                typeof result === "object" && result?.message
                  ? result.message
                  : "Kunde inte uppdatera status.",
              locked: false,
              members: [],
            },
          }));
          continue;
        }

        setMatchStatuses((prev) => ({
          ...prev,
          [match.id]: {
            loading: false,
            error: "",
            locked: Boolean(result?.locked),
            members: Array.isArray(result?.members) ? result.members : [],
          },
        }));
      } catch {
        setMatchStatuses((prev) => ({
          ...prev,
          [match.id]: {
            loading: false,
            error: "Kunde inte uppdatera status.",
            locked: false,
            members: [],
          },
        }));
      }
    }
  }

  async function handleSaveAll() {
    if (!league) return;

    setSaving(true);
    setMessage("");
    setPageError("");

    const payload = Object.entries(tips).map(([matchId, values]) => ({
      matchId,
      homeScore: values.home,
      awayScore: values.away,
    }));

    const response = await fetch("/api/save-predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId: league.id,
        predictions: payload,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setPageError(
        typeof result === "object" && result?.message
          ? result.message
          : "Kunde inte spara tipsen."
      );
      setSaving(false);
      return;
    }

    if (result?.skippedCount > 0) {
      setMessage(
        `Tips sparade. ${result.savedCount} match(er) sparades och ${result.skippedCount} match(er) hoppades över eftersom de redan var låsta.`
      );
    } else {
      setMessage("Alla tips sparade!");
    }

    await refreshMatchStatuses(league.id, matches);

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <Container>
          <div className="py-16">
            <h1 className="text-4xl font-bold tracking-tight">Tippa matcher</h1>
            <p className="mt-4 text-neutral-400">Laddar...</p>
          </div>
        </Container>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <Container>
          <div className="py-16">
            <h1 className="text-4xl font-bold tracking-tight">Tippa matcher</h1>
            <p className="mt-4 text-neutral-400">
              Du måste logga in för att tippa.
            </p>

            <div className="mt-6">
              <Link
                href="/login"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Logga in
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (pageError && !league) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <Container>
          <div className="py-16">
            <h1 className="text-4xl font-bold tracking-tight">Tippa matcher</h1>
            <p className="mt-4 text-red-400">{pageError}</p>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="py-16">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Tips
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Tippa matcher i {league?.name}
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Fyll i dina resultat och spara alla tips i ett klick. Tips låses 5
            minuter före avspark.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/liga/${league?.slug}`}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-100 hover:border-neutral-700"
            >
              Tillbaka till ligan
            </Link>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving ? "Sparar..." : "Spara alla tips"}
            </button>
          </div>

          {pageError && (
            <div className="mt-6 rounded-2xl border border-red-900 bg-neutral-900 p-4 text-sm text-red-400">
              {pageError}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl border border-green-900 bg-neutral-900 p-4 text-sm text-green-400">
              {message}
            </div>
          )}

          {matches.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-neutral-400">Inga matcher än</p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {matches.map((match) => {
                const currentTip = tips[match.id] ?? { home: "", away: "" };
                const locked = isMatchLocked(match.kickoff_utc, nowTs);
                const status = matchStatuses[match.id];
                const countdownLabel = getCountdownLabel(match.kickoff_utc, nowTs);

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neutral-400">
                          {match.stage === "group"
                            ? `Grupp ${match.group_name}`
                            : match.stage}
                        </span>

                        {locked && (
                          <span className="rounded-full border border-red-900 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-400">
                            Låst
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-neutral-400">
                        {formatKickoff(match.kickoff_utc)}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300">
                      {locked ? (
  <div className="space-y-1">
    <p>Tipset är låst</p>
    <p className="text-xs text-neutral-500">
      Låstes {formatLockTime(match.kickoff_utc)}
    </p>
  </div>
) : (
  <div className="space-y-1">
    {countdownLabel ? (
      <p>{countdownLabel}</p>
    ) : (
      <p>Tips låses {formatLockTime(match.kickoff_utc)}</p>
    )}

    <p className="text-xs text-neutral-500">
      Tips låses 5 minuter före avspark
    </p>
  </div>
)}
                    </div>

                    <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                      <div>
                        <p className="text-sm text-neutral-500">Hemmalag</p>
                        <p className="mt-1 text-xl font-semibold text-neutral-100">
                          {match.home_team}
                        </p>
                      </div>

                      <div className="text-center text-xl text-neutral-500">vs</div>

                      <div className="md:text-right">
                        <p className="text-sm text-neutral-500">Bortalag</p>
                        <p className="mt-1 text-xl font-semibold text-neutral-100">
                          {match.away_team}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-neutral-400">
                          {match.home_team}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentTip.home}
                          onChange={(e) => updateHomeScore(match.id, e.target.value)}
                          disabled={locked}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-neutral-400">
                          {match.away_team}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentTip.away}
                          onChange={(e) => updateAwayScore(match.id, e.target.value)}
                          disabled={locked}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="mt-6 text-sm text-neutral-400">
                      {match.stadium || "Okänd arena"}
                      {match.city ? ` · ${match.city}` : ""}
                    </div>

                    <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                      <p className="text-sm font-semibold text-neutral-200">
                        Status i ligan
                      </p>

                      {status?.loading && (
                        <p className="mt-3 text-sm text-neutral-400">
                          Hämtar status...
                        </p>
                      )}

                      {status?.error && (
                        <p className="mt-3 text-sm text-red-400">
                          {status.error}
                        </p>
                      )}

                      {!status?.loading && !status?.error && status?.members.length === 0 && (
                        <p className="mt-3 text-sm text-neutral-400">
                          Inga medlemmar att visa.
                        </p>
                      )}

                      {!status?.loading && !status?.error && status?.members.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {status.members.map((member) => {
                            const showExactPrediction =
                              status.locked &&
                              member.predicted_home_score !== null &&
                              member.predicted_away_score !== null;

                            return (
                              <div
                                key={member.user_id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-neutral-100">
                                    {member.display_name || member.email || "Okänd användare"}
                                  </p>
                                  {member.email && (
                                    <p className="mt-1 text-xs text-neutral-500">
                                      {member.email}
                                    </p>
                                  )}
                                </div>

                                {showExactPrediction ? (
                                  <span className="rounded-full border border-blue-900 px-3 py-1 text-xs font-medium text-blue-400">
                                    {member.predicted_home_score}-{member.predicted_away_score}
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      member.has_prediction
                                        ? "rounded-full border border-green-900 px-3 py-1 text-xs font-medium text-green-400"
                                        : "rounded-full border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-400"
                                    }
                                  >
                                    {member.has_prediction ? "Har tippat" : "Inte tippat än"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}