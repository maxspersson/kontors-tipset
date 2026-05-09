"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatKickoff } from "../lib/formatDate";
import type { LeagueSubmission, Match, SavedPrediction } from "./page";

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
  winner?: GroupTableRow;
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
  89: [
    { type: "winner", matchNumber: 74, label: "W74" },
    { type: "winner", matchNumber: 77, label: "W77" },
  ],
  90: [
    { type: "winner", matchNumber: 73, label: "W73" },
    { type: "winner", matchNumber: 75, label: "W75" },
  ],
  91: [
    { type: "winner", matchNumber: 76, label: "W76" },
    { type: "winner", matchNumber: 78, label: "W78" },
  ],
  92: [
    { type: "winner", matchNumber: 79, label: "W79" },
    { type: "winner", matchNumber: 80, label: "W80" },
  ],
  93: [
    { type: "winner", matchNumber: 83, label: "W83" },
    { type: "winner", matchNumber: 84, label: "W84" },
  ],
  94: [
    { type: "winner", matchNumber: 81, label: "W81" },
    { type: "winner", matchNumber: 82, label: "W82" },
  ],
  95: [
    { type: "winner", matchNumber: 86, label: "W86" },
    { type: "winner", matchNumber: 88, label: "W88" },
  ],
  96: [
    { type: "winner", matchNumber: 85, label: "W85" },
    { type: "winner", matchNumber: 87, label: "W87" },
  ],
  97: [
    { type: "winner", matchNumber: 89, label: "W89" },
    { type: "winner", matchNumber: 90, label: "W90" },
  ],
  98: [
    { type: "winner", matchNumber: 93, label: "W93" },
    { type: "winner", matchNumber: 94, label: "W94" },
  ],
  99: [
    { type: "winner", matchNumber: 91, label: "W91" },
    { type: "winner", matchNumber: 92, label: "W92" },
  ],
  100: [
    { type: "winner", matchNumber: 95, label: "W95" },
    { type: "winner", matchNumber: 96, label: "W96" },
  ],
  101: [
    { type: "winner", matchNumber: 97, label: "W97" },
    { type: "winner", matchNumber: 98, label: "W98" },
  ],
  102: [
    { type: "winner", matchNumber: 99, label: "W99" },
    { type: "winner", matchNumber: 100, label: "W100" },
  ],
  103: [
    { type: "loser", matchNumber: 101, label: "L101" },
    { type: "loser", matchNumber: 102, label: "L102" },
  ],
  104: [
    { type: "winner", matchNumber: 101, label: "W101" },
    { type: "winner", matchNumber: 102, label: "W102" },
  ],
};

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

function getMatchStatusText(match: Match, matchLocked: boolean) {
  if (isLiveMatch(match)) return "Matchen spelas nu";
  if (isFinishedMatch(match)) return "Slutspelad";
  if (matchLocked) return "Låst 60 min före avspark";
  if (isMatchLockingSoon(match)) return getLockPressureText(match);
  return "Öppen för tips";
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
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
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
        winner,
      });
    }

    rounds.push(roundMatches);
  }

  return rounds;
}

