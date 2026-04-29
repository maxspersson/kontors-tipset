export default function ReglerPage() {
  return (
    <main className="rules-page">
      <section className="rules-hero">
        <div className="rules-wrap">
          <div className="rules-head">
            <div>
              <p className="eyebrow">Regler</p>
              <h1>Poäng & spelregler.</h1>
              <p className="intro">
                Allt du behöver veta för att delta i VM-tipset. Enkelt att fatta –
                svårt att vinna.
              </p>
            </div>

            <div className="deadline-card">
              <p>Tips låses</p>
              <strong>10 juni 2026</strong>
              <span>23:59</span>
              <small>Slutspel & bonus låses helt</small>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="rules-section">
            <h2>Så funkar det</h2>

            <div className="rules-grid">
              <div className="rule-card">
                <strong>1</strong>
                <p>
                  Du lämnar in hela ditt VM-tips senast{" "}
                  <b>10 juni 2026 kl. 23:59</b>.
                </p>
              </div>

              <div className="rule-card">
                <strong>2</strong>
                <p>
                  Efter deadline låses slutspel och bonusfrågor – men matcher kan
                  fortfarande justeras.
                </p>
              </div>

              <div className="rule-card">
                <strong>3</strong>
                <p>
                  Varje match låses <b>60 minuter före avspark</b>. Därefter kan
                  den inte ändras.
                </p>
              </div>
            </div>
          </div>

          {/* MATCH POINTS */}
          <div className="rules-section">
            <h2>Poäng per match</h2>

            <div className="points-card highlight">
              <div className="points-main">
                <span>7 p</span>
                <p>max per match</p>
              </div>

              <div className="points-list">
                <div>
                  <strong>2 p</strong>
                  <span>Rätt antal mål (hemmalag)</span>
                </div>
                <div>
                  <strong>2 p</strong>
                  <span>Rätt antal mål (bortalag)</span>
                </div>
                <div>
                  <strong>3 p</strong>
                  <span>Rätt tecken (1X2)</span>
                </div>
              </div>
            </div>
          </div>

          {/* PLAYOFF */}
          <div className="rules-section">
            <h2>Slutspel</h2>

            <div className="points-grid">
              {[
                ["Åttondelsfinal", "2 p / lag"],
                ["Kvartsfinal", "4 p / lag"],
                ["Semifinal", "6 p / lag"],
                ["Final", "8 p / lag"],
              ].map(([label, value]) => (
                <div key={label} className="points-box">
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* BONUS */}
          <div className="rules-section">
            <h2>Bonusfrågor</h2>

            <div className="points-grid">
              {[
                ["Skyttekung", "20 p"],
                ["Världsmästare", "20 p"],
                ["Flest mål i gruppspelet", "10 p"],
                ["Släpper in flest mål", "10 p"],
                ["Egen bonus 1", "15 p"],
                ["Egen bonus 2", "15 p"],
              ].map(([label, value]) => (
                <div key={label} className="points-box">
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div className="rules-section">
            <h2>Bra att veta</h2>

            <div className="info-box">
              <ul>
                <li>
                  Slutspelstips och bonusfrågor kan inte ändras efter deadline.
                </li>
                <li>
                  Bonuspoäng delas ut när respektive del av turneringen är färdigspelad.
                </li>
                <li>
                  Bestäm i förväg om matcher avgörs efter 90 min, förlängning eller straffar.
                </li>
                <li>
                  Tipsgeneralen avgör eventuella specialfall.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .rules-page {
              min-height: 100vh;
              background: #020304;
              color: white;
            }

            .rules-hero {
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.74) 0%, rgba(2,3,4,0.96) 340px, #020304 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center;
            }

            .rules-wrap {
              max-width: 1100px;
              margin: 0 auto;
              padding: 72px 24px;
            }

            .rules-head {
              display: grid;
              grid-template-columns: 1fr 280px;
              gap: 40px;
              align-items: end;
            }

            .eyebrow {
              color: #e5b94d;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.16em;
            }

            h1 {
              font-size: clamp(42px, 5vw, 72px);
              margin: 10px 0;
            }

            .intro {
              color: rgba(255,255,255,0.65);
            }

            .deadline-card {
              padding: 20px;
              border-radius: 20px;
              background: rgba(5,12,18,0.8);
              border: 1px solid rgba(255,255,255,0.1);
            }

            .deadline-card strong {
              display: block;
              font-size: 24px;
              color: #e5b94d;
            }

            .rules-section {
              margin-top: 60px;
            }

            .rules-grid {
              display: grid;
              gap: 16px;
              margin-top: 20px;
            }

            .rule-card {
              padding: 18px;
              border-radius: 16px;
              background: rgba(255,255,255,0.05);
            }

            .rule-card strong {
              font-size: 20px;
              color: #e5b94d;
            }

            .points-card {
              padding: 24px;
              border-radius: 20px;
              background: rgba(5,12,18,0.8);
              border: 1px solid rgba(255,255,255,0.1);
              display: grid;
              gap: 20px;
            }

            .points-main span {
              font-size: 42px;
              color: #e5b94d;
            }

            .points-list div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }

            .points-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 14px;
              margin-top: 20px;
            }

            .points-box {
              padding: 18px;
              border-radius: 14px;
              background: rgba(255,255,255,0.05);
            }

            .points-box strong {
              color: #e5b94d;
            }

            .info-box {
              padding: 20px;
              border-radius: 16px;
              background: rgba(255,255,255,0.05);
            }

            ul {
              margin: 0;
              padding-left: 18px;
              line-height: 1.6;
            }

            @media (max-width: 800px) {
              .rules-head {
                grid-template-columns: 1fr;
              }
            }
          `,
        }}
      />
    </main>
  );
}