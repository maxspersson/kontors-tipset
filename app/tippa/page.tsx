import "./tippa.css";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TippaClient from "./TippaClient";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

export type Match = {
  id: string;
  fifa_match_number: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff_utc: string;
  stadium: string | null;
  city: string | null;
  country: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

export type SavedPrediction = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

export type LeagueSubmission = {
  id: string;
  league_id: string;
  user_id: string;
  submitted_at: string | null;
  updated_at: string | null;
};

type TippaPageProps = {
  searchParams?: Promise<{
    leagueId?: string;
  }>;
};

export default async function TippaPage({ searchParams }: TippaPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  let leagueId = params.leagueId;

  if (!leagueId) {
    const { data: firstMembership } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!firstMembership?.league_id) {
      redirect("/liga");
    }

    redirect(`/tippa?leagueId=${firstMembership.league_id}`);
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
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
    .select("match_id, predicted_home_score, predicted_away_score")
    .eq("user_id", user.id)
    .eq("league_id", leagueId);

  const { data: submission } = await supabase
    .from("league_submissions")
    .select("id, league_id, user_id, submitted_at, updated_at")
    .eq("user_id", user.id)
    .eq("league_id", leagueId)
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
      leagueId={leagueId}
    />
  );
}