import { supabase } from "@/app/lib/supabase";

const TOURNAMENT_ID = "3aadd8c0-9236-46a9-bd17-99653f3c2794";

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
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function groupMatchesByGroup(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, match) => {
    const group = match.group_name ?? "Övrigt";

    if (!acc[group]) {
      acc[group] = [];
    }

    acc[group].push(match);
    return acc;
  }, {});
}

export default async function TippaPage() {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("stage", "group")
    .order("group_name", { ascending: true })
    .order("fifa_match_number", { ascending: true });

  const matches = (data ?? []) as Match[];
  const groupedMatches = groupMatchesByGroup(matches);
  const groupNames = Object.keys(groupedMatches).sort();

  return (
    <main className="tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              <p className="eyebrow">VM 2026</p>
              <h1>Tippa gruppspelet.</h1>
              <p className="intro">
                Börja med gruppspelet. Dina resultat bygger tabellerna och blir
                grunden för slutspelet längre fram.
              </p>
            </div>

            <div className="hero-panel">
              <p>Nästa deadline</p>
              <strong>60 min före avspark</strong>
              <span>Tips kan ändras fram till varje match låses.</span>
            </div>
          </div>

          {error && <div className="error-box">Kunde inte hämta matcher.</div>}

          {!matches || matches.length === 0 ? (
            <div className="empty-box">
              <p>Inga matcher än.</p>
            </div>
          ) : (
            <>
              <div className="match-toolbar">
                <div>
                  <span>{matches.length}</span>
                  <p>gruppspelsmatcher</p>
                </div>
                <div>
                  <span>12</span>
                  <p>grupper</p>
                </div>
                <div>
                  <span>72</span>
                  <p>tips att fylla i</p>
                </div>
              </div>

              <div className="group-nav">
                {groupNames.map((group) => (
                  <a key={group} href={`#grupp-${group}`}>
                    {group}
                  </a>
                ))}
              </div>

              <div className="groups-list">
                {groupNames.map((group) => (
                  <section
                    key={group}
                    id={`grupp-${group}`}
                    className="group-section"
                  >
                    <div className="group-title">
                      <div>
                        <p>Grupp</p>
                        <h2>{group}</h2>
                      </div>
                      <span>{groupedMatches[group].length} matcher</span>
                    </div>

                    <div className="match-list compact">
                      {groupedMatches[group].map((match) => (
                        <article key={match.id} className="match-row">
                          <div className="match-row-top">
                            <span>
                              Match {match.fifa_match_number ?? ""}
                            </span>
                            <time>{formatKickoff(match.kickoff_utc)}</time>
                          </div>

                          <div className="match-row-main">
                            <div className="team-name">
                              <strong>{match.home_team}</strong>
                              {match.home_team_code && (
                                <small>{match.home_team_code}</small>
                              )}
                            </div>

                            <div className="score-inputs">
                              <input inputMode="numeric" placeholder="-" />
                              <span>:</span>
                              <input inputMode="numeric" placeholder="-" />
                            </div>

                            <div className="team-name away-team">
                              <strong>{match.away_team}</strong>
                              {match.away_team_code && (
                                <small>{match.away_team_code}</small>
                              )}
                            </div>
                          </div>

                          <div className="match-row-bottom">
                            <span>{match.city || "Arena kommer senare"}</span>
                            <span>{match.status}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .tips-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .tips-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.74) 0%, rgba(2,3,4,0.96) 340px, #020304 100%),
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.72) 58%, rgba(2,3,4,0.94) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .tips-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 74% 14%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 18% 12%, rgba(255,255,255,0.07), transparent 22%);
            }

            .tips-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px 70px;
            }

            .tips-head {
              display: grid;
              grid-template-columns: 1fr 340px;
              gap: 40px;
              align-items: end;
            }

            .eyebrow {
              margin: 0 0 16px;
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            .tips-head h1 {
              margin: 0;
              max-width: 720px;
              font-size: clamp(46px, 6vw, 82px);
              line-height: 1.02;
              letter-spacing: -0.06em;
              font-weight: 950;
            }

            .intro {
              margin: 22px 0 0;
              max-width: 600px;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.65;
            }

            .hero-panel,
            .error-box,
            .empty-box {
              padding: 22px;
              border-radius: 22px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .hero-panel p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .hero-panel strong {
              display: block;
              margin-top: 12px;
              color: #e5b94d;
              font-size: 25px;
              letter-spacing: -0.03em;
            }

            .hero-panel span {
              display: block;
              margin-top: 10px;
              color: rgba(255,255,255,0.52);
              font-size: 14px;
              line-height: 1.5;
            }

            .error-box,
            .empty-box {
              margin-top: 34px;
              color: rgba(255,255,255,0.72);
            }

            .error-box {
              border-color: rgba(248,113,113,0.30);
              color: #fca5a5;
            }

            .match-toolbar {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              margin-top: 42px;
            }

            .match-toolbar div {
              padding: 18px;
              border-radius: 18px;
              background: rgba(9,17,25,0.68);
              border: 1px solid rgba(255,255,255,0.09);
              backdrop-filter: blur(18px);
            }

            .match-toolbar span {
              display: block;
              color: #e5b94d;
              font-size: 24px;
              font-weight: 950;
              letter-spacing: -0.03em;
            }

            .match-toolbar p {
              margin: 4px 0 0;
              color: rgba(255,255,255,0.45);
              font-size: 13px;
            }

            .group-nav {
              position: sticky;
              top: 73px;
              z-index: 10;
              display: flex;
              gap: 8px;
              overflow-x: auto;
              margin: 18px -24px 0;
              padding: 14px 24px;
              background: rgba(2,3,4,0.76);
              backdrop-filter: blur(18px);
              border-top: 1px solid rgba(255,255,255,0.06);
              border-bottom: 1px solid rgba(255,255,255,0.06);
            }

            .group-nav a {
              flex: 0 0 auto;
              display: grid;
              place-items: center;
              width: 42px;
              height: 42px;
              border-radius: 999px;
              color: rgba(255,255,255,0.7);
              text-decoration: none;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.08);
              font-size: 13px;
              font-weight: 950;
            }

            .groups-list {
              display: grid;
              gap: 28px;
              margin-top: 26px;
            }

            .group-section {
              scroll-margin-top: 150px;
            }

            .group-title {
              display: flex;
              justify-content: space-between;
              align-items: end;
              gap: 16px;
              margin-bottom: 12px;
            }

            .group-title p {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .group-title h2 {
              margin: 4px 0 0;
              font-size: 34px;
              line-height: 1;
              letter-spacing: -0.05em;
            }

            .group-title span {
              color: rgba(255,255,255,0.45);
              font-size: 13px;
              font-weight: 800;
            }

            .match-list.compact {
              display: grid;
              gap: 10px;
            }

            .match-row {
              padding: 16px;
              border-radius: 20px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.10);
              box-shadow: 0 18px 60px rgba(0,0,0,0.24);
              backdrop-filter: blur(18px);
            }

            .match-row-top,
            .match-row-bottom {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 800;
            }

            .match-row-main {
              display: grid;
              grid-template-columns: 1fr 116px 1fr;
              gap: 16px;
              align-items: center;
              margin-top: 12px;
            }

            .team-name {
              min-width: 0;
            }

            .team-name strong {
              display: block;
              font-size: 18px;
              line-height: 1.2;
              letter-spacing: -0.03em;
            }

            .team-name small {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 900;
            }

            .away-team {
              text-align: right;
            }

            .score-inputs {
              display: grid;
              grid-template-columns: 42px 1fr 42px;
              align-items: center;
              gap: 6px;
            }

            .score-inputs input {
              width: 42px;
              height: 42px;
              border-radius: 13px;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(255,255,255,0.08);
              color: white;
              text-align: center;
              font-size: 18px;
              font-weight: 950;
              outline: none;
            }

            .score-inputs input:focus {
              border-color: rgba(229,185,77,0.7);
              box-shadow: 0 0 0 3px rgba(229,185,77,0.12);
            }

            .score-inputs span {
              text-align: center;
              color: rgba(255,255,255,0.42);
              font-weight: 950;
            }

            .match-row-bottom {
              margin-top: 12px;
            }

            @media (max-width: 900px) {
              .tips-wrap {
                padding: 48px 16px 46px;
              }

              .tips-head {
                grid-template-columns: 1fr;
                gap: 24px;
              }

              .tips-head h1 {
                font-size: 46px;
                max-width: 360px;
              }

              .intro {
                font-size: 16px;
                max-width: 350px;
              }

              .hero-panel {
                padding: 18px;
              }

              .match-toolbar {
                grid-template-columns: 1fr;
                margin-top: 30px;
              }

              .group-nav {
                margin-left: -16px;
                margin-right: -16px;
                padding-left: 16px;
                padding-right: 16px;
              }

              .match-row-main {
                grid-template-columns: 1fr;
                gap: 12px;
              }

              .away-team {
                text-align: left;
              }

              .score-inputs {
                width: 116px;
              }
            }
          `,
        }}
      />
    </main>
  );
}