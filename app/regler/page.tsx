import Container from "@/app/components/Container";

export default function RulesPage() {
  const knowItems = [
    "Du behöver inte fylla i alla 104 matcher på en gång, men alla matcher måste vara ifyllda innan du kan skicka in tipset.",
    "Du kan låsa upp och redigera ett redan inskickat tips fram till deadline.",
    "Deadline för turneringstipset är 11 juni 2026 kl. 20:00.",
    "Fram till deadline kan du ändra både gruppspel och slutspel och skicka in tipset på nytt.",
    "Efter deadline är slutspelet permanent låst. Gruppspelsmatcher kan fortfarande ändras fram till 60 minuter före respektive avspark.",
    "Efter deadline byggs slutspelet aldrig om, även om du ändrar gruppspelsmatcher.",
    "Efter att en enskild match har låsts kan just den matchen inte ändras.",
    "Om gruppresultat ändras före deadline så att slutspelsträdet påverkas kan berörda slutspelsmatcher behöva tippas om.",
    "Matchpoäng räknas först när ett faktiskt resultat finns registrerat.",
    "Gruppspel räknas efter ordinarie tid, alltså 90 minuter plus eventuell stopptid.",
    "Slutspel räknas efter 90 minuter plus eventuell förlängning.",
    "I slutspelet kan du få matchpoäng för rätt resultat och rätt matchutfall även om du hade fel lag i matchen. Slutspelsbonus kräver däremot rätt lag i rätt runda.",
    "Straffläggning används bara för att avgöra vilket lag som går vidare eller vinner final/bronsmatch. Straffar räknas inte in i målresultatet.",
    "Andras tips låses upp löpande från 60 minuter före avspark för respektive match.",
    "Bästa grupptreor jämförs separat mellan grupperna och rankas på poäng, målskillnad, gjorda mål och därefter FIFA-ranking.",
    "Om lag fortfarande inte kan skiljas åt används FIFA:s världsranking som sista skiljekriterium i Kontors-tipset.",
    "I mycket ovanliga fall kan ditt tippade slutspel skilja sig från det verkliga VM-slutspelet, eftersom FIFA även kan använda fair play-poäng eller lottning.",
  ];

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
              <strong>11 juni 2026 · 20:00</strong>
              <span>
                Fram till dess kan du redigera hela tipset. Efter deadline är
                slutspelet låst.
              </span>
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
                  Fyll i resultat i varje slutspelsmatch. Vinnarna flyttas
                  vidare automatiskt i ditt slutspel.
                </p>
              </div>

              <div>
                <span>04</span>
                <h3>Skicka in tipset</h3>
                <p>
                  När alla 104 matcher är ifyllda kan du skicka in ditt
                  turneringstips. Du kan fortfarande låsa upp och ändra det fram
                  till deadline.
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
              <p className="deadline-label">
                Turneringstipset ska skickas in senast
              </p>
              <p className="deadline-date">11 juni 2026 · 20:00</p>
              <p className="deadline-text">
                Hela turneringstipset ska vara inskickat senast 11 juni 2026
                kl. 20:00. Fram till dess kan du skicka in tipset, låsa upp det
                igen, ändra både gruppspel och slutspel och skicka in på nytt.
                Efter deadline är slutspelet låst, men gruppspelsmatcher kan fortfarande ändras fram till 60 minuter före respektive avspark.
              </p>
            </div>

            <div className="rule-note">
              <strong>
                Gruppspelsmatcher kan fortfarande ändras efter deadline.
              </strong>
              <span>
                Efter deadline kan du inte längre låsa upp hela tipset eller
                ändra slutspelet. Gruppspelsmatcher är däremot öppna fram till
                60 minuter före respektive avspark. Sådana ändringar påverkar
                bara dina matchpoäng, inte vilka lag du har i slutspelet.
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
                    <strong>3 p</strong> för rätt matchutfall, alltså rätt
                    vinnare eller oavgjort
                  </li>
                  <li>
                    <strong>Max 7 p</strong> per match
                  </li>
                </ul>

                <div className="example-box">
                  <p>Gruppspel</p>
                  <span>
                    I gruppspelet räknas resultatet efter ordinarie tid, alltså
                    90 minuter plus eventuell stopptid.
                  </span>
                </div>

                <div className="example-box">
                  <p>Slutspel</p>
                  <span>
                    I slutspelet räknas resultatet efter spelad matchtid, alltså
                    90 minuter plus eventuell förlängning. Straffar räknas inte
                    in i målresultatet.
                  </span>
                </div>
                <div className="example-box">
  <p>Viktigt om slutspel</p>
  <span>
    Matchpoängen i slutspelet räknas på matchens nummer i spelschemat,
    inte på exakt vilka lag du hade i matchen. Det betyder att du kan få
    poäng för rätt mål och rätt matchutfall även om två andra lag faktiskt
    spelar matchen.
  </span>
</div>
              </div>

              <div className="card">
                <p className="card-label">Slutspelsbonus</p>
                <h3>Rätt lag i rätt runda</h3>

                <ul>
                  <li>
                    <strong>2 p</strong> per rätt lag som når åttondelsfinal
                  </li>
                  <li>
                    <strong>4 p</strong> per rätt lag som når kvartsfinal
                  </li>
                  <li>
                    <strong>6 p</strong> per rätt lag som når semifinal
                  </li>
                  <li>
                    <strong>8 p</strong> per rätt lag som når final
                  </li>
                  <li>
                    <strong>20 p</strong> för rätt VM-vinnare
                  </li>
                </ul>

                <div className="example-box">
                  <p>Vid oavgjort i slutspel</p>
                  <span>
                    Om matchen är oavgjord efter 90 minuter plus eventuell
                    förlängning väljer du vilket lag som går vidare efter
                    straffläggning. I final och bronsmatch väljer du vinnare
                    efter straffläggning. Straffar räknas inte in i
                    målresultatet.
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
              <h3>
                Före deadline kan hela tipset ändras. Efter deadline är
                slutspelet låst.
              </h3>

              <p>
  Fram till 11 juni 2026 kl. 20:00 kan du låsa upp tipset, ändra
  dina gruppresultat, bygga om slutspelet och skicka in igen.
  Efter deadline ligger slutspelet fast. Då kan du fortfarande
  ändra enskilda gruppspelsmatcher fram till 60 minuter före
  avspark, men de ändringarna påverkar bara matchpoängen.
</p>

<div className="important-rule">
  Efter deadline byggs slutspelet aldrig om.
</div>

              <div className="yes-no-grid">
                <div>
                  <strong>✔ Före deadline: hela tipset kan ändras</strong>
                  <span>
                    Du kan låsa upp, ändra gruppspel och slutspel och skicka in
                    igen fram till 11 juni 2026 kl. 20:00.
                  </span>
                </div>

                <div>
                  <strong>✕ Efter deadline: slutspelet är låst</strong>
                  <span>
                    Gruppspelsmatcher kan fortfarande ändras till 60 minuter
                    före avspark, men slutspelet påverkas inte längre.
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

            <div className="know-grid">
              {knowItems.map((item) => (
                <div key={item} className="know-card">
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
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
            .warning-card,
            .know-card {
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

            .know-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
            }

            .know-card {
              display: grid;
              grid-template-columns: 34px 1fr;
              gap: 14px;
              align-items: start;
              padding: 18px;
              border-radius: 20px;
              background:
                linear-gradient(135deg, rgba(229,185,77,0.08), transparent 46%),
                rgba(5,12,18,0.82);
            }

            .know-card span {
              width: 34px;
              height: 34px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              color: #090909;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              font-size: 16px;
              font-weight: 950;
              box-shadow: 0 10px 28px rgba(229,185,77,0.18);
            }

            .know-card p {
              margin: 0;
              color: rgba(255,255,255,0.68);
              font-size: 14px;
              line-height: 1.55;
            }

             .important-rule {
  margin-top: 18px;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(229,185,77,0.12);
  border: 1px solid rgba(229,185,77,0.22);
  color: #e5b94d;
  font-size: 15px;
  font-weight: 900;
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
              .yes-no-grid,
              .know-grid {
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