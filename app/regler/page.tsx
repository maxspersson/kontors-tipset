import Container from "@/app/components/Container";

export default function RulesPage() {
  return (
    <main className="rules-page">
      <section className="rules-hero">
        <div className="rules-wrap">
          <p className="eyebrow">Regler</p>

          <h1>Så funkar Kontors-tipset</h1>

          <p className="intro">
            Ett enkelt VM-tips där du tävlar mot dina kollegor. 
            Sätt hela ditt tips innan turneringen startar – och jaga poäng match för match.
          </p>
        </div>
      </section>

      <section className="rules-content">
        <Container>
          {/* STEG */}
          <div className="section">
            <h2>1. Så spelar du</h2>

            <div className="steps">
              <div>
                <span>01</span>
                <h3>Fyll i alla matcher</h3>
                <p>Tippa resultat för hela gruppspelet.</p>
              </div>

              <div>
                <span>02</span>
                <h3>Slutspelet skapas</h3>
                <p>Slutspelsträdet baseras på dina gruppresultat.</p>
              </div>

              <div>
                <span>03</span>
                <h3>Bonusfrågor</h3>
                <p>Välj vinnare, skyttekung och fler frågor.</p>
              </div>

              <div>
                <span>04</span>
                <h3>Lås ditt tips</h3>
                <p>Allt måste vara klart innan deadline.</p>
              </div>
            </div>
          </div>

          {/* DEADLINE */}
          <div className="section highlight">
            <h2>2. Viktiga deadlines</h2>

            <div className="deadline-box">
              <p className="big">10 juni 2026 · 23:59</p>
              <p>
                Hela ditt tips måste vara ifyllt – inklusive slutspel och bonusfrågor.
              </p>
            </div>

            <div className="sub-info">
              <p>
                Efter detta kan du fortfarande ändra matchresultat i gruppspelet fram till
                <strong> 60 minuter före avspark.</strong>
              </p>
            </div>
          </div>

          {/* POÄNG */}
          <div className="section">
            <h2>3. Poängsystem</h2>

            <div className="grid-2">
              <div className="card">
                <h3>Matcher</h3>
                <ul>
                  <li>Rätt mål per lag: 2 + 2 poäng</li>
                  <li>Rätt tecken (1X2): 3 poäng</li>
                  <li><strong>Max 7 poäng per match</strong></li>
                </ul>
              </div>

              <div className="card">
  <h3>Slutspel</h3>
  <ul>
    <li>Rätt lag i åttondelsfinal: 2 poäng / lag</li>
    <li>Rätt lag i kvartsfinal: 4 poäng / lag</li>
    <li>Rätt lag i semifinal: 6 poäng / lag</li>
    <li>Rätt lag i final: 8 poäng / lag</li>
  </ul>
</div>

              <div className="card">
  <h3>Bonus</h3>
  <ul>
    <li>Skyttekung: 20 poäng</li>
    <li>VM-vinnare: 20 poäng</li>
    <li>Flest mål i gruppspelet: 10 poäng</li>
    <li>Flest insläppta mål: 10 poäng</li>
    <li>Egen bonusfråga 1: 15 poäng</li>
    <li>Egen bonusfråga 2: 15 poäng</li>
  </ul>
</div>
            </div>
          </div>

          {/* VIKTIG REGEL */}
          <div className="section warning">
            <h2>4. Viktigt att förstå</h2>

            <div className="card">
              <p>
                Ditt slutspel baseras på dina gruppresultat vid deadline.
              </p>

              <p>Om du ändrar matcher efter det:</p>

              <ul>
                <li>✔ Du får fortfarande poäng för matcherna</li>
                <li>❌ Ditt slutspel ändras inte</li>
              </ul>

              <p className="note">
                Du kan alltså fortsätta samla poäng – även om ditt slutspel inte längre stämmer.
              </p>
            </div>
          </div>

          {/* EXTRA */}
          <div className="section">
            <h2>5. Övrigt</h2>

            <div className="card">
              <ul>
                <li>Tips låses 60 minuter före varje match</li>
                <li>Bonuspoäng delas ut först när en hel spelomgång är färdigspelad (t.ex. gruppspel eller slutspel).</li>
                <li>Resultat räknas efter ordinarie tid (90 min)</li>
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
          }

          .rules-hero {
            padding: 88px 20px 34px;
            text-align: center;
          }

          .rules-wrap {
            max-width: 700px;
            margin: 0 auto;
          }

          .eyebrow {
            color: #e5b94d;
            letter-spacing: 0.2em;
            font-size: 12px;
            font-weight: 900;
          }

          h1 {
            margin-top: 18px;
            font-size: 48px;
            font-weight: 950;
            letter-spacing: -0.04em;
          }

          .intro {
            margin-top: 18px;
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
          }

          .rules-content {
            padding: 10px 0 80px;
          }

          .section {
            margin-top: 46px;
          }

          .section h2 {
            font-size: 32px;
            margin-bottom: 22px;
            letter-spacing: -0.04em;
          }

          .steps {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          .steps div {
            padding: 24px;
            border-radius: 20px;
            background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035));
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 20px 70px rgba(0,0,0,0.22);
          }

          .steps span {
            color: #e5b94d;
            font-weight: 950;
            font-size: 13px;
            letter-spacing: 0.12em;
          }

          .steps h3 {
            margin: 18px 0 8px;
            font-size: 20px;
            font-weight: 950;
            letter-spacing: -0.03em;
          }

          .steps p {
            margin: 0;
            color: rgba(255,255,255,0.62);
            font-size: 15px;
          }

          .deadline-box {
            padding: 24px;
            border-radius: 20px;
            background: rgba(229,185,77,0.1);
            border: 1px solid rgba(229,185,77,0.25);
          }

          .big {
            font-size: 22px;
            font-weight: 900;
          }

          .sub-info {
            margin-top: 12px;
            color: rgba(255,255,255,0.7);
          }

          .grid-2 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .card {
            padding: 20px;
            border-radius: 16px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.06);
          }

          .warning .card {
            border: 1px solid rgba(229,185,77,0.3);
          }

          ul {
            margin-top: 10px;
            padding-left: 18px;
            color: rgba(255,255,255,0.8);
          }

          li {
            margin-bottom: 6px;
          }

          .note {
            margin-top: 12px;
            font-size: 14px;
            color: rgba(255,255,255,0.6);
          }

          @media (max-width: 900px) {
            .steps {
              grid-template-columns: 1fr;
            }

            .grid-2 {
              grid-template-columns: 1fr;
            }

            h1 {
              font-size: 36px;
            }
          }
        `,
        }}
      />
    </main>
  );
}