export default function TippaClient({
  groupMatches,
  playoffMatches,
  savedPredictions,
  submission,
  isLocked,
  hasError,
  leagueId,
}: {
  groupMatches: Match[];
  playoffMatches: Match[];
  savedPredictions: SavedPrediction[];
  submission: LeagueSubmission | null;
  isLocked: boolean;
  hasError: boolean;
  leagueId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("A");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const [submitStatus, setSubmitStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(isLocked);

  const hasMounted = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlayoffLocked = hasSubmitted;

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
  }, [predictions, leagueId]);

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

  const completedPredictionsCount = groupMatches.reduce((sum, match) => {
    return sum + (isCompletePrediction(predictions[match.id]) ? 1 : 0);
  }, 0) + playoffMatches.reduce((sum, match) => {
    return sum + (isCompletePlayoffPrediction(predictions[match.id]) ? 1 : 0);
  }, 0);

  const TOTAL_MATCHES = 104;
  const isEntireBracketComplete = completedPredictionsCount >= TOTAL_MATCHES;

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
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
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

  function updatePrediction(
    matchId: string,
    side: "home" | "away",
    value: string
  ) {
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
  }

  function updateAdvancingTeam(matchId: string, advancingTeam: AdvancingTeam) {
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
      "Är du säker på att du vill skicka in tipset? Då låses ditt slutspel och en snapshot sparas. Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter före avspark."
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
        `Tipset är inskickat! ${data.totalPredictionsCount} tips låsta i snapshot.`
      );
    } catch {
      setSubmitStatus("Tipset är inskickat!");
    }

    setHasSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <main className="tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              <p className="eyebrow">VM 2026</p>
              <h1>Tippa gruppspelet.</h1>
              <p className="intro">
                Välj grupp, fyll i dina resultat och bygg ditt VM-tips steg för
                steg. När gruppspelet är klart skapas ditt slutspel automatiskt
                utifrån dina tips.
              </p>
            </div>

            <div className="hero-panel">
              <p>{hasSubmitted ? "Tipset är inskickat" : "Matcher ifyllda"}</p>
              <strong>
                {completedPredictionsCount}/{TOTAL_MATCHES}
              </strong>
              <span>
                {hasSubmitted
                  ? "Slutspelet är låst. Gruppspelsmatcher kan ändras fram till 60 minuter före avspark."
                  : "Tipset kan skickas in när alla matcher är ifyllda."}
              </span>
            </div>
          </div>

          {hasSubmitted && (
            <div className="tippa-locked-banner">
              <div>
                <p className="tippa-locked-title">Tipset är inskickat</p>
                <p className="tippa-locked-text">
                  Slutspelet är låst och din snapshot är sparad.
                  Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter
                  före avspark.
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

          <div className="match-toolbar">
            <div>
              <span>{groupMatches.length}</span>
              <p>gruppspelsmatcher</p>
            </div>
            <div>
              <span>{completedGroupMatches}</span>
              <p>ifyllda gruppresultat</p>
            </div>
            <div>
              <span>104</span>
              <p>matcher totalt i VM</p>
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
                  <p>din mästare</p>
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

                                <input
                                  inputMode="numeric"
                                  placeholder="-"
                                  value={match.scoreA}
                                  disabled={
                                    isPlayoffLocked ||
                                    !match.teamA ||
                                    !match.teamB
                                  }
                                  onChange={(event) =>
                                    updatePrediction(
                                      match.dbMatch.id,
                                      "home",
                                      event.target.value
                                    )
                                  }
                                />
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

                                <input
                                  inputMode="numeric"
                                  placeholder="-"
                                  value={match.scoreB}
                                  disabled={
                                    isPlayoffLocked ||
                                    !match.teamA ||
                                    !match.teamB
                                  }
                                  onChange={(event) =>
                                    updatePrediction(
                                      match.dbMatch.id,
                                      "away",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              {match.scoreA !== "" &&
                                match.scoreB !== "" &&
                                match.scoreA === match.scoreB &&
                                match.teamA &&
                                match.teamB && (
                                  <div className="advance-picker">
                                    <p>
                                      Matchen är oavgjord efter 90 minuter. Välj
                                      lag som går vidare.
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
                                        vidare
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
                                        vidare
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

              <div className="submit-panel">
                <div>
                  <p>{hasSubmitted ? "Inskickat" : "Redo att skicka in?"}</p>
                  <h3>
                    {hasSubmitted ? "Slutspelet är låst" : "Lås ditt VM-tips"}
                  </h3>
                  <span>
                    {hasSubmitted
                      ? "Din snapshot är sparad. Slutspelsträdet kan inte längre ändras."
                      : `${completedPredictionsCount}/${TOTAL_MATCHES} matcher ifyllda. När hela tipset är klart kan du låsa och skicka in din snapshot.`}
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
                      hasSubmitted || !isEntireBracketComplete || isSubmitting
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
                    <p>Live från dina tips</p>
                    <h3>Tabell Grupp {activeTab}</h3>
                  </div>
                  <span>Uppdateras direkt</span>
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
                        <tr
                          key={row.team}
                          className={index < 2 ? "advance" : ""}
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
                  const matchLocked = isMatchLocked(match);
                  const matchLockingSoon = isMatchLockingSoon(match);

                  return (
                    <article
                      key={match.id}
                      className={[
                        "match-card",
                        isLiveMatch(match) ? "match-card-live" : "",
                        isFinishedMatch(match) ? "match-card-finished" : "",
                        matchLockingSoon ? "match-card-locking-soon" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="match-top">
                        <span>Match {match.fifa_match_number}</span>

                        <div className="match-top-right">
                          {isLiveMatch(match) && (
                            <span className="live-badge">
                              <span className="live-dot" />
                              LIVE
                            </span>
                          )}

                          {isFinishedMatch(match) && (
                            <span className="finished-badge">Klar</span>
                          )}

                          {matchLockingSoon && (
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
                          <input
                            inputMode="numeric"
                            placeholder="-"
                            value={predictions[match.id]?.home || ""}
                            disabled={matchLocked}
                            onChange={(e) =>
                              updatePrediction(match.id, "home", e.target.value)
                            }
                          />

                          <span>:</span>

                          <input
                            inputMode="numeric"
                            placeholder="-"
                            value={predictions[match.id]?.away || ""}
                            disabled={matchLocked}
                            onChange={(e) =>
                              updatePrediction(match.id, "away", e.target.value)
                            }
                          />
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
                            isLiveMatch(match)
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
                          {getMatchStatusText(match, matchLocked)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="save-bar">
                <button onClick={savePredictions}>Spara tips</button>
                {(saveStatus || autoSaveStatus) && (
                  <p>{saveStatus || autoSaveStatus}</p>
                )}
              </div>
            </section>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
              opacity: 0.5;
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

            @media (max-width: 640px) {
              .match-top-right {
                gap: 7px;
              }

              .live-badge,
              .finished-badge,
              .lock-soon-badge {
                height: 22px;
                padding: 0 8px;
                font-size: 10px;
              }

              .advance-actions {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
    </main>
  );
}