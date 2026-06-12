import {
  buildGroupTable,
  buildPlayoffRounds,
  groups,
  rankBestThirdPlacedTeams,
  type AdvancingTeam,
  type GroupTable,
  type PredictionState,
  type WorldCupMatch,
} from "@/app/lib/worldCupRules";

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
  home_team_code?: string | null;
  away_team_code?: string | null;
  home_fifa_ranking?: number | null;
  away_fifa_ranking?: number | null;
  home_score: number | null;
  away_score: number | null;
  home_pen?: number | null;
  away_pen?: number | null;
  actual_advancing_team?: AdvancingTeam | null;
  kickoff_utc?: string | null;
  status?: string | null;
  city?: string | null;
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
  advancing_team?: AdvancingTeam | null;
  match: {
    id: string;
    fifa_match_number: number | null;
    stage: string;
    group_name: string | null;
    home_team: string;
    away_team: string;
    home_team_code?: string | null;
    away_team_code?: string | null;
    home_fifa_ranking?: number | null;
    away_fifa_ranking?: number | null;
  };
};

export type SubmissionRow = {
  league_id: string;
  user_id: string;
  group_snapshot: SnapshotPrediction[] | null;
  playoff_snapshot: SnapshotPrediction[] | null;
};

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

function toWorldCupMatch(match: MatchRow): WorldCupMatch {
  return {
    id: match.id,
    fifa_match_number: match.fifa_match_number,
    stage: match.stage,
    group_name: match.group_name,
    home_team: match.home_team,
    away_team: match.away_team,
    home_team_code: match.home_team_code ?? null,
    away_team_code: match.away_team_code ?? null,
    home_fifa_ranking: match.home_fifa_ranking ?? null,
    away_fifa_ranking: match.away_fifa_ranking ?? null,
    home_score: match.home_score,
    away_score: match.away_score,
    kickoff_utc: match.kickoff_utc ?? "",
    status: match.status ?? null,
    city: match.city ?? null,
  };
}

function buildAllGroupTables(
  matches: WorldCupMatch[],
  predictions: PredictionState
): GroupTable[] {
  return groups.map((group) => {
    const matchesInGroup = matches.filter(
      (match) => match.stage === "group" && match.group_name === group
    );

    return {
      group,
      table: buildGroupTable(matchesInGroup, predictions, group),
      completedMatches: matchesInGroup.filter((match) => {
        const prediction = predictions[match.id];
        return !!prediction && prediction.home !== "" && prediction.away !== "";
      }).length,
      totalMatches: matchesInGroup.length,
    };
  });
}

function getActualAdvancingTeam(match: MatchRow): AdvancingTeam | null {
  if (match.actual_advancing_team) return match.actual_advancing_team;

  if (match.stage === "group") return null;
  if (match.home_score === null || match.away_score === null) return null;

  if (match.home_score > match.away_score) return "home";
  if (match.away_score > match.home_score) return "away";

  if (
    match.home_pen !== null &&
    match.home_pen !== undefined &&
    match.away_pen !== null &&
    match.away_pen !== undefined
  ) {
    if (match.home_pen > match.away_pen) return "home";
    if (match.away_pen > match.home_pen) return "away";
  }

  return null;
}

function actualScoresToPredictionState(matches: MatchRow[]): PredictionState {
  const predictions: PredictionState = {};

  for (const match of matches) {
    predictions[match.id] = {
      home: match.home_score === null ? "" : String(match.home_score),
      away: match.away_score === null ? "" : String(match.away_score),
      advancingTeam: getActualAdvancingTeam(match),
    };
  }

  return predictions;
}

function snapshotToWorldCupMatches(snapshot: SnapshotPrediction[]): WorldCupMatch[] {
  return snapshot.map((item) => ({
    id: item.match.id,
    fifa_match_number: item.match.fifa_match_number,
    stage: item.match.stage,
    group_name: item.match.group_name,
    home_team: item.match.home_team,
    away_team: item.match.away_team,
    home_team_code: item.match.home_team_code ?? null,
    away_team_code: item.match.away_team_code ?? null,
    home_fifa_ranking: item.match.home_fifa_ranking ?? null,
    away_fifa_ranking: item.match.away_fifa_ranking ?? null,
    home_score: null,
    away_score: null,
    kickoff_utc: "",
    status: null,
    city: null,
  }));
}

