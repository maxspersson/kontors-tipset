import LeagueDangerAction from "@/app/components/LeagueDangerAction";
import { createClient } from "@/app/lib/supabase/server";
import { formatKickoff } from "@/app/lib/formatDate";
import CopyInvite from "@/app/components/CopyInvite";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  calculateStandings,
  type MatchRow,
  type PredictionRow,
  type ProfileRow,
  type SubmissionRow,
} from "@/app/lib/scoring";

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

type LeagueSubmissionRow = SubmissionRow & {
  submitted_at: string | null;
  total_predictions_count: number | null;
};

type LeagueMatch = MatchRow & {
  kickoff_utc: string;
};

function getDisplayName(profile?: MemberProfile) {
  return profile?.display_name || profile?.email?.split("@")[0] || "Spelare";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getSwedishTeamName(name: string) {
  const normalizedName = name.trim().toLowerCase();

  const map: Record<string, string> = {
    mexico: "Mexiko",
    "south africa": "Sydafrika",
    germany: "Tyskland",
    sweden: "Sverige",
    france: "Frankrike",
    england: "England",
    brazil: "Brasilien",
    argentina: "Argentina",
    portugal: "Portugal",
    spain: "Spanien",
    netherlands: "Nederländerna",
    switzerland: "Schweiz",
    belgium: "Belgien",
    norway: "Norge",
    denmark: "Danmark",
    japan: "Japan",
    australia: "Australien",
    canada: "Kanada",
    croatia: "Kroatien",
    ghana: "Ghana",
    panama: "Panama",
    uruguay: "Uruguay",
    "saudi arabia": "Saudiarabien",
    iraq: "Irak",
    senegal: "Senegal",
    qatar: "Qatar",
    ecuador: "Ecuador",
    tunisia: "Tunisien",
    morocco: "Marocko",
    scotland: "Skottland",
    haiti: "Haiti",
    colombia: "Colombia",
    "congo dr": "Kongo DR",
    uzbekistan: "Uzbekistan",
    austria: "Österrike",
    jordan: "Jordanien",
    algeria: "Algeriet",
    "bosnia-herzegovina": "Bosnien-Hercegovina",
    "korea republic": "Sydkorea",
    czechia: "Tjeckien",
    egypt: "Egypten",
    "new zealand": "Nya Zeeland",
    "ir iran": "Iran",
    türkiye: "Turkiet",
    usa: "USA",
    paraguay: "Paraguay",
    curaçao: "Curacao",
    "côte d'ivoire": "Elfenbenskusten",
    "cabo verde": "Kap Verde",
  };

  return map[normalizedName] ?? name;
}

export default async function LeagueDetailPage({ params }: LeaguePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, name, slug, invite_code, owner_user_id")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (leagueError || !league) {
    return (
      <main className="league-detail-page">
        <section className="league-detail-hero">
          <div className="league-wrap">
            <p className="eyebrow">Liga</p>
            <h1>Ligan hittades inte.</h1>
            <p className="intro">
              Vi kunde inte hitta någon liga med den här adressen.
            </p>
            <Link href="/liga" className="gold-btn">
              Till mina ligor
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const isOwner = league.owner_user_id === user.id;
  const invitePath = `/join/${league.invite_code}`;
  const inviteDisplayUrl = `kontorstipset.se${invitePath}`;

  const { data: currentMembership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = !!currentMembership;

  const { data: members, error: membersError } = await supabase
    .from("league_members")
    .select("id, user_id, created_at")
    .eq("league_id", league.id)
    .order("created_at", { ascending: true });

  const memberRows = (members ?? []) as LeagueMember[];
  const userIds = memberRows.map((member) => member.user_id);

  const { data: submissions } = await supabase
    .from("league_submissions")
    .select(
      "league_id, user_id, group_snapshot, playoff_snapshot, submitted_at, total_predictions_count"
    )
    .eq("league_id", league.id)
    .not("submitted_at", "is", null);

  const submissionRows = (submissions ?? []) as LeagueSubmissionRow[];
  const submittedUserIds = submissionRows.map((submission) => submission.user_id);
  const submittedUserSet = new Set(submittedUserIds);

  const currentUserSubmission = submissionRows.find(
    (submission) => submission.user_id === user.id
  );

  let profiles: MemberProfile[] = [];

  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    profiles = (profileRows ?? []) as MemberProfile[];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  let predictions: PredictionRow[] = [];

  if (submittedUserIds.length > 0) {
    const { data: predictionRows } = await supabase
      .from("predictions")
      .select(
        "league_id, user_id, match_id, predicted_home_score, predicted_away_score"
      )
      .eq("league_id", league.id)
      .in("user_id", submittedUserIds);

    predictions = (predictionRows ?? []) as PredictionRow[];
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, fifa_match_number, stage, group_name, home_team, away_team, home_score, away_score, kickoff_utc"
    );

  const matchRows = ((matches ?? []) as LeagueMatch[]).sort(
    (a, b) =>
      new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );

  const nowTime = Date.now();

  const latestStartedMatch =
    [...matchRows]
      .filter((match) => new Date(match.kickoff_utc).getTime() <= nowTime)
      .sort(
        (a, b) =>
          new Date(b.kickoff_utc).getTime() - new Date(a.kickoff_utc).getTime()
      )[0] ?? null;

  const nextUpcomingMatch =
    matchRows.find((match) => new Date(match.kickoff_utc).getTime() > nowTime) ??
    null;

  const featuredMatch = latestStartedMatch ?? nextUpcomingMatch;

  const hasFeaturedMatchStarted = featuredMatch
    ? new Date(featuredMatch.kickoff_utc).getTime() <= nowTime
    : false;

  const predictionMap = new Map(
    predictions.map((prediction) => [
      `${prediction.user_id}-${prediction.match_id}`,
      prediction,
    ])
  );

  const standings = calculateStandings({
    submissions: submissionRows,
    predictions,
    matches: matchRows as MatchRow[],
    profiles: profiles as ProfileRow[],
  });

  const leader = standings[0];
  const memberCount = memberRows.length;
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
                Ligacentralen för ert VM-tips. Här hittar du ligakoden,
                deltagarna, tabellen och vägen vidare till dina tips.
              </p>

              <div className="hero-actions">
                {isMember ? (
                  <>
                    <Link href={`/liga/${league.slug}/tippa`} className="gold-btn">
                      Tippa matcher →
                    </Link>

                    <Link href={`/liga/${league.slug}/tabell`} className="dark-btn">
                      Se tabell
                    </Link>
                  </>
                ) : (
                  <Link href="/liga" className="gold-btn">
                    Gå med via kod
                  </Link>
                )}
              </div>
            </div>

            <div className="status-card">
              <p>Din status</p>

              {!isMember ? (
                <>
                  <strong>Inte medlem</strong>
                  <span className="status-warning">
                    Gå med i ligan med koden för att kunna tippa.
                  </span>
                </>
              ) : currentUserSubmission ? (
                <>
                  <strong>Tipset inskickat</strong>
                  <span className="status-good">
                    {currentUserSubmission.total_predictions_count ?? 104}/104
                    matcher låsta.
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

          {isMember && (
            <section className="invite-hero-card">
              <div className="invite-hero-copy">
                <p>Bjud in kollegor</p>
                <h2>Få igång ligan på 2 sekunder.</h2>
                <span>
                  Dela länken i Teams, Slack eller Messenger. Nya spelare hamnar
                  direkt i rätt liga.
                </span>

                <div className="invite-link-preview">{inviteDisplayUrl}</div>
              </div>

              <div className="invite-hero-action">
                <CopyInvite inviteCode={league.invite_code} slug={league.slug} />
              </div>
            </section>
          )}

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
              <strong>{leader?.display_name || "Ingen ännu"}</strong>
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
                  Inga inskickade tips finns i ligan ännu.
                </div>
              ) : (
                <div className="leaderboard-list">
                  {standings.map((row, index) => {
                    const isCurrentUser = row.user_id === user.id;

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
                            {row.display_name}
                            {isCurrentUser ? " (du)" : ""}
                          </strong>

                          <span>
                            {row.playedMatches} räknade matcher ·{" "}
                            {row.exactScores} fullträffar ·{" "}
                            {row.bracketPoints} slutspelspoäng
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
              {featuredMatch && (
                <section className="panel match-picks-panel">
                  <div className="panel-head">
                    <div>
                      <p>
                        {hasFeaturedMatchStarted
                          ? "Aktuell match"
                          : "Nästa match"}
                      </p>
                      <h2>
                        {getSwedishTeamName(featuredMatch.home_team)} vs{" "}
                        {getSwedishTeamName(featuredMatch.away_team)}
                      </h2>
                    </div>
                  </div>

                  <p className="match-time">
                    Avspark {formatKickoff(featuredMatch.kickoff_utc)}
                  </p>

                  {!hasFeaturedMatchStarted ? (
                    <div className="locked-picks">
                      Tipsen visas när matchen har börjat.
                    </div>
                  ) : (
                    <details className="picks-details">
                      <summary>Så här tippade ligan</summary>

                      <div className="picks-list">
                        {memberRows.map((member) => {
                          const profile = profileMap.get(member.user_id);
                          const displayName = getDisplayName(profile);
                          const hasSubmitted = submittedUserSet.has(
                            member.user_id
                          );
                          const prediction = predictionMap.get(
                            `${member.user_id}-${featuredMatch.id}`
                          );

                          return (
                            <div key={member.id} className="pick-row">
                              <div>
                                <strong>{displayName}</strong>
                                <span>
                                  {hasSubmitted
                                    ? "Inskickat tips"
                                    : "Inte inskickat"}
                                </span>
                              </div>

                              <em>
                                {hasSubmitted && prediction
                                  ? `${prediction.predicted_home_score}–${prediction.predicted_away_score}`
                                  : "—"}
                              </em>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </section>
              )}

              <section className="panel invite-panel">
                <div className="panel-head">
                  <div>
                    <p>Bjud in</p>
                    <h2>Ligakod</h2>
                  </div>
                </div>

                <div className="invite-code">{league.invite_code}</div>

                <p className="invite-note">
                  Dela koden eller länken med kollegor och vänner så kan de gå
                  med i ligan direkt.
                </p>

                <div className="invite-small-link">{inviteDisplayUrl}</div>

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

                {memberRows.length === 0 ? (
                  <div className="empty-state">Inga medlemmar än.</div>
                ) : (
                  <div className="member-list">
                    {memberRows.map((member) => {
                      const profile = profileMap.get(member.user_id);
                      const displayName = getDisplayName(profile);
                      const hasSubmitted = submittedUserSet.has(member.user_id);
                      const isCurrentUser = member.user_id === user.id;

                      return (
                        <div
                          key={member.id}
                          className={`member-row ${
                            isCurrentUser ? "is-current-member" : ""
                          }`}
                        >
                          <div className="avatar">
                            {getInitials(displayName)}
                          </div>

                          <div>
                            <strong>
                              {displayName}
                              {isCurrentUser ? " (du)" : ""}
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

              {isMember && (
                <section className="panel danger-panel">
                  <div className="panel-head">
                    <div>
                      <p>Ligainställningar</p>
                      <h2>{isOwner ? "Ägare" : "Medlem"}</h2>
                    </div>
                  </div>

                  {isOwner ? (
                    <>
                      <p className="danger-note">
                        Arkivera ligan om den är skapad av misstag eller inte
                        längre ska användas. Den tas bort från alla listor men
                        datan raderas inte.
                      </p>

                      <LeagueDangerAction leagueId={league.id} action="archive" />
                    </>
                  ) : (
                    <>
                      <p className="danger-note">
                        Om du lämnar ligan försvinner den från dina ligor. Dina
                        gamla tips kan finnas kvar i databasen, men du ser inte
                        längre ligan.
                      </p>

                      <LeagueDangerAction leagueId={league.id} action="leave" />
                    </>
                  )}
                </section>
              )}
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
            .stat-card,
            .invite-hero-card {
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .status-card {
              padding: 24px;
              border-radius: 24px;
            }

            .status-card p,
            .stat-card p,
            .panel-head p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
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

            .invite-hero-card {
              position: relative;
              overflow: hidden;
              margin-top: 36px;
              padding: 26px;
              border-radius: 28px;
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 24px;
              align-items: center;
              border-color: rgba(229,185,77,0.22);
            }

            .invite-hero-card::before {
              content: "";
              position: absolute;
              inset: -80px -120px auto auto;
              width: 260px;
              height: 260px;
              border-radius: 999px;
              background: rgba(229,185,77,0.16);
              filter: blur(34px);
              pointer-events: none;
            }

            .invite-hero-copy {
              position: relative;
            }

            .invite-hero-copy p {
              margin: 0 0 10px;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .invite-hero-copy h2 {
              margin: 0;
              max-width: 560px;
              font-size: clamp(28px, 3vw, 42px);
              line-height: 1.05;
              letter-spacing: -0.055em;
            }

            .invite-hero-copy span {
              display: block;
              margin-top: 12px;
              max-width: 560px;
              color: rgba(255,255,255,0.58);
              font-size: 15px;
              line-height: 1.55;
              font-weight: 750;
            }

            .invite-link-preview,
            .invite-small-link {
              margin-top: 16px;
              padding: 12px 14px;
              border-radius: 16px;
              background: rgba(0,0,0,0.24);
              border: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.72);
              font-size: 13px;
              font-weight: 850;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .invite-hero-action {
              position: relative;
              min-width: 210px;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: 18px;
            }

            .stat-card {
              padding: 20px;
              border-radius: 20px;
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

            .panel-head h2 {
              margin: 6px 0 0;
              font-size: 24px;
              letter-spacing: -0.04em;
            }

            .match-time {
              margin: -6px 0 14px;
              color: rgba(255,255,255,0.56);
              font-size: 13px;
              font-weight: 800;
            }

            .locked-picks {
              padding: 15px;
              border-radius: 16px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.18);
              color: #f3cf69;
              font-size: 13px;
              font-weight: 850;
              line-height: 1.45;
            }

            .picks-details {
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.08);
              overflow: hidden;
            }

            .picks-details summary {
              padding: 15px;
              color: #e5b94d;
              cursor: pointer;
              font-size: 14px;
              font-weight: 950;
              list-style-position: inside;
            }

            .picks-list {
              display: grid;
              gap: 8px;
              padding: 0 12px 12px;
            }

            .pick-row {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 12px;
              align-items: center;
              padding: 12px;
              border-radius: 14px;
              background: rgba(0,0,0,0.22);
              border: 1px solid rgba(255,255,255,0.06);
            }

            .pick-row strong {
              display: block;
              font-size: 13px;
            }

            .pick-row span {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.38);
              font-size: 11px;
              font-weight: 800;
            }

            .pick-row em {
              color: #e5b94d;
              font-style: normal;
              font-size: 18px;
              font-weight: 950;
              white-space: nowrap;
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

            .invite-note,
            .danger-note {
              margin: 12px 0 0;
              color: rgba(255,255,255,0.52);
              font-size: 13px;
              line-height: 1.5;
            }

            .invite-small-link {
              margin-top: 12px;
              font-size: 12px;
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

            .member-row.is-current-member {
              border-color: rgba(229,185,77,0.30);
              background: rgba(229,185,77,0.07);
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

            .danger-panel {
              border-color: rgba(248,113,113,0.20);
              background: rgba(22,7,10,0.50);
            }

            .danger-button {
              width: 100%;
              height: 48px;
              margin-top: 16px;
              border: 1px solid rgba(248,113,113,0.35);
              border-radius: 14px;
              background: rgba(248,113,113,0.10);
              color: #fca5a5;
              font-size: 14px;
              font-weight: 950;
              cursor: pointer;
            }

            .danger-button:hover {
              background: rgba(248,113,113,0.16);
            }

            @media (max-width: 900px) {
              .league-wrap {
                padding: 56px 18px 46px;
              }

              .league-head,
              .content-grid,
              .invite-hero-card {
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

              .invite-hero-card {
                margin-top: 28px;
                padding: 22px;
              }

              .invite-hero-action {
                min-width: 0;
                width: 100%;
              }

              .stats-grid {
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