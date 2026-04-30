"use client";

import { useState } from "react";
import type { Match } from "./page";

const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

type Tab = string | "slutspel" | "bonus";

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function TippaClient({
  matches,
  hasError,
}: {
  matches: Match[];
  hasError: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("A");

  const activeMatches = matches.filter(
    (match) => match.group_name === activeTab
  );

  return (
    <main className="tips-page">
      <section className="tips-hero">
        <div className="tips-wrap">
          <div className="tips-head">
            <div>
              <p className="eyebrow">VM 2026</p>
              <h1>Tippa gruppspelet.</h1>
              <p className="intro">
                Välj grupp, fyll i dina resultat och bygg ditt VM-tips steg för
                steg. Slutspel och bonusfrågor kommer efter gruppspelet.
              </p>
            </div>

            <div className="hero-panel">
              <p>Nästa deadline</p>
              <strong>60 min före avspark</strong>
              <span>Tips kan ändras fram till varje match låses.</span>
            </div>
          </div>

          {hasError && (
            <div className="error-box">Kunde inte hämta matcher.</div>
          )}

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
              <span>104</span>
              <p>matcher totalt i VM</p>
            </div>
          </div>

          <nav className="tips-tabs">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveTab(group)}
                className={activeTab === group ? "active" : ""}
              >
                Grupp {group}
              </button>
            ))}

            <button
              onClick={() => setActiveTab("slutspel")}
              className={activeTab === "slutspel" ? "active" : ""}
            >
              Slutspel
            </button>

            <button
              onClick={() => setActiveTab("bonus")}
              className={activeTab === "bonus" ? "active" : ""}
            >
              Bonusfrågor
            </button>
          </nav>

          {activeTab === "slutspel" ? (
            <section className="placeholder-panel">
              <p>Slutspel</p>
              <h2>Här byggs ditt slutspel automatiskt.</h2>
              <span>
                När gruppspelet är tippat räknar vi fram tabellerna och skapar
                din bracket.
              </span>
            </section>
          ) : activeTab === "bonus" ? (
            <section className="placeholder-panel">
              <p>Bonusfrågor</p>
              <h2>Extra poäng kommer här.</h2>
              <span>
                Exempel: vinnare, skyttekung, flest mål och andra turneringsfrågor.
              </span>
            </section>
          ) : (
            <section className="group-block">
              <div className="group-heading">
                <div>
                  <p>Aktiv grupp</p>
                  <h2>Grupp {activeTab}</h2>
                </div>
                <span>{activeMatches.length} matcher</span>
              </div>

              <div className="match-list">
                {activeMatches.map((match) => (
                  <article key={match.id} className="match-card">
                    <div className="match-top">
                      <span>Match {match.fifa_match_number}</span>
                      <time>{formatKickoff(match.kickoff_utc)}</time>
                    </div>

                    <div className="match-main">
                      <div className="team">
                        <strong>{match.home_team}</strong>
                        <small>{match.home_team_code}</small>
                      </div>

                      <div className="score">
                        <input inputMode="numeric" placeholder="-" />
                        <span>:</span>
                        <input inputMode="numeric" placeholder="-" />
                      </div>

                      <div className="team away">
                        <strong>{match.away_team}</strong>
                        <small>{match.away_team_code}</small>
                      </div>
                    </div>

                    <div className="match-bottom">
                      <span>{match.city || "Arena kommer senare"}</span>
                      <span>{match.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <style jsx>{`
        .tips-page {
          min-height: 100vh;
          background: #020304;
          color: white;
        }

        .tips-hero {
          min-height: calc(100vh - 73px);
          background-image:
            linear-gradient(180deg, rgba(2,3,4,0.76), #020304 520px),
            url('/stadium.jpg');
          background-size: cover;
          background-position: center top;
        }

        .tips-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 72px 24px;
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

        h1 {
          margin: 0;
          font-size: clamp(46px, 6vw, 82px);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .intro {
          max-width: 620px;
          margin-top: 22px;
          color: rgba(255,255,255,0.68);
          font-size: 17px;
          line-height: 1.6;
        }

        .hero-panel,
        .match-toolbar div,
        .match-card,
        .placeholder-panel {
          background: rgba(5,12,18,0.78);
          border: 1px solid rgba(255,255,255,0.11);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.3);
        }

        .hero-panel {
          padding: 22px;
          border-radius: 22px;
        }

        .hero-panel p,
        .placeholder-panel p,
        .group-heading p {
          margin: 0;
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .hero-panel strong {
          display: block;
          margin-top: 12px;
          color: #e5b94d;
          font-size: 25px;
        }

        .hero-panel span,
        .placeholder-panel span {
          display: block;
          margin-top: 10px;
          color: rgba(255,255,255,0.54);
          line-height: 1.5;
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
        }

        .match-toolbar span {
          display: block;
          color: #e5b94d;
          font-size: 24px;
          font-weight: 950;
        }

        .match-toolbar p {
          margin: 4px 0 0;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
        }

        .tips-tabs {
          position: sticky;
          top: 73px;
          z-index: 20;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin: 22px -24px 0;
          padding: 14px 24px;
          background: rgba(2,3,4,0.78);
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
        }

        .tips-tabs button {
          flex: 0 0 auto;
          height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.72);
          font-weight: 900;
          cursor: pointer;
        }

        .tips-tabs button.active {
          background: linear-gradient(180deg, #f3cf69, #d9a935);
          color: #090909;
          border-color: transparent;
        }

        .group-block {
          margin-top: 28px;
        }

        .group-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .group-heading h2,
        .placeholder-panel h2 {
          margin: 6px 0 0;
          font-size: 36px;
          letter-spacing: -0.05em;
        }

        .group-heading span {
          color: rgba(255,255,255,0.48);
          font-size: 13px;
          font-weight: 800;
        }

        .match-list {
          display: grid;
          gap: 12px;
        }

        .match-card {
          padding: 18px;
          border-radius: 22px;
        }

        .match-top,
        .match-bottom {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          font-weight: 800;
        }

        .match-main {
          display: grid;
          grid-template-columns: 1fr 120px 1fr;
          gap: 18px;
          align-items: center;
          margin-top: 14px;
        }

        .team strong {
          display: block;
          font-size: 20px;
          letter-spacing: -0.03em;
        }

        .team small {
          display: block;
          margin-top: 5px;
          color: rgba(255,255,255,0.38);
          font-size: 12px;
          font-weight: 900;
        }

        .away {
          text-align: right;
        }

        .score {
          display: grid;
          grid-template-columns: 42px 1fr 42px;
          gap: 6px;
          align-items: center;
        }

        .score input {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.08);
          color: white;
          text-align: center;
          font-size: 18px;
          font-weight: 950;
          outline: none;
        }

        .score input:focus {
          border-color: rgba(229,185,77,0.8);
          box-shadow: 0 0 0 3px rgba(229,185,77,0.12);
        }

        .score span {
          text-align: center;
          color: rgba(255,255,255,0.42);
          font-weight: 950;
        }

        .match-bottom {
          margin-top: 14px;
        }

        .placeholder-panel {
          margin-top: 28px;
          padding: 28px;
          border-radius: 24px;
        }

        .error-box {
          margin-top: 24px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(127,29,29,0.25);
          border: 1px solid rgba(248,113,113,0.3);
          color: #fca5a5;
        }

        @media (max-width: 900px) {
          .tips-wrap {
            padding: 48px 16px;
          }

          .tips-head {
            grid-template-columns: 1fr;
          }

          .match-toolbar {
            grid-template-columns: 1fr;
          }

          .tips-tabs {
            margin-left: -16px;
            margin-right: -16px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .match-main {
            grid-template-columns: 1fr;
          }

          .away {
            text-align: left;
          }

          .score {
            width: 120px;
          }
        }
      `}</style>
    </main>
  );
}