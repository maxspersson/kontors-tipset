"use client";

import { createClient } from "@/app/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type League = {
  id: string;
  name: string;
  slug: string;
  submission_deadline: string | null;
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

type SubmissionRow = {
  submitted_at: string;
  updated_at: string;
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

const LOCK_MINUTES_BEFORE_KICKOFF = 60;

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatDeadline(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function isSubmissionDeadlinePassed(deadline: string | null) {
  if (!deadline) return false;
  return Date.now() > new Date(deadline).getTime();
}

function formatSubmissionTime(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function getLockTimestamp(kickoffUtc: string) {
  return new Date(kickoffUtc).getTime() - LOCK_MINUTES_BEFORE_KICKOFF * 60 * 1000;
}

function formatLockTime(kickoffUtc: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(getLockTimestamp(kickoffUtc)));
}

function isMatchLocked(kickoffUtc: string, nowTs: number) {
  return nowTs >= getLockTimestamp(kickoffUtc);
}

function getCountdownLabel(kickoffUtc: string, nowTs: number) {
  const msLeft = getLockTimestamp(kickoffUtc) - nowTs;

  if (msLeft <= 0) return "Tipset är låst";

  const totalMinutes = Math.floor(msLeft / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) return null;
  if (totalMinutes < 1) return "Låser om mindre än 1 min";
  if (hours >= 1) return `Låser om ${hours} tim ${minutes} min`;

  return `Låser om ${totalMinutes} min`;
}

function formatStage(match: MatchRow) {
  if (match.stage === "group") return `Grupp ${match.group_name ?? ""}`;
  return match.stage;
}

export default function LeagueTippaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [tips, setTips] = useState<TipState>({});
  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [matchStatuses, setMatchStatuses] = useState<MatchStatusState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  const completedTipsCount = matches.filter((match) => {
    const tip = tips[match.id];
    return tip?.home !== "" && tip?.away !== "";
  }).length;

  const allMatchesTipped = matches.length > 0 && completedTipsCount === matches.length;
  const isDeadlinePassed = isSubmissionDeadlinePassed(league?.submission_deadline ?? null);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTs(Date.now()), 1000);
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
        .select("id, name, slug, submission_deadline")
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

      const { data: submissionRow, error: submissionError } = await supabase
        .from("league_submissions")
        .select("submitted_at, updated_at")
        .eq("league_id", leagueRow.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (submissionError) {
        setPageError("Kunde inte hämta status för ditt turneringstips.");
        setLoading(false);
        return;
      }

      setSubmission(submissionRow);

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

          setMatchStatuses((prev) => ({
            ...prev,
            [match.id]: response.ok
              ? {
                  loading: false,
                  error: "",
                  locked: Boolean(result?.locked),
                  members: Array.isArray(result?.members) ? result.members : [],
                }
              : {
                  loading: false,
                  error:
                    typeof result === "object" && result?.message
                      ? result.message
                      : "Kunde inte hämta status för matchen.",
                  locked: false,
                  members: [],
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

        setMatchStatuses((prev) => ({
          ...prev,
          [match.id]: response.ok
            ? {
                loading: false,
                error: "",
                locked: Boolean(result?.locked),
                members: Array.isArray(result?.members) ? result.members : [],
              }
            : {
                loading: false,
                error:
                  typeof result === "object" && result?.message
                    ? result.message
                    : "Kunde inte uppdatera status.",
                locked: false,
                members: [],
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

    if (!submission) {
      setMessage(
        "Dina tips sparas, men du behöver skicka in turneringstipset innan deadline för att delta i ligan."
      );
    }

    setSaving(true);
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

  async function handleSubmitTournament() {
    if (!league) return;

    setSubmitting(true);
    setMessage("");
    setPageError("");

    const response = await fetch("/api/submit-tournament", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId: league.id,
      }),
    });

    const text = await response.text();

    let result: {
      success?: boolean;
      message?: string;
      totalMatches?: number;
      userPredictions?: number;
    } | null = null;

    try {
      result = JSON.parse(text);
    } catch {
      result = null;
    }

    if (!response.ok) {
      setPageError(result?.message || text || "Kunde inte skicka in turneringstipset.");
      setSubmitting(false);
      return;
    }

    setSubmission({
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setMessage(result?.message || "Turneringstipset är inskickat.");
    setSubmitting(false);
  }

  if (loading) {
    return (
      <Shell>
        <div className="center-card">
          <p className="eyebrow">Tips</p>
          <h1>Laddar tipsen.</h1>
          <p>Vi hämtar matcher, sparade tips och ligastatus.</p>
        </div>
      </Shell>
    );
  }

  if (!userId) {
    return (
      <Shell>
        <div className="center-card">
          <p className="eyebrow">Tips</p>
          <h1>Logga in för att tippa.</h1>
          <p>Du behöver vara inloggad för att skicka in och ändra dina tips.</p>
          <Link href="/login" className="gold-btn">
            Logga in →
          </Link>
        </div>
      </Shell>
    );
  }

  if (pageError && !league) {
    return (
      <Shell>
        <div className="center-card">
          <p className="eyebrow">Tips</p>
          <h1>Något gick fel.</h1>
          <p>{pageError}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="tips-head">
        <div>
          <p className="eyebrow">Tips</p>
          <h1>Tippa matcher i {league?.name}</h1>
          <p className="intro">
            Fyll i alla matcher och skicka in ditt turneringstips innan deadline.
            Efter inskickat tips kan du ändra enskilda matcher fram till 60 minuter
            före avspark.
          </p>
        </div>

        <div className="submit-card">
          <p>Turneringstips</p>

          {submission ? (
            <>
              <strong>Inskickat</strong>
              <span>{formatSubmissionTime(submission.submitted_at)}</span>
            </>
          ) : (
            <>
              <strong>Inte inskickat</strong>
              <span>{completedTipsCount} av {matches.length} matcher ifyllda</span>
            </>
          )}

          {league?.submission_deadline && (
            <small>Deadline: {formatDeadline(league.submission_deadline)}</small>
          )}

          <button
            type="button"
            onClick={handleSubmitTournament}
            disabled={submitting || !allMatchesTipped || isDeadlinePassed}
            className="gold-submit"
          >
            {submitting
              ? "Skickar in..."
              : isDeadlinePassed
                ? "Deadline passerad"
                : submission
                  ? "Skicka in igen"
                  : "Skicka in tips"}
          </button>
        </div>
      </div>

      <div className="progress-panel">
        <div>
          <p>Progress</p>
          <strong>{completedTipsCount}/{matches.length}</strong>
          <span>matcher ifyllda</span>
        </div>

        <div>
          <p>Matchlås</p>
          <strong>60 min</strong>
          <span>före avspark</span>
        </div>

        <div>
          <p>Status</p>
          <strong>{submission ? "Klar" : "Pågår"}</strong>
          <span>{submission ? "tipset är inskickat" : "skicka in före deadline"}</span>
        </div>
      </div>

      <div className="action-row">
        <Link href={`/liga/${league?.slug}`} className="dark-btn">
          ← Tillbaka till ligan
        </Link>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="gold-btn"
        >
          {saving ? "Sparar..." : "Spara alla tips"}
        </button>
      </div>

      {pageError && <div className="notice error">{pageError}</div>}
      {message && <div className="notice success">{message}</div>}

      {matches.length === 0 ? (
        <div className="empty-card">Inga matcher än.</div>
      ) : (
        <div className="match-list">
          {matches.map((match) => {
            const currentTip = tips[match.id] ?? { home: "", away: "" };
            const locked = isMatchLocked(match.kickoff_utc, nowTs);
            const status = matchStatuses[match.id];
            const countdownLabel = getCountdownLabel(match.kickoff_utc, nowTs);

            return (
              <article key={match.id} className="match-card">
                <div className="match-top">
                  <div className="match-meta">
                    <span>{formatStage(match)}</span>
                    {locked && <em>Låst</em>}
                  </div>

                  <time>{formatKickoff(match.kickoff_utc)}</time>
                </div>

                <div className="lock-box">
                  {locked ? (
                    <>
                      <strong>Tipset är låst</strong>
                      <span>Låstes {formatLockTime(match.kickoff_utc)}</span>
                    </>
                  ) : (
                    <>
                      <strong>{countdownLabel || `Tips låses ${formatLockTime(match.kickoff_utc)}`}</strong>
                      <span>Tips låses 60 minuter före avspark</span>
                    </>
                  )}
                </div>

                <div className="prediction-grid">
                  <div className="team-box">
                    <p>Hemmalag</p>
                    <h2>{match.home_team}</h2>

                    <input
                      type="number"
                      min="0"
                      value={currentTip.home}
                      onChange={(e) => updateHomeScore(match.id, e.target.value)}
                      disabled={locked}
                      placeholder="0"
                    />
                  </div>

                  <div className="vs-pill">VS</div>

                  <div className="team-box away">
                    <p>Bortalag</p>
                    <h2>{match.away_team}</h2>

                    <input
                      type="number"
                      min="0"
                      value={currentTip.away}
                      onChange={(e) => updateAwayScore(match.id, e.target.value)}
                      disabled={locked}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="venue-line">
                  {match.stadium || "Okänd arena"}
                  {match.city ? ` · ${match.city}` : ""}
                </div>

                <div className="league-status">
                  <div className="status-head">
                    <p>Status i ligan</p>
                    <span>{status?.locked ? "Tips synliga" : "Dolda tips"}</span>
                  </div>

                  {status?.loading && <p className="muted">Hämtar status...</p>}
                  {status?.error && <p className="status-error">{status.error}</p>}

                  {!status?.loading && !status?.error && status?.members.length === 0 && (
                    <p className="muted">Inga medlemmar att visa.</p>
                  )}

                  {!status?.loading && !status?.error && status?.members.length > 0 && (
                    <div className="member-tip-list">
                      {status.members.map((member) => {
                        const showExactPrediction =
                          status.locked &&
                          member.predicted_home_score !== null &&
                          member.predicted_away_score !== null;

                        return (
                          <div key={member.user_id} className="member-tip-row">
                            <div>
                              <strong>
                                {member.display_name || member.email || "Okänd användare"}
                              </strong>
                              {member.email && <span>{member.email}</span>}
                            </div>

                            {showExactPrediction ? (
                              <em className="score-pill">
                                {member.predicted_home_score}-{member.predicted_away_score}
                              </em>
                            ) : (
                              <em className={member.has_prediction ? "done-pill" : "pending-pill"}>
                                {member.has_prediction ? "Har tippat" : "Inte tippat"}
                              </em>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="league-tips-page">
      <section className="league-tips-hero">
        <div className="tips-wrap">{children}</div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .league-tips-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .league-tips-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.74) 0%, rgba(2,3,4,0.96) 340px, #020304 100%),
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.70) 58%, rgba(2,3,4,0.94) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .league-tips-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 74% 14%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 18% 12%, rgba(255,255,255,0.07), transparent 22%);
            }

            .tips-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px 70px;
            }

            .tips-head {
              display: grid;
              grid-template-columns: 1fr 360px;
              gap: 44px;
              align-items: end;
            }

            .eyebrow {
              margin: 0 0 16px;
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            .tips-head h1,
            .center-card h1 {
              margin: 0;
              max-width: 760px;
              font-size: clamp(46px, 6vw, 82px);
              line-height: 1.02;
              letter-spacing: -0.06em;
              font-weight: 950;
            }

            .intro,
            .center-card p {
              margin: 22px 0 0;
              max-width: 620px;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.65;
            }

            .center-card {
              max-width: 680px;
              padding: 34px;
              border-radius: 28px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .submit-card,
            .progress-panel > div,
            .match-card,
            .empty-card,
            .notice {
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .submit-card {
              padding: 24px;
              border-radius: 24px;
            }

            .submit-card p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .submit-card strong {
              display: block;
              margin-top: 12px;
              font-size: 30px;
              letter-spacing: -0.04em;
            }

            .submit-card span,
            .submit-card small {
              display: block;
              margin-top: 8px;
              color: rgba(255,255,255,0.58);
              font-size: 14px;
              line-height: 1.45;
            }

            .gold-submit,
            .gold-btn,
            .dark-btn {
              height: 56px;
              padding: 0 26px;
              border-radius: 14px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              font-size: 14px;
              font-weight: 950;
              cursor: pointer;
              font-family: inherit;
            }

            .gold-submit,
            .gold-btn {
              border: 0;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              box-shadow: 0 18px 50px rgba(218,169,53,0.25);
            }

            .gold-submit {
              width: 100%;
              margin-top: 18px;
            }

            .gold-submit:disabled,
            .gold-btn:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }

            .dark-btn {
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(255,255,255,0.055);
              color: white;
              backdrop-filter: blur(14px);
            }

            .progress-panel {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 42px;
            }

            .progress-panel > div {
              padding: 20px;
              border-radius: 20px;
            }

            .progress-panel p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .progress-panel strong {
              display: block;
              margin-top: 12px;
              color: #e5b94d;
              font-size: 28px;
              line-height: 1.1;
              letter-spacing: -0.04em;
            }

            .progress-panel span {
              display: block;
              margin-top: 6px;
              color: rgba(255,255,255,0.48);
              font-size: 13px;
            }

            .action-row {
              display: flex;
              gap: 14px;
              flex-wrap: wrap;
              margin-top: 18px;
            }

            .notice,
            .empty-card {
              margin-top: 18px;
              padding: 18px;
              border-radius: 18px;
              color: rgba(255,255,255,0.70);
            }

            .notice.error {
              border-color: rgba(248,113,113,0.30);
              color: #fca5a5;
            }

            .notice.success {
              border-color: rgba(134,239,172,0.25);
              color: #86efac;
            }

            .match-list {
              display: grid;
              gap: 18px;
              margin-top: 24px;
            }

            .match-card {
              padding: 24px;
              border-radius: 26px;
            }

            .match-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
            }

            .match-meta {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
            }

            .match-meta span,
            .match-meta em {
              display: inline-flex;
              align-items: center;
              min-height: 30px;
              padding: 0 12px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              font-style: normal;
            }

            .match-meta span {
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.22);
              color: #e5b94d;
            }

            .match-meta em {
              background: rgba(248,113,113,0.10);
              border: 1px solid rgba(248,113,113,0.24);
              color: #fca5a5;
            }

            .match-top time {
              color: rgba(255,255,255,0.50);
              font-size: 13px;
              font-weight: 800;
            }

            .lock-box {
              display: flex;
              justify-content: space-between;
              gap: 14px;
              margin-top: 16px;
              padding: 15px 16px;
              border-radius: 16px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.16);
            }

            .lock-box strong {
              color: #e5b94d;
              font-size: 14px;
            }

            .lock-box span {
              color: rgba(255,255,255,0.48);
              font-size: 13px;
            }

            .prediction-grid {
              display: grid;
              grid-template-columns: 1fr 64px 1fr;
              gap: 16px;
              align-items: center;
              margin-top: 20px;
            }

            .team-box {
              min-width: 0;
              padding: 20px;
              border-radius: 20px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .team-box.away {
              text-align: right;
            }

            .team-box p {
              margin: 0;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .team-box h2 {
              margin: 10px 0 16px;
              font-size: 26px;
              line-height: 1.05;
              letter-spacing: -0.04em;
            }

            .team-box input {
              width: 92px;
              height: 62px;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 16px;
              background: rgba(0,0,0,0.34);
              color: white;
              text-align: center;
              font-size: 28px;
              font-weight: 950;
              outline: none;
            }

            .team-box input:focus {
              border-color: rgba(229,185,77,0.65);
              box-shadow: 0 0 0 4px rgba(229,185,77,0.12);
            }

            .team-box input:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }

            .vs-pill {
              display: grid;
              place-items: center;
              width: 54px;
              height: 54px;
              border-radius: 999px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 13px;
              font-weight: 950;
              box-shadow: 0 18px 50px rgba(218,169,53,0.22);
            }

            .venue-line {
              margin-top: 16px;
              color: rgba(255,255,255,0.46);
              font-size: 14px;
            }

            .league-status {
              margin-top: 18px;
              padding: 18px;
              border-radius: 20px;
              background: rgba(0,0,0,0.24);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .status-head {
              display: flex;
              justify-content: space-between;
              gap: 14px;
              align-items: center;
            }

            .status-head p {
              margin: 0;
              font-size: 14px;
              font-weight: 950;
            }

            .status-head span {
              color: rgba(255,255,255,0.44);
              font-size: 12px;
              font-weight: 850;
            }

            .muted,
            .status-error {
              margin: 14px 0 0;
              color: rgba(255,255,255,0.50);
              font-size: 14px;
            }

            .status-error {
              color: #fca5a5;
            }

            .member-tip-list {
              display: grid;
              gap: 10px;
              margin-top: 14px;
            }

            .member-tip-row {
              display: flex;
              justify-content: space-between;
              gap: 14px;
              align-items: center;
              padding: 13px;
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .member-tip-row strong {
              display: block;
              font-size: 14px;
            }

            .member-tip-row span {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.36);
              font-size: 12px;
            }

            .score-pill,
            .done-pill,
            .pending-pill {
              font-style: normal;
              white-space: nowrap;
              padding: 7px 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 950;
            }

            .score-pill {
              color: #93c5fd;
              background: rgba(59,130,246,0.12);
              border: 1px solid rgba(59,130,246,0.22);
            }

            .done-pill {
              color: #86efac;
              background: rgba(34,197,94,0.10);
              border: 1px solid rgba(34,197,94,0.20);
            }

            .pending-pill {
              color: rgba(255,255,255,0.48);
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.10);
            }

            @media (max-width: 900px) {
              .tips-wrap {
                padding: 56px 18px 46px;
              }

              .tips-head {
                grid-template-columns: 1fr;
                gap: 24px;
              }

              .tips-head h1,
              .center-card h1 {
                font-size: 46px;
                max-width: 350px;
              }

              .intro,
              .center-card p {
                font-size: 16px;
                max-width: 350px;
              }

              .progress-panel {
                grid-template-columns: 1fr;
                margin-top: 30px;
              }

              .action-row {
                flex-direction: column;
              }

              .gold-btn,
              .dark-btn {
                width: 100%;
              }

              .match-card {
                padding: 18px;
                border-radius: 22px;
              }

              .match-top {
                align-items: flex-start;
                flex-direction: column;
              }

              .lock-box {
                flex-direction: column;
              }

              .prediction-grid {
                grid-template-columns: 1fr;
              }

              .team-box.away {
                text-align: left;
              }

              .vs-pill {
                margin: 0 auto;
              }

              .team-box input {
                width: 100%;
              }

              .member-tip-row {
                align-items: flex-start;
                flex-direction: column;
              }
            }
          `,
        }}
      />
    </main>
  );
}