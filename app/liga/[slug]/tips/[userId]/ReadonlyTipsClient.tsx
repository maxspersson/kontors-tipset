"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatKickoff } from "@/app/lib/formatDate";
import {
  groups,
  bracketRounds,
  buildGroupTable,
  buildPlayoffRounds,
  rankBestThirdPlacedTeams,
  isCompletePrediction,
  type BracketMatch,
  type PredictionState,
} from "@/app/lib/worldCupRules";
import type { LeagueSubmission, Match, SavedPrediction } from "@/app/tippa/page";

type Tab = string | "slutspel";

type ReadonlyTipsClientProps = {
  groupMatches: Match[];
  playoffMatches: Match[];
  savedPredictions: SavedPrediction[];
  submission: LeagueSubmission;
  viewerName: string;
  backHref: string;
  hasError: boolean;
  isOwnTips: boolean;
};

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

function renderReadonlyScoreBox(value: string) {
  return <div className="readonly-score-box">{value || "-"}</div>;
}

function getThirdPlaceWinner(finalRound?: BracketMatch[]) {
  const thirdPlaceMatch = finalRound?.find(
    (match) => match.dbMatch.stage === "third_place"
  );

  return thirdPlaceMatch?.winner;
}

function isMatchRevealable(match: Match, isOwnTips: boolean) {
  if (isOwnTips) return true;
  if (!match.kickoff_utc) return false;

  const unlockTime = new Date(match.kickoff_utc).getTime() - 60 * 60 * 1000;

  return (
    Date.now() >= unlockTime ||
    match.status === "live" ||
    match.status === "finished"
  );
}

function createMaskedPredictions({
  groupMatches,
  playoffMatches,
  predictions,
  isOwnTips,
}: {
  groupMatches: Match[];
  playoffMatches: Match[];
  predictions: PredictionState;
  isOwnTips: boolean;
}) {
  const masked: PredictionState = {};

  for (const match of [...groupMatches, ...playoffMatches]) {
    const prediction = predictions[match.id];

    if (!prediction) continue;

    const canReveal = isMatchRevealable(match, isOwnTips);

    masked[match.id] = canReveal
      ? prediction
      : {
          home: "",
          away: "",
          advancingTeam: null,
        };
  }

  return masked;
}

