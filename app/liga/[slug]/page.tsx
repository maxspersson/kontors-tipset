import Container from "@/app/components/Container";
import { supabase } from "@/lib/supabase";
import CopyInvite from "@/app/components/CopyInvite";
import Link from "next/link";

type LeaguePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type MemberProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
};

type LeagueMember = {
  id: string;
  user_id: string;
  created_at: string;
};

export default async function LeagueDetailPage({ params }: LeaguePageProps) {
  const { slug } = await params;

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (leagueError || !league) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <Container>
          <h1 className="text-4xl font-bold tracking-tight">Liga hittades inte</h1>
          <p className="mt-4 text-neutral-400">
            Vi kunde inte hitta någon liga med den här adressen.
          </p>
        </Container>
      </main>
    );
  }

  const { data: members, error: membersError } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", league.id)
    .order("created_at", { ascending: true });

  const userIds = (members ?? []).map((member) => member.user_id);

  let profiles: MemberProfile[] = [];

  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    profiles = profileRows ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Liga
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          {league.name}
        </h1>

        <p className="mt-4 text-neutral-400">
          Här kommer tabell, medlemmar och tips för den här ligan att visas.
        </p>
        <div className="mt-6">
  <Link
    href={`/liga/${league.slug}/tippa`}
    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
  >
    Tippa matcher
  </Link>
</div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Antal medlemmar</p>
          <p className="mt-2 text-2xl font-bold text-neutral-100">
            {members?.length ?? 0}
          </p>

          {membersError && (
            <p className="mt-3 text-sm text-red-400">
              Kunde inte hämta medlemmar
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Medlemmar</p>

          {!members || members.length === 0 ? (
            <p className="mt-3 text-neutral-400">Inga medlemmar än</p>
          ) : (
            <div className="mt-4 space-y-3">
              {members.map((member: LeagueMember) => {
                const profile = profileMap.get(member.user_id);

                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="text-sm text-neutral-400">Namn</p>
                    <p className="mt-1 text-sm text-neutral-100">
                      {profile?.display_name || "Okänd användare"}
                    </p>

                    <p className="mt-3 text-sm text-neutral-400">E-post</p>
                    <p className="mt-1 text-sm text-neutral-100">
                      {profile?.email || "Ingen e-post"}
                    </p>

                    <p className="mt-3 text-sm text-neutral-400">User ID</p>
                    <p className="mt-1 break-all text-xs text-neutral-500">
                      {member.user_id}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
  <p className="text-sm text-neutral-400">Slug</p>
  <p className="mt-1 text-lg font-medium text-neutral-100">
    {league.slug}
  </p>

  <div className="mt-6">
    <p className="text-sm text-neutral-400">Inbjudningskod</p>
    <p className="mt-1 text-lg font-medium text-neutral-100">
      {league.invite_code}
    </p>
  </div>
</div>

<CopyInvite inviteCode={league.invite_code} slug={league.slug} />
      </Container>
    </main>
  );
}