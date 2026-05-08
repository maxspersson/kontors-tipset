import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import TabellPage from "@/app/tabell/page";

type LeagueTabellPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LeagueTabellPage({
  params,
}: LeagueTabellPageProps) {
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

  return (
    <TabellPage
      searchParams={Promise.resolve({
        leagueId: league.id,
      })}
    />
  );
}