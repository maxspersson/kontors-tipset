import Container from "@/app/components/Container";

export default function RulesPage() {
  return (
    <main className="rules-page">
      <section className="rules-hero">
        <div className="rules-wrap">
          <p className="eyebrow">Regler</p>

          <h1>Så funkar Kontors-tipset</h1>

          <p className="intro">
            Tippa alla matcher i VM 2026, bygg ditt slutspel och tävla mot
            kollegor, vänner eller familj. Här är reglerna du behöver ha koll på
            innan du skickar in ditt tips.
          </p>
        </div>
      </section>

      <section className="rules-content">
        <Container>
          <div className="top-summary">
            <div>
              <p>Deadline</p>
              <strong>10 juni 2026 · 23:59</strong>
              <span>Hela VM-tipset ska vara inskickat.</span>
            </div>

            <div>
              <p>Matchlås</p>
              <strong>60 minuter</strong>
              <span>Gruppspelsmatcher låses före avspark.</span>
            </div>

            <div>
              <p>Max per match</p>
              <strong>7 poäng</strong>
              <span>Rätt mål + rätt tecken.</span>
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <p>Steg för steg</p>
              <h2>1. Så spelar du</h2>
            </div>

            <div className="steps">
              <div>
                <span>01</span>
                <h3>Fyll i gruppspelet</h3>
                <p>
                  Tippa resultat i alla 72 gruppspelsmatcher. Dina resultat
                  bygger tabellerna automatiskt.
                </p>
              </div>

              <div>
                <span>02</span>
                <h3>Bygg slutspel</h3>
                <p>
                  När gruppspelet är ifyllt skapas ditt slutspel utifrån dina
                  egna grupptabeller.
                </p>
              </div>

              <div>
                <span>03</span>
                <h3>Tippa slutspelet</h3>
                <p>
                  Fyll i resultat i varje slutspelsmatch. Vinnarna går vidare i
                  ditt bracket automatiskt.
                </p>
              </div>

              <div>
                <span>04</span>
                <h3>Skicka in tipset</h3>
                <p>
                  När alla 104 matcher är ifyllda kan du skicka in och låsa ditt
                  turneringstips.
                </p>
              </div>
            </div>
          </div>

          <div className="section highlight">
            <div className="section-head">
              <p>Viktig deadline</p>
              <h2>2. När låses tipset?</h2>
            </div>

            <div className="deadline-card">
              <p className="deadline-label">Hela tipset ska skickas in senast</p>
              <p className="deadline-date">10 juni 2026 · 23:59</p>
              <p className="deadline-text">
                Då låses ditt slutspel baserat på dina gruppresultat. Efter
  deadline kan slutspelet inte ändras.
              </p>
            </div>

            <div className="rule-note">
              <strong>Efter deadline kan du fortfarande ändra gruppspel.</strong>
              <span>
                Gruppspelsmatcher kan ändras fram till 60 minuter före respektive
                avspark. Det påverkar dina matchpoäng, men inte ditt låsta
                slutspel.
              </span>
            </div>
          </div>

          <div className="section">
  <div className="section-head">
    <p>Poäng</p>
    <h2>3. Poängsystem</h2>
  </div>

  <div className="points-grid">
    <div className="card main-card">
      <p className="card-label">Matcher</p>
      <h3>Resultatpoäng</h3>

      <ul>
        <li>
          <strong>2 p</strong> för rätt antal mål för hemmalaget
        </li>
        <li>
          <strong>2 p</strong> för rätt antal mål för bortalaget
        </li>
        <li>
          <strong>3 p</strong> för rätt tecken, alltså rätt vinnare eller oavgjort
        </li>
        <li>
          <strong>Max 7 p</strong> per match
        </li>
      </ul>

      <div className="example-box">
        <p>Gruppspel</p>
        <span>
          I gruppspelet räknas resultatet efter ordinarie tid, alltså 90 minuter
          plus eventuell stopptid.
        </span>
      </div>

      <div className="example-box">
        <p>Slutspel</p>
        <span>
          I slutspelet räknas resultatet efter spelad matchtid, alltså 90 minuter
          plus eventuell förlängning. Straffar räknas inte in i målresultatet.
        </span>
      </div>
    </div>

    <div className="card">
      <p className="card-label">Slutspelsbonus</p>
      <h3>Rätt lag i rätt runda</h3>

      <ul>
        <li>
          <strong>2 p</strong> per rätt lag i åttondelsfinal
        </li>
        <li>
          <strong>4 p</strong> per rätt lag i kvartsfinal
        </li>
        <li>
          <strong>6 p</strong> per rätt lag i semifinal
        </li>
        <li>
          <strong>8 p</strong> per rätt lag i final
        </li>
        <li>
          <strong>20 p</strong> för rätt VM-vinnare
        </li>
      </ul>

      <div className="example-box">
        <p>Vid oavgjort i slutspel</p>
        <span>
          Om du tippar oavgjort efter spelad matchtid väljer du vilket lag som
          går vidare efter straffläggning. Det valet används för att bygga vidare
          ditt slutspel.
        </span>
      </div>
    </div>
  </div>
</div>

          <div className="section warning">
            <div className="section-head">
              <p>Viktigast att förstå</p>
              <h2>4. Slutspel och gruppspel hänger ihop</h2>
            </div>

            <div className="warning-card">
              <h3>Ditt slutspel baseras på dina gruppresultat vid deadline.</h3>

              <p>
                När deadline passerat låses ditt slutspel utifrån de
  gruppresultat du hade vid inskickning. Om du senare ändrar ett
  gruppspelsresultat fortsätter du samla poäng för matchen, men
  ditt slutspel ändras inte.

              </p>

              <div className="yes-no-grid">
                <div>
                  <strong>✔ Du kan fortfarande få matchpoäng</strong>
                  <span>
                    Gruppspelsmatcher kan justeras fram till 60 minuter före
                    avspark.
                  </span>
                </div>

                <div>
                  <strong>✕ Slutspelet ändras inte</strong>
                  <span>
                    Bracket och slutspelslag är låsta från din inskickade
                    snapshot.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <p>Övrigt</p>
              <h2>5. Bra att veta</h2>
            </div>

            <div className="card">
              <ul>
               <li>Gruppspelsmatcher kan ändras fram till 60 minuter före avspark.</li>
<li>Slutspelet låses när du skickar in hela tipset.</li>
                <li>
                  Matchpoäng räknas när ett faktiskt resultat finns registrerat.
                </li>
                <li>
  Gruppspel räknas efter ordinarie tid, alltså 90 minuter plus eventuell stopptid.
</li>
<li>
  Slutspel räknas efter spelad matchtid, alltså 90 minuter plus eventuell förlängning.
</li>
<li>
  Straffläggning används bara för att avgöra vilket lag som går vidare, inte för matchpoäng.
</li>
                <li>
                  Tabellen uppdateras utifrån inskickade tips och spelade matcher.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .rules-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .rules-hero {
              position: relative;
              padding: 92px 20px 56px;
              text-align: center;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.62), #020304 86%),
                linear-gradient(90deg, rgba(2,3,4,0.92), rgba(2,3,4,0.62)),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center top;
            }

            .rules-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 50% 10%, rgba(229,185,77,0.24), transparent 26%),
                radial-gradient(circle at 18% 18%, rgba(255,255,255,0.07), transparent 22%);
            }

            .rules-wrap {
              position: relative;
              z-index: 1;
              max-width: 760px;
              margin: 0 auto;
            }

            .eyebrow,
            .section-head p,
            .card-label,
            .deadline-label {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            h1 {
              margin: 18px 0 0;
              font-size: clamp(46px, 6vw, 76px);
              line-height: 1;
              font-weight: 950;
              letter-spacing: -0.06em;
            }

            .intro {
              margin: 22px auto 0;
              max-width: 640px;
              color: rgba(255,255,255,0.72);
              font-size: 17px;
              line-height: 1.7;
            }

            .rules-content {
              padding: 10px 0 86px;
            }

            .top-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-top: -26px;
              position: relative;
              z-index: 2;
            }

            .top-summary div,
            .steps div,
            .card,
            .deadline-card,
            .rule-note,
            .warning-card {
              background: rgba(5,12,18,0.82);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.34);
              backdrop-filter: blur(18px);
            }

            .top-summary div {
              padding: 20px;
              border-radius: 22px;
            }

            .top-summary p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .top-summary strong {
              display: block;
              margin-top: 10px;
              color: #e5b94d;
              font-size: 24px;
              letter-spacing: -0.03em;
            }

            .top-summary span {
              display: block;
              margin-top: 8px;
              color: rgba(255,255,255,0.56);
              font-size: 14px;
              line-height: 1.45;
            }

            .section {
              margin-top: 56px;
            }

            .section-head {
              margin-bottom: 18px;
            }

            .section-head h2 {
              margin: 6px 0 0;
              font-size: clamp(30px, 4vw, 42px);
              line-height: 1.05;
              letter-spacing: -0.05em;
            }

            .steps {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
            }

            .steps div {
              min-height: 210px;
              padding: 22px;
              border-radius: 22px;
            }

            .steps span {
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.12em;
            }

            .steps h3 {
              margin: 30px 0 8px;
              font-size: 20px;
              font-weight: 950;
              letter-spacing: -0.04em;
            }

            .steps p {
              margin: 0;
              color: rgba(255,255,255,0.58);
              font-size: 14px;
              line-height: 1.5;
            }

            .deadline-card {
              padding: 26px;
              border-radius: 24px;
              border-color: rgba(229,185,77,0.24);
              background:
                linear-gradient(180deg, rgba(229,185,77,0.14), rgba(5,12,18,0.86));
            }

            .deadline-date {
              margin: 10px 0 0;
              color: white;
              font-size: clamp(30px, 5vw, 48px);
              font-weight: 950;
              letter-spacing: -0.05em;
            }

            .deadline-text {
              max-width: 720px;
              margin: 12px 0 0;
              color: rgba(255,255,255,0.68);
              font-size: 16px;
              line-height: 1.6;
            }

            .rule-note {
              display: grid;
              gap: 8px;
              margin-top: 14px;
              padding: 20px;
              border-radius: 20px;
              border-color: rgba(229,185,77,0.18);
            }

            .rule-note strong {
              color: #e5b94d;
              font-size: 16px;
            }

            .rule-note span {
              color: rgba(255,255,255,0.64);
              line-height: 1.55;
            }

            .points-grid {
              display: grid;
              grid-template-columns: 1.15fr 0.85fr;
              gap: 16px;
            }

            .card {
              padding: 24px;
              border-radius: 22px;
            }

            .card h3 {
              margin: 8px 0 12px;
              font-size: 24px;
              letter-spacing: -0.04em;
            }

            ul {
              margin: 12px 0 0;
              padding-left: 20px;
              color: rgba(255,255,255,0.76);
              line-height: 1.6;
            }

            li {
              margin-bottom: 8px;
            }

            li strong {
              color: #e5b94d;
            }

            .example-box {
              margin-top: 18px;
              padding: 16px;
              border-radius: 16px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .example-box p {
              margin: 0 0 6px;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .example-box span {
              color: rgba(255,255,255,0.66);
              font-size: 14px;
              line-height: 1.55;
            }

            .warning-card {
              padding: 26px;
              border-radius: 24px;
              border-color: rgba(229,185,77,0.28);
              background:
                linear-gradient(180deg, rgba(229,185,77,0.10), rgba(5,12,18,0.86));
            }

            .warning-card h3 {
              margin: 0;
              font-size: 26px;
              letter-spacing: -0.04em;
            }

            .warning-card p {
              margin: 14px 0 0;
              max-width: 800px;
              color: rgba(255,255,255,0.68);
              font-size: 16px;
              line-height: 1.65;
            }

            .yes-no-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-top: 22px;
            }

            .yes-no-grid div {
              padding: 18px;
              border-radius: 18px;
              background: rgba(255,255,255,0.055);
              border: 1px solid rgba(255,255,255,0.08);
            }

            .yes-no-grid strong {
              display: block;
              color: white;
              font-size: 16px;
            }

            .yes-no-grid span {
              display: block;
              margin-top: 8px;
              color: rgba(255,255,255,0.58);
              font-size: 14px;
              line-height: 1.5;
            }

            @media (max-width: 900px) {
              .rules-hero {
                padding: 72px 18px 42px;
                text-align: left;
              }

              .rules-wrap {
                margin: 0;
              }

              h1 {
                font-size: 46px;
              }

              .intro {
                margin-left: 0;
                margin-right: 0;
                font-size: 16px;
              }

              .top-summary,
              .steps,
              .points-grid,
              .yes-no-grid {
                grid-template-columns: 1fr;
              }

              .top-summary {
                margin-top: 24px;
              }

              .section {
                margin-top: 42px;
              }

              .steps div {
                min-height: auto;
              }

              .steps h3 {
                margin-top: 18px;
              }

              .deadline-date {
                font-size: 32px;
              }
            }
          `,
        }}
      />
    </main>
  );
}