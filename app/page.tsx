import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type League = {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  created_at: string;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let leagues: League[] = [];

  if (user) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.email?.split("@")[0] ?? null,
      },
      { onConflict: "id" }
    );

    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    const leagueIds = memberships?.map((m) => m.league_id) ?? [];

    if (leagueIds.length > 0) {
      const { data: leagueRows } = await supabase
        .from("leagues")
        .select("*")
        .in("id", leagueIds);

      leagues = (leagueRows ?? []) as League[];
    }
  }

  return (
    <main>
      <section className="hero-section">
        <div className="home-wrap">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="eyebrow">VM 2026</div>

              <h1 className="hero-title">
                Tippa.
                <br />
                Utmana.
                <br />
                Vinn äran.
              </h1>

              <p className="hero-copy">
                Skapa din egen liga med polarna, tippa matcher och klättra i
                tabellen. Vem blir bäst i gänget?
              </p>

              <div className="hero-actions">
                <Link href={user ? "/liga" : "/login"} className="primary-btn">
                  {user ? "Skapa liga" : "Skapa konto"} →
                </Link>

                <Link href="/regler" className="secondary-btn">
                  Se regler
                </Link>
              </div>

              <div className="mobile-match-card">
                <MatchCard />
              </div>

              <div className="feature-grid">
                {[
                  ["👥", "Skapa din liga", "Starta en liga och bjud in vänner."],
                  ["🏆", "Tippa matcher", "Sätt resultaten före deadline."],
                  ["📊", "Klättra i tabellen", "Följ poängen live under VM."],
                  ["🎁", "Vinn ära", "Skryt resten av sommaren."],
                ].map(([icon, title, text]) => (
                  <div key={title} className="feature-card">
                    <div className="feature-icon">{icon}</div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="desktop-card">
              <MatchCard />
            </div>
          </div>

          {user && leagues.length > 0 && (
            <div className="leagues-box">
              <div className="leagues-head">
                <div>
                  <p>Dina ligor</p>
                  <h2>Fortsätt spela</h2>
                </div>

                <Link href="/liga" className="small-gold-btn">
                  Ny liga
                </Link>
              </div>

              <div className="leagues-grid">
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/liga/${league.slug}`}
                    className="league-card"
                  >
                    <span>Liga</span>
                    <strong>{league.name}</strong>
                    <p>Öppna liga →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
            }

            main {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .hero-section {
              position: relative;
              min-height: 92vh;
              overflow: hidden;
              background-image:
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.80) 42%, rgba(2,3,4,0.48) 70%, rgba(2,3,4,0.96) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center;
            }

            .hero-section::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 64% 24%, rgba(229,185,77,0.24), transparent 28%),
                radial-gradient(circle at 16% 20%, rgba(255,255,255,0.08), transparent 22%),
                linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.45));
            }

            .home-wrap {
              position: relative;
              z-index: 1;
              max-width: 1380px;
              margin: 0 auto;
              padding: 90px 28px 42px;
            }

            .hero-grid {
              display: grid;
              grid-template-columns: 1.05fr 0.95fr;
              gap: 48px;
              align-items: center;
              min-height: 72vh;
            }

            .eyebrow {
              color: #e5b94d;
              font-size: 14px;
              font-weight: 900;
              letter-spacing: 0.16em;
              margin-bottom: 20px;
            }

            .hero-title {
  font-size: clamp(56px, 7vw, 112px);
  line-height: 1.02;
              letter-spacing: -0.06em;
              font-weight: 950;
              text-transform: uppercase;
              margin: 0;
              max-width: 760px;
            }

            .hero-copy {
              margin: 28px 0 0;
              max-width: 560px;
              color: rgba(255,255,255,0.72);
              font-size: 18px;
              line-height: 1.7;
            }

            .hero-actions {
              display: flex;
              gap: 14px;
              margin-top: 34px;
              flex-wrap: wrap;
            }

            .primary-btn {
              height: 58px;
              padding: 0 32px;
              border-radius: 10px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-weight: 900;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              box-shadow: 0 18px 50px rgba(218,169,53,0.28);
            }

            .secondary-btn {
              height: 58px;
              padding: 0 32px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.18);
              background: rgba(255,255,255,0.05);
              color: white;
              font-weight: 800;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              backdrop-filter: blur(14px);
            }

            .desktop-card {
              display: flex;
              justify-content: flex-end;
            }

            .match-card {
              width: 100%;
              max-width: 420px;
              padding: 22px;
              border-radius: 22px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.12);
              box-shadow: 0 30px 100px rgba(0,0,0,0.55);
              backdrop-filter: blur(18px);
            }

            .match-label {
              margin: 0;
              color: #e5b94d;
              font-weight: 900;
              font-size: 13px;
              letter-spacing: 0.14em;
            }

            .match-title {
              margin: 10px 0 24px;
              font-size: 28px;
              line-height: 1.1;
            }

            .team-grid {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 14px;
              align-items: center;
            }

            .team-card {
              min-width: 0;
              padding: 18px;
              border-radius: 18px;
              background: rgba(255,255,255,0.06);
            }

            .team-flag {
              font-size: 38px;
            }

            .team-name {
              margin-top: 10px;
              font-weight: 900;
            }

            .deadline-box {
              margin-top: 20px;
              padding: 16px;
              border-radius: 14px;
              background: rgba(229,185,77,0.12);
              color: #f3cf69;
              font-weight: 800;
              font-size: 14px;
            }

            .leaderboard {
              margin-top: 18px;
            }

            .leader-row {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 13px 0;
              border-top: 1px solid rgba(255,255,255,0.08);
            }

            .rank {
              width: 32px;
              height: 32px;
              border-radius: 999px;
              background: #e5b94d;
              color: #090909;
              display: grid;
              place-items: center;
              font-weight: 950;
              flex: 0 0 auto;
            }

            .feature-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
              margin-top: 72px;
              max-width: 1180px;
            }

            .feature-card {
              padding: 22px;
              border-radius: 16px;
              background: rgba(9,17,25,0.72);
              border: 1px solid rgba(255,255,255,0.09);
              box-shadow: 0 24px 80px rgba(0,0,0,0.35);
              backdrop-filter: blur(18px);
            }

            .feature-icon {
              font-size: 28px;
            }

            .feature-card h3 {
              margin: 14px 0 6px;
              font-size: 17px;
              line-height: 1.25;
            }

            .feature-card p {
              margin: 0;
              color: rgba(255,255,255,0.55);
              font-size: 14px;
              line-height: 1.5;
            }

            .mobile-match-card {
              display: none;
            }

            .leagues-box {
              margin-top: 36px;
              padding: 24px;
              border-radius: 22px;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.1);
              backdrop-filter: blur(18px);
            }

            .leagues-head {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 16px;
            }

            .leagues-head p {
              margin: 0 0 4px;
              color: rgba(255,255,255,0.45);
              font-size: 14px;
            }

            .leagues-head h2 {
              margin: 0;
              font-size: 28px;
              letter-spacing: -0.04em;
            }

            .small-gold-btn {
              height: 44px;
              padding: 0 20px;
              border-radius: 10px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-weight: 900;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              white-space: nowrap;
            }

            .leagues-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 16px;
              margin-top: 18px;
            }

            .league-card {
              padding: 20px;
              border-radius: 16px;
              background: rgba(0,0,0,0.3);
              border: 1px solid rgba(255,255,255,0.1);
              color: white;
              text-decoration: none;
            }

            .league-card span {
              display: block;
              margin-bottom: 10px;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .league-card strong {
              display: block;
              font-size: 20px;
            }

            .league-card p {
              margin: 18px 0 0;
              color: #e5b94d;
              font-weight: 800;
            }

            @media (max-width: 900px) {
              main,
              .hero-section {
                overflow-x: hidden;
              }

              .hero-section {
                min-height: auto;
                background-image:
                  linear-gradient(180deg, rgba(2,3,4,0.55) 0%, rgba(2,3,4,0.80) 45%, rgba(2,3,4,0.98) 100%),
                  linear-gradient(90deg, rgba(2,3,4,0.92) 0%, rgba(2,3,4,0.55) 100%),
                  url('/stadium.jpg');
                background-position: center top;
              }

              .home-wrap {
                width: 100%;
                max-width: 100%;
                padding: 78px 18px 30px;
              }

              .hero-grid {
                display: flex;
                flex-direction: column;
                gap: 0;
                min-height: auto;
                width: 100%;
                align-items: stretch;
              }

              .hero-content {
                width: 100%;
                min-width: 0;
              }

              .desktop-card {
                display: none;
              }

              .eyebrow {
                font-size: 13px;
                margin-bottom: 18px;
              }

             .hero-title {
  font-size: 44px;
  line-height: 1.05;
  letter-spacing: -0.055em;
  max-width: 330px;
}

              .hero-copy {
                font-size: 16px;
                line-height: 1.55;
                max-width: 340px;
                margin-top: 22px;
                color: rgba(255,255,255,0.74);
              }

              .hero-actions {
                display: flex;
                flex-direction: column;
                width: 100%;
                max-width: 340px;
                margin-top: 28px;
              }

              .primary-btn,
              .secondary-btn {
                width: 100%;
                height: 56px;
              }

              .mobile-match-card {
                display: block;
                width: 100%;
                margin-top: 30px;
              }

              .match-card {
                width: 100%;
                max-width: 100%;
                padding: 18px;
                border-radius: 22px;
              }

              .match-title {
                font-size: 23px;
                line-height: 1.15;
                margin: 8px 0 16px;
              }

              .team-grid {
                grid-template-columns: 1fr auto 1fr;
                gap: 8px;
              }

              .team-card {
                padding: 14px 10px;
                border-radius: 16px;
              }

              .team-flag {
                font-size: 28px;
              }

              .team-name {
                font-size: 12px;
                line-height: 1.2;
                word-break: break-word;
              }

              .deadline-box {
                font-size: 13px;
                line-height: 1.4;
                padding: 14px;
              }

              .leaderboard {
                display: none;
              }

              .feature-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 28px;
                width: 100%;
              }

              .feature-card {
                padding: 16px;
                min-height: 142px;
              }

              .feature-icon {
                font-size: 25px;
              }

              .feature-card h3 {
                font-size: 15px;
                line-height: 1.25;
              }

              .feature-card p {
                font-size: 12px;
                line-height: 1.45;
              }

              .leagues-box {
                margin-top: 28px;
                padding: 18px;
              }

              .leagues-head {
                align-items: flex-start;
                flex-direction: column;
              }

              .leagues-head h2 {
                font-size: 24px;
              }

              .small-gold-btn {
                width: 100%;
              }

              .leagues-grid {
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 430px) {
              .home-wrap {
                padding-left: 16px;
                padding-right: 16px;
              }

              .hero-title {
                font-size: 40px;
                max-width: 310px;
              }

              .hero-copy {
                max-width: 310px;
              }

              .hero-actions {
                max-width: 310px;
              }

              .feature-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
          `,
        }}
      />
    </main>
  );
}

function MatchCard() {
  return (
    <div className="match-card">
      <p className="match-label">NÄSTA MATCH</p>

      <h2 className="match-title">Argentina vs Frankrike</h2>

      <div className="team-grid">
        <Team flag="🇦🇷" name="Argentina" />
        <strong style={{ color: "rgba(255,255,255,0.35)" }}>VS</strong>
        <Team flag="🇫🇷" name="Frankrike" align="right" />
      </div>

      <div className="deadline-box">
        Tips låses 60 minuter före matchstart
      </div>

      <div className="leaderboard">
        {[
          ["1", "Max", "84 p"],
          ["2", "Linus", "78 p"],
          ["3", "Anton", "71 p"],
        ].map(([rank, name, points]) => (
          <div key={rank} className="leader-row">
            <span className="rank">{rank}</span>
            <strong style={{ flex: 1 }}>{name}</strong>
            <strong style={{ color: "#e5b94d" }}>{points}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Team({
  flag,
  name,
  align = "left",
}: {
  flag: string;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div className="team-card" style={{ textAlign: align }}>
      <div className="team-flag">{flag}</div>
      <div className="team-name">{name}</div>
    </div>
  );
}