function snapshotToPredictionState(snapshot: SnapshotPrediction[]): PredictionState {
  const predictions: PredictionState = {};

  for (const item of snapshot) {
    predictions[item.match_id] = {
      home:
        item.predicted_home_score === null
          ? ""
          : String(item.predicted_home_score),
      away:
        item.predicted_away_score === null
          ? ""
          : String(item.predicted_away_score),
      advancingTeam: item.advancing_team ?? null,
    };
  }

  return predictions;
}

function buildTournamentProgression({
  matches,
  predictions,
  requireCompletedGroups,
}: {
  matches: WorldCupMatch[];
  predictions: PredictionState;
  requireCompletedGroups: boolean;
}): TournamentProgression {
  const groupMatches = matches.filter((match) => match.stage === "group");
  const playoffMatches = matches.filter((match) => match.stage !== "group");

  const allGroupTables = buildAllGroupTables(groupMatches, predictions);

  const groupTablesForThirds = requireCompletedGroups
    ? allGroupTables.filter(
        (group) =>
          group.totalMatches > 0 && group.completedMatches === group.totalMatches
      )
    : allGroupTables;

  const allGroupsComplete =
    allGroupTables.length > 0 &&
    allGroupTables.every(
      (group) =>
        group.totalMatches > 0 && group.completedMatches === group.totalMatches
    );

  const thirdPlacedTeams =
    requireCompletedGroups && !allGroupsComplete
      ? []
      : rankBestThirdPlacedTeams(groupTablesForThirds).slice(0, 8);

  const playoffRounds = buildPlayoffRounds({
    playoffMatches,
    allGroupTables,
    thirdPlacedTeams,
    predictions,
  });

  const roundOf16Teams = new Set<string>();
  const quarterFinalTeams = new Set<string>();
  const semiFinalTeams = new Set<string>();
  const finalTeams = new Set<string>();

  for (const round of playoffRounds) {
    for (const match of round) {
      if (!match.winner) continue;

      if (match.dbMatch.stage === "round_of_32") {
        roundOf16Teams.add(match.winner.team);
      }

      if (match.dbMatch.stage === "round_of_16") {
        quarterFinalTeams.add(match.winner.team);
      }

      if (match.dbMatch.stage === "quarter_final") {
        semiFinalTeams.add(match.winner.team);
      }

      if (match.dbMatch.stage === "semi_final") {
        finalTeams.add(match.winner.team);
      }
    }
  }

  const finalRound = playoffRounds[playoffRounds.length - 1];
  const finalMatch = finalRound?.find((match) => match.dbMatch.stage === "final");

  return {
    roundOf16Teams,
    quarterFinalTeams,
    semiFinalTeams,
    finalTeams,
    champion: finalMatch?.winner?.team ?? null,
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

  const actualProgression = buildTournamentProgression({
    matches: matches.map(toWorldCupMatch),
    predictions: actualScoresToPredictionState(matches),
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

  for (const submission of submissions) {
  const key = `${submission.league_id}:${submission.user_id}`;
  const current = scoreMap.get(key);

  if (!current) continue;

  const fullSnapshot = [
    ...(submission.group_snapshot ?? []),
    ...(submission.playoff_snapshot ?? []),
  ];

  for (const snapshotPrediction of fullSnapshot) {
    const match = matchMap.get(snapshotPrediction.match_id);

    if (!match || match.home_score === null || match.away_score === null) {
      continue;
    }

    const points = getMatchPoints(
      {
        league_id: submission.league_id,
        user_id: submission.user_id,
        match_id: snapshotPrediction.match_id,
        predicted_home_score: snapshotPrediction.predicted_home_score,
        predicted_away_score: snapshotPrediction.predicted_away_score,
      },
      match
    );

    current.matchPoints += points;
    current.totalPoints += points;
    current.playedMatches += 1;

    if (points === 7) current.exactScores += 1;
  }
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
      matches: snapshotToWorldCupMatches(fullSnapshot),
      predictions: snapshotToPredictionState(fullSnapshot),
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

  if (b.exactScores !== a.exactScores) {
    return b.exactScores - a.exactScores;
  }

  if (b.matchPoints !== a.matchPoints) {
    return b.matchPoints - a.matchPoints;
  }

  if (b.bracketPoints !== a.bracketPoints) {
    return b.bracketPoints - a.bracketPoints;
  }

  return a.display_name.localeCompare(b.display_name, "sv");
});

  return typeof limit === "number" ? standings.slice(0, limit) : standings;
}