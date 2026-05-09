import "@/app/tippa/tippa.css";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TippaClient from "@/app/tippa/TippaClient";
import type {
  LeagueSubmission,
  Match,
  SavedPrediction,
} from "@/app/tippa/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

type LeagueTippaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LeagueTippaPage({
  params,
}: LeagueTippaPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, slug")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (!league) {
    redirect("/liga");
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/liga");
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", TOURNAMENT_ID)
    .order("fifa_match_number", { ascending: true });

  const { data: savedPredictions } = await supabase
  .from("predictions")
  .select("match_id, predicted_home_score, predicted_away_score, advancing_team")
  .eq("user_id", user.id)
  .eq("league_id", league.id);

  const { data: submission } = await supabase
    .from("league_submissions")
    .select("id, league_id, user_id, submitted_at, updated_at")
    .eq("user_id", user.id)
    .eq("league_id", league.id)
    .maybeSingle();

  const groupMatches = (matches ?? []).filter(
    (match) => match.stage === "group"
  );

  const playoffMatches = (matches ?? []).filter(
    (match) => match.stage !== "group"
  );

  return (
    <TippaClient
      groupMatches={groupMatches as Match[]}
      playoffMatches={playoffMatches as Match[]}
      savedPredictions={(savedPredictions ?? []) as SavedPrediction[]}
      submission={submission as LeagueSubmission | null}
      isLocked={Boolean(submission?.submitted_at)}
      hasError={!!matchesError}
      leagueId={league.id}
    />
  );
}