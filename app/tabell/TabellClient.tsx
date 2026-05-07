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
};

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

  const leader = standings[0];

  useEffect(() => {
    if (!selectedLeagueId) return;

    async function loadStandings() {
      setIsLoading(true);
      setStatus("");

      const response = await fetch(
        `/api/league-standings?leagueId=${selectedLeagueId}`
      );

      const text = await response.text();

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

    loadStandings();
  }, [selectedLeagueId]);

  const selectedLeagueName = useMemo(() => {
    return leagues.find((league) => league.id === selectedLeagueId)?.name;
  }, [leagues, selectedLeagueId]);

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

              {leagues.length > 1 && (
                <div className="league-switcher">
                  <label htmlFor="league-select">Välj liga</label>
                  <select
                    id="league-select"
                    value={selectedLeagueId}
                    onChange={(event) =>
                      setSelectedLeagueId(event.target.value)
                    }
                  >
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {leagues.length === 1 && (
                <p className="selected-league">{selectedLeagueName}</p>
              )}
            </div>

            <div className="leader-card">
              <p>Leder just nu</p>
              <strong>{leader ? leader.display_name : "Ingen ännu"}</strong>
              <span>{leader ? `${leader.points} poäng` : "0 poäng"}</span>
            </div>
          </div>

          {isLoading && <div className="table-status">Hämtar tabellen...</div>}

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
                    <div className="rank-badge">{index + 1}</div>
                    <h2>{player.display_name}</h2>
                    <p>{player.points} p</p>
                    <span>
                      {player.matchPoints} matchp · {player.bracketPoints} slutspel
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
                  <div key={player.user_id} className="table-row">
                    <div className="placement">
                      <span>{index + 1}</span>
                    </div>

                    <div className="player">
                      <strong>{player.display_name}</strong>
                      <small>{player.playedMatches} räknade matcher</small>
                    </div>

                    <div className="points">{player.points}</div>

                    <div className="stat-cell">
                      <strong>{player.matchPoints}</strong>
                      <small>matchp</small>
                    </div>

                    <div className="stat-cell">
                      <strong>{player.bracketPoints}</strong>
                      <small>slutspel</small>
                    </div>

                    <div className="stat-cell">
                      <strong>{player.exactScores}</strong>
                      <small>fullträffar</small>
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
            }

            .table-row:last-child {
              border-bottom: 0;
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

              .player small {
                display: block;
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