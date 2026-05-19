"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeagueOption } from "./page";

type Standing = {
  user_id: string;
  display_name: string;
  email: string | null;
  points: number;
  matchPoints: number;
  bracketPoints: number;
  exactScores: number;
  playedMatches: number;
  rank: number;
  previousRank: number | null;
  movement: number;
};

const demoStandings: Standing[] = [
  {
    user_id: "demo-1",
    display_name: "Maja",
    email: null,
    points: 142,
    matchPoints: 142,
    bracketPoints: 0,
    exactScores: 12,
    playedMatches: 38,
    rank: 1,
    previousRank: 4,
    movement: 3,
  },
  {
    user_id: "demo-2",
    display_name: "Johan",
    email: null,
    points: 136,
    matchPoints: 136,
    bracketPoints: 0,
    exactScores: 10,
    playedMatches: 38,
    rank: 2,
    previousRank: 1,
    movement: -1,
  },
  {
    user_id: "demo-3",
    display_name: "Sara",
    email: null,
    points: 132,
    matchPoints: 132,
    bracketPoints: 0,
    exactScores: 9,
    playedMatches: 38,
    rank: 3,
    previousRank: 2,
    movement: -1,
  },
  {
    user_id: "demo-4",
    display_name: "Alex",
    email: null,
    points: 129,
    matchPoints: 129,
    bracketPoints: 0,
    exactScores: 11,
    playedMatches: 38,
    rank: 4,
    previousRank: 7,
    movement: 3,
  },
  {
    user_id: "demo-5",
    display_name: "Nina",
    email: null,
    points: 121,
    matchPoints: 121,
    bracketPoints: 0,
    exactScores: 8,
    playedMatches: 38,
    rank: 5,
    previousRank: 3,
    movement: -2,
  },
  {
    user_id: "demo-6",
    display_name: "Oskar",
    email: null,
    points: 118,
    matchPoints: 118,
    bracketPoints: 0,
    exactScores: 7,
    playedMatches: 38,
    rank: 6,
    previousRank: 8,
    movement: 2,
  },
  {
    user_id: "demo-7",
    display_name: "Linnea",
    email: null,
    points: 111,
    matchPoints: 111,
    bracketPoints: 0,
    exactScores: 6,
    playedMatches: 38,
    rank: 7,
    previousRank: 5,
    movement: -2,
  },
  {
    user_id: "demo-8",
    display_name: "David",
    email: null,
    points: 104,
    matchPoints: 104,
    bracketPoints: 0,
    exactScores: 5,
    playedMatches: 38,
    rank: 8,
    previousRank: 6,
    movement: -2,
  },
];
  

