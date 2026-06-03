"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  groups,
  bracketRounds,
  buildGroupTable,
  buildPlayoffRounds,
  rankBestThirdPlacedTeams,
  isCompletePrediction,
  type AdvancingTeam,
  type PredictionState,
} from "../lib/worldCupRules";
import { formatKickoff } from "../lib/formatDate";
import type { LeagueSubmission, Match, SavedPrediction } from "./page";

type Tab = string | "slutspel";

type CopyLeagueOption = {
  id: string;
  name: string;
};

const TOURNAMENT_DEADLINE_LABEL = "11 juni 2026 kl. 20:00";
const TOURNAMENT_SUBMIT_LOCK_DATE = new Date("2026-06-11T20:30:00+02:00");

function isTournamentSubmitDeadlinePassed() {
  return Date.now() >= TOURNAMENT_SUBMIT_LOCK_DATE.getTime();
}

function isLiveMatch(match: Match) {
  return match.status === "live";
}

function isFinishedMatch(match: Match) {
  return match.status === "finished";
}

function isMatchLocked(match: Match) {
  if (isLiveMatch(match)) return true;
  if (isFinishedMatch(match)) return true;

  const kickoff = new Date(match.kickoff_utc).getTime();
  const lockTime = kickoff - 60 * 60 * 1000;

  return Date.now() >= lockTime;
}

function getMinutesUntilLock(match: Match) {
  const kickoff = new Date(match.kickoff_utc).getTime();
  const lockTime = kickoff - 60 * 60 * 1000;
  const diff = lockTime - Date.now();

  return Math.ceil(diff / 1000 / 60);
}

function isMatchLockingSoon(match: Match) {
  if (isMatchLocked(match)) return false;
  if (isLiveMatch(match)) return false;
  if (isFinishedMatch(match)) return false;

  const minutesUntilLock = getMinutesUntilLock(match);

  return minutesUntilLock > 0 && minutesUntilLock <= 180;
}

function getLockPressureText(match: Match) {
  const minutesUntilLock = getMinutesUntilLock(match);

  if (minutesUntilLock <= 0) return "Låser nu";
  if (minutesUntilLock < 60) return `Låser om ${minutesUntilLock} min`;

  const hours = Math.floor(minutesUntilLock / 60);
  const minutes = minutesUntilLock % 60;

  if (minutes === 0) return `Låser om ${hours} tim`;

  return `Låser om ${hours} tim ${minutes} min`;
}

function getMatchStatusText(match: Match, matchLocked: boolean, readonly: boolean) {
  if (readonly) return "Låst tips";
  if (isLiveMatch(match)) return "Matchen spelas nu";
  if (isFinishedMatch(match)) return "Slutspelad";
  if (matchLocked) return "Låst 60 min före avspark";
  if (isMatchLockingSoon(match)) return getLockPressureText(match);
  return "Öppen för tips";
}

function isCompletePlayoffPrediction(prediction?: {
  home: string;
  away: string;
  advancingTeam?: AdvancingTeam | null;
}) {
  if (!prediction) return false;
  if (!isCompletePrediction(prediction)) return false;
  if (prediction.home !== prediction.away) return true;

  return prediction.advancingTeam === "home" || prediction.advancingTeam === "away";
}

function getSingleMatchPoints({
  predictedHome,
  predictedAway,
  actualHome,
  actualAway,
}: {
  predictedHome: number | null;
  predictedAway: number | null;
  actualHome: number | null;
  actualAway: number | null;
}) {
  if (
    predictedHome === null ||
    predictedAway === null ||
    actualHome === null ||
    actualAway === null
  ) {
    return null;
  }

  let points = 0;

  if (predictedHome === actualHome) points += 2;
  if (predictedAway === actualAway) points += 2;

  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
  const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

  if (predictedSign === actualSign) points += 3;

  return points;
}

function getSwedishTeamName(name: string) {
  const normalizedName = name.trim().toLowerCase();

  const map: Record<string, string> = {
    mexico: "Mexiko",
    "south africa": "Sydafrika",
    germany: "Tyskland",
    sweden: "Sverige",
    france: "Frankrike",
    england: "England",
    brazil: "Brasilien",
    argentina: "Argentina",
    portugal: "Portugal",
    spain: "Spanien",
    netherlands: "Nederländerna",
    switzerland: "Schweiz",
    belgium: "Belgien",
    norway: "Norge",
    denmark: "Danmark",
    japan: "Japan",
    australia: "Australien",
    canada: "Kanada",
    croatia: "Kroatien",
    ghana: "Ghana",
    panama: "Panama",
    uruguay: "Uruguay",
    "saudi arabia": "Saudiarabien",
    iraq: "Irak",
    senegal: "Senegal",
    qatar: "Qatar",
    ecuador: "Ecuador",
    tunisia: "Tunisien",
    morocco: "Marocko",
    scotland: "Skottland",
    haiti: "Haiti",
    colombia: "Colombia",
    "congo dr": "Kongo DR",
    uzbekistan: "Uzbekistan",
    austria: "Österrike",
    jordan: "Jordanien",
    algeria: "Algeriet",
    "bosnia-herzegovina": "Bosnien-Hercegovina",
    "korea republic": "Sydkorea",
    czechia: "Tjeckien",
    egypt: "Egypten",
    "new zealand": "Nya Zeeland",
    "ir iran": "Iran",
    türkiye: "Turkiet",
    usa: "USA",
    paraguay: "Paraguay",
    curaçao: "Curacao",
    "côte d'ivoire": "Elfenbenskusten",
    "cabo verde": "Kap Verde",
  };

  return map[normalizedName] ?? name;
}

