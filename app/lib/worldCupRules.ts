export type AdvancingTeam = "home" | "away";

export type PredictionState = Record<
  string,
  {
    home: string;
    away: string;
    advancingTeam?: AdvancingTeam | null;
  }
>;

export type WorldCupMatch = {
  id: string;
  fifa_match_number: number | null;
  stage: string | null;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_team_code: string | null;
  away_team_code: string | null;
  home_fifa_ranking?: number | null;
  away_fifa_ranking?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  kickoff_utc: string;
  status: string | null;
  city?: string | null;
};

export type GroupTableRow = {
  team: string;
  code: string | null;
  group: string;
  fifaRanking: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupTable = {
  group: string;
  table: GroupTableRow[];
  completedMatches: number;
  totalMatches: number;
};

export type AdvancingTeamRow = GroupTableRow;

export type BracketMatch = {
  dbMatch: WorldCupMatch;
  slotALabel: string;
  slotBLabel: string;
  teamA: AdvancingTeamRow | null;
  teamB: AdvancingTeamRow | null;
  scoreA: string;
  scoreB: string;
  winner: AdvancingTeamRow | null;
  loser: AdvancingTeamRow | null;
};

export const groups = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export const bracketRounds = [
  { key: "round_of_32", label: "Sextondelsfinal", matches: 16 },
  { key: "round_of_16", label: "Åttondelsfinal", matches: 8 },
  { key: "quarter_final", label: "Kvartsfinal", matches: 4 },
  { key: "semi_final", label: "Semifinal", matches: 2 },
  { key: "medals", label: "Final & Bronsmatch", matches: 2 },
] as const;

export function isCompletePrediction(prediction?: {
  home: string;
  away: string;
  advancingTeam?: AdvancingTeam | null;
}) {
  return !!prediction && prediction.home !== "" && prediction.away !== "";
}

export function isGroupTableRow(
  row: GroupTableRow | undefined | null
): row is GroupTableRow {
  return !!row;
}

function createEmptyRow(
  team: string,
  code: string | null,
  group: string,
  fifaRanking: number | null = null
): GroupTableRow {
  return {
    team,
    code,
    group,
    fifaRanking,
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

function applyMatchToRows(
  home: GroupTableRow,
  away: GroupTableRow,
  homeScore: number,
  awayScore: number
) {
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
  } else if (awayScore > homeScore) {
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

function compareByFifaRankingThenName(a: GroupTableRow, b: GroupTableRow) {
  if (
    a.fifaRanking !== null &&
    b.fifaRanking !== null &&
    a.fifaRanking !== b.fifaRanking
  ) {
    return a.fifaRanking - b.fifaRanking;
  }

  if (a.fifaRanking !== null && b.fifaRanking === null) return -1;
  if (a.fifaRanking === null && b.fifaRanking !== null) return 1;

  return a.team.localeCompare(b.team, "sv");
}

function getHeadToHeadRows(
  tiedTeams: GroupTableRow[],
  matchesInGroup: WorldCupMatch[],
  predictions: PredictionState,
  group: string
) {
  const tiedTeamNames = new Set(tiedTeams.map((team) => team.team));
  const miniTable = new Map<string, GroupTableRow>();

  for (const team of tiedTeams) {
    miniTable.set(
      team.team,
      createEmptyRow(team.team, team.code, group, team.fifaRanking)
    );
  }

  for (const match of matchesInGroup) {
    if (!tiedTeamNames.has(match.home_team)) continue;
    if (!tiedTeamNames.has(match.away_team)) continue;

    const prediction = predictions[match.id];
    if (!isCompletePrediction(prediction)) continue;

    const home = miniTable.get(match.home_team);
    const away = miniTable.get(match.away_team);

    if (!home || !away) continue;

    applyMatchToRows(home, away, Number(prediction.home), Number(prediction.away));
  }

  return miniTable;
}

function compareGroupTeams(
  a: GroupTableRow,
  b: GroupTableRow,
  allRows: GroupTableRow[],
  matchesInGroup: WorldCupMatch[],
  predictions: PredictionState,
  group: string
) {
  if (b.points !== a.points) return b.points - a.points;

  const tiedTeams = allRows.filter((row) => row.points === a.points);

  if (tiedTeams.length > 1) {
    const headToHeadRows = getHeadToHeadRows(
      tiedTeams,
      matchesInGroup,
      predictions,
      group
    );

    const h2hA = headToHeadRows.get(a.team);
    const h2hB = headToHeadRows.get(b.team);

    if (h2hA && h2hB) {
      if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points;

      if (h2hB.goalDifference !== h2hA.goalDifference) {
        return h2hB.goalDifference - h2hA.goalDifference;
      }

      if (h2hB.goalsFor !== h2hA.goalsFor) {
        return h2hB.goalsFor - h2hA.goalsFor;
      }
    }
  }

  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }

  if (b.goalsFor !== a.goalsFor) {
    return b.goalsFor - a.goalsFor;
  }

  return compareByFifaRankingThenName(a, b);
}

export function buildGroupTable(
  matchesInGroup: WorldCupMatch[],
  predictions: PredictionState,
  group: string
): GroupTableRow[] {
  const table = new Map<string, GroupTableRow>();

  for (const match of matchesInGroup) {
    if (!table.has(match.home_team)) {
      table.set(
        match.home_team,
        createEmptyRow(
          match.home_team,
          match.home_team_code,
          group,
          match.home_fifa_ranking ?? null
        )
      );
    }

    if (!table.has(match.away_team)) {
      table.set(
        match.away_team,
        createEmptyRow(
          match.away_team,
          match.away_team_code,
          group,
          match.away_fifa_ranking ?? null
        )
      );
    }

    const prediction = predictions[match.id];
    if (!isCompletePrediction(prediction)) continue;

    const home = table.get(match.home_team);
    const away = table.get(match.away_team);

    if (!home || !away) continue;

    applyMatchToRows(home, away, Number(prediction.home), Number(prediction.away));
  }

  const rows = Array.from(table.values());

  return rows.sort((a, b) =>
    compareGroupTeams(a, b, rows, matchesInGroup, predictions, group)
  );
}

export function rankBestThirdPlacedTeams(input: GroupTable[] | GroupTableRow[]) {
  const thirdPlacedTeams = Array.isArray(input)
    ? input.flatMap((item) => {
        if ("table" in item) {
          return item.table[2] ? [item.table[2]] : [];
        }

        return [item];
      })
    : [];

  return [...thirdPlacedTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    return compareByFifaRankingThenName(a, b);
  });
}

function getGroupWinnerOrRunnerUp(
  label: string,
  allGroupTables: GroupTable[]
): GroupTableRow | null {
  const match = label.match(/^([12])([A-L])$/);
  if (!match) return null;

  const position = Number(match[1]) - 1;
  const group = match[2];

  const groupTable = allGroupTables.find((item) => item.group === group);

  return groupTable?.table[position] ?? null;
}

function getThirdPlacedTeamFromSlot(
  label: string,
  thirdPlacedTeams: GroupTableRow[],
  usedThirdGroups: Set<string>
): GroupTableRow | null {
  const match = label.match(/^3([A-L]+)$/);
  if (!match) return null;

  const allowedGroups = match[1].split("");

  const team = thirdPlacedTeams.find(
    (row) => allowedGroups.includes(row.group) && !usedThirdGroups.has(row.group)
  );

  if (team) {
    usedThirdGroups.add(team.group);
  }

  return team ?? null;
}

function getWinnerFromPreviousMatch(
  label: string,
  resolvedByMatchNumber: Map<number, BracketMatch>
): GroupTableRow | null {
  const match = label.match(/^W(\d+)$/);
  if (!match) return null;

  const matchNumber = Number(match[1]);

  return resolvedByMatchNumber.get(matchNumber)?.winner ?? null;
}

function getLoserFromPreviousMatch(
  label: string,
  resolvedByMatchNumber: Map<number, BracketMatch>
): GroupTableRow | null {
  const match = label.match(/^L(\d+)$/);
  if (!match) return null;

  const matchNumber = Number(match[1]);

  return resolvedByMatchNumber.get(matchNumber)?.loser ?? null;
}

function resolveSlot({
  label,
  allGroupTables,
  thirdPlacedTeams,
  usedThirdGroups,
  resolvedByMatchNumber,
}: {
  label: string;
  allGroupTables: GroupTable[];
  thirdPlacedTeams: GroupTableRow[];
  usedThirdGroups: Set<string>;
  resolvedByMatchNumber: Map<number, BracketMatch>;
}) {
  return (
    getGroupWinnerOrRunnerUp(label, allGroupTables) ??
    getThirdPlacedTeamFromSlot(label, thirdPlacedTeams, usedThirdGroups) ??
    getWinnerFromPreviousMatch(label, resolvedByMatchNumber) ??
    getLoserFromPreviousMatch(label, resolvedByMatchNumber)
  );
}

function getMatchWinnerAndLoser({
  teamA,
  teamB,
  scoreA,
  scoreB,
  prediction,
}: {
  teamA: GroupTableRow | null;
  teamB: GroupTableRow | null;
  scoreA: string;
  scoreB: string;
  prediction:
    | {
        home: string;
        away: string;
        advancingTeam?: AdvancingTeam | null;
      }
    | undefined;
}) {
  if (!teamA || !teamB) {
    return { winner: null, loser: null };
  }

  if (!isCompletePrediction(prediction)) {
    return { winner: null, loser: null };
  }

  const homeScore = Number(scoreA);
  const awayScore = Number(scoreB);

  if (homeScore > awayScore) {
    return { winner: teamA, loser: teamB };
  }

  if (awayScore > homeScore) {
    return { winner: teamB, loser: teamA };
  }

  if (prediction?.advancingTeam === "home") {
    return { winner: teamA, loser: teamB };
  }

  if (prediction?.advancingTeam === "away") {
    return { winner: teamB, loser: teamA };
  }

  return { winner: null, loser: null };
}

function sortPlayoffMatches(a: WorldCupMatch, b: WorldCupMatch) {
  return (a.fifa_match_number ?? 9999) - (b.fifa_match_number ?? 9999);
}

export function buildPlayoffRounds({
  playoffMatches,
  allGroupTables,
  thirdPlacedTeams,
  predictions,
}: {
  playoffMatches: WorldCupMatch[];
  allGroupTables: GroupTable[];
  thirdPlacedTeams: GroupTableRow[];
  predictions: PredictionState;
}): BracketMatch[][] {
  const resolvedByMatchNumber = new Map<number, BracketMatch>();
  const usedThirdGroups = new Set<string>();

  const rounds = bracketRounds.map((round) => {
    const matches =
      round.key === "medals"
        ? playoffMatches
            .filter(
              (match) =>
                match.stage === "final" || match.stage === "third_place"
            )
            .sort((a, b) => {
              if (a.stage === "final" && b.stage !== "final") return -1;
              if (a.stage !== "final" && b.stage === "final") return 1;

              return sortPlayoffMatches(a, b);
            })
        : playoffMatches
            .filter((match) => match.stage === round.key)
            .sort(sortPlayoffMatches);

    return matches.map((dbMatch) => {
      const slotALabel = dbMatch.home_team;
      const slotBLabel = dbMatch.away_team;

      const teamA = resolveSlot({
        label: slotALabel,
        allGroupTables,
        thirdPlacedTeams,
        usedThirdGroups,
        resolvedByMatchNumber,
      });

      const teamB = resolveSlot({
        label: slotBLabel,
        allGroupTables,
        thirdPlacedTeams,
        usedThirdGroups,
        resolvedByMatchNumber,
      });

      const prediction = predictions[dbMatch.id];

      const scoreA = prediction?.home ?? "";
      const scoreB = prediction?.away ?? "";

      const { winner, loser } = getMatchWinnerAndLoser({
        teamA,
        teamB,
        scoreA,
        scoreB,
        prediction,
      });

      const bracketMatch: BracketMatch = {
        dbMatch,
        slotALabel,
        slotBLabel,
        teamA,
        teamB,
        scoreA,
        scoreB,
        winner,
        loser,
      };

      if (dbMatch.fifa_match_number !== null) {
        resolvedByMatchNumber.set(dbMatch.fifa_match_number, bracketMatch);
      }

      return bracketMatch;
    });
  });

  return rounds;
}