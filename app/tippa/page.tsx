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
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatStage(match: Match) {
  if (match.stage === "group") return `Grupp ${match.group_name ?? ""}`;
  return match.stage;
}

export default async function TippaPage() {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  return (
    <main className="tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              <p className="eyebrow">Matcher</p>
              <h1>Tippa matcherna.</h1>
              <p className="intro">
                Här ser du alla matcher i VM. Snart lägger vi på själva
                tipprutan, men redan nu får sidan känslan av en riktig
                matchcentral.
              </p>
            </div>

            <div className="hero-panel">
              <p>Nästa deadline</p>
              <strong>60 min före avspark</strong>
              <span>Tips kan ändras fram till låsning.</span>
            </div>
          </div>

          {error && (
            <div className="error-box">Kunde inte hämta matcher.</div>
          )}

          {!matches || matches.length === 0 ? (
            <div className="empty-box">
              <p>Inga matcher än.</p>
            </div>
          ) : (
            <>
              <div className="match-toolbar">
                <div>
                  <span>{matches.length}</span>
                  <p>matcher inlästa</p>
                </div>
                <div>
                  <span>VM 2026</span>
                  <p>matchschema</p>
                </div>
                <div>
                  <span>Live</span>
                  <p>tabell kommer sen</p>
                </div>
              </div>

              <div className="match-list">
                {matches.map((match: Match) => (
                  <article key={match.id} className="match-card">
                    <div className="match-top">
                      <div className="match-meta">
                        <span>{formatStage(match)}</span>
                        {match.fifa_match_number && (
                          <small>Match {match.fifa_match_number}</small>
                        )}
                      </div>

                      <time>{formatKickoff(match.kickoff_utc)}</time>
                    </div>

                    <div className="teams">
                      <div className="team home">
                        <p>Hemmalag</p>
                        <h2>{match.home_team}</h2>
                        {match.home_team_code && (
                          <span>{match.home_team_code}</span>
                        )}
                      </div>

                      <div className="vs">
                        <span>VS</span>
                      </div>

                      <div className="team away">
                        <p>Bortalag</p>
                        <h2>{match.away_team}</h2>
                        {match.away_team_code && (
                          <span>{match.away_team_code}</span>
                        )}
                      </div>
                    </div>

                    <div className="match-bottom">
                      <div>
                        <p>Arena</p>
                        <strong>{match.stadium || "Ej klart"}</strong>
                      </div>
                      <div>
                        <p>Stad</p>
                        <strong>{match.city || "Ej klart"}</strong>
                      </div>
                      <div>
                        <p>Status</p>
                        <strong>{match.status}</strong>
                      </div>
                    </div>
                  </article>
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

            .hero-panel {
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
              padding: 22px;
              border-radius: 20px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
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

            .match-list {
              display: grid;
              gap: 18px;
              margin-top: 18px;
            }

            .match-card {
              padding: 24px;
              border-radius: 26px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .match-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 18px;
            }

            .match-meta {
              display: flex;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
            }

            .match-meta span {
              display: inline-flex;
              align-items: center;
              min-height: 30px;
              padding: 0 12px;
              border-radius: 999px;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.22);
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .match-meta small,
            .match-top time {
              color: rgba(255,255,255,0.48);
              font-size: 13px;
              font-weight: 700;
            }

            .teams {
              display: grid;
              grid-template-columns: 1fr 74px 1fr;
              gap: 18px;
              align-items: stretch;
              margin-top: 22px;
            }

            .team {
              min-width: 0;
              padding: 22px;
              border-radius: 20px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .team p {
              margin: 0;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .team h2 {
              margin: 12px 0 0;
              font-size: 28px;
              line-height: 1.05;
              letter-spacing: -0.04em;
            }

            .team span {
              display: inline-flex;
              margin-top: 12px;
              color: rgba(255,255,255,0.44);
              font-size: 13px;
              font-weight: 900;
            }

            .away {
              text-align: right;
            }

            .vs {
              display: grid;
              place-items: center;
            }

            .vs span {
              display: grid;
              place-items: center;
              width: 54px;
              height: 54px;
              border-radius: 999px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 13px;
              font-weight: 950;
              box-shadow: 0 18px 50px rgba(218,169,53,0.22);
            }

            .match-bottom {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-top: 14px;
            }

            .match-bottom div {
              padding: 16px;
              border-radius: 16px;
              background: rgba(0,0,0,0.24);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .match-bottom p {
              margin: 0;
              color: rgba(255,255,255,0.36);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .match-bottom strong {
              display: block;
              margin-top: 8px;
              color: rgba(255,255,255,0.82);
              font-size: 14px;
              line-height: 1.35;
            }

            @media (max-width: 900px) {
              .tips-wrap {
                padding: 56px 18px 46px;
              }

              .tips-head {
                grid-template-columns: 1fr;
                gap: 24px;
              }

              .tips-head h1 {
                font-size: 46px;
                max-width: 340px;
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

              .match-card {
                padding: 18px;
                border-radius: 22px;
              }

              .match-top {
                align-items: flex-start;
                flex-direction: column;
                gap: 12px;
              }

              .teams {
                grid-template-columns: 1fr;
                gap: 10px;
              }

              .away {
                text-align: left;
              }

              .vs {
                height: 38px;
              }

              .vs span {
                width: 44px;
                height: 44px;
              }

              .team {
                padding: 18px;
              }

              .team h2 {
                font-size: 24px;
              }

              .match-bottom {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
    </main>
  );
}