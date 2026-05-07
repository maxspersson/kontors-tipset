import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TabellClient from "./TabellClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeagueMemberRow = {
  league_id: string;
  leagues:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export type LeagueOption = {
  id: string;
  name: string;
};

export default async function TabellPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name)")
    .eq("user_id", user.id);

  const leagues: LeagueOption[] = ((memberships ?? []) as LeagueMemberRow[])
    .map((membership) => {
      const league = Array.isArray(membership.leagues)
        ? membership.leagues[0]
        : membership.leagues;

      return {
        id: league?.id || membership.league_id,
        name: league?.name || "Min liga",
      };
    })
    .filter((league) => league.id);

  return <TabellClient leagues={leagues} />;
}