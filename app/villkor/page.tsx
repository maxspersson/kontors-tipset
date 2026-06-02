import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-wrap">
          <Link href="/" className="back-link">← Till startsidan</Link>
          <p className="eyebrow">Kontors-tipset</p>
          <h1>Användarvillkor</h1>
          <p className="intro">
            Här beskriver vi villkoren för att använda Kontors-tipset.
          </p>
        </div>
      </section>

      <section className="legal-content">
        <div className="legal-card">
          <h2>Om tjänsten</h2>
          <p>
            Kontors-tipset är ett kostnadsfritt tipsspel för VM 2026. Du kan
            skapa ligor, bjuda in andra och tävla genom att tippa matcher.
          </p>

          <h2>Användarkonto</h2>
          <div className="legal-list">
            <div><span>✓</span>Du ansvarar för att uppgifterna i ditt konto är korrekta.</div>
            <div><span>✓</span>Du ansvarar för aktiviteter som sker via ditt konto.</div>
            <div><span>✓</span>Du får inte använda tjänsten för olagliga eller skadliga syften.</div>
          </div>

          <h2>Tips och resultat</h2>
          <div className="legal-list">
            <div><span>✓</span>Hela tipset måste vara inskickat senast 11 juni 2026 kl. 20:00.</div>
            <div><span>✓</span>Slutspelet låses när du skickar in ditt VM-tips.</div>
            <div><span>✓</span>Gruppspelsmatcher kan ändras fram till 60 minuter före avspark.</div>
            <div><span>✓</span>Poäng räknas automatiskt enligt reglerna på sajten.</div>
          </div>

          <h2>Tillgänglighet</h2>
          <p>
            Vi försöker hålla tjänsten tillgänglig, men kan inte garantera att
            den alltid fungerar utan avbrott. Funktioner kan ändras eller
            uppdateras vid behov.
          </p>

          <h2>Ansvar</h2>
          <p>
            Resultat hämtas från externa datakällor. Kontors-tipset ansvarar
            inte för tillfälliga tekniska fel, felaktig extern data eller andra
            problem som kan påverka poängräkningen.
          </p>

          <h2>Kontakt</h2>
          <p>Har du frågor om villkoren kan du kontakta:</p>
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

            .legal-card p {
              color: rgba(255,255,255,0.68);
              font-size: 15px;
              line-height: 1.65;
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

            .contact {
              color: #e5b94d !important;
              font-weight: 900;
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