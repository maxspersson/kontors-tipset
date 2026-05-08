import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProfileRow = {
  display_name: string | null;
  email: string | null;
  created_at?: string | null;
};

type LeagueMemberRow = {
  league_id: string;
};

type LeagueRow = {
  id: string;
  name: string;
  slug: string;
  invite_code: string | null;
  created_at: string | null;
  is_archived: boolean | null;
};

type PredictionRow = {
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

function formatDisplayName(email?: string | null) {
  if (!email) return "Spelare";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const email = profile?.email || user.email || null;
  const displayName =
    profile?.display_name || formatDisplayName(email) || "Spelare";
  const initials = getInitials(displayName);

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id);

  const leagueIds = ((memberships ?? []) as LeagueMemberRow[])
    .map((membership) => membership.league_id)
    .filter(Boolean);

  let leagues: LeagueRow[] = [];

  if (leagueIds.length > 0) {
    const { data: leagueRows } = await supabase
      .from("leagues")
      .select("id, name, slug, invite_code, created_at, is_archived")
      .in("id", leagueIds)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    leagues = (leagueRows ?? []) as LeagueRow[];
  }

  const { data: predictions } = await supabase
    .from("predictions")
    .select("match_id, predicted_home_score, predicted_away_score")
    .eq("user_id", user.id);

  const completedPredictions = ((predictions ?? []) as PredictionRow[]).filter(
    (prediction) =>
      prediction.predicted_home_score !== null &&
      prediction.predicted_away_score !== null
  ).length;

  const { data: submissions } = await supabase
    .from("league_submissions")
    .select("league_id")
    .eq("user_id", user.id)
    .not("submitted_at", "is", null);

  const submittedTipsCount = submissions?.length ?? 0;

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-wrap">
          <div className="profile-head">
            <div>
              <p className="eyebrow">Profil</p>
              <h1>Din profil.</h1>
              <p className="intro">
                Här styr du hur ditt namn visas i tabeller, topplistor och
                ligor. En tydlig profil gör det enklare för kollegor och vänner
                att känna igen dig.
              </p>
            </div>

            <div className="profile-summary">
              <div className="avatar">{initials}</div>
              <div>
                <p>Inloggad som</p>
                <strong>{displayName}</strong>
                {email && <span>{email}</span>}
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <section className="profile-card edit-card">
              <div className="card-head">
                <div>
                  <p>Visningsnamn</p>
                  <h2>Ändra namn</h2>
                </div>
                <span>Max 24 tecken</span>
              </div>

              <form action="/api/update-profile" method="POST">
                <label htmlFor="display_name">Namn som visas i appen</label>

                <input
                  id="display_name"
                  type="text"
                  name="display_name"
                  defaultValue={displayName}
                  placeholder="Till exempel Max"
                  maxLength={24}
                  required
                />

                <button type="submit">Spara ändringar</button>
              </form>

              <div className="preview">
                <span>Så visas du i tabellen</span>
                <strong>{displayName}</strong>
              </div>
            </section>

            <section className="profile-card stats-card">
              <div className="card-head">
                <div>
                  <p>Överblick</p>
                  <h2>Din statistik</h2>
                </div>
              </div>

              <div className="stats-grid">
                <div>
                  <strong>{leagues.length}</strong>
                  <span>Ligor</span>
                </div>

                <div>
                  <strong>{submittedTipsCount}</strong>
                  <span>Inskickade tips</span>
                </div>

                <div>
                  <strong>{completedPredictions}</strong>
                  <span>Tippade matcher</span>
                </div>
              </div>

              <div className="mini-rules">
                <p>Poäng i korthet</p>
                <ul>
                  <li>2 p per rätt mål</li>
                  <li>3 p för rätt tecken</li>
                  <li>Max 7 p per match</li>
                </ul>
              </div>
            </section>
          </div>

          <section className="profile-card leagues-card">
            <div className="card-head">
              <div>
                <p>Dina ligor</p>
                <h2>Fortsätt spela</h2>
              </div>

              <Link href="/liga" className="small-link">
                Alla ligor
              </Link>
            </div>

            {leagues.length === 0 ? (
              <div className="empty-state">
                <h3>Du är inte med i någon liga ännu.</h3>
                <p>Skapa en egen liga eller gå med via en kod.</p>
                <Link href="/liga">Gå till ligor</Link>
              </div>
            ) : (
              <div className="league-list">
                {leagues.slice(0, 4).map((league) => (
                  <article key={league.id} className="league-item">
                    <div>
                      <span>VM 2026</span>
                      <h3>{league.name}</h3>
                      <p>
                        Kod: <strong>{league.invite_code || "Saknas"}</strong>
                      </p>
                    </div>

                    <div className="league-actions">
                      <Link className="primary-action" href={`/liga/${league.slug}`}>
                        Gå till liga
                      </Link>
                     <Link href={`/liga/${league.slug}/tippa`}>Tippa</Link>

<Link href={`/liga/${league.slug}/tabell`}>
  Tabell
</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .profile-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .profile-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.76), #020304 560px),
                linear-gradient(90deg, rgba(2,3,4,0.96), rgba(2,3,4,0.68)),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .profile-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 78% 18%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 20% 18%, rgba(255,255,255,0.07), transparent 22%);
            }

            .profile-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px;
            }

            .profile-head {
              display: grid;
              grid-template-columns: 1fr 390px;
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

            .profile-card,
            .profile-summary {
              background: rgba(5,12,18,0.82);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .profile-summary {
              display: flex;
              align-items: center;
              gap: 18px;
              padding: 22px;
              border-radius: 24px;
            }

            .avatar {
              width: 68px;
              height: 68px;
              display: grid;
              place-items: center;
              border-radius: 999px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 22px;
              font-weight: 950;
              box-shadow: 0 18px 50px rgba(218,169,53,0.24);
              flex: 0 0 auto;
            }

            .profile-summary p,
            .card-head p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .profile-summary strong {
              display: block;
              margin-top: 8px;
              font-size: 26px;
              letter-spacing: -0.04em;
            }

            .profile-summary span {
              display: block;
              margin-top: 6px;
              color: rgba(255,255,255,0.52);
              font-size: 14px;
            }

            .profile-grid {
              display: grid;
              grid-template-columns: 1.1fr 0.9fr;
              gap: 18px;
              margin-top: 46px;
            }

            .profile-card {
              padding: 24px;
              border-radius: 26px;
            }

            .card-head {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              align-items: flex-start;
              margin-bottom: 24px;
            }

            .card-head h2 {
              margin: 7px 0 0;
              font-size: 30px;
              letter-spacing: -0.05em;
            }

            .card-head > span {
              padding: 7px 12px;
              border-radius: 999px;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.20);
              color: #e5b94d;
              font-size: 12px;
              font-weight: 900;
              white-space: nowrap;
            }

            form {
              display: grid;
              gap: 12px;
            }

            form label {
              color: rgba(255,255,255,0.62);
              font-size: 14px;
              font-weight: 800;
            }

            input {
              width: 100%;
              height: 56px;
              padding: 0 18px;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(0,0,0,0.34);
              color: white;
              font-size: 16px;
              outline: none;
            }

            input:focus {
              border-color: rgba(229,185,77,0.65);
              box-shadow: 0 0 0 4px rgba(229,185,77,0.12);
            }

            button {
              height: 56px;
              border: 0;
              border-radius: 16px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 15px;
              font-weight: 950;
              cursor: pointer;
            }

            .preview {
              margin-top: 24px;
              padding-top: 20px;
              border-top: 1px solid rgba(255,255,255,0.08);
            }

            .preview span {
              display: block;
              color: rgba(255,255,255,0.46);
              font-size: 13px;
              font-weight: 800;
            }

            .preview strong {
              display: block;
              margin-top: 8px;
              color: #e5b94d;
              font-size: 30px;
              letter-spacing: -0.04em;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }

            .stats-grid div {
              padding: 16px;
              border-radius: 18px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .stats-grid strong {
              display: block;
              color: #e5b94d;
              font-size: 28px;
              letter-spacing: -0.04em;
            }

            .stats-grid span {
              display: block;
              margin-top: 6px;
              color: rgba(255,255,255,0.50);
              font-size: 12px;
              font-weight: 800;
            }

            .mini-rules {
              margin-top: 18px;
              padding: 16px;
              border-radius: 18px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.18);
            }

            .mini-rules p {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .mini-rules ul {
              margin: 10px 0 0;
              padding-left: 18px;
              color: rgba(255,255,255,0.68);
              line-height: 1.6;
            }

            .leagues-card {
              margin-top: 18px;
            }

            .small-link {
              height: 40px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0 16px;
              border-radius: 999px;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.82);
              text-decoration: none;
              font-size: 13px;
              font-weight: 900;
              white-space: nowrap;
            }

            .league-list {
              display: grid;
              gap: 12px;
            }

            .league-item {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 16px;
              align-items: center;
              padding: 18px;
              border-radius: 20px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .league-item span {
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .league-item h3 {
              margin: 6px 0 0;
              font-size: 22px;
              letter-spacing: -0.04em;
            }

            .league-item p {
              margin: 8px 0 0;
              color: rgba(255,255,255,0.52);
              font-size: 13px;
            }

            .league-item p strong {
              color: #e5b94d;
              letter-spacing: 0.08em;
            }

            .league-actions {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              justify-content: flex-end;
            }

            .league-actions a {
              height: 40px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0 14px;
              border-radius: 999px;
              text-decoration: none;
              font-size: 13px;
              font-weight: 950;
              background: rgba(255,255,255,0.06);
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.82);
            }

            .league-actions .primary-action {
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              border: 0;
            }

            .empty-state {
              padding: 22px;
              border-radius: 20px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .empty-state h3 {
              margin: 0;
              font-size: 22px;
            }

            .empty-state p {
              margin: 8px 0 16px;
              color: rgba(255,255,255,0.58);
            }

            .empty-state a {
              color: #e5b94d;
              font-weight: 900;
              text-decoration: none;
            }

            @media (max-width: 900px) {
              .profile-wrap {
                padding: 56px 18px 42px;
              }

              .profile-head,
              .profile-grid,
              .league-item {
                grid-template-columns: 1fr;
              }

              h1 {
                font-size: 48px;
              }

              .intro {
                font-size: 16px;
              }

              .profile-summary {
                align-items: flex-start;
              }

              .card-head {
                flex-direction: column;
              }

              .stats-grid {
                grid-template-columns: 1fr;
              }

              .league-actions {
                flex-direction: column;
                justify-content: stretch;
              }

              .league-actions a {
                width: 100%;
              }

              .small-link {
                width: 100%;
              }
            }
          `,
        }}
      />
    </main>
  );
}