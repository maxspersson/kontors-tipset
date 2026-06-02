import {
  calculateStandings,
  type MatchRow,
  type PredictionRow,
  type ProfileRow,
  type SubmissionRow,
  type SnapshotPrediction,
} from "../app/lib/scoring";
import type { AdvancingTeam } from "../app/lib/worldCupRules";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL saknas i .env.local");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas i .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function fakeScore(matchNumber: number, variant = 0) {
  const home = (matchNumber + variant) % 4;
  const away = (matchNumber + variant + 1) % 3;

  if (home === away) {
    return { home: home + 1, away };
  }

  return { home, away };
}

function getAdvancingTeam(home: number, away: number): AdvancingTeam {
  return home >= away ? "home" : "away";
}

function createSnapshotPrediction(
  match: MatchRow,
  prediction: PredictionRow
): SnapshotPrediction {
  return {
    match_id: match.id,
    predicted_home_score: prediction.predicted_home_score,
    predicted_away_score: prediction.predicted_away_score,
    advancing_team:
      match.stage === "group" ||
      prediction.predicted_home_score === null ||
      prediction.predicted_away_score === null
        ? null
        : getAdvancingTeam(
            prediction.predicted_home_score,
            prediction.predicted_away_score
          ),
    match: {
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
    },
  };
}

async function main() {
  console.log("Startar säker VM-simulering...");
  console.log("OBS: Scriptet skriver ingenting till databasen.\n");

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      fifa_match_number,
      stage,
      group_name,
      home_team,
      away_team,
      home_team_code,
      away_team_code,
      home_fifa_ranking,
      away_fifa_ranking,
      home_score,
      away_score,
      home_pen,
      away_pen,
      actual_advancing_team,
      kickoff_utc,
      status,
      city
    `
    )
    .order("fifa_match_number", { ascending: true });

  if (error) {
    throw new Error(`Kunde inte hämta matcher: ${error.message}`);
  }

  const matches = (data ?? []) as MatchRow[];

  if (matches.length !== 104) {
    throw new Error(`Förväntade 104 matcher men hittade ${matches.length}.`);
  }

  const simulatedMatches: MatchRow[] = matches.map((match) => {
    const matchNumber = match.fifa_match_number ?? 0;
    const score = fakeScore(matchNumber);

    return {
      ...match,
      home_score: score.home,
      away_score: score.away,
      status: "finished",
      actual_advancing_team:
        match.stage === "group" ? null : getAdvancingTeam(score.home, score.away),
    };
  });

  const profiles: ProfileRow[] = [
    {
      id: "sim-user-1",
      display_name: "Simulerad favorit",
      email: "sim1@example.com",
    },
    {
      id: "sim-user-2",
      display_name: "Simulerad outsider",
      email: "sim2@example.com",
    },
    {
      id: "sim-user-3",
      display_name: "Simulerad chansare",
      email: "sim3@example.com",
    },
  ];

  const leagueId = "sim-league";

  const predictions: PredictionRow[] = [];

  for (const profile of profiles) {
    const variant =
      profile.id === "sim-user-1" ? 0 : profile.id === "sim-user-2" ? 1 : 2;

    for (const match of matches) {
      const matchNumber = match.fifa_match_number ?? 0;
      const score = fakeScore(matchNumber, variant);

      predictions.push({
        league_id: leagueId,
        user_id: profile.id,
        match_id: match.id,
        predicted_home_score: score.home,
        predicted_away_score: score.away,
      });
    }
  }

  const submissions: SubmissionRow[] = profiles.map((profile) => {
    const userPredictions = predictions.filter(
      (prediction) => prediction.user_id === profile.id
    );

    const groupSnapshot = userPredictions
      .map((prediction) => {
        const match = matches.find((item) => item.id === prediction.match_id);
        if (!match || match.stage !== "group") return null;
        return createSnapshotPrediction(match, prediction);
      })
      .filter(Boolean) as SnapshotPrediction[];

    const playoffSnapshot = userPredictions
      .map((prediction) => {
        const match = matches.find((item) => item.id === prediction.match_id);
        if (!match || match.stage === "group") return null;
        return createSnapshotPrediction(match, prediction);
      })
      .filter(Boolean) as SnapshotPrediction[];

    return {
      league_id: leagueId,
      user_id: profile.id,
      group_snapshot: groupSnapshot,
      playoff_snapshot: playoffSnapshot,
    };
  });

  const standings = calculateStandings({
    submissions,
    predictions,
    matches: simulatedMatches,
    profiles,
    leagues: [{ id: leagueId, name: "Simulerad liga" }],
  });

  const stageCounts = simulatedMatches.reduce<Record<string, number>>(
    (acc, match) => {
      acc[match.stage] = (acc[match.stage] ?? 0) + 1;
      return acc;
    },
    {}
  );

  console.log("✓ 104 matcher lästa");
  console.log(`✓ Gruppspelsmatcher: ${stageCounts.group ?? 0}`);
  console.log(`✓ Sextondelsfinaler: ${stageCounts.round_of_32 ?? 0}`);
  console.log(`✓ Åttondelsfinaler: ${stageCounts.round_of_16 ?? 0}`);
  console.log(`✓ Kvartsfinaler: ${stageCounts.quarter_final ?? 0}`);
  console.log(`✓ Semifinaler: ${stageCounts.semi_final ?? 0}`);
  console.log(`✓ Bronsmatch: ${stageCounts.third_place ?? 0}`);
  console.log(`✓ Final: ${stageCounts.final ?? 0}`);
  console.log("✓ Fejkresultat skapade i minnet");
  console.log("✓ Fejkade tips och snapshots skapade i minnet");
  console.log("✓ calculateStandings kördes utan krasch\n");

  console.table(
    standings.map((standing) => ({
      spelare: standing.display_name,
      totalpoang: standing.points,
      matchpoang: standing.matchPoints,
      slutspelspoang: standing.bracketPoints,
      fulltraffar: standing.exactScores,
      rattadeMatcher: standing.playedMatches,
    }))
  );

  console.log("\nKLART: Full VM-simulering lyckades utan databasändringar.");
}

main().catch((error) => {
  console.error("\nSimuleringen misslyckades:");
  console.error(error);
  process.exit(1);
});