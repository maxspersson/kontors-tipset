import Container from "@/app/components/Container";
import { createClient } from "@/lib/supabase/server";
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

type StandingRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  points: number;
  scored_matches: number;
  submitted_predictions: number;
};

type MatchResultRow = {
  id: string;
  home_score: number | null;
  away_score: number | null;
};

type PredictionRow = {
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

export default async function LeagueDetailPage({ params }: LeaguePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: submissions } = await supabase
    .from("league_submissions")
    .select("user_id, submitted_at")
    .eq("league_id", league.id);

  const submittedUserIds = (submissions ?? []).map(
    (submission) => submission.user_id
  );

  const submittedUserSet = new Set(submittedUserIds);

  const currentUserHasSubmitted = user
    ? submittedUserSet.has(user.id)
    : false;

  let profiles: MemberProfile[] = [];

  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    profiles = profileRows ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, match_id, predicted_home_score, predicted_away_score")
    .eq("league_id", league.id)
    .in("user_id", submittedUserIds.length > 0 ? submittedUserIds : [""]);

  const { data: matchesWithResults } = await supabase
    .from("matches")
    .select("id, home_score, away_score");

  const matchMap = new Map(
    (matchesWithResults ?? []).map((match: MatchResultRow) => [match.id, match])
  );

  const pointsMap = new Map<string, number>();
  const scoredMatchesMap = new Map<string, number>();
  const submittedPredictionsMap = new Map<string, number>();

  (predictions ?? []).forEach((prediction: PredictionRow) => {
    submittedPredictionsMap.set(
      prediction.user_id,
      (submittedPredictionsMap.get(prediction.user_id) ?? 0) + 1
    );

    const match = matchMap.get(prediction.match_id);

    if (!match) return;
    if (match.home_score === null || match.away_score === null) return;

    let points = 0;

    if (prediction.predicted_home_score === match.home_score) {
      points += 2;
    }

    if (prediction.predicted_away_score === match.away_score) {
      points += 2;
    }

    const predictedDiff =
      prediction.predicted_home_score - prediction.predicted_away_score;
    const actualDiff = match.home_score - match.away_score;

    const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
    const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

    if (predictedSign === actualSign) {
      points += 3;
    }

    pointsMap.set(
      prediction.user_id,
      (pointsMap.get(prediction.user_id) ?? 0) + points
    );

    scoredMatchesMap.set(
      prediction.user_id,
      (scoredMatchesMap.get(prediction.user_id) ?? 0) + 1
    );
  });

  const standings: StandingRow[] = submittedUserIds.map((userId) => {
    const profile = profileMap.get(userId);

    return {
      user_id: userId,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      points: pointsMap.get(userId) ?? 0,
      scored_matches: scoredMatchesMap.get(userId) ?? 0,
      submitted_predictions: submittedPredictionsMap.get(userId) ?? 0,
    };
  });

  standings.sort((a, b) => b.points - a.points);

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
          Här ser du tabellen, medlemmarna och länkar vidare till tipsen.
        </p>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm font-semibold text-neutral-100">Din status</p>

          {currentUserHasSubmitted ? (
            <p className="mt-2 text-sm text-green-400">
              Du är med i spelet. Ditt turneringstips är inskickat.
            </p>
          ) : (
            <div>
              <p className="mt-2 text-sm text-yellow-400">
                Du är inte med i spelet ännu. Skicka in ditt turneringstips för
                att räknas i leaderboarden.
              </p>

              <div className="mt-4">
                <Link
                  href={`/liga/${league.slug}/tippa`}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
                >
                  Gå till tipsen
                </Link>
              </div>
            </div>
          )}
        </div>

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-400">Leaderboard</p>
              <h2 className="mt-1 text-xl font-semibold text-neutral-100">
                Ställning i ligan
              </h2>
            </div>
          </div>

          {standings.length === 0 ? (
            <p className="mt-4 text-neutral-400">
              Inga inskickade turneringstips än
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
              <div className="grid grid-cols-[80px_1fr_110px] bg-neutral-950 px-4 py-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
                <div>Plats</div>
                <div>Namn</div>
                <div className="text-right">Poäng</div>
              </div>

              <div className="divide-y divide-neutral-800">
                {standings.map((row, index) => {
                  const isCurrentUser = user && row.user_id === user.id;

                  return (
                    <div
                      key={row.user_id}
                      className={`grid grid-cols-[80px_1fr_110px] items-center px-4 py-4 ${
                        isCurrentUser ? "bg-neutral-800" : ""
                      }`}
                    >
                      <div className="text-sm font-semibold text-neutral-300">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-neutral-100">
                          {row.display_name || row.email || "Okänd användare"}
                          {isCurrentUser ? " (du)" : ""}
                        </p>

                        {row.email && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {row.email}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-neutral-300">
                            {row.scored_matches} rättade
                          </span>
                          <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-neutral-300">
                            {row.submitted_predictions} tips
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-lg font-bold text-neutral-100">
                        {row.points}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

                    <p className="mt-3 text-sm text-neutral-400">Status</p>
                    <p className="mt-1 text-sm text-neutral-100">
                      {submittedUserSet.has(member.user_id)
                        ? "Turneringstips inskickat"
                        : "Inte inskickat än"}
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