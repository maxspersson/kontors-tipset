import Container from "@/app/components/Container";
import { supabase } from "@/lib/supabase";

type Match = {
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

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default async function TippaPage() {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="py-16">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Matcher
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Tippa matcher
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Här visas gruppspel, avsparkstider och kommande matcher.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-900 bg-neutral-900 p-4 text-sm text-red-400">
              Kunde inte hämta matcher
            </div>
          )}

          {!matches || matches.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-neutral-400">Inga matcher än</p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {matches.map((match: Match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {match.stage === "group"
                          ? `Grupp ${match.group_name}`
                          : match.stage}
                      </span>

                      {match.fifa_match_number && (
                        <span className="text-xs text-neutral-500">
                          Match {match.fifa_match_number}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-neutral-400">
                      {formatKickoff(match.kickoff_utc)}
                    </p>
                  </div>

                  <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                    <div>
                      <p className="text-sm text-neutral-500">Hemmalag</p>
                      <p className="mt-1 text-2xl font-semibold text-neutral-100">
                        {match.home_team}
                      </p>
                      {match.home_team_code && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {match.home_team_code}
                        </p>
                      )}
                    </div>

                    <div className="text-center text-xl text-neutral-500">vs</div>

                    <div className="md:text-right">
                      <p className="text-sm text-neutral-500">Bortalag</p>
                      <p className="mt-1 text-2xl font-semibold text-neutral-100">
                        {match.away_team}
                      </p>
                      {match.away_team_code && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {match.away_team_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Arena
                      </p>
                      <p className="mt-2 text-sm text-neutral-100">
                        {match.stadium || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Stad
                      </p>
                      <p className="mt-2 text-sm text-neutral-100">
                        {match.city || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Status
                      </p>
                      <p className="mt-2 text-sm text-neutral-100">
                        {match.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}