export default function TabellClient({
  leagues,
  initialLeagueId,
}: {
  leagues: LeagueOption[];
  initialLeagueId: string;
}) {
  const [selectedLeagueId, setSelectedLeagueId] = useState(initialLeagueId);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isDemoMovement, setIsDemoMovement] = useState(false);

  const leader = standings[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoMode = params.get("demoMovement") === "1";

    setIsDemoMovement(demoMode);

    if (demoMode) {
      setStandings(demoStandings);
      setStatus("");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLeagueId || isDemoMovement) return;

    let isActive = true;

    async function loadStandings(showLoading = false) {
      if (showLoading) setIsLoading(true);

      setStatus("");

      const response = await fetch(
        `/api/league-standings?leagueId=${selectedLeagueId}`,
        { cache: "no-store" }
      );

      const text = await response.text();

      if (!isActive) return;

      if (!response.ok) {
        setStatus(text || "Kunde inte hämta tabellen.");
        setStandings([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = JSON.parse(text);
        setStandings(data.standings ?? []);
      } catch {
        setStatus("Kunde inte läsa tabellen.");
        setStandings([]);
      }

      setIsLoading(false);
    }

    loadStandings(true);

    const interval = window.setInterval(() => {
      loadStandings(false);
    }, 30000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [selectedLeagueId, isDemoMovement]);

  const selectedLeagueName = useMemo(() => {
    if (isDemoMovement) return "Demo League";
    return leagues.find((league) => league.id === selectedLeagueId)?.name;
  }, [leagues, selectedLeagueId, isDemoMovement]);

  function renderMovement(player: Standing) {
    if (player.movement > 0) {
      return <span className="movement up">↑ {player.movement}</span>;
    }

    if (player.movement < 0) {
      return <span className="movement down">↓ {Math.abs(player.movement)}</span>;
    }

    if (player.previousRank) {
      return <span className="movement same">—</span>;
    }

    return null;
  }

  return (
    <main className="table-page">
      <section className="table-hero">
        <div className="table-wrap">
          <div className="table-head">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h1>Tabellen.</h1>
              <p className="intro">
                Följ ställningen i ligan. Totalpoängen består av matchpoäng,
                slutspelspoäng och fullträffar från inskickade tips.
              </p>

              {isDemoMovement && (
                <div className="demo-notice">
                  Demo-läge: movement visas med fejkade spelare. Databasen påverkas inte.
                </div>
              )}

              {!isDemoMovement && leagues.length > 1 && (
                <div className="league-switcher">
                  <label htmlFor="league-select">Välj liga</label>
                  <select
                    id="league-select"
                    value={selectedLeagueId}
                    onChange={(event) => setSelectedLeagueId(event.target.value)}
                  >
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(isDemoMovement || leagues.length === 1) && (
                <p className="selected-league">{selectedLeagueName}</p>
              )}
            </div>

            <div className="leader-card">
              <p>Leder just nu</p>
              <strong>{leader ? leader.display_name : "Ingen ännu"}</strong>
              <span>{leader ? `${leader.points} poäng` : "0 poäng"}</span>
              <small className="live-refresh">
                {isDemoMovement ? "Demo-data" : "Uppdateras automatiskt"}
              </small>
            </div>
          </div>

          {isLoading && !isDemoMovement && (
  <div className="table-status">Hämtar tabellen...</div>
)}

          {!isLoading && status && <div className="table-status">{status}</div>}

          {!isLoading && !status && standings.length === 0 && (
            <div className="table-status">
              Inga inskickade tips finns i den här ligan ännu.
            </div>
          )}

          {standings.length > 0 && (
            <>
              <div className="podium">
                {standings.slice(0, 3).map((player, index) => (
                  <div
                    key={player.user_id}
                    className={`podium-card podium-${index + 1}`}
                  >
                    <div className="rank-badge">{player.rank}</div>
                    <h2>{player.display_name}</h2>
<div className="podium-movement">{renderMovement(player)}</div>
                    <p>{player.points} p</p>
                    <span>
  {player.matchPoints} matchpoäng · {player.bracketPoints} slutspel ·{" "}
  {player.exactScores} fullträffar
</span>
                  </div>
                ))}
              </div>

              <div className="table-card">
                <div className="table-row table-header">
                  <span>Placering</span>
                  <span>Spelare</span>
                  <span>Total</span>
                  <span>Matcher</span>
                  <span>Slutspel</span>
                  <span>Fullträffar</span>
                </div>

                {standings.map((player, index) => (
                  <div
                    key={player.user_id}
                    className={`table-row ${index < 3 ? `top-${index + 1}` : ""}`}
                  >
                    <div className="placement">
                      <span>{player.rank}</span>
                    </div>

                    <div className="player">
                      <div className="player-top">
                        <strong>{player.display_name}</strong>
                        {renderMovement(player)}
                      </div>
                      <small>{player.playedMatches} räknade matcher</small>
                    </div>

                    <div className="points">{player.points}</div>

                    <div className="stat-cell">
  <strong>{player.matchPoints}</strong>
</div>

<div className="stat-cell">
  <strong>{player.bracketPoints}</strong>
</div>

<div className="stat-cell">
  <strong>{player.exactScores}</strong>
</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .table-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .table-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.74) 0%, rgba(2,3,4,0.96) 340px, #020304 100%),
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.70) 58%, rgba(2,3,4,0.94) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .table-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 74% 14%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 18% 12%, rgba(255,255,255,0.07), transparent 22%);
            }

            .table-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 72px 24px 70px;
            }

            .table-head {
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

            .table-head h1 {
              margin: 0;
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

            .demo-notice {
              margin-top: 22px;
              max-width: 560px;
              padding: 14px 16px;
              border-radius: 18px;
              background: rgba(229,185,77,0.10);
              border: 1px solid rgba(229,185,77,0.24);
              color: rgba(255,255,255,0.78);
              font-size: 14px;
              font-weight: 750;
              line-height: 1.5;
            }

            .league-switcher {
              margin-top: 24px;
              display: flex;
              flex-direction: column;
              gap: 8px;
              max-width: 320px;
            }

            .league-switcher label,
            .selected-league {
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .selected-league {
              margin-top: 24px;
              color: #e5b94d;
            }

            .league-switcher select {
              height: 46px;
              padding: 0 16px;
              border-radius: 999px;
              border: 1px solid rgba(255,255,255,0.14);
              background: rgba(5,12,18,0.86);
              color: white;
              font-size: 14px;
              font-weight: 850;
              outline: none;
            }

            .leader-card,
            .table-status {
              padding: 22px;
              border-radius: 22px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .leader-card p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .leader-card strong {
              display: block;
              margin-top: 12px;
              font-size: 34px;
              letter-spacing: -0.04em;
            }

            .leader-card span {
              display: block;
              margin-top: 8px;
              color: #e5b94d;
              font-size: 15px;
              font-weight: 950;
            }

            .live-refresh {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              margin-top: 14px;
              color: rgba(255,255,255,0.46);
              font-size: 12px;
              font-weight: 850;
            }

            .live-refresh::before {
              content: "";
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: #86efac;
              box-shadow: 0 0 18px rgba(134,239,172,0.55);
            }

            .table-status {
              margin-top: 32px;
              color: rgba(255,255,255,0.68);
              font-size: 15px;
              font-weight: 750;
            }

            .podium {
              display: grid;
              grid-template-columns: 1fr 1.12fr 1fr;
              gap: 16px;
              align-items: end;
              margin-top: 46px;
            }

            .podium-card {
              position: relative;
              min-height: 190px;
              padding: 24px;
              border-radius: 26px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
              overflow: hidden;
            }

            .podium-card::before {
              content: "";
              position: absolute;
              inset: -80px -80px auto auto;
              width: 180px;
              height: 180px;
              border-radius: 999px;
              background: rgba(229,185,77,0.16);
              filter: blur(30px);
            }

            .podium-1 {
              min-height: 230px;
              border-color: rgba(229,185,77,0.30);
            }

            .podium-movement {
  position: relative;
  margin-top: 10px;
  min-height: 24px;
}

            .rank-badge {
              position: relative;
              width: 44px;
              height: 44px;
              display: grid;
              place-items: center;
              border-radius: 999px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 16px;
              font-weight: 950;
            }

            .podium-card h2 {
              position: relative;
              margin: 34px 0 0;
              font-size: 30px;
              letter-spacing: -0.04em;
            }

            .podium-card p {
              position: relative;
              margin: 8px 0 0;
              color: #e5b94d;
              font-size: 22px;
              font-weight: 950;
            }

            .podium-card span {
              position: relative;
              display: block;
              margin-top: 10px;
              color: rgba(255,255,255,0.48);
              font-size: 14px;
              font-weight: 750;
            }

            .table-card {
              margin-top: 18px;
              overflow: hidden;
              border-radius: 26px;
              background: rgba(5,12,18,0.78);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 22px 80px rgba(0,0,0,0.30);
              backdrop-filter: blur(18px);
            }

            .table-row {
              display: grid;
              grid-template-columns: 110px 1.3fr 110px 120px 120px 120px;
              gap: 16px;
              align-items: center;
              padding: 18px 24px;
              border-bottom: 1px solid rgba(255,255,255,0.075);
              transition: background 160ms ease, transform 160ms ease, border-color 160ms ease;
            }

            .table-row:last-child {
              border-bottom: 0;
            }

            .table-row:hover {
              transform: translateX(4px);
              background: rgba(255,255,255,0.055);
            }

            .table-row.top-1 {
              background: rgba(229,185,77,0.10);
              border-left: 3px solid #f3cf69;
            }

            .table-row.top-2 {
              background: rgba(255,255,255,0.055);
              border-left: 3px solid #d1d5db;
            }

            .table-row.top-3 {
              background: rgba(180,120,60,0.08);
              border-left: 3px solid #c08457;
            }

            .table-header {
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              background: rgba(255,255,255,0.035);
            }

            .placement span {
              width: 38px;
              height: 38px;
              display: grid;
              place-items: center;
              border-radius: 999px;
              background: rgba(255,255,255,0.08);
              color: white;
              font-size: 14px;
              font-weight: 950;
            }

            .player-top {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
            }

            .player strong {
              display: block;
              font-size: 17px;
            }

            .player small,
            .stat-cell small {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 750;
            }

            .points {
              color: #e5b94d;
              font-size: 24px;
              font-weight: 950;
            }

            .stat-cell strong {
              color: rgba(255,255,255,0.82);
              font-size: 17px;
              font-weight: 950;
            }

            .movement {
              height: 24px;
              min-width: 24px;
              padding: 0 9px;
              border-radius: 999px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 950;
              letter-spacing: 0.04em;
            }

            .movement.up {
              background: rgba(34,197,94,0.16);
              color: #4ade80;
              border: 1px solid rgba(34,197,94,0.25);
            }

            .movement.down {
              background: rgba(239,68,68,0.14);
              color: #f87171;
              border: 1px solid rgba(239,68,68,0.24);
            }

            .movement.same {
              background: rgba(255,255,255,0.06);
              color: rgba(255,255,255,0.48);
              border: 1px solid rgba(255,255,255,0.08);
            }

            @media (max-width: 900px) {
              .table-wrap {
                padding: 56px 18px 46px;
              }

              .table-head {
                grid-template-columns: 1fr;
                gap: 24px;
              }

              .table-head h1 {
                font-size: 46px;
              }

              .intro {
                font-size: 16px;
                max-width: 350px;
              }

              .podium {
                grid-template-columns: 1fr;
                margin-top: 30px;
              }

              .podium-card,
              .podium-1 {
                min-height: auto;
              }

              .table-card {
                margin-top: 16px;
                border-radius: 22px;
              }

              .table-header {
                display: none;
              }

              .table-row {
                grid-template-columns: 46px 1fr auto;
                gap: 12px;
                padding: 16px;
              }

              .points {
                font-size: 22px;
              }

              .stat-cell {
                display: none;
              }
            }
          `,
        }}
      />
    </main>
  );
}