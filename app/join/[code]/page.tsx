import Container from "@/app/components/Container";
import { createClient } from "@/lib/supabase/server";

type JoinPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: league, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (error || !league) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <Container>
          <h1 className="text-4xl font-bold">Ogiltig kod</h1>
          <p className="mt-4 text-neutral-400">
            Vi kunde inte hitta någon liga med den här koden.
          </p>
        </Container>
      </main>
    );
  }

  let isAlreadyMember = false;

  if (user) {
    const { data: existingMembership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .maybeSingle();

    isAlreadyMember = !!existingMembership;
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <h1 className="text-4xl font-bold">Join liga</h1>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">Liganamn</p>
          <p className="text-lg font-medium">{league.name}</p>

          <p className="mt-4 text-sm text-neutral-400">Slug</p>
          <p className="text-lg font-medium">{league.slug}</p>

          <p className="mt-4 text-sm text-neutral-400">Invite code</p>
          <p className="text-lg font-medium">{league.invite_code}</p>
        </div>

        {!user ? (
          <div className="mt-6 rounded-2xl border border-yellow-900 bg-neutral-900 p-6">
            <p className="text-sm text-yellow-400">
              Du måste logga in för att gå med i ligan
            </p>
          </div>
        ) : isAlreadyMember ? (
          <div className="mt-6 rounded-2xl border border-green-900 bg-neutral-900 p-6">
            <p className="text-sm text-green-400">Du är redan med i ligan</p>
          </div>
        ) : (
          <form action="/api/join" method="POST" className="mt-6">
            <input type="hidden" name="code" value={league.invite_code} />

            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:opacity-90"
            >
              Gå med i ligan
            </button>
          </form>
        )}
      </Container>
    </main>
  );
}