export default function ReadonlyTipsClient({
  groupMatches,
  playoffMatches,
  savedPredictions,
  submission,
  viewerName,
  backHref,
  hasError,
  isOwnTips,
}: ReadonlyTipsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("A");

  const predictions = useMemo<PredictionState>(() => {
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
  }, [savedPredictions]);

  const displayPredictions = useMemo(() => {
    return createMaskedPredictions({
      groupMatches,
      playoffMatches,
      predictions,
      isOwnTips,
    });
  }, [groupMatches, playoffMatches, predictions, isOwnTips]);

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
        table: buildGroupTable(matchesInGroup, displayPredictions, group),
        completedMatches: matchesInGroup.filter((match) =>
          isCompletePrediction(displayPredictions[match.id])
        ).length,
        totalMatches: matchesInGroup.length,
      };
    });
  }, [groupMatches, displayPredictions]);

  const summaryGroupTables = useMemo(() => {
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

  const thirdPlacedTeams = rankBestThirdPlacedTeams(allGroupTables).slice(0, 8);

  const summaryThirdPlacedTeams = rankBestThirdPlacedTeams(
    summaryGroupTables
  ).slice(0, 8);

  const playoffRounds = useMemo(() => {
    return buildPlayoffRounds({
      playoffMatches,
      allGroupTables,
      thirdPlacedTeams,
      predictions: displayPredictions,
    });
  }, [playoffMatches, allGroupTables, thirdPlacedTeams, displayPredictions]);

  const summaryPlayoffRounds = useMemo(() => {
    return buildPlayoffRounds({
      playoffMatches,
      allGroupTables: summaryGroupTables,
      thirdPlacedTeams: summaryThirdPlacedTeams,
      predictions,
    });
  }, [playoffMatches, summaryGroupTables, summaryThirdPlacedTeams, predictions]);

  const finalRound = summaryPlayoffRounds[summaryPlayoffRounds.length - 1];
  const finalMatch = finalRound?.find((match) => match.dbMatch.stage === "final");
  const champion = finalMatch?.winner;
  const finalist = finalMatch?.loser;
  const thirdPlace = getThirdPlaceWinner(finalRound);

  const possessiveName = viewerName.endsWith("s")
    ? `${viewerName}'`
    : `${viewerName}s`;

  return (
    <main className="tips-page readonly-tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              <Link href={backHref} className="readonly-back-link">
                ← Till ligan
              </Link>

              <p className="eyebrow">VM 2026</p>

              <h1>Så här har {viewerName || "spelaren"} tippat.</h1>

                <p className="intro">
                Andra deltagares tips visas stegvis under VM. Varje match blir
                synlig en timme före avspark för att behålla spänningen hela
                vägen till finalen.
              </p>
            </div>
          </div>

                    <div className="tippa-locked-banner">
            <div>
              <p className="tippa-locked-title">
                Du tittar på ett inskickat tips
              </p>
              <p className="tippa-locked-text">
  Här visas {possessiveName} VM-tips.
  {submission?.submitted_at
    ? ` Inskickat ${formatKickoff(submission.submitted_at)}.`
    : ""}
</p>
            </div>
          </div>

          {hasError && (
            <div className="error-box">Kunde inte hämta matcher.</div>
          )}

          <div className="match-toolbar readonly-insight-toolbar">
            <div>
              <span>{champion ? getSwedishTeamName(champion.team) : "Ej klart"}</span>
              <p>Tippad världsmästare</p>
            </div>

            <div>
              <span>{finalist ? getSwedishTeamName(finalist.team) : "Ej klart"}</span>
              <p>Tippad tvåa</p>
            </div>

            <div>
              <span>{thirdPlace ? getSwedishTeamName(thirdPlace.team) : "Ej klart"}</span>
              <p>Tippad trea</p>
            </div>
          </div>

          <nav className="tips-tabs">
            {groups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveTab(group)}
                className={activeTab === group ? "active" : ""}
              >
                Grupp {group}
              </button>
            ))}

            <button
              type="button"
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
                <span>{thirdPlacedTeams.length}/8 bästa treor</span>
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
                          {roundMatches.map((match) => {
                            const advancingTeam =
                              displayPredictions[match.dbMatch.id]
                                ?.advancingTeam ?? null;

                            const isDraw =
                              match.scoreA !== "" &&
                              match.scoreB !== "" &&
                              match.scoreA === match.scoreB &&
                              match.teamA &&
                              match.teamB;

                            const advancingLabel =
                              isDraw && advancingTeam === "home"
                                ? match.teamA
                                  ? getSwedishTeamName(match.teamA.team)
                                  : ""
                                : isDraw && advancingTeam === "away"
                                  ? match.teamB
                                    ? getSwedishTeamName(match.teamB.team)
                                    : ""
                                  : "";

                            return (
                              <div
                                key={match.dbMatch.id}
                                className={
                                  match.dbMatch.stage === "final"
                                    ? "bracket-match final-match"
                                    : "bracket-match"
                                }
                              >
                                <div className="bracket-match-label">
                                  Match {match.dbMatch.fifa_match_number}
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

                                  {renderReadonlyScoreBox(match.scoreA)}
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

                                  {renderReadonlyScoreBox(match.scoreB)}
                                </div>

                                {isDraw && advancingLabel && (
                                  <div className="advance-picker readonly-advance-picker">
                                    <p>
                                      Matchen är oavgjord efter spelad matchtid,
                                      inklusive eventuell förlängning.{" "}
                                      <strong>{advancingLabel}</strong> är valt
                                      lag att gå vidare efter straffläggning.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                    <p>Tabell från tipset</p>
                    <h3>Tabell Grupp {activeTab}</h3>
                  </div>
                  <span>Inskickat tips</span>
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
                      {activeGroupTable.map((row, index) => (
                        <tr key={row.team} className={index < 2 ? "advance" : ""}>
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
                      ))}
                    </tbody>
                  </table>
                </div>

                  <p className="table-note">
                  Gruppordningen följer FIFAs regler: poäng, inbördes poäng,
                  inbördes målskillnad, inbördes gjorda mål, total målskillnad,
                  gjorda mål och därefter FIFA-ranking som sista skiljekriterium.
                </p>
              </div>

              <div className="match-list">
                {activeMatches.map((match) => {
                  const prediction = displayPredictions[match.id] ?? {
                    home: "",
                    away: "",
                    advancingTeam: null,
                  };

                  return (
                    <article
                      key={match.id}
                      className="match-card match-card-readonly"
                    >
                      <div className="match-top">
                        <span>Match {match.fifa_match_number}</span>

                        <div className="match-top-right">
                          <span className="readonly-badge">Låst tips</span>
                          <time>{formatKickoff(match.kickoff_utc)}</time>
                        </div>
                      </div>

                      <div className="match-main">
                        <div className="team">
                          <strong>{getSwedishTeamName(match.home_team)}</strong>
                          <small>{match.home_team_code}</small>
                        </div>

                        <div className="score">
                          {renderReadonlyScoreBox(prediction.home)}
                          <span>:</span>
                          {renderReadonlyScoreBox(prediction.away)}
                        </div>

                        <div className="team away">
                          <strong>{getSwedishTeamName(match.away_team)}</strong>
                          <small>{match.away_team_code}</small>
                        </div>
                      </div>

                      <div className="match-bottom">
                        <span>{match.city || "Arena kommer senare"}</span>
                        <span className="match-status locked">Låst tips</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .tips-page {
              min-height: 100vh;
              background:
                radial-gradient(circle at 16% 0%, rgba(229,185,77,0.18), transparent 34%),
                radial-gradient(circle at 86% 10%, rgba(255,255,255,0.08), transparent 28%),
                linear-gradient(180deg, #061018 0%, #05080c 48%, #030405 100%);
              color: white;
              overflow-x: hidden;
            }

            .tips-hero {
              position: relative;
              min-height: 100vh;
              padding: 42px 20px 80px;
            }

            .tips-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              background:
                linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
              background-size: 68px 68px;
              mask-image: radial-gradient(circle at top, rgba(0,0,0,0.84), transparent 72%);
              pointer-events: none;
            }

            .tips-hero::after {
              content: "";
              position: absolute;
              left: 50%;
              top: 72px;
              width: min(1180px, 94vw);
              height: 430px;
              transform: translateX(-50%);
              border: 1px solid rgba(229,185,77,0.16);
              border-radius: 999px 999px 90px 90px;
              background:
                linear-gradient(180deg, rgba(229,185,77,0.08), transparent 64%),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 72px);
              opacity: 0.7;
              pointer-events: none;
            }

            .tips-wrap {
              position: relative;
              z-index: 1;
              width: min(1180px, 100%);
              margin: 0 auto;
            }

            .tips-head {
              display: grid;
              grid-template-columns: 1fr;
              gap: 22px;
              align-items: stretch;
              margin-bottom: 24px;
            }

            .tips-head > div:first-child,
            .hero-panel,
            .tippa-locked-banner,
            .match-toolbar,
            .group-block,
            .playoff-panel,
            .error-box {
              border: 1px solid rgba(255,255,255,0.11);
              background:
                linear-gradient(135deg, rgba(229,185,77,0.10), transparent 38%),
                rgba(5,12,18,0.78);
              box-shadow: 0 28px 90px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .tips-head > div:first-child {
              border-radius: 32px;
              padding: clamp(40px, 6vw, 72px);
            }

            .tips-head h1,
            .tips-head .intro {
              margin-left: auto;
              margin-right: auto;
              text-align: center;
            }

            .tips-head h1 {
  max-width: 980px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}

            .tips-head .intro {
              max-width: 760px;
            }

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

            .eyebrow {
              margin: 0 0 14px;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .tips-head h1 {
  margin: 0;
  max-width: 980px;
  font-size: clamp(38px, 5.4vw, 78px);
  line-height: 0.98;
  letter-spacing: 0.005em;
  color: white;
}

            .intro {
              margin: 22px 0 0;
              max-width: 690px;
              color: rgba(255,255,255,0.62);
              font-size: clamp(16px, 2vw, 19px);
              line-height: 1.6;
            }

            .tippa-locked-banner {
              margin: 0 0 18px;
              border-radius: 26px;
              padding: 20px 22px;
              border-color: rgba(229,185,77,0.20);
            }

            .tippa-locked-title {
              margin: 0;
              color: white;
              font-size: 16px;
              font-weight: 950;
            }

            .tippa-locked-text {
              margin: 6px 0 0;
              color: rgba(255,255,255,0.60);
              font-size: 14px;
              line-height: 1.5;
            }

            .error-box {
              border-radius: 24px;
              padding: 18px;
              color: #fecaca;
              border-color: rgba(239,68,68,0.30);
              margin-bottom: 18px;
            }

            .match-toolbar {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1px;
              overflow: hidden;
              border-radius: 28px;
              margin-bottom: 18px;
            }

            .match-toolbar div {
  padding: 30px 24px;
  background: rgba(255,255,255,0.035);
  min-height: 128px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

            .match-toolbar span {
              display: block;
              color: white;
              font-size: 28px;
              font-weight: 950;
              letter-spacing: -0.04em;
            }

            .match-toolbar p {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.48);
  font-size: 13px;
  font-weight: 800;
}

            .readonly-insight-toolbar div:first-child span {
              color: #e5b94d;
              font-size: clamp(22px, 3vw, 34px);
              line-height: 1.05;
              word-break: break-word;
            }

            .readonly-insight-toolbar div:nth-child(2) span,
            .readonly-insight-toolbar div:nth-child(3) span {
              color: white;
            }

            .readonly-insight-toolbar p {
              max-width: 260px;
            }

            .tips-tabs {
              display: flex;
              gap: 8px;
              overflow-x: auto;
              padding: 6px 2px 18px;
            }

            .tips-tabs button {
              border: 1px solid rgba(255,255,255,0.10);
              background: rgba(255,255,255,0.055);
              color: rgba(255,255,255,0.68);
              border-radius: 999px;
              height: 44px;
              padding: 0 16px;
              font-weight: 950;
              white-space: nowrap;
              cursor: pointer;
            }

            .tips-tabs button.active {
              color: #090909;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              border-color: rgba(229,185,77,0.58);
              box-shadow: 0 12px 34px rgba(229,185,77,0.18);
            }

            .group-block,
            .playoff-panel {
              border-radius: 32px;
              padding: clamp(18px, 3vw, 30px);
            }

            .group-heading {
              display: flex;
              align-items: end;
              justify-content: space-between;
              gap: 18px;
              margin-bottom: 18px;
            }

            .group-heading p,
            .group-table-head p,
            .bracket-round-title p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .group-heading h2 {
              margin: 7px 0 0;
              color: white;
              font-size: clamp(30px, 4vw, 42px);
              line-height: 1;
              letter-spacing: -0.055em;
            }

            .group-heading span {
              color: rgba(255,255,255,0.52);
              font-size: 14px;
              font-weight: 800;
            }

            .group-table-card {
              border-radius: 26px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.10);
              overflow: hidden;
              margin-bottom: 18px;
            }

            .group-table-head {
              display: flex;
              justify-content: space-between;
              align-items: end;
              gap: 18px;
              padding: 20px 22px;
              border-bottom: 1px solid rgba(255,255,255,0.08);
            }

            .group-table-head h3 {
              margin: 6px 0 0;
              color: white;
              font-size: 24px;
              letter-spacing: -0.04em;
            }

            .group-table-head span {
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
            }

            .group-table-scroll {
              overflow-x: auto;
            }

            .group-table-card table {
              width: 100%;
              border-collapse: collapse;
              min-width: 720px;
            }

            .group-table-card th,
            .group-table-card td {
              padding: 14px 12px;
              text-align: right;
              border-bottom: 1px solid rgba(255,255,255,0.07);
              color: rgba(255,255,255,0.72);
              font-size: 13px;
            }

            .group-table-card th {
              color: rgba(255,255,255,0.42);
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .group-table-card th:nth-child(2),
            .group-table-card td:nth-child(2) {
              text-align: left;
            }

            .group-table-card td:nth-child(2) strong {
              display: block;
              color: white;
              font-size: 14px;
            }

            .group-table-card td:nth-child(2) small {
              display: block;
              margin-top: 3px;
              color: rgba(255,255,255,0.38);
              font-size: 11px;
              font-weight: 900;
            }

            .group-table-card tr.advance td:first-child {
              color: #e5b94d;
              font-weight: 950;
            }

            .table-note {
              margin: 0;
              padding: 15px 22px 20px;
              color: rgba(255,255,255,0.46);
              font-size: 13px;
              line-height: 1.45;
            }

            .match-list {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
            }

            .match-card {
              position: relative;
              border-radius: 26px;
              padding: 18px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.10);
              box-shadow: 0 24px 90px rgba(0,0,0,0.30);
            }

            .match-card-readonly {
              border-color: rgba(229,185,77,0.16);
            }

            .match-top,
            .match-bottom {
              display: flex;
              justify-content: space-between;
              gap: 14px;
              align-items: center;
            }

            .match-top span:first-child {
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.13em;
              text-transform: uppercase;
            }

            .match-top-right {
              display: inline-flex;
              align-items: center;
              gap: 10px;
            }

            .match-top time {
              color: rgba(255,255,255,0.48);
              font-size: 12px;
              font-weight: 850;
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

            .match-main {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
              gap: 16px;
              align-items: center;
              padding: 24px 0;
            }

            .team strong {
              display: block;
              color: white;
              font-size: 18px;
              line-height: 1.1;
            }

            .team small {
              display: block;
              margin-top: 5px;
              color: rgba(255,255,255,0.40);
              font-size: 12px;
              font-weight: 950;
            }

            .team.away {
              text-align: right;
            }

            .score {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .score span {
              color: rgba(255,255,255,0.38);
              font-size: 20px;
              font-weight: 950;
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

            .match-bottom {
              padding-top: 14px;
              border-top: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.46);
              font-size: 13px;
              font-weight: 800;
            }

            .match-status.locked {
              color: rgba(255,255,255,0.48);
            }

            .mobile-swipe-hint {
              display: none;
              color: rgba(255,255,255,0.52);
              font-size: 13px;
              font-weight: 850;
              margin-bottom: 12px;
            }

            .bracket-shell {
              overflow: hidden;
            }

            .bracket-scroll {
              display: grid;
              grid-template-columns: repeat(5, minmax(240px, 1fr));
              gap: 14px;
              overflow-x: auto;
              padding-bottom: 10px;
            }

            .bracket-column {
              min-width: 240px;
            }

            .bracket-round-title {
              margin-bottom: 12px;
            }

            .bracket-round-title h3 {
              margin: 5px 0 0;
              color: #e5b94d;
              font-size: 18px;
              letter-spacing: -0.03em;
            }

            .bracket-matches {
              display: grid;
              gap: 12px;
            }

            .bracket-match {
              border-radius: 22px;
              padding: 14px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.10);
            }

            .bracket-match.final-match {
              border-color: rgba(229,185,77,0.24);
              background:
                linear-gradient(135deg, rgba(229,185,77,0.10), transparent 44%),
                rgba(255,255,255,0.055);
            }

            .bracket-match-label {
              margin-bottom: 10px;
              color: rgba(255,255,255,0.42);
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.10em;
              text-transform: uppercase;
            }

            .bracket-team {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 10px;
              align-items: center;
              padding: 10px 0;
              border-top: 1px solid rgba(255,255,255,0.07);
            }

            .bracket-team strong {
              display: block;
              color: rgba(255,255,255,0.82);
              font-size: 14px;
              line-height: 1.2;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .bracket-team small {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.38);
              font-size: 11px;
              font-weight: 800;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .bracket-team.winner strong {
              color: #e5b94d;
            }

            .bracket-team .readonly-score-box {
              width: 42px;
              height: 42px;
              border-radius: 13px;
            }

            .advance-picker {
              margin-top: 12px;
              padding: 12px;
              border-radius: 18px;
              background: rgba(229,185,77,0.08);
              border: 1px solid rgba(229,185,77,0.18);
            }

            .advance-picker p {
              margin: 0;
              color: rgba(255,255,255,0.62);
              font-size: 12px;
              font-weight: 800;
              line-height: 1.35;
            }

            .advance-picker strong {
              color: #e5b94d;
            }

            @media (max-width: 980px) {
              .tips-head {
                grid-template-columns: 1fr;
              }

              .match-list {
                grid-template-columns: 1fr;
              }

              .bracket-scroll {
                grid-template-columns: repeat(5, 260px);
              }

              .mobile-swipe-hint {
                display: flex;
                gap: 8px;
                align-items: center;
              }
            }

            @media (max-width: 720px) {
              .tips-head h1 {
                white-space: normal;
              }

              .tips-head > div:first-child,
              .hero-panel,
              .group-block,
              .playoff-panel {
                border-radius: 24px;
              }

              .match-toolbar {
                grid-template-columns: 1fr;
              }

              .group-heading,
              .group-table-head {
                align-items: flex-start;
                flex-direction: column;
              }

              .match-main {
                grid-template-columns: 1fr;
                text-align: center;
              }

              .team.away {
                text-align: center;
              }

              .score {
                justify-content: center;
              }

              .match-top,
              .match-bottom {
                align-items: flex-start;
                flex-direction: column;
              }

              .match-top-right {
                flex-wrap: wrap;
              }
            }
          `,
        }}
      />
    </main>
  );
}