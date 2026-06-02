import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import ReadonlyTipsClient from "./ReadonlyTipsClient";
import type {
  LeagueSubmission,
  Match,
  SavedPrediction,
} from "@/app/tippa/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type TipsPageProps = {
  params: Promise<{
    slug: string;
    userId: string;
  }>;
};

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
};

type SnapshotPrediction = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  advancing_team?: "home" | "away" | null;
};

type TeamRankingRow = {
  name: string;
  code: string | null;
  fifa_ranking: number | null;
};

function getDisplayName(profile?: Profile | null) {
  return profile?.display_name || profile?.email?.split("@")[0] || "Spelare";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeTeamKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function addFifaRankingsToMatches(
  matches: Match[],
  teams: TeamRankingRow[]
): Match[] {
  const rankingByName = new Map<string, number | null>();
  const rankingByCode = new Map<string, number | null>();

  for (const team of teams) {
    rankingByName.set(normalizeTeamKey(team.name), team.fifa_ranking);

    if (team.code) {
      rankingByCode.set(normalizeTeamKey(team.code), team.fifa_ranking);
    }
  }

  return matches.map((match) => {
    const homeRanking =
      rankingByName.get(normalizeTeamKey(match.home_team)) ??
      rankingByCode.get(normalizeTeamKey(match.home_team_code)) ??
      null;

    const awayRanking =
      rankingByName.get(normalizeTeamKey(match.away_team)) ??
      rankingByCode.get(normalizeTeamKey(match.away_team_code)) ??
      null;

    return {
      ...match,
      home_fifa_ranking: homeRanking,
      away_fifa_ranking: awayRanking,
    };
  });
}

export default async function MemberTipsPage({ params }: TipsPageProps) {
  const { slug, userId: userOrSlug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (!league) {
    redirect("/liga");
  }

  const { data: myMembership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) {
    redirect("/liga");
  }

  const submissionQuery = supabase
    .from("league_submissions")
    .select(
      "id, league_id, user_id, submitted_at, updated_at, group_snapshot, playoff_snapshot, public_slug"
    )
    .eq("league_id", league.id)
    .not("submitted_at", "is", null);

  const { data: submission } = isUuid(userOrSlug)
    ? await submissionQuery.eq("user_id", userOrSlug).maybeSingle()
    : await submissionQuery.eq("public_slug", userOrSlug).maybeSingle();

  if (!submission) {
    redirect(`/liga/${league.slug}`);
  }

  const targetUserId = submission.user_id;
  const isOwnTips = targetUserId === user.id;

  const { data: targetMembership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMembership) {
    redirect(`/liga/${league.slug}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", targetUserId)
    .maybeSingle();

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", TOURNAMENT_ID)
    .order("fifa_match_number", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("name, code, fifa_ranking")
    .eq("tournament_id", TOURNAMENT_ID);

  const matchRows = addFifaRankingsToMatches(
    (matches ?? []) as Match[],
    (teams ?? []) as TeamRankingRow[]
  );

  const groupSnapshot = (submission.group_snapshot ??
    []) as SnapshotPrediction[];

  const playoffSnapshot = (submission.playoff_snapshot ??
    []) as SnapshotPrediction[];

  const savedPredictions: SavedPrediction[] = [
    ...groupSnapshot,
    ...playoffSnapshot,
  ].map((prediction) => ({
    match_id: prediction.match_id,
    predicted_home_score: prediction.predicted_home_score,
    predicted_away_score: prediction.predicted_away_score,
    advancing_team: prediction.advancing_team ?? null,
  }));

  const groupMatches = matchRows.filter((match) => match.stage === "group");

  const playoffMatches = matchRows.filter((match) => match.stage !== "group");

  return (
    <ReadonlyTipsClient
      groupMatches={groupMatches}
      playoffMatches={playoffMatches}
      savedPredictions={savedPredictions}
      submission={submission as LeagueSubmission}
      viewerName={getDisplayName(profile as Profile | null)}
      backHref={`/liga/${league.slug}`}
      hasError={!!matchesError}
      isOwnTips={isOwnTips}
    />
  );
}