import MatchDuelPager, {
  type MatchDuelPickItem,
} from "@/app/components/MatchDuelPager";
import CopyTextButton from "@/app/components/CopyTextButton";
import MembersPager, { type MemberPagerItem } from "@/app/components/MembersPager";
import LeagueAutoRefresh from "@/app/components/LeagueAutoRefresh";
import LeagueDangerAction from "@/app/components/LeagueDangerAction";
import { createClient } from "@/app/lib/supabase/server";
import { formatKickoff } from "@/app/lib/formatDate";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  calculateStandings,
  type MatchRow,
  type ProfileRow,
  type SubmissionRow,
} from "@/app/lib/scoring";

type LeaguePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ demo?: string }>;
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
  public_slug: string | null;
};

type LeagueMatch = MatchRow & {
  kickoff_utc: string;
  status: string | null;
};

type StandingSnapshotRow = {
  user_id: string;
  rank: number;
  points: number;
  created_at: string;
};

function formatNameFromEmail(email?: string | null) {
  if (!email) return null;

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayName(profile?: MemberProfile) {
  return (
    profile?.display_name?.trim() ||
    formatNameFromEmail(profile?.email) ||
    "Spelare"
  );
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

function getPickOutcomeLabel(
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  homeTeam: string,
  awayTeam: string
) {
  if (homeScore === null || homeScore === undefined) return "Inget tips";
  if (awayScore === null || awayScore === undefined) return "Inget tips";
  if (homeScore > awayScore) return getSwedishTeamName(homeTeam);
  if (homeScore < awayScore) return getSwedishTeamName(awayTeam);
  return "Oavgjort";
}

function getMostCommonResult(
  picks: { homeScore: number | null; awayScore: number | null }[]
) {
  const resultCounts = new Map<string, number>();

  picks.forEach((pick) => {
    if (pick.homeScore === null || pick.awayScore === null) return;
    const key = `${pick.homeScore}–${pick.awayScore}`;
    resultCounts.set(key, (resultCounts.get(key) ?? 0) + 1);
  });

  return (
    Array.from(resultCounts.entries()).sort((a, b) => b[1] - a[1])[0] ?? null
  );
}

export default async function LeagueDetailPage({
  params,
  searchParams,
}: LeaguePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isDemoMode = resolvedSearchParams.demo === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, name, slug, invite_code, owner_user_id")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (leagueError || !league) {
    return (
  <main className="league-detail-page">
    <LeagueAutoRefresh intervalMs={30000} />
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
  const inviteFullUrl = `https://${inviteDisplayUrl}`;

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
      "league_id, user_id, group_snapshot, playoff_snapshot, submitted_at, total_predictions_count, public_slug"
    )
    .eq("league_id", league.id)
    .not("submitted_at", "is", null);

  const submissionRows = (submissions ?? []) as LeagueSubmissionRow[];
  const submittedUserIds = submissionRows.map((submission) => submission.user_id);
  const submittedUserSet = new Set(submittedUserIds);
  const submissionByUserId = new Map(
    submissionRows.map((submission) => [submission.user_id, submission])
  );

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

  if (!profileMap.has(user.id)) {
    profileMap.set(user.id, {
      id: user.id,
      email: user.email ?? null,
      display_name:
        user.user_metadata?.display_name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        null,
    });
  }

  const { data: matches } = await supabase.from("matches").select(
    "id, fifa_match_number, stage, group_name, home_team, away_team, home_team_code, away_team_code, home_fifa_ranking, away_fifa_ranking, home_score, away_score, home_pen, away_pen, actual_advancing_team, kickoff_utc, status"
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

  const liveMatch = matchRows.find((match) => match.status === "live") ?? null;

const currentStartedMatch =
  [...matchRows]
    .filter(
      (match) =>
        new Date(match.kickoff_utc).getTime() <= nowTime &&
        match.status !== "finished"
    )
    .sort(
      (a, b) =>
        new Date(b.kickoff_utc).getTime() -
        new Date(a.kickoff_utc).getTime()
    )[0] ?? null;


  const finishedMatch =
    [...matchRows]
      .filter((match) => match.status === "finished")
      .sort(
        (a, b) =>
          new Date(b.kickoff_utc).getTime() -
          new Date(a.kickoff_utc).getTime()
      )[0] ?? null;

      const ONE_HOUR_MS = 60 * 60 * 1000;

      const isNextMatchWithinOneHour =
      nextUpcomingMatch
      ? new Date(nextUpcomingMatch.kickoff_utc).getTime() - nowTime <= ONE_HOUR_MS
      : false;

  const featuredMatch =
  liveMatch ??
  currentStartedMatch ??
  (isNextMatchWithinOneHour ? nextUpcomingMatch : null) ??
  finishedMatch ??
  nextUpcomingMatch;

  const demoFeaturedMatch = matchRows[0]
    ? {
        ...matchRows[0],
        home_team: "Mexico",
        away_team: "South Africa",
        home_score: 1,
        away_score: 1,
        status: "live",
        kickoff_utc: new Date().toISOString(),
      }
    : null;

  const activeFeaturedMatch = isDemoMode ? demoFeaturedMatch : featuredMatch;

  const hasFeaturedMatchStarted = activeFeaturedMatch
    ? new Date(activeFeaturedMatch.kickoff_utc).getTime() <= nowTime
    : false;

  const isLiveMatch = activeFeaturedMatch?.status === "live";
  const isFinishedMatch = activeFeaturedMatch?.status === "finished";

  function getSubmittedPickForMatch(userId: string, matchId: string) {
    const submission = submissionByUserId.get(userId);
    if (!submission) return null;

    const snapshot = [
      ...(submission.group_snapshot ?? []),
      ...(submission.playoff_snapshot ?? []),
    ];

    return snapshot.find((item) => item.match_id === matchId) ?? null;
  }

  const demoMatchDuelPicks = [
    {
      memberId: "demo-pick-1",
      userId: "demo-1",
      displayName: "Maja",
      initials: "MA",
      hasSubmitted: true,
      homeScore: 2,
      awayScore: 1,
    },
    {
      memberId: "demo-pick-2",
      userId: "demo-2",
      displayName: "Johan",
      initials: "JO",
      hasSubmitted: true,
      homeScore: 1,
      awayScore: 1,
    },
    {
      memberId: "demo-pick-3",
      userId: "demo-3",
      displayName: "Sara",
      initials: "SA",
      hasSubmitted: true,
      homeScore: 1,
      awayScore: 1,
    },
    {
      memberId: "demo-pick-4",
      userId: "demo-4",
      displayName: "Alex",
      initials: "AL",
      hasSubmitted: true,
      homeScore: 0,
      awayScore: 1,
    },
    {
      memberId: "demo-pick-5",
      userId: "demo-5",
      displayName: "Nina",
      initials: "NI",
      hasSubmitted: true,
      homeScore: 3,
      awayScore: 1,
    },
  ];

  const matchDuelPicks = isDemoMode
    ? demoMatchDuelPicks
    : activeFeaturedMatch
      ? memberRows.map((member) => {
          const profile = profileMap.get(member.user_id);
          const displayName = getDisplayName(profile);
          const prediction = getSubmittedPickForMatch(
            member.user_id,
            activeFeaturedMatch.id
          );

          return {
            memberId: member.id,
            userId: member.user_id,
            displayName,
            initials: getInitials(displayName),
            hasSubmitted: submittedUserSet.has(member.user_id),
            homeScore: prediction?.predicted_home_score ?? null,
            awayScore: prediction?.predicted_away_score ?? null,
          };
        })
      : [];

  const submittedMatchDuelPicks = matchDuelPicks.filter(
    (pick) =>
      pick.hasSubmitted && pick.homeScore !== null && pick.awayScore !== null
  );

  const homeWinPicks = submittedMatchDuelPicks.filter(
    (pick) =>
      pick.homeScore !== null &&
      pick.awayScore !== null &&
      pick.homeScore > pick.awayScore
  );

  const drawPicks = submittedMatchDuelPicks.filter(
    (pick) =>
      pick.homeScore !== null &&
      pick.awayScore !== null &&
      pick.homeScore === pick.awayScore
  );

  const awayWinPicks = submittedMatchDuelPicks.filter(
    (pick) =>
      pick.homeScore !== null &&
      pick.awayScore !== null &&
      pick.homeScore < pick.awayScore
  );

  const mostCommonResult = getMostCommonResult(submittedMatchDuelPicks);

  const uniqueResultCount = submittedMatchDuelPicks.filter((pick) => {
    const sameResultCount = submittedMatchDuelPicks.filter(
      (otherPick) =>
        otherPick.homeScore === pick.homeScore &&
        otherPick.awayScore === pick.awayScore
    ).length;

    return sameResultCount === 1;
  }).length;

  const mostBackedOutcome =
    [
      {
        label: activeFeaturedMatch
          ? getSwedishTeamName(activeFeaturedMatch.home_team)
          : "",
        count: homeWinPicks.length,
      },
      { label: "Oavgjort", count: drawPicks.length },
      {
        label: activeFeaturedMatch
          ? getSwedishTeamName(activeFeaturedMatch.away_team)
          : "",
        count: awayWinPicks.length,
      },
    ].sort((a, b) => b.count - a.count)[0] ?? null;

  const standings = calculateStandings({
    submissions: submissionRows,
    predictions: [],
    matches: matchRows as MatchRow[],
    profiles: profiles as ProfileRow[],
  });

  const demoStandings = [
    {
      user_id: "demo-1",
      display_name: "Maja",
      points: 142,
      matchPoints: 142,
      bracketPoints: 0,
      exactScores: 12,
      playedMatches: 38,
      climb: 3,
    },
    {
      user_id: "demo-2",
      display_name: "Johan",
      points: 136,
      matchPoints: 136,
      bracketPoints: 0,
      exactScores: 10,
      playedMatches: 38,
      climb: 0,
    },
    {
      user_id: "demo-3",
      display_name: "Sara",
      points: 132,
      matchPoints: 132,
      bracketPoints: 0,
      exactScores: 9,
      playedMatches: 38,
      climb: 0,
    },
    {
      user_id: "demo-4",
      display_name: "Alex",
      points: 129,
      matchPoints: 129,
      bracketPoints: 0,
      exactScores: 11,
      playedMatches: 38,
      climb: 4,
    },
  ];

  const activeStandings = isDemoMode ? demoStandings : standings;

  const { data: standingSnapshots } = await supabase
    .from("league_standing_snapshots")
    .select("user_id, rank, points, created_at")
    .eq("league_id", league.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const snapshotRows = (standingSnapshots ?? []) as StandingSnapshotRow[];

  const snapshotTimes = Array.from(
    new Set(snapshotRows.map((snapshot) => snapshot.created_at))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const latestSnapshotTime = snapshotTimes[0] ?? null;
  const previousSnapshotTime = snapshotTimes[snapshotTimes.length - 1] ?? null;

  const latestRankByUserId = new Map<string, number>();
  const previousRankByUserId = new Map<string, number>();

  if (latestSnapshotTime) {
    snapshotRows
      .filter((snapshot) => snapshot.created_at === latestSnapshotTime)
      .forEach((snapshot) => {
        latestRankByUserId.set(snapshot.user_id, snapshot.rank);
      });
  }

  if (previousSnapshotTime) {
    snapshotRows
      .filter((snapshot) => snapshot.created_at === previousSnapshotTime)
      .forEach((snapshot) => {
        previousRankByUserId.set(snapshot.user_id, snapshot.rank);
      });
  }

  const climbers = standings
    .map((standing) => {
      const latestRank = latestRankByUserId.get(standing.user_id);
      const previousRank = previousRankByUserId.get(standing.user_id);

      return {
        ...standing,
        climb: latestRank && previousRank ? previousRank - latestRank : 0,
      };
    })
    .filter((standing) => standing.climb > 0)
    .sort((a, b) => b.climb - a.climb);

  const memberCount = isDemoMode ? 5 : memberRows.length;
  const submittedCount = isDemoMode ? 5 : submittedUserIds.length;

  const hasScoredMatches =
    isDemoMode || activeStandings.some((standing) => standing.playedMatches > 0);

  const leader = hasScoredMatches ? activeStandings[0] : null;

  const topClimber =
  isDemoMode
    ? { display_name: "Alex", climb: 4 }
    : hasScoredMatches
      ? climbers[0] ?? leader
      : null;

  const exactScoreLeader =
    isDemoMode || hasScoredMatches
      ? isDemoMode
        ? { display_name: "Maja", exactScores: 12 }
        : [...standings]
            .filter((standing) => standing.exactScores > 0)
            .sort((a, b) => b.exactScores - a.exactScores)[0] ?? null
      : null;

  const duelPagerPicks: MatchDuelPickItem[] = activeFeaturedMatch
    ? matchDuelPicks.map((pick) => ({
        memberId: pick.memberId,
        displayName: pick.displayName,
        hasSubmitted: pick.hasSubmitted,
        homeScore: pick.homeScore,
        awayScore: pick.awayScore,
        outcomeLabel:
          pick.hasSubmitted && pick.homeScore !== null && pick.awayScore !== null
            ? getPickOutcomeLabel(
                pick.homeScore,
                pick.awayScore,
                activeFeaturedMatch.home_team,
                activeFeaturedMatch.away_team
              )
            : pick.hasSubmitted
              ? "Inget tips på matchen"
              : "Inte inskickat",
      }))
    : [];

  const pagerMembers: MemberPagerItem[] = memberRows.map((member) => {
    const profile = profileMap.get(member.user_id);
    const displayName = getDisplayName(profile);
    const hasSubmitted = submittedUserSet.has(member.user_id);
    const isCurrentUser = member.user_id === user.id;
    const memberSubmission = submissionByUserId.get(member.user_id);
    const tipsPath = memberSubmission?.public_slug || member.user_id;

    return {
      id: member.id,
      displayName,
      email:
        profile?.email ||
        (isCurrentUser ? user.email ?? "" : "") ||
        "Ingen e-post",
      initials: getInitials(displayName),
      isCurrentUser,
      hasSubmitted,
      tipsHref: hasSubmitted ? `/liga/${league.slug}/tips/${tipsPath}` : null,
    };
  });

  const recentMemberActivities = memberRows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      const displayName = getDisplayName(profile);

      return {
        id: `member-${member.id}`,
        text: `${displayName} gick med i ligan`,
        createdAt: member.created_at,
        icon: "👋",
      };
    });

  const recentSubmissionActivities = submissionRows
    .filter((submission) => submission.submitted_at)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submitted_at || "").getTime() -
        new Date(a.submitted_at || "").getTime()
    )
    .slice(0, 5)
    .map((submission) => {
      const profile = profileMap.get(submission.user_id);
      const displayName = getDisplayName(profile);

      return {
        id: `submission-${submission.user_id}`,
        text: `${displayName} skickade in sitt tips`,
        createdAt: submission.submitted_at || "",
        icon: "✅",
      };
    });

  const activityItems = [...recentMemberActivities, ...recentSubmissionActivities]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

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
              <p>{hasScoredMatches ? "Leder just nu" : "Inte igång ännu"}</p>
              <strong>
                {hasScoredMatches && leader ? leader.display_name : "Ingen ledare ännu"}
              </strong>
            </div>
          </div>

          <section className="highlights-panel">
            <div className="highlight-card">
              <p>Hetast just nu</p>
              {topClimber ? (
                <>
                  <strong>{topClimber.display_name}</strong>
             <span>
               {"climb" in topClimber && topClimber.climb > 0
                 ? `+${topClimber.climb} placeringar`
                 : "Leder ligan just nu"}
               </span>
                </>
              ) : (
                <>
                  <strong>Inte igång ännu</strong>
                  <span>Visas när tabellen börjar röra på sig.</span>
                </>
              )}
            </div>

            <div className="highlight-card">
              <p>Flest fullträffar</p>
              {exactScoreLeader ? (
                <>
                  <strong>{exactScoreLeader.display_name}</strong>
                  <span>{exactScoreLeader.exactScores} exakta resultat</span>
                </>
              ) : (
                <>
                  <strong>Ingen fullträff ännu</strong>
                  <span>Vaknar när första matcherna är spelade.</span>
                </>
              )}
            </div>
          </section>

          {isMember && (
            <section className="activity-card activity-card-wide">
              <div className="activity-head">
                <p>Senaste i ligan</p>
              </div>

              {activityItems.length === 0 ? (
                <div className="activity-empty">
                  Bjud in fler deltagare så börjar ligan vakna till liv.
                </div>
              ) : (
                <div className="activity-list">
                  {activityItems.map((activity) => (
                    <div key={activity.id} className="activity-row">
                      <span>{activity.icon}</span>
                      <p>{activity.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="content-grid">
            <section className="panel leaderboard-panel">
              <div className="panel-head">
                <div>
                  <p>Leaderboard</p>
                  <h2>Ställning i ligan</h2>
                </div>
              </div>

              {activeStandings.length === 0 ? (
                <div className="empty-state">
                  Inga inskickade tips finns i ligan ännu.
                </div>
              ) : !hasScoredMatches ? (
                <div className="empty-state">
                  Tabellen vaknar när första matchen är spelad. Då börjar poängen räknas och
                  ligans riktiga leaderboard visas här.
                </div>
              ) : (
                <div className="leaderboard-list">
                  {activeStandings.map((row, index) => {
                    const isCurrentUser = row.user_id === user.id;

                    return (
                      <div
                        key={row.user_id}
                        className={`leader-row ${isCurrentUser ? "is-current" : ""}`}
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
              {activeFeaturedMatch && (
                <section className="panel match-picks-panel">
                  <div className="panel-head">
                    <div>
                      <p>
                        {isLiveMatch
                          ? "Live nu"
                          : isFinishedMatch
                            ? "Senaste resultat"
                            : hasFeaturedMatchStarted
                              ? "Aktuell match"
                              : "Nästa match"}
                      </p>
                      <h2>
                        {getSwedishTeamName(activeFeaturedMatch.home_team)} vs{" "}
                        {getSwedishTeamName(activeFeaturedMatch.away_team)}
                      </h2>
                    </div>
                  </div>

                  <p className={isLiveMatch ? "match-time match-live-time" : "match-time"}>
                    {isLiveMatch ? (
                      <>
                        <span className="live-dot-small" />
                        LIVE · {activeFeaturedMatch.home_score ?? 0}–
                        {activeFeaturedMatch.away_score ?? 0}
                      </>
                    ) : isFinishedMatch ? (
                      <>
                        Slutresultat · {activeFeaturedMatch.home_score ?? 0}–
                        {activeFeaturedMatch.away_score ?? 0}
                      </>
                    ) : (
                      <>Avspark {formatKickoff(activeFeaturedMatch.kickoff_utc)}</>
                    )}
                  </p>

                  {!isLiveMatch &&
!isFinishedMatch &&
!hasFeaturedMatchStarted &&
!isNextMatchWithinOneHour ? (
  <div className="locked-picks">
    Tipsen visas en timme före avspark.
  </div>
) : (
                    <div className="match-duel-card">
                      <div className="match-duel-top">
                        <p>Matchduellen</p>
                        <h3>Så här tippade ligan</h3>
                      </div>

                      <div className="duel-insights">
                        <div>
                          <span>{mostCommonResult ? mostCommonResult[0] : "—"}</span>
                          <p>Vanligaste resultat</p>
                        </div>

                        <div>
                          <span>
                            {mostBackedOutcome && mostBackedOutcome.count > 0
                              ? mostBackedOutcome.label
                              : "—"}
                          </span>
                          <p>Flest tror på</p>
                        </div>

                        <div>
                          <span>{uniqueResultCount}</span>
                          <p>ensamma tips</p>
                        </div>
                      </div>

                      <div className="duel-outcome-grid">
                        <div>
                          <strong>{getSwedishTeamName(activeFeaturedMatch.home_team)}</strong>
                          <span>{homeWinPicks.length} tips</span>
                        </div>

                        <div>
                          <strong>Oavgjort</strong>
                          <span>{drawPicks.length} tips</span>
                        </div>

                        <div>
                          <strong>{getSwedishTeamName(activeFeaturedMatch.away_team)}</strong>
                          <span>{awayWinPicks.length} tips</span>
                        </div>
                      </div>

                      <MatchDuelPager picks={duelPagerPicks} />
                    </div>
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

                <div className="invite-actions">
                  <CopyTextButton value={league.invite_code} label="Kopiera kod" />
                </div>

                <div className="invite-divider" />

                <p className="invite-label">Invitelänk</p>

                <div className="invite-small-link">{inviteDisplayUrl}</div>

                <div className="invite-actions">
                  <CopyTextButton value={inviteFullUrl} label="Kopiera länk" />
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

                {pagerMembers.length === 0 ? (
                  <div className="empty-state">Inga medlemmar än.</div>
                ) : (
                  <MembersPager members={pagerMembers} />
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
            .highlight-card {
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

            .activity-card {
              position: relative;
              padding: 22px;
              border-radius: 22px;
              background: rgba(0,0,0,0.20);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .activity-card-wide {
              margin-top: 18px;
            }

            .activity-head p {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .activity-list {
              display: grid;
              gap: 10px;
              margin-top: 18px;
            }

            .activity-row {
              display: grid;
              grid-template-columns: 38px 1fr;
              gap: 12px;
              align-items: center;
              padding: 13px;
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.075);
            }

            .activity-row span {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              background: rgba(255,255,255,0.08);
              font-size: 18px;
            }

            .activity-row p {
              margin: 0;
              color: rgba(255,255,255,0.76);
              font-size: 14px;
              font-weight: 850;
              line-height: 1.35;
            }

            .activity-empty {
              margin-top: 18px;
              padding: 16px;
              border-radius: 16px;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.075);
              color: rgba(255,255,255,0.56);
              font-size: 14px;
              line-height: 1.5;
            }

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

            .invite-actions {
              margin-top: 12px;
            }

            .invite-actions .copy-text-button {
              width: 100%;
            }

            .invite-divider {
              height: 1px;
              margin: 22px 0;
              background: rgba(255,255,255,0.10);
            }

            .invite-label {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .copy-text-button {
              height: 48px;
              padding: 0 16px;
              border: 1px solid rgba(229,185,77,0.24);
              border-radius: 14px;
              background: rgba(229,185,77,0.10);
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              cursor: pointer;
              white-space: nowrap;
            }

            .copy-text-button:hover {
              background: rgba(229,185,77,0.16);
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

            .highlights-panel {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-top: 18px;
            }

            .highlight-card {
              position: relative;
              overflow: hidden;
              padding: 22px;
              border-radius: 24px;
            }

            .highlight-card::before {
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

            .highlight-card p {
              position: relative;
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .highlight-card strong {
              position: relative;
              display: block;
              margin-top: 12px;
              font-size: 28px;
              letter-spacing: -0.04em;
            }

            .highlight-card span {
              position: relative;
              display: block;
              margin-top: 8px;
              color: #e5b94d;
              font-size: 14px;
              font-weight: 900;
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

            .match-live-time {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #fca5a5;
              font-weight: 950;
            }

            .live-dot-small {
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: #ef4444;
              box-shadow: 0 0 0 rgba(239,68,68,0.75);
              animation: leagueLivePulse 1.4s infinite;
            }

            @keyframes leagueLivePulse {
              0% {
                box-shadow: 0 0 0 0 rgba(239,68,68,0.72);
              }

              70% {
                box-shadow: 0 0 0 8px rgba(239,68,68,0);
              }

              100% {
                box-shadow: 0 0 0 0 rgba(239,68,68,0);
              }
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

            .match-duel-card {
              border-radius: 20px;
              background:
                linear-gradient(135deg, rgba(229,185,77,0.10), transparent 42%),
                rgba(255,255,255,0.045);
              border: 1px solid rgba(229,185,77,0.16);
              overflow: hidden;
            }

            .match-duel-top {
              padding: 16px;
              border-bottom: 1px solid rgba(255,255,255,0.08);
            }

            .match-duel-top p {
              margin: 0;
              color: #e5b94d;
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .match-duel-top h3 {
              margin: 6px 0 0;
              color: white;
              font-size: 20px;
              letter-spacing: -0.04em;
            }

            .duel-insights {
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
              padding: 12px;
            }

            .duel-insights div,
            .duel-outcome-grid div {
              padding: 13px;
              border-radius: 16px;
              background: rgba(0,0,0,0.22);
              border: 1px solid rgba(255,255,255,0.07);
            }

            .duel-insights span {
              display: block;
              color: white;
              font-size: 22px;
              font-weight: 950;
              letter-spacing: -0.04em;
            }

            .duel-insights p,
            .duel-outcome-grid span {
              margin: 4px 0 0;
              color: rgba(255,255,255,0.44);
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .duel-outcome-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
              padding: 0 12px 12px;
            }

            .duel-outcome-grid strong {
              display: block;
              color: #e5b94d;
              font-size: 14px;
              line-height: 1.25;
            }

            .picks-list {
  display: grid;
  gap: 8px;
  padding: 0 12px 12px;
}

.duel-picks-list {
  padding-top: 0;
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

.pick-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
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

            .danger-note {
              margin: 12px 0 0;
              color: rgba(255,255,255,0.52);
              font-size: 13px;
              line-height: 1.5;
            }

            .members-pager {
              display: grid;
              grid-template-columns: 46px 1fr 46px;
              gap: 10px;
              align-items: center;
              margin-top: 12px;
            }

            .members-pager button {
              height: 46px;
              border-radius: 14px;
              border: 1px solid rgba(229,185,77,0.24);
              background: rgba(229,185,77,0.08);
              color: #e5b94d;
              font-size: 18px;
              font-weight: 950;
              cursor: pointer;
            }

            .members-pager button:disabled {
              opacity: 0.35;
              cursor: not-allowed;
            }

            .members-pager span {
              height: 46px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              background: rgba(255,255,255,0.045);
              border: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.72);
              font-size: 13px;
              font-weight: 900;
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

.member-actions {
  display: grid;
  gap: 7px;
  justify-items: end;
}

            .view-tips-link {
              height: 28px;
              padding: 0 10px;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: rgba(229,185,77,0.12);
              border: 1px solid rgba(229,185,77,0.24);
              color: #e5b94d;
              text-decoration: none;
              font-size: 11px;
              font-weight: 950;
              white-space: nowrap;
            }

            .view-tips-link:hover {
              background: rgba(229,185,77,0.18);
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

              .activity-card {
                padding: 18px;
              }

              .league-head,
              .content-grid {
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
              .highlights-panel {
                grid-template-columns: 1fr;
              }

              .stat-card strong {
                font-size: 24px;
              }

              .leader-row {
                grid-template-columns: 42px 1fr;
              }

              .member-row span {
  max-width: 190px;
}

              .points {
                grid-column: 2;
              }
            }
          `,
        }}
      />
    </main>
  );
}