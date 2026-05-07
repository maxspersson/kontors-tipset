import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeagueMemberRow = {
  league_id: string;
};

type League = {
  id: string;
  name: string;
  slug: string | null;
  invite_code: string | null;
};

export default async function LigaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      .select("id, name, slug, invite_code")
      .in("id", leagueIds);

    leagues = (leagueRows ?? []) as League[];
  }

  return (
    <main className="league-page">
      <section className="league-hero">
        <div className="league-wrap">
          <div className="league-head">
            <div>
              <p className="eyebrow">Liga</p>
              <h1>Mina ligor.</h1>
              <p className="intro">
                Skapa en liga, gå med via kod eller välj vilken liga du vill
                tippa i. Varje liga har egen tabell och egna inskickade tips.
              </p>

              <p style={{ marginTop: 16, color: "#e5b94d", fontSize: 12 }}>
  Debug user id: {user.id}
</p>
            </div>

            <div className="summary-card">
              <p>Aktiva ligor</p>
              <strong>{leagues.length}</strong>
              <span>kopplade till ditt konto</span>
            </div>
          </div>

          <div className="league-layout">
            <section className="my-leagues">
              <div className="section-head">
                <p>Dina ligor</p>
                <h2>Välj liga</h2>
              </div>

              {leagues.length === 0 ? (
                <div className="empty-card">
                  <h3>Du är inte med i någon liga ännu.</h3>
                  <p>
                    Skapa en ny liga eller gå med i en befintlig med en kod.
                  </p>
                </div>
              ) : (
                <div className="league-list">
                  {leagues.map((league) => (
                    <article key={league.id} className="league-card">
                      <div>
                        <p>VM 2026</p>
                        <h3>{league.name}</h3>

                        <div className="invite-code">
                          <span>Invite code</span>
                          <strong>{league.invite_code || "Saknas"}</strong>
                        </div>
                      </div>

                      <div className="league-actions">
                        <Link
                          className="primary-link"
                          href={`/tippa?leagueId=${league.id}`}
                        >
                          Tippa
                        </Link>

                        <Link
                          className="secondary-link"
                          href={`/tabell?leagueId=${league.id}`}
                        >
                          Se tabell
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="league-side">
              <div className="form-card">
                <div className="card-top">
                  <div>
                    <p>Kontors-tipset</p>
                    <h2>Skapa liga</h2>
                  </div>
                  <span>VM 2026</span>
                </div>

                <form action="/api/create-league" method="POST">
                  <label>Namn på ligan</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Till exempel: Marknadsteamet"
                    required
                  />

                  <button type="submit">Skapa liga</button>
                </form>
              </div>

              <div className="form-card join-card">
                <div className="card-top">
                  <div>
                    <p>Bjuden?</p>
                    <h2>Gå med</h2>
                  </div>
                </div>

                <form action="/api/join-league" method="POST">
                  <label>Ligakod</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="Till exempel: X7K92A"
                    required
                  />

                  <button type="submit">Gå med i liga</button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .league-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .league-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.76), #020304 560px),
                linear-gradient(90deg, rgba(2,3,4,0.96), rgba(2,3,4,0.68)),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .league-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              background:
                radial-gradient(circle at 78% 18%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 20% 18%, rgba(255,255,255,0.07), transparent 22%);
              pointer-events: none;
            }

            .league-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px;
            }

            .league-head {
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

            h1 {
              margin: 0;
              font-size: clamp(46px, 6vw, 82px);
              line-height: 1;
              letter-spacing: -0.06em;
              font-weight: 950;
            }

            .intro {
              margin: 22px 0 0;
              max-width: 620px;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.65;
            }

            .summary-card,
            .form-card,
            .league-card,
            .empty-card {
              background: rgba(5,12,18,0.82);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .summary-card {
              padding: 22px;
              border-radius: 22px;
            }

            .summary-card p,
            .section-head p,
            .league-card p,
            .card-top p,
            .invite-code span {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .summary-card strong {
              display: block;
              margin-top: 12px;
              color: #e5b94d;
              font-size: 34px;
              letter-spacing: -0.04em;
            }

            .summary-card span {
              display: block;
              margin-top: 8px;
              color: rgba(255,255,255,0.54);
              font-size: 14px;
              line-height: 1.5;
            }

            .league-layout {
              display: grid;
              grid-template-columns: 1fr 390px;
              gap: 22px;
              align-items: start;
              margin-top: 46px;
            }

            .section-head {
              margin-bottom: 16px;
            }

            .section-head h2 {
              margin: 6px 0 0;
              font-size: 34px;
              letter-spacing: -0.05em;
            }

            .league-list {
              display: grid;
              gap: 14px;
            }

            .league-card {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 18px;
              align-items: center;
              padding: 22px;
              border-radius: 24px;
            }

            .league-card h3 {
              margin: 8px 0 0;
              font-size: 26px;
              letter-spacing: -0.04em;
            }

            .invite-code {
              display: inline-flex;
              gap: 12px;
              align-items: center;
              margin-top: 16px;
              padding: 10px 12px;
              border-radius: 999px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.20);
            }

            .invite-code strong {
              color: #e5b94d;
              font-size: 14px;
              letter-spacing: 0.08em;
            }

            .league-actions {
              display: flex;
              gap: 10px;
              align-items: center;
            }

            .primary-link,
            .secondary-link {
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

            .primary-link {
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
            }

            .secondary-link {
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.8);
            }

            .empty-card {
              padding: 24px;
              border-radius: 24px;
            }

            .empty-card h3 {
              margin: 0;
              font-size: 22px;
            }

            .empty-card p {
              margin: 10px 0 0;
              color: rgba(255,255,255,0.58);
              line-height: 1.5;
            }

            .league-side {
              display: grid;
              gap: 16px;
            }

            .form-card {
              padding: 22px;
              border-radius: 26px;
            }

            .join-card {
              background: rgba(5,12,18,0.66);
            }

            .card-top {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              align-items: flex-start;
              margin-bottom: 24px;
            }

            .card-top h2 {
              margin: 8px 0 0;
              font-size: 28px;
              letter-spacing: -0.04em;
            }

            .card-top span {
              padding: 7px 12px;
              border-radius: 999px;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.20);
              color: #e5b94d;
              font-size: 12px;
              font-weight: 900;
              white-space: nowrap;
            }

            form label {
              display: block;
              margin-bottom: 10px;
              color: rgba(255,255,255,0.60);
              font-size: 14px;
              font-weight: 800;
            }

            form input {
              width: 100%;
              height: 54px;
              padding: 0 16px;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(0,0,0,0.34);
              color: white;
              font-size: 15px;
              outline: none;
            }

            form input::placeholder {
              color: rgba(255,255,255,0.32);
            }

            form input:focus {
              border-color: rgba(229,185,77,0.65);
              box-shadow: 0 0 0 4px rgba(229,185,77,0.12);
            }

            form button {
              width: 100%;
              height: 54px;
              margin-top: 14px;
              border: 0;
              border-radius: 16px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 15px;
              font-weight: 950;
              cursor: pointer;
            }

            @media (max-width: 900px) {
              .league-wrap {
                padding: 56px 18px 42px;
              }

              .league-head,
              .league-layout,
              .league-card {
                grid-template-columns: 1fr;
              }

              h1 {
                font-size: 48px;
              }

              .intro {
                font-size: 16px;
              }

              .league-actions {
                flex-direction: column;
                align-items: stretch;
              }

              .primary-link,
              .secondary-link {
                width: 100%;
              }
            }
          `,
        }}
      />
    </main>
  );
}