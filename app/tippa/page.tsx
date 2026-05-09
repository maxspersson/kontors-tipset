import "./tippa.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import TippaClient from "./TippaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  advancing_team: "home" | "away" | null;
};

export type LeagueSubmission = {
  id: string;
  league_id: string;
  user_id: string;
  submitted_at: string | null;
  updated_at: string | null;
};

type LeagueMemberRow = {
  league_id: string;
};

type League = {
  id: string;
  name: string;
  slug: string | null;
  invite_code: string | null;
  created_at: string | null;
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
  const leagueId = params.leagueId;

  if (!leagueId) {
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    const leagueIds = ((memberships ?? []) as LeagueMemberRow[])
      .map((membership) => membership.league_id)
      .filter(Boolean);

    let leagues: League[] = [];

    if (leagueIds.length > 0) {
      const { data: leagueRows } = await supabase
  .from("leagues")
  .select("id, name, slug, invite_code, created_at")
  .in("id", leagueIds)
  .eq("is_archived", false)
  .order("created_at", { ascending: false });

      leagues = (leagueRows ?? []) as League[];
    }

    return (
      <main className="tips-page">
        <section className="tips-hero">
          <div className="tips-wrap">
            <div className="tips-head">
              <div>
                <p className="eyebrow">VM 2026</p>
                <h1>Välj liga att tippa i.</h1>
                <p className="intro">
                  Dina tips sparas separat för varje liga. Välj vilken liga du
                  vill öppna innan du fyller i gruppspel och slutspel.
                </p>
              </div>

              <div className="hero-panel">
                <p>Mina ligor</p>
                <strong>{leagues.length}</strong>
                <span>
                  {leagues.length === 1
                    ? "En liga kopplad till ditt konto."
                    : "Ligor kopplade till ditt konto."}
                </span>
              </div>
            </div>

            {leagues.length === 0 ? (
              <div className="choose-empty-card">
                <div>
                  <p className="choose-kicker">Ingen liga hittades</p>
                  <h2>Skapa eller gå med i en liga först.</h2>
                  <p>
                    När du är med i en liga kan du börja lägga ditt VM-tips och
                    tävla mot kollegor eller kompisar.
                  </p>
                </div>

                <Link href="/liga" className="choose-primary">
                  Gå till mina ligor
                </Link>
              </div>
            ) : (
              <section className="choose-league-section">
                <div className="choose-section-head">
                  <div>
                    <p>Dina ligor</p>
                    <h2>Vilken liga vill du spela i?</h2>
                  </div>
                  <span>Tipsen sparas per liga</span>
                </div>

                <div className="choose-league-grid">
                  {leagues.map((league) => (
                    <article key={league.id} className="choose-league-card">
                      <div className="choose-card-top">
                        <span>VM 2026</span>
                        <span>{league.invite_code || "Ingen kod"}</span>
                      </div>

                      <div className="choose-card-main">
                        <h3>{league.name}</h3>
                        <p>
                          Öppna ligan för detaljer eller gå direkt till tipset
                          för att fylla i dina matcher.
                        </p>
                      </div>

                      <div className="choose-card-actions">
                        {league.slug ? (
                          <Link
                            href={`/liga/${league.slug}`}
                            className="choose-secondary"
                          >
                            Öppna liga
                          </Link>
                        ) : (
                          <span className="choose-secondary disabled">
                            Saknar ligasida
                          </span>
                        )}

                        <Link
                          href={league.slug ? `/liga/${league.slug}/tippa` : `/tippa?leagueId=${league.id}`}
                          className="choose-primary"
                        >
                          Tippa i ligan
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .choose-league-section {
                margin-top: 42px;
              }

              .choose-section-head {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                align-items: end;
                margin-bottom: 18px;
              }

              .choose-section-head p,
              .choose-kicker {
                margin: 0;
                color: rgba(255,255,255,0.42);
                font-size: 12px;
                font-weight: 950;
                letter-spacing: 0.14em;
                text-transform: uppercase;
              }

              .choose-section-head h2 {
                margin: 8px 0 0;
                color: white;
                font-size: 34px;
                line-height: 1;
                letter-spacing: -0.05em;
              }

              .choose-section-head span {
                color: rgba(255,255,255,0.52);
                font-size: 14px;
              }

              .choose-league-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
              }

              .choose-league-card,
              .choose-empty-card {
                position: relative;
                overflow: hidden;
                border-radius: 28px;
                background:
                  linear-gradient(135deg, rgba(229,185,77,0.10), transparent 34%),
                  rgba(5,12,18,0.82);
                border: 1px solid rgba(255,255,255,0.11);
                box-shadow: 0 28px 90px rgba(0,0,0,0.42);
                backdrop-filter: blur(18px);
              }

              .choose-league-card::before,
              .choose-empty-card::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                  radial-gradient(circle at 85% 0%, rgba(229,185,77,0.20), transparent 30%),
                  radial-gradient(circle at 0% 100%, rgba(255,255,255,0.06), transparent 28%);
                pointer-events: none;
              }

              .choose-league-card {
                min-height: 250px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
              }

              .choose-league-card:hover {
                transform: translateY(-3px);
                border-color: rgba(229,185,77,0.34);
                background:
                  linear-gradient(135deg, rgba(229,185,77,0.16), transparent 38%),
                  rgba(7,16,24,0.9);
              }

              .choose-card-top,
              .choose-card-main,
              .choose-card-actions,
              .choose-empty-card > * {
                position: relative;
                z-index: 1;
              }

              .choose-card-top {
                display: flex;
                justify-content: space-between;
                gap: 14px;
                align-items: center;
              }

              .choose-card-top span {
                color: rgba(255,255,255,0.42);
                font-size: 12px;
                font-weight: 950;
                letter-spacing: 0.13em;
                text-transform: uppercase;
              }

              .choose-card-top span:last-child {
                padding: 8px 12px;
                border-radius: 999px;
                color: #e5b94d;
                background: rgba(229,185,77,0.10);
                border: 1px solid rgba(229,185,77,0.20);
              }

              .choose-card-main {
                margin-top: 28px;
              }

              .choose-card-main h3 {
                margin: 0;
                color: white;
                font-size: 30px;
                line-height: 1.05;
                letter-spacing: -0.05em;
              }

              .choose-card-main p,
              .choose-empty-card p {
                margin: 12px 0 0;
                max-width: 460px;
                color: rgba(255,255,255,0.56);
                font-size: 15px;
                line-height: 1.55;
              }

              .choose-card-actions {
                display: flex;
                gap: 10px;
                align-items: center;
                justify-content: flex-end;
                margin-top: 30px;
              }

              .choose-primary,
              .choose-secondary {
                height: 46px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0 18px;
                border-radius: 999px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 950;
                white-space: nowrap;
              }

              .choose-primary {
                background: linear-gradient(180deg, #f3cf69, #d9a935);
                color: #090909;
                box-shadow: 0 12px 34px rgba(229,185,77,0.18);
              }

              .choose-secondary {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
                color: rgba(255,255,255,0.78);
              }

              .choose-secondary.disabled {
                opacity: 0.45;
              }

              .choose-empty-card {
                margin-top: 38px;
                padding: 28px;
                display: flex;
                justify-content: space-between;
                gap: 24px;
                align-items: center;
              }

              .choose-empty-card h2 {
                margin: 8px 0 0;
                color: white;
                font-size: 30px;
                letter-spacing: -0.04em;
              }

              @media (max-width: 900px) {
                .choose-section-head,
                .choose-empty-card {
                  align-items: stretch;
                  flex-direction: column;
                }

                .choose-league-grid {
                  grid-template-columns: 1fr;
                }

                .choose-card-actions {
                  flex-direction: column;
                  align-items: stretch;
                }

                .choose-primary,
                .choose-secondary {
                  width: 100%;
                }
              }
            `,
          }}
        />
      </main>
    );
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

const { data: activeLeague } = await supabase
  .from("leagues")
  .select("id")
  .eq("id", leagueId)
  .eq("is_archived", false)
  .maybeSingle();

if (!activeLeague) {
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