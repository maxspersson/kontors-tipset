import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-wrap">
          <Link href="/" className="back-link">← Till startsidan</Link>
          <p className="eyebrow">Kontors-tipset</p>
          <h1>Integritetspolicy</h1>
          <p className="intro">
            Här beskriver vi vilka uppgifter som sparas när du använder
            Kontors-tipset och varför de behövs.
          </p>
        </div>
      </section>

      <section className="legal-content">
        <div className="legal-card">
          <h2>Vilka uppgifter sparas?</h2>
          <p>När du använder Kontors-tipset kan följande uppgifter lagras:</p>
          <div className="legal-list">
  <div><span>✓</span>E-postadress</div>
  <div><span>✓</span>Visningsnamn</div>
  <div><span>✓</span>Dina tippningar</div>
  <div><span>✓</span>Ditt medlemskap i ligor</div>
</div>

          <h2>Varför sparas uppgifterna?</h2>
          <p>Uppgifterna används för att:</p>
          <div className="legal-list">
  <div><span>✓</span>Hantera inloggning och användarkonton</div>
  <div><span>✓</span>Visa tabeller, poäng och resultat</div>
  <div><span>✓</span>Göra det möjligt att delta i ligor</div>
  <div><span>✓</span>Felsöka problem och förbättra tjänsten</div>
</div>

          <h2>Delas uppgifterna med tredje part?</h2>
          <p>
            Nej. Kontors-tipset säljer inte personuppgifter och delar dem inte
            med tredje part för marknadsföring.
          </p>

          <h2>Kontakt</h2>
          <p>
            Har du frågor om hur dina uppgifter hanteras kan du kontakta:
          </p>
          <p className="contact">max.persson@lintigroup.se</p>

          <p className="updated">Senast uppdaterad: 2 juni 2026</p>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .legal-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .legal-hero {
              position: relative;
              padding: 92px 20px 46px;
              background:
                radial-gradient(circle at 70% 10%, rgba(229,185,77,0.20), transparent 32%),
                linear-gradient(180deg, #061018 0%, #020304 100%);
              border-bottom: 1px solid rgba(255,255,255,0.08);
            }

            .legal-wrap,
            .legal-content {
              width: min(900px, calc(100% - 40px));
              margin: 0 auto;
            }

            .back-link {
              display: inline-flex;
              margin-bottom: 28px;
              color: rgba(255,255,255,0.58);
              text-decoration: none;
              font-size: 14px;
              font-weight: 850;
            }

            .back-link:hover {
              color: #e5b94d;
            }

            .eyebrow {
              margin: 0 0 14px;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            h1 {
              margin: 0;
              font-size: clamp(44px, 6vw, 72px);
              line-height: 0.98;
              letter-spacing: -0.06em;
            }

            .intro {
              max-width: 680px;
              margin: 22px 0 0;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.65;
            }

            .legal-content {
              padding: 34px 0 90px;
            }

            .legal-card {
              padding: clamp(24px, 4vw, 42px);
              border-radius: 28px;
              background:
                linear-gradient(135deg, rgba(229,185,77,0.08), transparent 42%),
                rgba(5,12,18,0.82);
              border: 1px solid rgba(255,255,255,0.11);
              box-shadow: 0 28px 90px rgba(0,0,0,0.34);
              backdrop-filter: blur(18px);
            }

            .legal-card h2 {
              margin: 34px 0 10px;
              font-size: 24px;
              letter-spacing: -0.04em;
            }

            .legal-card h2:first-child {
              margin-top: 0;
            }

            .legal-card p,
            .legal-card li {
              color: rgba(255,255,255,0.68);
              font-size: 15px;
              line-height: 1.65;
            }

            .legal-card ul {
              margin: 12px 0 0;
              padding-left: 20px;
            }

            .legal-card li {
              margin-bottom: 6px;
            }

            .contact {
              color: #e5b94d !important;
              font-weight: 900;
            }

            .legal-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.legal-list div {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
  font-size: 15px;
  line-height: 1.45;
}

.legal-list span {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #090909;
  background: linear-gradient(180deg, #f3cf69, #d9a935);
  font-size: 13px;
  font-weight: 950;
}

            .updated {
              margin-top: 44px;
              color: rgba(255,255,255,0.42) !important;
              font-size: 14px !important;
            }

            @media (max-width: 700px) {
              .legal-hero {
                padding-top: 72px;
              }

              .legal-wrap,
              .legal-content {
                width: min(100% - 32px, 900px);
              }

              .legal-card {
                border-radius: 22px;
              }
            }
          `,
        }}
      />
    </main>
  );
}