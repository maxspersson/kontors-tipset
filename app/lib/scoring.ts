export type PredictionRow = {
  league_id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

export type MatchRow = {
  id: string;
  fifa_match_number: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export type LeagueRow = {
  id: string;
  name: string;
};

export type SnapshotPrediction = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  match: {
    id: string;
    fifa_match_number: number | null;
    stage: string;
    group_name: string | null;
    home_team: string;
    away_team: string;
  };
};

export type SubmissionRow = {
  league_id: string;
  user_id: string;
  group_snapshot: SnapshotPrediction[] | null;
  playoff_snapshot: SnapshotPrediction[] | null;
};

type TeamRow = {
  team: string;
  group: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type SeedSlot =
  | { type: "group_position"; position: 1 | 2; group: string; label: string }
  | { type: "best_third"; groups: string[]; label: string }
  | { type: "winner"; matchNumber: number; label: string };

type TournamentProgression = {
  roundOf16Teams: Set<string>;
  quarterFinalTeams: Set<string>;
  semiFinalTeams: Set<string>;
  finalTeams: Set<string>;
  champion: string | null;
};

export type Standing = {
  league_id: string;
  league_name: string | null;
  user_id: string;
  display_name: string;
  email: string | null;
  points: number;
  matchPoints: number;
  bracketPoints: number;
  exactScores: number;
  playedMatches: number;
};

const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const roundOf32Slots: Record<number, [SeedSlot, SeedSlot]> = {
  73: [{ type: "group_position", position: 2, group: "A", label: "2A" }, { type: "group_position", position: 2, group: "B", label: "2B" }],
  74: [{ type: "group_position", position: 1, group: "E", label: "1E" }, { type: "best_third", groups: ["A", "B", "C", "D", "F"], label: "3ABCDF" }],
  75: [{ type: "group_position", position: 1, group: "F", label: "1F" }, { type: "group_position", position: 2, group: "C", label: "2C" }],
  76: [{ type: "group_position", position: 1, group: "C", label: "1C" }, { type: "group_position", position: 2, group: "F", label: "2F" }],
  77: [{ type: "group_position", position: 1, group: "I", label: "1I" }, { type: "best_third", groups: ["C", "D", "F", "G", "H"], label: "3CDFGH" }],
  78: [{ type: "group_position", position: 2, group: "E", label: "2E" }, { type: "group_position", position: 2, group: "I", label: "2I" }],
  79: [{ type: "group_position", position: 1, group: "A", label: "1A" }, { type: "best_third", groups: ["C", "E", "F", "H", "I"], label: "3CEFHI" }],
  80: [{ type: "group_position", position: 1, group: "L", label: "1L" }, { type: "best_third", groups: ["E", "H", "I", "J", "K"], label: "3EHIJK" }],
  81: [{ type: "group_position", position: 1, group: "D", label: "1D" }, { type: "best_third", groups: ["B", "E", "F", "I", "J"], label: "3BEFIJ" }],
  82: [{ type: "group_position", position: 1, group: "G", label: "1G" }, { type: "best_third", groups: ["A", "E", "H", "I", "J"], label: "3AEHIJ" }],
  83: [{ type: "group_position", position: 2, group: "K", label: "2K" }, { type: "group_position", position: 2, group: "L", label: "2L" }],
  84: [{ type: "group_position", position: 1, group: "H", label: "1H" }, { type: "group_position", position: 2, group: "J", label: "2J" }],
  85: [{ type: "group_position", position: 1, group: "B", label: "1B" }, { type: "best_third", groups: ["E", "F", "G", "I", "J"], label: "3EFGIJ" }],
  86: [{ type: "group_position", position: 1, group: "J", label: "1J" }, { type: "group_position", position: 2, group: "H", label: "2H" }],
  87: [{ type: "group_position", position: 1, group: "K", label: "1K" }, { type: "best_third", groups: ["D", "E", "I", "J", "L"], label: "3DEIJL" }],
  88: [{ type: "group_position", position: 2, group: "D", label: "2D" }, { type: "group_position", position: 2, group: "G", label: "2G" }],
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
  104: [{ type: "winner", matchNumber: 101, label: "W101" }, { type: "winner", matchNumber: 102, label: "W102" }],
};

function formatDisplayName(email?: string | null) {
  if (!email) return null;

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMatchPoints(prediction: PredictionRow, match: MatchRow) {
  if (
    match.home_score === null ||
    match.away_score === null ||
    prediction.predicted_home_score === null ||
    prediction.predicted_away_score === null
  ) {
    return 0;
  }

  let points = 0;

  if (prediction.predicted_home_score === match.home_score) points += 2;
  if (prediction.predicted_away_score === match.away_score) points += 2;

  const predictedDiff =
    prediction.predicted_home_score - prediction.predicted_away_score;
  const actualDiff = match.home_score - match.away_score;

  const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
  const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

  if (predictedSign === actualSign) points += 3;

  return points;
}

function createTeam(team: string, group: string): TeamRow {
  return {
    team,
    group,
    played: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function buildGroupTables(
  matches: MatchRow[],
  scoresByMatchId: Map<string, { home: number | null; away: number | null }>
) {
  const tables = new Map<string, TeamRow[]>();
  const completedGroups = new Set<string>();

  for (const group of groups) {
    const matchesInGroup = matches.filter(
      (match) => match.stage === "group" && match.group_name === group
    );

    const table = new Map<string, TeamRow>();

    for (const match of matchesInGroup) {
      if (!table.has(match.home_team)) {
        table.set(match.home_team, createTeam(match.home_team, group));
      }

      if (!table.has(match.away_team)) {
        table.set(match.away_team, createTeam(match.away_team, group));
      }

      const score = scoresByMatchId.get(match.id);

      if (!score || score.home === null || score.away === null) continue;

      const home = table.get(match.home_team)!;
      const away = table.get(match.away_team)!;

      home.played += 1;
      away.played += 1;

      home.goalsFor += score.home;
      home.goalsAgainst += score.away;
      away.goalsFor += score.away;
      away.goalsAgainst += score.home;

      if (score.home > score.away) home.points += 3;
      else if (score.away > score.home) away.points += 3;
      else {
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    const sortedTable = Array.from(table.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });

    tables.set(group, sortedTable);

    const allMatchesHaveScores =
      matchesInGroup.length > 0 &&
      matchesInGroup.every((match) => {
        const score = scoresByMatchId.get(match.id);
        return score?.home !== null && score?.away !== null;
      });

    if (allMatchesHaveScores) completedGroups.add(group);
  }

  return { tables, completedGroups };
}

function getThirdPlacedTeams(tables: Map<string, TeamRow[]>) {
  return groups
    .map((group) => tables.get(group)?.[2])
    .filter((team): team is TeamRow => Boolean(team))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    })
    .slice(0, 8);
}

function buildBestThirdAssignment(thirdPlacedTeams: TeamRow[]) {
  const usedGroups = new Set<string>();
  const assignment = new Map<string, TeamRow>();
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

function getWinner(
  teamA: TeamRow | undefined,
  teamB: TeamRow | undefined,
  scoreA: number | null,
  scoreB: number | null
) {
  if (!teamA || !teamB || scoreA === null || scoreB === null) return undefined;
  if (scoreA > scoreB) return teamA;
  if (scoreB > scoreA) return teamB;
  return undefined;
}

function resolveSlot({
  slot,
  tables,
  completedGroups,
  thirdAssignment,
  winnersByMatchNumber,
  requireCompletedGroups,
}: {
  slot: SeedSlot;
  tables: Map<string, TeamRow[]>;
  completedGroups: Set<string>;
  thirdAssignment: Map<string, TeamRow>;
  winnersByMatchNumber: Map<number, TeamRow>;
  requireCompletedGroups: boolean;
}) {
  if (slot.type === "group_position") {
    if (requireCompletedGroups && !completedGroups.has(slot.group)) {
      return undefined;
    }

    return tables.get(slot.group)?.[slot.position - 1];
  }

  if (slot.type === "best_third") {
    if (requireCompletedGroups && completedGroups.size < groups.length) {
      return undefined;
    }

    return thirdAssignment.get(slot.label);
  }

  return winnersByMatchNumber.get(slot.matchNumber);
}

function buildTournamentProgression({
  matches,
  scoresByMatchId,
  requireCompletedGroups,
}: {
  matches: MatchRow[];
  scoresByMatchId: Map<string, { home: number | null; away: number | null }>;
  requireCompletedGroups: boolean;
}): TournamentProgression {
  const { tables, completedGroups } = buildGroupTables(matches, scoresByMatchId);
  const thirdPlacedTeams = getThirdPlacedTeams(tables);
  const thirdAssignment = buildBestThirdAssignment(thirdPlacedTeams);
  const winnersByMatchNumber = new Map<number, TeamRow>();

  const roundOf16Teams = new Set<string>();
  const quarterFinalTeams = new Set<string>();
  const semiFinalTeams = new Set<string>();
  const finalTeams = new Set<string>();

  const playoffMatches = matches
    .filter((match) => match.stage !== "group")
    .sort((a, b) => (a.fifa_match_number ?? 0) - (b.fifa_match_number ?? 0));

  for (const match of playoffMatches) {
    const matchNumber = match.fifa_match_number;
    if (!matchNumber) continue;

    const slots =
      match.stage === "round_of_32"
        ? roundOf32Slots[matchNumber]
        : laterRoundSlots[matchNumber];

    if (!slots) continue;

    const [slotA, slotB] = slots;

    const teamA = resolveSlot({
      slot: slotA,
      tables,
      completedGroups,
      thirdAssignment,
      winnersByMatchNumber,
      requireCompletedGroups,
    });

    const teamB = resolveSlot({
      slot: slotB,
      tables,
      completedGroups,
      thirdAssignment,
      winnersByMatchNumber,
      requireCompletedGroups,
    });

    const score = scoresByMatchId.get(match.id);
    const winner = getWinner(
      teamA,
      teamB,
      score?.home ?? null,
      score?.away ?? null
    );

    if (!winner) continue;

    winnersByMatchNumber.set(matchNumber, winner);

    if (match.stage === "round_of_32") roundOf16Teams.add(winner.team);
    if (match.stage === "round_of_16") quarterFinalTeams.add(winner.team);
    if (match.stage === "quarter_final") semiFinalTeams.add(winner.team);
    if (match.stage === "semi_final") finalTeams.add(winner.team);
  }

  return {
    roundOf16Teams,
    quarterFinalTeams,
    semiFinalTeams,
    finalTeams,
    champion: winnersByMatchNumber.get(104)?.team ?? null,
  };
}

function getBracketPoints(
  predicted: TournamentProgression,
  actual: TournamentProgression
) {
  let points = 0;

  predicted.roundOf16Teams.forEach((team) => {
    if (actual.roundOf16Teams.has(team)) points += 2;
  });

  predicted.quarterFinalTeams.forEach((team) => {
    if (actual.quarterFinalTeams.has(team)) points += 4;
  });

  predicted.semiFinalTeams.forEach((team) => {
    if (actual.semiFinalTeams.has(team)) points += 6;
  });

  predicted.finalTeams.forEach((team) => {
    if (actual.finalTeams.has(team)) points += 8;
  });

  if (
    predicted.champion &&
    actual.champion &&
    predicted.champion === actual.champion
  ) {
    points += 20;
  }

  return points;
}

function snapshotToMatchRows(snapshot: SnapshotPrediction[]) {
  return snapshot.map((item) => ({
    id: item.match.id,
    fifa_match_number: item.match.fifa_match_number,
    stage: item.match.stage,
    group_name: item.match.group_name,
    home_team: item.match.home_team,
    away_team: item.match.away_team,
    home_score: null,
    away_score: null,
  }));
}

function snapshotToScores(snapshot: SnapshotPrediction[]) {
  return new Map(
    snapshot.map((item) => [
      item.match_id,
      {
        home: item.predicted_home_score,
        away: item.predicted_away_score,
      },
    ])
  );
}

export function calculateStandings({
  submissions,
  predictions,
  matches,
  profiles,
  leagues = [],
  limit,
}: {
  submissions: SubmissionRow[];
  predictions: PredictionRow[];
  matches: MatchRow[];
  profiles: ProfileRow[];
  leagues?: LeagueRow[];
  limit?: number;
}) {
  const submittedKeys = new Set(
    submissions.map((submission) => `${submission.league_id}:${submission.user_id}`)
  );

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const leagueMap = new Map(leagues.map((league) => [league.id, league.name]));
  const matchMap = new Map(matches.map((match) => [match.id, match]));
  const submissionMap = new Map(
    submissions.map((submission) => [
      `${submission.league_id}:${submission.user_id}`,
      submission,
    ])
  );

  const actualScoresByMatchId = new Map(
    matches.map((match) => [
      match.id,
      {
        home: match.home_score,
        away: match.away_score,
      },
    ])
  );

  const actualProgression = buildTournamentProgression({
    matches,
    scoresByMatchId: actualScoresByMatchId,
    requireCompletedGroups: true,
  });

  const scoreMap = new Map<
    string,
    {
      league_id: string;
      user_id: string;
      matchPoints: number;
      bracketPoints: number;
      totalPoints: number;
      exactScores: number;
      playedMatches: number;
    }
  >();

  for (const submission of submissions) {
    const key = `${submission.league_id}:${submission.user_id}`;

    scoreMap.set(key, {
      league_id: submission.league_id,
      user_id: submission.user_id,
      matchPoints: 0,
      bracketPoints: 0,
      totalPoints: 0,
      exactScores: 0,
      playedMatches: 0,
    });
  }

  for (const prediction of predictions) {
    const key = `${prediction.league_id}:${prediction.user_id}`;
    if (!submittedKeys.has(key)) continue;

    const match = matchMap.get(prediction.match_id);
    if (!match || match.home_score === null || match.away_score === null) {
      continue;
    }

    const points = getMatchPoints(prediction, match);
    const current = scoreMap.get(key);
    if (!current) continue;

    current.matchPoints += points;
    current.totalPoints += points;
    current.playedMatches += 1;

    if (points === 7) current.exactScores += 1;
  }

  for (const [key, current] of scoreMap.entries()) {
    const submission = submissionMap.get(key);
    if (!submission) continue;

    const fullSnapshot = [
      ...(submission.group_snapshot ?? []),
      ...(submission.playoff_snapshot ?? []),
    ];

    if (fullSnapshot.length === 0) continue;

    const predictedProgression = buildTournamentProgression({
      matches: snapshotToMatchRows(fullSnapshot),
      scoresByMatchId: snapshotToScores(fullSnapshot),
      requireCompletedGroups: false,
    });

    const bracketPoints = getBracketPoints(
      predictedProgression,
      actualProgression
    );

    current.bracketPoints += bracketPoints;
    current.totalPoints += bracketPoints;
  }

  const standings: Standing[] = Array.from(scoreMap.values()).map((score) => {
    const profile = profileMap.get(score.user_id);

    return {
      league_id: score.league_id,
      league_name: leagueMap.get(score.league_id) ?? null,
      user_id: score.user_id,
      display_name:
        profile?.display_name ||
        formatDisplayName(profile?.email) ||
        "Spelare",
      email: profile?.email || null,
      points: score.totalPoints,
      matchPoints: score.matchPoints,
      bracketPoints: score.bracketPoints,
      exactScores: score.exactScores,
      playedMatches: score.playedMatches,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.bracketPoints !== a.bracketPoints) {
      return b.bracketPoints - a.bracketPoints;
    }
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    return a.display_name.localeCompare(b.display_name);
  });

  return typeof limit === "number" ? standings.slice(0, limit) : standings;
}