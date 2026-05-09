"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatKickoff } from "@/app/lib/formatDate";
import type { LeagueSubmission, Match, SavedPrediction } from "@/app/tippa/page";

const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const bracketRounds = [
  { key: "round_of_32", label: "Sextondelsfinal", matches: 16 },
  { key: "round_of_16", label: "Åttondelsfinal", matches: 8 },
  { key: "quarter_final", label: "Kvartsfinal", matches: 4 },
  { key: "semi_final", label: "Semifinal", matches: 2 },
  { key: "medals", label: "Final & Bronsmatch", matches: 2 },
] as const;

type Tab = string | "slutspel";
type AdvancingTeam = "home" | "away";

type PredictionState = Record<
  string,
  {
    home: string;
    away: string;
    advancingTeam?: AdvancingTeam | null;
  }
>;

type GroupTableRow = {
  team: string;
  code: string | null;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type GroupTable = {
  group: string;
  table: GroupTableRow[];
  completedMatches: number;
  totalMatches: number;
};

type SeedSlot =
  | { type: "group_position"; position: 1 | 2; group: string; label: string }
  | { type: "best_third"; groups: string[]; label: string }
  | { type: "winner"; matchNumber: number; label: string }
  | { type: "loser"; matchNumber: number; label: string };

type PlayoffMatch = {
  dbMatch: Match;
  teamA?: GroupTableRow;
  teamB?: GroupTableRow;
  slotALabel: string;
  slotBLabel: string;
  scoreA: string;
  scoreB: string;
  advancingTeam?: AdvancingTeam | null;
  winner?: GroupTableRow;
};

type ReadonlyTipsClientProps = {
  groupMatches: Match[];
  playoffMatches: Match[];
  savedPredictions: SavedPrediction[];
  submission: LeagueSubmission;
  viewerName: string;
  backHref: string;
  hasError: boolean;
};

const roundOf32Slots: Record<number, [SeedSlot, SeedSlot]> = {
  73: [
    { type: "group_position", position: 2, group: "A", label: "2A" },
    { type: "group_position", position: 2, group: "B", label: "2B" },
  ],
  74: [
    { type: "group_position", position: 1, group: "E", label: "1E" },
    { type: "best_third", groups: ["A", "B", "C", "D", "F"], label: "3ABCDF" },
  ],
  75: [
    { type: "group_position", position: 1, group: "F", label: "1F" },
    { type: "group_position", position: 2, group: "C", label: "2C" },
  ],
  76: [
    { type: "group_position", position: 1, group: "C", label: "1C" },
    { type: "group_position", position: 2, group: "F", label: "2F" },
  ],
  77: [
    { type: "group_position", position: 1, group: "I", label: "1I" },
    { type: "best_third", groups: ["C", "D", "F", "G", "H"], label: "3CDFGH" },
  ],
  78: [
    { type: "group_position", position: 2, group: "E", label: "2E" },
    { type: "group_position", position: 2, group: "I", label: "2I" },
  ],
  79: [
    { type: "group_position", position: 1, group: "A", label: "1A" },
    { type: "best_third", groups: ["C", "E", "F", "H", "I"], label: "3CEFHI" },
  ],
  80: [
    { type: "group_position", position: 1, group: "L", label: "1L" },
    { type: "best_third", groups: ["E", "H", "I", "J", "K"], label: "3EHIJK" },
  ],
  81: [
    { type: "group_position", position: 1, group: "D", label: "1D" },
    { type: "best_third", groups: ["B", "E", "F", "I", "J"], label: "3BEFIJ" },
  ],
  82: [
    { type: "group_position", position: 1, group: "G", label: "1G" },
    { type: "best_third", groups: ["A", "E", "H", "I", "J"], label: "3AEHIJ" },
  ],
  83: [
    { type: "group_position", position: 2, group: "K", label: "2K" },
    { type: "group_position", position: 2, group: "L", label: "2L" },
  ],
  84: [
    { type: "group_position", position: 1, group: "H", label: "1H" },
    { type: "group_position", position: 2, group: "J", label: "2J" },
  ],
  85: [
    { type: "group_position", position: 1, group: "B", label: "1B" },
    { type: "best_third", groups: ["E", "F", "G", "I", "J"], label: "3EFGIJ" },
  ],
  86: [
    { type: "group_position", position: 1, group: "J", label: "1J" },
    { type: "group_position", position: 2, group: "H", label: "2H" },
  ],
  87: [
    { type: "group_position", position: 1, group: "K", label: "1K" },
    { type: "best_third", groups: ["D", "E", "I", "J", "L"], label: "3DEIJL" },
  ],
  88: [
    { type: "group_position", position: 2, group: "D", label: "2D" },
    { type: "group_position", position: 2, group: "G", label: "2G" },
  ],
};

const laterRoundSlots: Record<number, [SeedSlot, SeedSlot]> = {
  89: [{ type: "winner", matchNumber: 74, label: "W74" }, { type: "winner", matchNumber: 77, label: "W77" }],
  90: [{ type: "winner", matchNumber: 73, label: "W73" }, { type: "winner", matchNumber: 75, label: "W75" }],
  91: [{ type: "winner", matchNumber: 76, label: "W76" }, { type: "winner", matchNumber: 78, label: "W78" }],
  92: [{ type: "winner", matchNumber: 79, label: "W79" }, { type: "winner", matchNumber: 80, label: "W80" }],
  93: [{ type: "winner", matchNumber: 83, label: "W83" }, { type: "winner", matchNumber: 84, label: "W84" }],
  94: [{ type: "winner", matchNumber: 81, label: "W81" }, { type: "winner", matchNumber: 82, label: "W82" }],
  95: [{ type: "winner", matchNumber: 86, label: "W86" }, { type: "winner", matchNumber: 88, label: "W88" }],
  96: [{ type: "winner", matchNumber: 85, label: "W85" }, { type: "winner", matchNumber: 87, label: "W87" }],
  97: [{ type: "winner", matchNumber: 89, label: "W89" }, { type: "winner", matchNumber: 90, label: "W90" }],
  98: [{ type: "winner", matchNumber: 93, label: "W93" }, { type: "winner", matchNumber: 94, label: "W94" }],
  99: [{ type: "winner", matchNumber: 91, label: "W91" }, { type: "winner", matchNumber: 92, label: "W92" }],
  100: [{ type: "winner", matchNumber: 95, label: "W95" }, { type: "winner", matchNumber: 96, label: "W96" }],
  101: [{ type: "winner", matchNumber: 97, label: "W97" }, { type: "winner", matchNumber: 98, label: "W98" }],
  102: [{ type: "winner", matchNumber: 99, label: "W99" }, { type: "winner", matchNumber: 100, label: "W100" }],
  103: [{ type: "loser", matchNumber: 101, label: "L101" }, { type: "loser", matchNumber: 102, label: "L102" }],
  104: [{ type: "winner", matchNumber: 101, label: "W101" }, { type: "winner", matchNumber: 102, label: "W102" }],
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

function createEmptyRow(
  team: string,
  code: string | null,
  group: string
): GroupTableRow {
  return {
    team,
    code,
    group,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function isCompletePrediction(prediction?: {
  home: string;
  away: string;
  advancingTeam?: AdvancingTeam | null;
}) {
  return !!prediction && prediction.home !== "" && prediction.away !== "";
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

function isGroupTableRow(row: GroupTableRow | undefined): row is GroupTableRow {
  return !!row;
}

function buildGroupTable(
  matchesInGroup: Match[],
  predictions: PredictionState,
  group: string
): GroupTableRow[] {
  const table = new Map<string, GroupTableRow>();

  for (const match of matchesInGroup) {
    if (!table.has(match.home_team)) {
      table.set(
        match.home_team,
        createEmptyRow(match.home_team, match.home_team_code, group)
      );
    }

    if (!table.has(match.away_team)) {
      table.set(
        match.away_team,
        createEmptyRow(match.away_team, match.away_team_code, group)
      );
    }

    const prediction = predictions[match.id];

    if (!isCompletePrediction(prediction)) continue;

    const homeScore = Number(prediction.home);
    const awayScore = Number(prediction.away);

    const home = table.get(match.home_team)!;
    const away = table.get(match.away_team)!;

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeScore < awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });
}

function getWinner(
  teamA: GroupTableRow | undefined,
  teamB: GroupTableRow | undefined,
  prediction?: {
    home: string;
    away: string;
    advancingTeam?: AdvancingTeam | null;
  }
) {
  if (!teamA || !teamB || !prediction) return undefined;
  if (prediction.home === "" || prediction.away === "") return undefined;

  const home = Number(prediction.home);
  const away = Number(prediction.away);

  if (home > away) return teamA;
  if (away > home) return teamB;
  if (prediction.advancingTeam === "home") return teamA;
  if (prediction.advancingTeam === "away") return teamB;

  return undefined;
}

function getLoser(
  teamA: GroupTableRow | undefined,
  teamB: GroupTableRow | undefined,
  prediction?: {
    home: string;
    away: string;
    advancingTeam?: AdvancingTeam | null;
  }
) {
  if (!teamA || !teamB || !prediction) return undefined;
  if (prediction.home === "" || prediction.away === "") return undefined;

  const home = Number(prediction.home);
  const away = Number(prediction.away);

  if (home > away) return teamB;
  if (away > home) return teamA;
  if (prediction.advancingTeam === "home") return teamB;
  if (prediction.advancingTeam === "away") return teamA;

  return undefined;
}

function resolveGroupPosition(
  allGroupTables: GroupTable[],
  group: string,
  position: 1 | 2
) {
  const groupTable = allGroupTables.find((item) => item.group === group);

  if (!groupTable) return undefined;
  if (groupTable.completedMatches < groupTable.totalMatches) return undefined;

  return groupTable.table[position - 1];
}

function buildBestThirdAssignment(thirdPlacedTeams: GroupTableRow[]) {
  const usedGroups = new Set<string>();
  const assignment = new Map<string, GroupTableRow>();
  const matchNumbers = [74, 77, 79, 80, 81, 82, 85, 87];

  for (const matchNumber of matchNumbers) {
    const slot = roundOf32Slots[matchNumber]?.find(
      (item) => item.type === "best_third"
    );

    if (!slot || slot.type !== "best_third") continue;

    const team = thirdPlacedTeams.find(
      (candidate) =>
        slot.groups.includes(candidate.group) && !usedGroups.has(candidate.group)
    );

    if (team) {
      assignment.set(slot.label, team);
      usedGroups.add(team.group);
    }
  }

  return assignment;
}

function resolveSlot({
  slot,
  allGroupTables,
  thirdAssignment,
  winnersByMatchNumber,
  losersByMatchNumber,
}: {
  slot: SeedSlot;
  allGroupTables: GroupTable[];
  thirdAssignment: Map<string, GroupTableRow>;
  winnersByMatchNumber: Map<number, GroupTableRow>;
  losersByMatchNumber: Map<number, GroupTableRow>;
}) {
  if (slot.type === "group_position") {
    return resolveGroupPosition(allGroupTables, slot.group, slot.position);
  }

  if (slot.type === "best_third") {
    return thirdAssignment.get(slot.label);
  }

  if (slot.type === "loser") {
    return losersByMatchNumber.get(slot.matchNumber);
  }

  return winnersByMatchNumber.get(slot.matchNumber);
}

function buildPlayoffRounds({
  playoffMatches,
  allGroupTables,
  thirdPlacedTeams,
  predictions,
}: {
  playoffMatches: Match[];
  allGroupTables: GroupTable[];
  thirdPlacedTeams: GroupTableRow[];
  predictions: PredictionState;
}) {
  const winnersByMatchNumber = new Map<number, GroupTableRow>();
  const losersByMatchNumber = new Map<number, GroupTableRow>();
  const thirdAssignment = buildBestThirdAssignment(thirdPlacedTeams);
  const rounds: PlayoffMatch[][] = [];

  for (const round of bracketRounds) {
    const matchesInRound = playoffMatches
      .filter((match) => {
        if (round.key === "medals") {
          return match.stage === "final" || match.stage === "third_place";
        }

        return match.stage === round.key;
      })
      .sort((a, b) => {
        if (a.stage === "final") return -1;
        if (b.stage === "final") return 1;

        return (a.fifa_match_number ?? 0) - (b.fifa_match_number ?? 0);
      });

    const roundMatches: PlayoffMatch[] = [];

    for (const dbMatch of matchesInRound) {
      const matchNumber = dbMatch.fifa_match_number;

      if (!matchNumber) continue;

      const slots =
        dbMatch.stage === "round_of_32"
          ? roundOf32Slots[matchNumber]
          : laterRoundSlots[matchNumber];

      if (!slots) continue;

      const [slotA, slotB] = slots;
      const prediction = predictions[dbMatch.id] ?? {
        home: "",
        away: "",
        advancingTeam: null,
      };

      const teamA = resolveSlot({
        slot: slotA,
        allGroupTables,
        thirdAssignment,
        winnersByMatchNumber,
        losersByMatchNumber,
      });

      const teamB = resolveSlot({
        slot: slotB,
        allGroupTables,
        thirdAssignment,
        winnersByMatchNumber,
        losersByMatchNumber,
      });

      const winner = getWinner(teamA, teamB, prediction);
      const loser = getLoser(teamA, teamB, prediction);

      if (winner) {
        winnersByMatchNumber.set(matchNumber, winner);
      }

      if (loser) {
        losersByMatchNumber.set(matchNumber, loser);
      }

      roundMatches.push({
        dbMatch,
        teamA,
        teamB,
        slotALabel: slotA.label,
        slotBLabel: slotB.label,
        scoreA: prediction.home,
        scoreB: prediction.away,
        advancingTeam: prediction.advancingTeam,
        winner,
      });
    }

    rounds.push(roundMatches);
  }

  return rounds;
}

function renderReadonlyScoreBox(value: string) {
  return <div className="readonly-score-box">{value || "-"}</div>;
}

function getMostGoalRichPrediction({
  groupMatches,
  playoffMatches,
  predictions,
}: {
  groupMatches: Match[];
  playoffMatches: Match[];
  predictions: PredictionState;
}) {
  const allMatches = [...groupMatches, ...playoffMatches];

  let best:
    | {
        match: Match;
        home: number;
        away: number;
        total: number;
      }
    | null = null;

  for (const match of allMatches) {
    const prediction = predictions[match.id];

    if (!isCompletePrediction(prediction)) continue;

    const home = Number(prediction.home);
    const away = Number(prediction.away);
    const total = home + away;

    if (!best || total > best.total) {
      best = {
        match,
        home,
        away,
        total,
      };
    }
  }

  return best;
}

function getDrawCount(predictions: PredictionState) {
  return Object.values(predictions).filter(
    (prediction) =>
      prediction.home !== "" &&
      prediction.away !== "" &&
      prediction.home === prediction.away
  ).length;
}

export default function ReadonlyTipsClient({
  groupMatches,
  playoffMatches,
  savedPredictions,
  submission,
  viewerName,
  backHref,
  hasError,
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

  const groupWinners = allGroupTables
    .filter((group) => group.completedMatches === group.totalMatches)
    .map((group) => group.table[0])
    .filter(isGroupTableRow);

  const thirdPlacedTeams = allGroupTables
    .filter((group) => group.completedMatches === group.totalMatches)
    .map((group) => group.table[2])
    .filter(isGroupTableRow)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    })
    .slice(0, 8);

  const playoffRounds = useMemo(() => {
    return buildPlayoffRounds({
      playoffMatches,
      allGroupTables,
      thirdPlacedTeams,
      predictions,
    });
  }, [playoffMatches, allGroupTables, thirdPlacedTeams, predictions]);

  const finalRound = playoffRounds[playoffRounds.length - 1];
  const champion = finalRound?.[0]?.winner;
  const mostGoalRichPrediction = useMemo(() => {
  return getMostGoalRichPrediction({
    groupMatches,
    playoffMatches,
    predictions,
  });
}, [groupMatches, playoffMatches, predictions]);

const drawCount = useMemo(() => getDrawCount(predictions), [predictions]);

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
  Jämför gruppspel, slutspel och potentiella skrällar i det inskickade VM-tipset.
</p>
            </div>
          </div>

                    <div className="tippa-locked-banner">
            <div>
              <p className="tippa-locked-title">Du tittar på ett låst tips</p>
              <p className="tippa-locked-text">
                Det här är {viewerName || "spelarens"} inskickade VM-tips.
                Resultaten går inte att ändra här.
                {submission?.submitted_at
                  ? ` Inskickat ${formatKickoff(submission.submitted_at)}.`
                  : ""}
              </p>
            </div>
          </div>

          {hasError && <div className="error-box">Kunde inte hämta matcher.</div>}

          <div className="match-toolbar readonly-insight-toolbar">
  <div>
    <span>{champion ? getSwedishTeamName(champion.team) : "Ej klart"}</span>
    <p>Tippad världsmästare</p>
  </div>

  <div>
    <span>
      {mostGoalRichPrediction
        ? `${mostGoalRichPrediction.home}-${mostGoalRichPrediction.away}`
        : "Ej klart"}
    </span>
    <p>
      {mostGoalRichPrediction
        ? `${mostGoalRichPrediction.total} mål i mest målrika matchen`
        : "Mest målrika match"}
    </p>
  </div>

  <div>
    <span>{drawCount}</span>
    <p>Oavgjorda matcher</p>
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

              <div className="bracket-status">
                <div>
                  <span>{playoffMatches.length}</span>
                  <p>slutspelsmatcher i DB</p>
                </div>
                <div>
                  <span>{groupWinners.length}</span>
                  <p>gruppvinnare</p>
                </div>
                <div className={champion ? "champion-card" : ""}>
                  <span>
                    {champion ? getSwedishTeamName(champion.team) : "Ej klart"}
                  </span>
                  <p>tippad mästare</p>
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
                          {roundMatches.map((match) => {
                            const isDraw =
                              match.scoreA !== "" &&
                              match.scoreB !== "" &&
                              match.scoreA === match.scoreB &&
                              match.teamA &&
                              match.teamB;

                            const advancingLabel =
                              isDraw && match.advancingTeam === "home"
                                ? match.teamA
                                  ? getSwedishTeamName(match.teamA.team)
                                  : ""
                                : isDraw && match.advancingTeam === "away"
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
                                      Matchen är oavgjord efter 90 minuter.{" "}
                                      <strong>{advancingLabel}</strong> är valt
                                      lag att gå vidare.
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
                  <span>Låst snapshot</span>
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
                  De två översta lagen markeras som direkt vidare. Tiebreakers
                  är förenklade just nu: poäng, målskillnad, gjorda mål.
                </p>
              </div>

              <div className="match-list">
                {activeMatches.map((match) => {
                  const prediction = predictions[match.id] ?? {
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
              padding: clamp(28px, 5vw, 54px);
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
              max-width: 780px;
              font-size: clamp(42px, 7vw, 86px);
              line-height: 0.9;
              letter-spacing: -0.07em;
              color: white;
            }

            .intro {
              margin: 22px 0 0;
              max-width: 690px;
              color: rgba(255,255,255,0.62);
              font-size: clamp(16px, 2vw, 19px);
              line-height: 1.6;
            }

            .hero-panel {
              border-radius: 32px;
              padding: 28px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            .hero-panel p {
              margin: 0;
              color: rgba(255,255,255,0.48);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .hero-panel strong {
              display: block;
              margin-top: 18px;
              color: #e5b94d;
              font-size: 56px;
              line-height: 1;
              letter-spacing: -0.06em;
            }

            .hero-big-number {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hero-big-number span {
  display: inline-block;
  margin: 0 0.08em;
  opacity: 0.72;
}

            .hero-panel span {
              display: block;
              margin-top: 18px;
              color: rgba(255,255,255,0.58);
              font-size: 14px;
              line-height: 1.45;
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
              padding: 22px;
              background: rgba(255,255,255,0.035);
            }

            .match-toolbar span {
              display: block;
              color: white;
              font-size: 28px;
              font-weight: 950;
              letter-spacing: -0.04em;
            }

            .match-toolbar p {
              margin: 5px 0 0;
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

            .bracket-status {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 18px;
            }

            .bracket-status div {
              border-radius: 22px;
              padding: 18px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.09);
            }

            .bracket-status span {
              display: block;
              color: white;
              font-size: 24px;
              font-weight: 950;
              letter-spacing: -0.04em;
            }

            .bracket-status p {
              margin: 5px 0 0;
              color: rgba(255,255,255,0.46);
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .bracket-status .champion-card {
              background:
                linear-gradient(135deg, rgba(229,185,77,0.18), transparent),
                rgba(255,255,255,0.045);
              border-color: rgba(229,185,77,0.26);
            }

            .bracket-status .champion-card span {
              color: #e5b94d;
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
              .tips-hero {
                padding: 24px 12px 56px;
              }

              .tips-head > div:first-child,
              .hero-panel,
              .group-block,
              .playoff-panel {
                border-radius: 24px;
              }

              .match-toolbar,
              .bracket-status {
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