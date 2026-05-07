import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TabellClient from "./TabellClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeagueMemberRow = {
  league_id: string;
};

export type LeagueOption = {
  id: string;
  name: string;
};

type TabellPageProps = {
  searchParams?: Promise<{
    leagueId?: string;
  }>;
};

export default async function TabellPage({ searchParams }: TabellPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const leagueIdFromUrl = params.leagueId;

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  const leagueIds = ((memberships ?? []) as LeagueMemberRow[])
    .map((membership) => membership.league_id)
    .filter(Boolean);

  if (leagueIds.length === 0) {
    redirect("/liga");
  }

  const { data: leagueRows } = await supabase
  .from("leagues")
  .select("id, name")
  .in("id", leagueIds)
  .eq("is_archived", false);

  const leagues = (leagueRows ?? []) as LeagueOption[];

  const initialLeagueId =
    leagueIdFromUrl && leagueIds.includes(leagueIdFromUrl)
      ? leagueIdFromUrl
      : leagues[0]?.id || "";

  return <TabellClient leagues={leagues} initialLeagueId={initialLeagueId} />;
}