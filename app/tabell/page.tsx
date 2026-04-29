const standings = [
  { id: 1, name: "Max", points: 84, exacts: 6 },
  { id: 2, name: "Linus", points: 79, exacts: 5 },
  { id: 3, name: "Johan", points: 76, exacts: 4 },
  { id: 4, name: "Emil", points: 71, exacts: 4 },
  { id: 5, name: "Anton", points: 68, exacts: 3 },
];

export default function TabellPage() {
  const leader = standings[0];

  return (
    <main className="table-page">
      <section className="table-hero">
        <div className="table-wrap">
          <div className="table-head">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h1>Tabellen.</h1>
              <p className="intro">
                Ställningen i ligan just nu. Här kommer vi senare koppla på
                riktiga poäng, senaste matchen och vem som klättrar mest.
              </p>
            </div>

            <div className="leader-card">
              <p>Leder just nu</p>
              <strong>{leader.name}</strong>
              <span>{leader.points} poäng</span>
            </div>
          </div>

          <div className="podium">
            {standings.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className={`podium-card podium-${index + 1}`}
              >
                <div className="rank-badge">{index + 1}</div>
                <h2>{player.name}</h2>
                <p>{player.points} p</p>
                <span>{player.exacts} fullträffar</span>
              </div>
            ))}
          </div>

          <div className="table-card">
            <div className="table-row table-header">
              <span>Placering</span>
              <span>Namn</span>
              <span>Poäng</span>
              <span>Fullträffar</span>
            </div>

            {standings.map((player, index) => (
              <div key={player.id} className="table-row">
                <div className="placement">
                  <span>{index + 1}</span>
                </div>

                <div className="player">
                  <strong>{player.name}</strong>
                  <small>Spelare</small>
                </div>

                <div className="points">{player.points}</div>

                <div className="exacts">{player.exacts}</div>
              </div>
            ))}
          </div>
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

            .leader-card {
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
              box-shadow: 0 18px 50px rgba(218,169,53,0.22);
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
              grid-template-columns: 140px 1fr 160px 160px;
              gap: 18px;
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

            .player small {
              display: block;
              margin-top: 4px;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 750;
            }

            .points {
              color: #e5b94d;
              font-size: 22px;
              font-weight: 950;
            }

            .exacts {
              color: rgba(255,255,255,0.72);
              font-weight: 850;
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
                grid-template-columns: 48px 1fr auto;
                gap: 12px;
                padding: 16px;
              }

              .placement span {
                width: 38px;
                height: 38px;
              }

              .player small {
                display: none;
              }

              .points {
                font-size: 20px;
              }

              .exacts {
                display: none;
              }
            }
          `,
        }}
      />
    </main>
  );
}