function getFriendlySlotLabel(label: string) {
  if (/^W\d+$/.test(label)) return `Vinnare match ${label.replace("W", "")}`;
  if (/^L\d+$/.test(label)) return `Förlorare match ${label.replace("L", "")}`;
  if (/^1[A-L]$/.test(label)) return `Vinnare grupp ${label.replace("1", "")}`;
  if (/^2[A-L]$/.test(label)) return `Tvåa grupp ${label.replace("2", "")}`;
  if (/^3[A-L]+$/.test(label)) return "Bästa grupptrea";

  return "Ej klart";
}

function getPenaltyDecisionText(stage?: string | null) {
  if (stage === "final" || stage === "third_place") {
    return "Välj vinnare efter straffläggning.";
  }

  return "Välj lag som går vidare efter straffläggning.";
}

function getPenaltyButtonSuffix(stage?: string | null) {
  if (stage === "final" || stage === "third_place") {
    return "vinner";
  }

  return "vidare";
}

export default function TippaClient({
  groupMatches,
  playoffMatches,
  savedPredictions,
  submission,
  isLocked,
  hasError,
  leagueId,
  copyLeagueOptions = [],
  readonly = false,
  viewerName,
  backHref,
}: {
  groupMatches: Match[];
  playoffMatches: Match[];
  savedPredictions: SavedPrediction[];
  submission: LeagueSubmission | null;
  isLocked: boolean;
  hasError: boolean;
  leagueId: string;
  copyLeagueOptions?: CopyLeagueOption[];
  readonly?: boolean;
  viewerName?: string;
  backHref?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("A");
  const [saveStatus, setSaveStatus] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(isLocked);
  const [copySourceLeagueId, setCopySourceLeagueId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [submitDeadlinePassed, setSubmitDeadlinePassed] = useState(false);

  const hasMounted = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function updateDeadlineStatus() {
      setSubmitDeadlinePassed(isTournamentSubmitDeadlinePassed());
    }

    updateDeadlineStatus();

    const interval = setInterval(updateDeadlineStatus, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const isSubmitDeadlineLocked = submitDeadlinePassed && !readonly;
  const isPlayoffLocked = hasSubmitted || readonly || isSubmitDeadlineLocked;

  const [predictions, setPredictions] = useState<PredictionState>(() => {
    const initial: PredictionState = {};

    for (const prediction of savedPredictions) {
      initial[prediction.match_id] = {
        home:
          prediction.predicted_home_score === null
            ? ""
            : String(prediction.predicted_home_score),
        away:
          prediction.predicted_away_score === null
            ? ""
            : String(prediction.predicted_away_score),
        advancingTeam: prediction.advancing_team,
      };
    }

    return initial;
  });

  useEffect(() => {
    if (readonly) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    const payload = Object.entries(predictions)
      .filter(([, value]) => value.home !== "" && value.away !== "")
      .map(([matchId, value]) => ({
        matchId,
        homeScore: value.home,
        awayScore: value.away,
        advancingTeam: value.advancingTeam ?? null,
      }));

    if (payload.length === 0) return;

    setAutoSaveStatus("Sparar automatiskt...");

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/save-predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leagueId,
            predictions: payload,
          }),
        });

        const text = await response.text();

        if (!response.ok) {
          setAutoSaveStatus(text || "Kunde inte autospara.");
          return;
        }

        setAutoSaveStatus("Autosparat ✓");
      } catch {
        setAutoSaveStatus("Kunde inte autospara.");
      }
    }, 1000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [predictions, leagueId, readonly]);

  const activeMatches = groupMatches.filter(
    (match) => match.group_name === activeTab
  );

  const allGroupTables = useMemo(() => {
    return groups.map((group) => {
      const matchesInGroup = groupMatches.filter(
        (match) => match.group_name === group
      );

      return {
        group,
        table: buildGroupTable(matchesInGroup, predictions, group),
        completedMatches: matchesInGroup.filter((match) =>
          isCompletePrediction(predictions[match.id])
        ).length,
        totalMatches: matchesInGroup.length,
      };
    });
  }, [groupMatches, predictions]);

  const activeGroupTable =
    allGroupTables.find((item) => item.group === activeTab)?.table ?? [];

  const completedGroupMatches = allGroupTables.reduce(
    (sum, group) => sum + group.completedMatches,
    0
  );

  const completedPredictionsCount =
    groupMatches.reduce((sum, match) => {
      return sum + (isCompletePrediction(predictions[match.id]) ? 1 : 0);
    }, 0) +
    playoffMatches.reduce((sum, match) => {
      return sum + (isCompletePlayoffPrediction(predictions[match.id]) ? 1 : 0);
    }, 0);

  const TOTAL_MATCHES = 104;
  const isEntireBracketComplete = completedPredictionsCount >= TOTAL_MATCHES;

  const allGroupsComplete = allGroupTables.every(
    (group) =>
      group.totalMatches > 0 && group.completedMatches === group.totalMatches
  );

  const thirdPlacedTeams = allGroupsComplete
    ? rankBestThirdPlacedTeams(allGroupTables).slice(0, 8)
    : [];

  const playoffRounds = useMemo(() => {
    return buildPlayoffRounds({
      playoffMatches,
      allGroupTables,
      thirdPlacedTeams,
      predictions,
    });
  }, [playoffMatches, allGroupTables, thirdPlacedTeams, predictions]);

  const finalRound = playoffRounds[playoffRounds.length - 1];
  const finalMatch = finalRound?.find((match) => match.dbMatch.stage === "final");
  const bronzeMatch = finalRound?.find(
    (match) => match.dbMatch.stage === "third_place"
  );

  const champion = finalMatch?.winner;
  const runnerUp = finalMatch?.loser;
  const bronzeWinner = bronzeMatch?.winner;

  function updatePrediction(
    matchId: string,
    side: "home" | "away",
    value: string
  ) {
    if (readonly) return;

    const match =
      groupMatches.find((item) => item.id === matchId) ||
      playoffMatches.find((item) => item.id === matchId);

    if (!match) return;

    if (match.stage === "group" && isMatchLocked(match)) return;
    if (match.stage !== "group" && isPlayoffLocked) return;

    const onlyNumbers = value.replace(/\D/g, "");

    setPredictions((prev) => {
      const current = prev[matchId] ?? {
        home: "",
        away: "",
        advancingTeam: null,
      };

      const next = {
        ...current,
        [side]: onlyNumbers,
      };

      if (next.home !== next.away) {
        next.advancingTeam = null;
      }

      return {
        ...prev,
        [matchId]: next,
      };
    });

    setSaveStatus("");
    setAutoSaveStatus("");
    setSubmitStatus("");
    setCopyStatus("");
  }

  function updateAdvancingTeam(matchId: string, advancingTeam: AdvancingTeam) {
    if (readonly) return;

    const match = playoffMatches.find((item) => item.id === matchId);

    if (!match) return;
    if (isPlayoffLocked) return;

    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home || "",
        away: prev[matchId]?.away || "",
        advancingTeam,
      },
    }));

    setSaveStatus("");
    setAutoSaveStatus("");
    setSubmitStatus("");
    setCopyStatus("");
  }

  async function copyPredictionsFromLeague() {
    if (isSubmitDeadlineLocked) {
      setCopyStatus(
        "Deadline har passerat. Det går inte längre att kopiera in ett helt tips."
      );
      return;
    }

    if (!copySourceLeagueId) {
      setCopyStatus("Välj en liga att kopiera från.");
      return;
    }

    const confirmed = window.confirm(
      "Vill du kopiera in tipset från den valda ligan? Dina nuvarande tips i den här ligan skrivs över, men tipset låses inte."
    );

    if (!confirmed) return;

    setIsCopying(true);
    setCopyStatus("Kopierar tips...");

    const response = await fetch("/api/copy-predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceLeagueId: copySourceLeagueId,
        targetLeagueId: leagueId,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      setCopyStatus(text || "Kunde inte kopiera tips.");
      setIsCopying(false);
      return;
    }

    try {
      const data = JSON.parse(text);
      setCopyStatus(`${data.copiedCount ?? 0} tips kopierade. Laddar om...`);
    } catch {
      setCopyStatus("Tips kopierade. Laddar om...");
    }

    window.location.reload();
  }

  async function savePredictions() {
    setSaveStatus("Sparar...");

    const payload = Object.entries(predictions)
      .filter(([, value]) => value.home !== "" && value.away !== "")
      .map(([matchId, value]) => ({
        matchId,
        homeScore: value.home,
        awayScore: value.away,
        advancingTeam: value.advancingTeam ?? null,
      }));

    if (payload.length === 0) {
      setSaveStatus("Fyll i minst ett komplett tips först.");
      return false;
    }

    const response = await fetch("/api/save-predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId,
        predictions: payload,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      setSaveStatus(text || "Kunde inte spara tipsen.");
      return false;
    }

    try {
      const data = JSON.parse(text);
      setSaveStatus(`Sparat! ${data.savedCount ?? payload.length} tips sparade.`);
    } catch {
      setSaveStatus("Sparat!");
    }

    return true;
  }

  async function submitPredictions() {
    if (isSubmitDeadlineLocked) {
      setSubmitStatus(
        `Deadline har passerat. Tipset skulle vara inskickat senast ${TOURNAMENT_DEADLINE_LABEL}.`
      );
      return;
    }

    if (hasSubmitted) {
      setSubmitStatus("Tipset är redan inskickat. Slutspelet är låst.");
      return;
    }

    if (!isEntireBracketComplete) {
      setSubmitStatus(
        `Du måste fylla i alla ${TOTAL_MATCHES} matcher innan du kan skicka in tipset. Just nu är ${completedPredictionsCount}/${TOTAL_MATCHES} ifyllda.`
      );
      return;
    }

    const confirmed = window.confirm(
      "Är du säker på att du vill skicka in tipset? Då låses ditt slutspel och en sparad kopia skapas. Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter före avspark."
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    setSubmitStatus("Sparar senaste ändringar...");

    const saved = await savePredictions();

    if (!saved) {
      setSubmitStatus("Kunde inte skicka in eftersom tipset inte kunde sparas.");
      setIsSubmitting(false);
      return;
    }

    setSubmitStatus("Skickar in tipset...");

    const response = await fetch("/api/submit-predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      setSubmitStatus(text || "Kunde inte skicka in tipset.");
      setIsSubmitting(false);
      return;
    }

    try {
      const data = JSON.parse(text);

      setSubmitStatus(
        `Tipset är inskickat! ${data.totalPredictionsCount} tips är låsta.`
      );
    } catch {
      setSubmitStatus("Tipset är inskickat!");
    }

    setHasSubmitted(true);
    setIsSubmitting(false);
  }

  function renderScoreInput({
    matchId,
    side,
    value,
    disabled,
  }: {
    matchId: string;
    side: "home" | "away";
    value: string;
    disabled: boolean;
  }) {
    if (readonly) {
      return <div className="readonly-score-box">{value || "-"}</div>;
    }

    return (
      <input
        inputMode="numeric"
        placeholder="-"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          updatePrediction(matchId, side, event.target.value)
        }
      />
    );
  }

  return (
    <main className="tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              {backHref && (
                <a href={backHref} className="readonly-back-link">
                  ← Till ligan
                </a>
              )}

              <p className="eyebrow">VM 2026</p>

              <h1>
                {readonly
                  ? `Så här har ${viewerName || "spelaren"} tippat.`
                  : "Bygg ditt VM-tips."}
              </h1>

              <p className="intro">
                {readonly
                  ? "Här visas det låsta VM-tipset i ligan. Jämför gruppspel, slutspel och potentiella skrällar."
                  : "Fyll i dina resultat i lugn och ro. Tipsen sparas automatiskt och du kan pausa och fortsätta senare. När gruppspelet är klart byggs slutspelet utifrån dina tips."}
              </p>
            </div>

            <div className="hero-panel">
              <p>
                {readonly
                  ? "Låst tips"
                  : hasSubmitted
                    ? "Tipset är inskickat"
                    : "Matcher ifyllda"}
              </p>
              <strong>
                {completedPredictionsCount}/{TOTAL_MATCHES}
              </strong>
              <span>
                {readonly
                  ? "Det här är spelarens inskickade tips."
                  : hasSubmitted
                    ? "Slutspelet är låst. Gruppspelsmatcher kan ändras fram till 60 minuter före avspark."
                    : "Tipsen sparas automatiskt medan du bygger ditt VM-tips."}
              </span>
            </div>
          </div>

          {(hasSubmitted || readonly) && (
            <div className="tippa-locked-banner">
              <div>
                <p className="tippa-locked-title">
                  {readonly ? "Du tittar på ett låst tips" : "Tipset är inskickat"}
                </p>
                <p className="tippa-locked-text">
                  {readonly
                    ? `Det här är ${viewerName || "spelarens"} inskickade VM-tips. Resultaten går inte att ändra här.`
                    : "Slutspelet är låst och en sparad kopia av tipset finns. Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter före avspark."}
                  {submission?.submitted_at
                    ? ` Inskickat ${formatKickoff(submission.submitted_at)}.`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="error-box">Kunde inte hämta matcher.</div>
          )}

          {isSubmitDeadlineLocked && !hasSubmitted && (
            <div className="tippa-locked-banner">
              <div>
                <p className="tippa-locked-title">Deadline har passerat</p>
                <p className="tippa-locked-text">
                  Det går inte längre att skicka in ett nytt turneringstips.
                  Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter
                  före respektive avspark, men bara inskickade tips deltar i
                  ligans tabell.
                </p>
              </div>
            </div>
          )}

          {!readonly && !hasSubmitted && copyLeagueOptions.length > 0 && (
            <div className="copy-tips-card">
              <div>
                <p>Kopiera tidigare tips</p>
                <h3>Har du redan tippat i en annan liga?</h3>
                <span>
                  Kopiera in dina resultat här och justera fritt innan du
                  skickar in.
                </span>
              </div>

              <div className="copy-tips-actions">
                <select
                  value={copySourceLeagueId}
                  onChange={(event) => {
                    setCopySourceLeagueId(event.target.value);
                    setCopyStatus("");
                  }}
                >
                  <option value="">Välj liga</option>
                  {copyLeagueOptions.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={isCopying || !copySourceLeagueId}
                  onClick={copyPredictionsFromLeague}
                >
                  {isCopying ? "Kopierar..." : "Kopiera tips"}
                </button>
              </div>

              {copyStatus && <p className="copy-tips-status">{copyStatus}</p>}
            </div>
          )}

          <div className="match-toolbar">
            <div>
              <span>
                {completedGroupMatches}/{groupMatches.length}
              </span>
              <p>Gruppspel ifyllt</p>
            </div>

            <div>
              <span>12</span>
              <p>Grupper</p>
            </div>

            <div>
              <span>32</span>
              <p>Slutspelsmatcher</p>
            </div>
          </div>

          <nav className="tips-tabs">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveTab(group)}
                className={activeTab === group ? "active" : ""}
              >
                Grupp {group}
              </button>
            ))}

            <button
              onClick={() => setActiveTab("slutspel")}
              className={activeTab === "slutspel" ? "active" : ""}
            >
              Slutspel
            </button>
          </nav>

          {activeTab === "slutspel" ? (
            <section className="playoff-panel">
              <div className="group-heading">
                <div>
                  <p>Officiell VM-nyckel</p>
                  <h2>Slutspelsträd</h2>
                </div>
              </div>

              <div className="playoff-info-card">
                <strong>Så tippar du slutspelet</strong>
                <p>
  Du tippar matchresultatet efter ordinarie tid och eventuell
  förlängning. Om matchen fortfarande är oavgjord väljer du
  vilket lag som avgör på straffar.
</p>
              </div>

              <div className="bracket-status podium-status">
                <div className={champion ? "champion-card" : ""}>
                  <span>
                    {champion ? getSwedishTeamName(champion.team) : "Ej klart"}
                  </span>
                  <p>Guld</p>
                </div>

                <div>
                  <span>
                    {runnerUp ? getSwedishTeamName(runnerUp.team) : "Ej klart"}
                  </span>
                  <p>Silver</p>
                </div>

                <div>
                  <span>
                    {bronzeWinner
                      ? getSwedishTeamName(bronzeWinner.team)
                      : "Ej klart"}
                  </span>
                  <p>Brons</p>
                </div>
              </div>

              <div className="mobile-swipe-hint">
                <span>←</span>
                Svep mellan rundorna
                <span>→</span>
              </div>

              <div className="bracket-shell">
                <div className="bracket-scroll">
                  {playoffRounds.map((roundMatches, roundIndex) => {
                    const roundInfo = bracketRounds[roundIndex];

                    return (
                      <div key={roundInfo.key} className="bracket-column">
                        <div className="bracket-round-title">
                          <p>Runda {roundIndex + 1}</p>
                          <h3>{roundInfo.label}</h3>
                        </div>

                        <div className="bracket-matches">
                          {roundMatches.map((match) => (
                            <div
                              key={match.dbMatch.id}
                              className={
                                match.dbMatch.stage === "final"
                                  ? "bracket-match final-match"
                                  : "bracket-match"
                              }
                            >
                             <div className="bracket-match-label">
  <span>Match {match.dbMatch.fifa_match_number}</span>
  <small>{formatKickoff(match.dbMatch.kickoff_utc)}</small>
</div>

                              <div
                                className={
                                  match.winner?.team === match.teamA?.team
                                    ? "bracket-team winner"
                                    : "bracket-team"
                                }
                              >
                                <div>
                                  <strong>
                                    {match.teamA
                                      ? getSwedishTeamName(match.teamA.team)
                                      : getFriendlySlotLabel(match.slotALabel)}
                                  </strong>
                                  <small>
                                    {match.teamA
                                      ? `Grupp ${match.teamA.group} · ${match.teamA.points} p`
                                      : getFriendlySlotLabel(match.slotALabel)}
                                  </small>
                                </div>

                                {renderScoreInput({
                                  matchId: match.dbMatch.id,
                                  side: "home",
                                  value: match.scoreA,
                                  disabled:
                                    isPlayoffLocked ||
                                    !match.teamA ||
                                    !match.teamB,
                                })}
                              </div>

                              <div
                                className={
                                  match.winner?.team === match.teamB?.team
                                    ? "bracket-team winner"
                                    : "bracket-team"
                                }
                              >
                                <div>
                                  <strong>
                                    {match.teamB
                                      ? getSwedishTeamName(match.teamB.team)
                                      : getFriendlySlotLabel(match.slotBLabel)}
                                  </strong>
                                  <small>
                                    {match.teamB
                                      ? `Grupp ${match.teamB.group} · ${match.teamB.points} p`
                                      : getFriendlySlotLabel(match.slotBLabel)}
                                  </small>
                                </div>

                                {renderScoreInput({
                                  matchId: match.dbMatch.id,
                                  side: "away",
                                  value: match.scoreB,
                                  disabled:
                                    isPlayoffLocked ||
                                    !match.teamA ||
                                    !match.teamB,
                                })}
                              </div>

                              {match.scoreA !== "" &&
                                match.scoreB !== "" &&
                                match.scoreA === match.scoreB &&
                                match.teamA &&
                                match.teamB && (
                                  <div className="advance-picker">
                                    <p>
  Oavgjort efter ordinarie tid och förlängning.{" "}
  {getPenaltyDecisionText(match.dbMatch.stage)}
</p>

                                    <div className="advance-actions">
                                      <button
                                        type="button"
                                        disabled={isPlayoffLocked}
                                        className={
                                          predictions[match.dbMatch.id]
                                            ?.advancingTeam === "home"
                                            ? "advance-choice active"
                                            : "advance-choice"
                                        }
                                        onClick={() =>
                                          updateAdvancingTeam(
                                            match.dbMatch.id,
                                            "home"
                                          )
                                        }
                                      >
                                        {getSwedishTeamName(match.teamA.team)}{" "}
                                        {getPenaltyButtonSuffix(match.dbMatch.stage)}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={isPlayoffLocked}
                                        className={
                                          predictions[match.dbMatch.id]
                                            ?.advancingTeam === "away"
                                            ? "advance-choice active"
                                            : "advance-choice"
                                        }
                                        onClick={() =>
                                          updateAdvancingTeam(
                                            match.dbMatch.id,
                                            "away"
                                          )
                                        }
                                      >
                                        {getSwedishTeamName(match.teamB.team)}{" "}
                                        {getPenaltyButtonSuffix(match.dbMatch.stage)}
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!readonly && (
                <div className="submit-panel">
                  <div>
                    <p>{hasSubmitted ? "Inskickat" : "Redo att skicka in?"}</p>
                    <h3>
                      {hasSubmitted ? "Slutspelet är låst" : "Lås ditt VM-tips"}
                    </h3>
                    <span>
                      {hasSubmitted
                        ? "Ditt inskickade tips är sparat. Slutspelsträdet kan inte längre ändras."
                        : `${completedPredictionsCount}/${TOTAL_MATCHES} matcher ifyllda. När hela tipset är klart kan du låsa och skicka in det.`}
                    </span>
                  </div>

                  <div className="submit-actions">
                    <button
                      className="secondary-button"
                      disabled={isSubmitting}
                      onClick={savePredictions}
                    >
                      Spara tips
                    </button>

                    <button
                      className="submit-button"
                      disabled={
                        isSubmitDeadlineLocked ||
                        hasSubmitted ||
                        !isEntireBracketComplete ||
                        isSubmitting
                      }
                      onClick={submitPredictions}
                    >
                      {hasSubmitted
                        ? "Tipset inskickat"
                        : isSubmitting
                          ? "Skickar in..."
                          : "Skicka in tipset"}
                    </button>
                  </div>

                  {(saveStatus || submitStatus || autoSaveStatus) && (
                    <p className="submit-status">
                      {submitStatus || saveStatus || autoSaveStatus}
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="group-block">
              <div className="group-heading">
                <div>
                  <p>Aktiv grupp</p>
                  <h2>Grupp {activeTab}</h2>
                </div>
                <span>{activeMatches.length} matcher i gruppen</span>
              </div>

              <div className="group-table-card">
                <div className="group-table-head">
                  <div>
                    <p>{readonly ? "Tabell från tipset" : "Live från dina tips"}</p>
                    <h3>Tabell Grupp {activeTab}</h3>
                  </div>
                  <span>{readonly ? "Låst tips" : "Uppdateras direkt"}</span>
                </div>

                <div className="group-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Lag</th>
                        <th>S</th>
                        <th>V</th>
                        <th>O</th>
                        <th>F</th>
                        <th>Mål</th>
                        <th>+/-</th>
                        <th>P</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGroupTable.map((row, index) => {
                        const isBestThird = thirdPlacedTeams.some(
                          (team) =>
                            team.team === row.team && team.group === row.group
                        );

                        return (
                          <tr
                            key={row.team}
                            className={
                              index < 2
                                ? "advance"
                                : isBestThird
                                  ? "advance third-advance"
                                  : ""
                            }
                          >
                            <td>{index + 1}</td>
                            <td>
                              <strong>{getSwedishTeamName(row.team)}</strong>
                              {row.code && <small>{row.code}</small>}
                            </td>
                            <td>{row.played}</td>
                            <td>{row.wins}</td>
                            <td>{row.draws}</td>
                            <td>{row.losses}</td>
                            <td>
                              {row.goalsFor}-{row.goalsAgainst}
                            </td>
                            <td>{row.goalDifference}</td>
                            <td>
                              <strong>{row.points}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="table-note">
                  Gruppordningen följer FIFAs regler: poäng, inbördes poäng,
                  inbördes målskillnad, inbördes gjorda mål, total målskillnad,
                  gjorda mål och därefter FIFA-ranking som fallback.
                </p>
              </div>

              <div className="match-list">
                {activeMatches.map((match) => {
                  const matchLocked = isMatchLocked(match);
                  const matchLockingSoon = isMatchLockingSoon(match);
                  const prediction = predictions[match.id];

                  const predictedHome =
                    prediction?.home === "" || prediction?.home === undefined
                      ? null
                      : Number(prediction.home);

                  const predictedAway =
                    prediction?.away === "" || prediction?.away === undefined
                      ? null
                      : Number(prediction.away);

                  const matchPoints = getSingleMatchPoints({
                    predictedHome,
                    predictedAway,
                    actualHome: match.home_score,
                    actualAway: match.away_score,
                  });

                  const shouldShowResult =
                    isFinishedMatch(match) &&
                    predictedHome !== null &&
                    predictedAway !== null &&
                    match.home_score !== null &&
                    match.away_score !== null &&
                    matchPoints !== null;

                  return (
                    <article
                      key={match.id}
                      className={[
                        "match-card",
                        isLiveMatch(match) ? "match-card-live" : "",
                        isFinishedMatch(match) ? "match-card-finished" : "",
                        matchLockingSoon ? "match-card-locking-soon" : "",
                        readonly ? "match-card-readonly" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="match-top">
                        <span>Match {match.fifa_match_number}</span>

                        <div className="match-top-right">
                          {readonly && (
                            <span className="readonly-badge">Låst tips</span>
                          )}

                          {!readonly && isLiveMatch(match) && (
                            <span className="live-badge">
                              <span className="live-dot" />
                              LIVE
                            </span>
                          )}

                          {!readonly && isFinishedMatch(match) && (
                            <span className="finished-badge">Klar</span>
                          )}

                          {!readonly && matchLockingSoon && (
                            <span className="lock-soon-badge">
                              {getLockPressureText(match)}
                            </span>
                          )}

                          <time>{formatKickoff(match.kickoff_utc)}</time>
                        </div>
                      </div>

                      <div className="match-main">
                        <div className="team">
                          <strong>{getSwedishTeamName(match.home_team)}</strong>
                          <small>{match.home_team_code}</small>
                        </div>

                        <div className="score">
                          {renderScoreInput({
                            matchId: match.id,
                            side: "home",
                            value: predictions[match.id]?.home || "",
                            disabled: matchLocked,
                          })}

                          <span>:</span>

                          {renderScoreInput({
                            matchId: match.id,
                            side: "away",
                            value: predictions[match.id]?.away || "",
                            disabled: matchLocked,
                          })}
                        </div>

                        <div className="team away">
                          <strong>{getSwedishTeamName(match.away_team)}</strong>
                          <small>{match.away_team_code}</small>
                        </div>
                      </div>

                      <div className="match-bottom">
                        <span>{match.city || "Arena kommer senare"}</span>

                        <span
                          className={
                            readonly
                              ? "match-status locked"
                              : isLiveMatch(match)
                                ? "match-status live"
                                : isFinishedMatch(match)
                                  ? "match-status finished"
                                  : matchLocked
                                    ? "match-status locked"
                                    : matchLockingSoon
                                      ? "match-status locking-soon"
                                      : "match-status open"
                          }
                        >
                          {getMatchStatusText(match, matchLocked, readonly)}
                        </span>
                      </div>

                      {shouldShowResult && (
                        <div className="match-result-panel">
                          <div>
                            <span>Ditt tips</span>
                            <strong>
                              {predictedHome}–{predictedAway}
                            </strong>
                          </div>

                          <div>
                            <span>Resultat</span>
                            <strong>
                              {match.home_score}–{match.away_score}
                            </strong>
                          </div>

                          <div className={matchPoints === 7 ? "full-points" : ""}>
                            <span>Poäng</span>
                            <strong>{matchPoints} p</strong>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {!readonly && (
                <div className="save-bar">
                  <button onClick={savePredictions}>Spara tips</button>
                  {(saveStatus || autoSaveStatus) && (
                    <p>{saveStatus || autoSaveStatus}</p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .readonly-back-link {
              display: inline-flex;
              margin-bottom: 22px;
              color: rgba(255,255,255,0.58);
              text-decoration: none;
              font-size: 14px;
              font-weight: 850;
            }

            .readonly-back-link:hover {
              color: #e5b94d;
            }

            .readonly-score-box {
              width: 48px;
              height: 48px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.12);
              color: white;
              font-size: 18px;
              font-weight: 950;
            }

            .readonly-badge {
              height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #e5b94d;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.24);
            }

            .match-card-readonly {
              border-color: rgba(229,185,77,0.16) !important;
            }

            .match-result-panel {
              margin-top: 18px;
              padding: 14px;
              border-radius: 18px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.10);
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }

            .match-result-panel div {
  min-height: 58px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(5,12,18,0.72);
  border: 1px solid rgba(255,255,255,0.08);
  text-align: center;
}

            .match-result-panel span {
              display: block;
              margin-bottom: 6px;
              color: rgba(255,255,255,0.42);
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.10em;
              text-transform: uppercase;
            }

            .match-result-panel strong {
              color: white;
              font-size: 18px;
              font-weight: 950;
            }

            .match-result-panel .full-points {
              background: rgba(229,185,77,0.12);
              border-color: rgba(229,185,77,0.24);
            }

            .match-result-panel .full-points strong {
              color: #e5b94d;
            }

            .copy-tips-card {
              margin-top: 24px;
              padding: 22px;
              border-radius: 26px;
              background:
                linear-gradient(135deg, rgba(229,185,77,0.10), transparent 42%),
                rgba(5,12,18,0.78);
              border: 1px solid rgba(229,185,77,0.18);
              box-shadow: 0 24px 80px rgba(0,0,0,0.34);
              backdrop-filter: blur(18px);
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 18px;
              align-items: center;
            }

            .copy-tips-card p {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .copy-tips-card h3 {
              margin: 7px 0 0;
              color: white;
              font-size: 22px;
              letter-spacing: -0.04em;
            }

            .copy-tips-card span {
              display: block;
              margin-top: 7px;
              color: rgba(255,255,255,0.58);
              font-size: 14px;
              line-height: 1.45;
            }

            .copy-tips-actions {
              display: flex;
              gap: 10px;
              align-items: center;
            }

            .copy-tips-actions select,
            .copy-tips-actions button {
              height: 46px;
              border-radius: 999px;
              font-size: 14px;
              font-weight: 950;
            }

            .copy-tips-actions select {
              min-width: 220px;
              padding: 0 16px;
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(5,12,18,0.92);
              color: white;
              outline: none;
            }

            .copy-tips-actions button {
              padding: 0 18px;
              border: 0;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              cursor: pointer;
              box-shadow: 0 12px 34px rgba(229,185,77,0.18);
            }

            .copy-tips-actions button:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }

            .copy-tips-status {
              grid-column: 1 / -1;
              color: rgba(255,255,255,0.62) !important;
              letter-spacing: 0 !important;
              text-transform: none !important;
            }

            .match-card-live {
              position: relative;
              border-color: rgba(239,68,68,0.42) !important;
              box-shadow:
                0 0 0 1px rgba(239,68,68,0.18),
                0 24px 80px rgba(239,68,68,0.16),
                0 24px 90px rgba(0,0,0,0.42) !important;
            }

            .match-card-live::before {
              content: "";
              position: absolute;
              inset: -1px;
              border-radius: inherit;
              pointer-events: none;
              background: radial-gradient(circle at 50% 0%, rgba(239,68,68,0.20), transparent 42%);
            }

            .match-card-finished input,
            .match-card-live input {
              opacity: 0.7;
              cursor: not-allowed;
            }

            .match-card-locking-soon {
              position: relative;
              border-color: rgba(229,185,77,0.34) !important;
              box-shadow:
                0 0 0 1px rgba(229,185,77,0.10),
                0 22px 70px rgba(229,185,77,0.10),
                0 24px 90px rgba(0,0,0,0.38) !important;
            }

            .match-card-locking-soon::before {
              content: "";
              position: absolute;
              inset: -1px;
              border-radius: inherit;
              pointer-events: none;
              background: radial-gradient(circle at 50% 0%, rgba(229,185,77,0.16), transparent 44%);
            }

            .match-top-right {
              display: inline-flex;
              align-items: center;
              gap: 10px;
            }

            .live-badge,
            .finished-badge {
              height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              gap: 7px;
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .group-table-card tr.third-advance td:first-child {
              color: #e5b94d;
              font-weight: 950;
            }

            .group-table-card tr.third-advance td:nth-child(2) strong::after {
              content: "Bästa trea";
              display: inline-flex;
              margin-left: 10px;
              padding: 3px 8px;
              border-radius: 999px;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.22);
              color: #e5b94d;
              font-size: 10px;
              font-weight: 950;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              vertical-align: middle;
            }

            .live-badge {
              color: #fecaca;
              background: rgba(239,68,68,0.16);
              border: 1px solid rgba(239,68,68,0.34);
              box-shadow: 0 0 24px rgba(239,68,68,0.18);
            }

            .finished-badge {
              color: rgba(255,255,255,0.62);
              background: rgba(255,255,255,0.07);
              border: 1px solid rgba(255,255,255,0.10);
            }

            .lock-soon-badge {
              height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #f8e7ad;
              background: rgba(229,185,77,0.14);
              border: 1px solid rgba(229,185,77,0.30);
              box-shadow: 0 0 24px rgba(229,185,77,0.12);
            }

            .live-dot {
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: #ef4444;
              box-shadow: 0 0 0 rgba(239,68,68,0.75);
              animation: livePulse 1.4s infinite;
            }

            .match-status {
              font-weight: 900;
            }

            .match-status.live {
              color: #fca5a5;
            }

            .match-status.finished {
              color: rgba(255,255,255,0.52);
            }

            .match-status.locked {
              color: rgba(255,255,255,0.48);
            }

            .match-status.open {
              color: #e5b94d;
            }

            .match-status.locking-soon {
              color: #f8e7ad;
            }

            .playoff-info-card {
              margin: 0 0 18px;
              padding: 16px 18px;
              border-radius: 20px;
              background: rgba(229,185,77,0.08);
              border: 1px solid rgba(229,185,77,0.18);
              color: rgba(255,255,255,0.72);
            }

            .playoff-info-card strong {
              display: block;
              margin-bottom: 6px;
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .playoff-info-card p {
              margin: 0;
              font-size: 14px;
              line-height: 1.45;
            }

            .advance-picker {
              margin-top: 12px;
              padding: 12px;
              border-radius: 18px;
              background: rgba(229,185,77,0.08);
              border: 1px solid rgba(229,185,77,0.18);
            }

            .advance-picker p {
              margin: 0 0 10px;
              color: rgba(255,255,255,0.62);
              font-size: 12px;
              font-weight: 800;
              line-height: 1.35;
            }

            .advance-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }

            .advance-choice {
              min-height: 38px;
              border: 1px solid rgba(255,255,255,0.10);
              border-radius: 999px;
              background: rgba(255,255,255,0.06);
              color: rgba(255,255,255,0.76);
              font-size: 12px;
              font-weight: 950;
              cursor: pointer;
            }

            .advance-choice.active {
              color: #090909;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              border-color: rgba(229,185,77,0.60);
              box-shadow: 0 12px 30px rgba(229,185,77,0.16);
            }

            .advance-choice:disabled {
              opacity: 0.75;
              cursor: not-allowed;
            }

            @keyframes livePulse {
              0% {
                box-shadow: 0 0 0 0 rgba(239,68,68,0.72);
              }

              70% {
                box-shadow: 0 0 0 8px rgba(239,68,68,0);
              }

              100% {
                box-shadow: 0 0 0 0 rgba(239,68,68,0);
              }
            }

            .podium-status .champion-card span {
              color: #e5b94d;
            }

            .podium-status div {
              min-height: 104px;
            }

            @media (max-width: 760px) {
              .copy-tips-card {
                grid-template-columns: 1fr;
              }

              .copy-tips-actions {
                flex-direction: column;
                align-items: stretch;
              }

              .copy-tips-actions select,
              .copy-tips-actions button {
                width: 100%;
              }
            }

            @media (max-width: 640px) {
              .match-top-right {
                gap: 7px;
              }

              .live-badge,
              .finished-badge,
              .lock-soon-badge,
              .readonly-badge {
                height: 22px;
                padding: 0 8px;
                font-size: 10px;
              }

              .advance-actions {
                grid-template-columns: 1fr;
              }

              .match-result-panel {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
    </main>
  );
}