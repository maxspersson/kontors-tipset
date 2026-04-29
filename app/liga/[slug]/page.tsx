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
      <main className="league-detail-page">
        <div className="league-wrap">
          <p className="eyebrow">Liga</p>
          <h1>Liga hittades inte.</h1>
          <p className="intro">
            Vi kunde inte hitta någon liga med den här adressen.
          </p>
        </div>
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

    if (prediction.predicted_home_score === match.home_score) points += 2;
    if (prediction.predicted_away_score === match.away_score) points += 2;

    const predictedDiff =
      prediction.predicted_home_score - prediction.predicted_away_score;
    const actualDiff = match.home_score - match.away_score;

    const predictedSign = predictedDiff === 0 ? 0 : predictedDiff > 0 ? 1 : -1;
    const actualSign = actualDiff === 0 ? 0 : actualDiff > 0 ? 1 : -1;

    if (predictedSign === actualSign) points += 3;

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

  const leader = standings[0];
  const memberCount = members?.length ?? 0;
  const submittedCount = submittedUserIds.length;

  return (
    <main className="league-detail-page">
      <section className="league-detail-hero">
        <div className="league-wrap">
          <div className="league-head">
            <div>
              <p className="eyebrow">Liga</p>
              <h1>{league.name}</h1>
              <p className="intro">
                Din ligacentral för VM-tipset. Här ser du status, tabell,
                medlemmar och vägen vidare till matchtipsen.
              </p>

              <div className="hero-actions">
                <Link href={`/liga/${league.slug}/tippa`} className="gold-btn">
                  Tippa matcher →
                </Link>
                <Link href="/regler" className="dark-btn">
                  Se regler
                </Link>
              </div>
            </div>

            <div className="status-card">
              <p>Din status</p>

              {currentUserHasSubmitted ? (
                <>
                  <strong>Klar för spel</strong>
                  <span className="status-good">
                    Turneringstipset är inskickat.
                  </span>
                </>
              ) : (
                <>
                  <strong>Inte inskickat</strong>
                  <span className="status-warning">
                    Skicka in ditt tips för att räknas i tabellen.
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p>Medlemmar</p>
              <strong>{memberCount}</strong>
            </div>

            <div className="stat-card">
              <p>Inskickade tips</p>
              <strong>{submittedCount}</strong>
            </div>

            <div className="stat-card">
              <p>Leder just nu</p>
              <strong>{leader?.display_name || leader?.email || "Ingen än"}</strong>
            </div>
          </div>

          <div className="content-grid">
            <section className="panel leaderboard-panel">
              <div className="panel-head">
                <div>
                  <p>Leaderboard</p>
                  <h2>Ställning i ligan</h2>
                </div>
              </div>

              {standings.length === 0 ? (
                <div className="empty-state">
                  Inga inskickade turneringstips än.
                </div>
              ) : (
                <div className="leaderboard-list">
                  {standings.map((row, index) => {
                    const isCurrentUser = user && row.user_id === user.id;

                    return (
                      <div
                        key={row.user_id}
                        className={`leader-row ${
                          isCurrentUser ? "is-current" : ""
                        }`}
                      >
                        <div className="rank">{index + 1}</div>

                        <div className="leader-user">
                          <strong>
                            {row.display_name || row.email || "Okänd användare"}
                            {isCurrentUser ? " (du)" : ""}
                          </strong>

                          <span>
                            {row.scored_matches} rättade ·{" "}
                            {row.submitted_predictions} tips
                          </span>
                        </div>

                        <div className="points">{row.points} p</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="side-stack">
              <section className="panel invite-panel">
                <div className="panel-head">
                  <div>
                    <p>Bjud in</p>
                    <h2>Invite code</h2>
                  </div>
                </div>

                <div className="invite-code">{league.invite_code}</div>

                <div className="copy-wrap">
                  <CopyInvite inviteCode={league.invite_code} slug={league.slug} />
                </div>
              </section>

              <section className="panel members-panel">
                <div className="panel-head">
                  <div>
                    <p>Medlemmar</p>
                    <h2>Deltagare</h2>
                  </div>
                </div>

                {membersError && (
                  <div className="error-state">Kunde inte hämta medlemmar.</div>
                )}

                {!members || members.length === 0 ? (
                  <div className="empty-state">Inga medlemmar än.</div>
                ) : (
                  <div className="member-list">
                    {members.map((member: LeagueMember) => {
                      const profile = profileMap.get(member.user_id);
                      const hasSubmitted = submittedUserSet.has(member.user_id);

                      return (
                        <div key={member.id} className="member-row">
                          <div className="avatar">
                            {(profile?.display_name ||
                              profile?.email ||
                              "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {profile?.display_name || "Okänd användare"}
                            </strong>
                            <span>{profile?.email || "Ingen e-post"}</span>
                          </div>

                          <em className={hasSubmitted ? "done" : "pending"}>
                            {hasSubmitted ? "Klar" : "Ej klar"}
                          </em>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .league-detail-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .league-detail-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.74) 0%, rgba(2,3,4,0.96) 340px, #020304 100%),
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.70) 58%, rgba(2,3,4,0.94) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .league-detail-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 74% 14%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 18% 12%, rgba(255,255,255,0.07), transparent 22%);
            }

            .league-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px 70px;
            }

            .league-head {
              display: grid;
              grid-template-columns: 1fr 360px;
              gap: 44px;
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

            .league-head h1 {
              margin: 0;
              max-width: 760px;
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

            .hero-actions {
              display: flex;
              gap: 14px;
              margin-top: 32px;
              flex-wrap: wrap;
            }

            .gold-btn,
            .dark-btn {
              height: 56px;
              padding: 0 26px;
              border-radius: 14px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              font-size: 14px;
              font-weight: 950;
            }

            .gold-btn {
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              box-shadow: 0 18px 50px rgba(218,169,53,0.25);
            }

            .dark-btn {
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(255,255,255,0.055);
              color: white;
              backdrop-filter: blur(14px);
            }

            .status-card,
            .panel,
            .stat-card {
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .status-card {
              padding: 24px;
              border-radius: 24px;
            }

            .status-card p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .status-card strong {
              display: block;
              margin-top: 12px;
              font-size: 30px;
              letter-spacing: -0.04em;
            }

            .status-card span {
              display: block;
              margin-top: 10px;
              font-size: 14px;
              line-height: 1.5;
            }

            .status-good {
              color: #86efac;
            }

            .status-warning {
              color: #f3cf69;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 42px;
            }

            .stat-card {
              padding: 20px;
              border-radius: 20px;
            }

            .stat-card p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .stat-card strong {
              display: block;
              margin-top: 12px;
              color: #e5b94d;
              font-size: 28px;
              line-height: 1.1;
              letter-spacing: -0.04em;
            }

            .content-grid {
              display: grid;
              grid-template-columns: 1fr 360px;
              gap: 18px;
              margin-top: 18px;
              align-items: start;
            }

            .side-stack {
              display: grid;
              gap: 18px;
            }

            .panel {
              padding: 22px;
              border-radius: 26px;
            }

            .panel-head {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              align-items: flex-start;
              margin-bottom: 18px;
            }

            .panel-head p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .panel-head h2 {
              margin: 6px 0 0;
              font-size: 24px;
              letter-spacing: -0.04em;
            }

            .empty-state,
            .error-state {
              padding: 18px;
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              color: rgba(255,255,255,0.55);
              font-size: 14px;
            }

            .error-state {
              color: #fca5a5;
            }

            .leaderboard-list {
              display: grid;
              gap: 10px;
            }

            .leader-row {
              display: grid;
              grid-template-columns: 44px 1fr auto;
              gap: 14px;
              align-items: center;
              padding: 15px;
              border-radius: 18px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .leader-row.is-current {
              border-color: rgba(229,185,77,0.38);
              background: rgba(229,185,77,0.08);
            }

            .rank {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              display: grid;
              place-items: center;
              font-size: 14px;
              font-weight: 950;
            }

            .leader-user strong {
              display: block;
              font-size: 15px;
            }

            .leader-user span {
              display: block;
              margin-top: 5px;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 750;
            }

            .points {
              color: #e5b94d;
              font-size: 18px;
              font-weight: 950;
              white-space: nowrap;
            }

            .invite-code {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              min-height: 62px;
              border-radius: 18px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.22);
              color: #e5b94d;
              font-size: 26px;
              font-weight: 950;
              letter-spacing: 0.12em;
            }

            .copy-wrap {
              margin-top: 16px;
            }

            .member-list {
              display: grid;
              gap: 10px;
            }

            .member-row {
              display: grid;
              grid-template-columns: 42px 1fr auto;
              gap: 12px;
              align-items: center;
              padding: 13px;
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .avatar {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              background: rgba(255,255,255,0.10);
              color: white;
              font-size: 12px;
              font-weight: 950;
            }

            .member-row strong {
              display: block;
              font-size: 14px;
            }

            .member-row span {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.36);
              font-size: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 160px;
            }

            .member-row em {
              font-style: normal;
              font-size: 12px;
              font-weight: 900;
              white-space: nowrap;
            }

            .done {
              color: #86efac;
            }

            .pending {
              color: #f3cf69;
            }

            @media (max-width: 900px) {
              .league-wrap {
                padding: 56px 18px 46px;
              }

              .league-head {
                grid-template-columns: 1fr;
                gap: 24px;
              }

              .league-head h1 {
                font-size: 46px;
                max-width: 340px;
              }

              .intro {
                font-size: 16px;
                max-width: 350px;
              }

              .hero-actions {
                flex-direction: column;
              }

              .gold-btn,
              .dark-btn {
                width: 100%;
              }

              .stats-grid,
              .content-grid {
                grid-template-columns: 1fr;
              }

              .stat-card strong {
                font-size: 24px;
              }

              .leader-row {
                grid-template-columns: 42px 1fr;
              }

              .points {
                grid-column: 2;
              }

              .member-row span {
                max-width: 190px;
              }
            }
          `,
        }}
      />
    </main>
  );
}