import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Kontors-tipset",
  description: "VM-tipset för kontoret",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="logo">
              KONTORS-TIPSET
            </Link>

            <nav className="desktop-nav">
              <Link href="/tippa">Tippa</Link>
              <Link href="/tabell">Tabell</Link>
              <Link href="/liga">Liga</Link>
              <Link href="/regler">Regler</Link>
            </nav>

            <div className="header-right">
              <span className="season-pill">VM 2026</span>

              <details className="user-menu desktop-user">
                <summary>MP</summary>
                <div className="dropdown">
                  <Link href="/liga">Mina ligor</Link>
                  <form action="/api/logout" method="POST">
                    <button type="submit">Logga ut</button>
                  </form>
                </div>
              </details>

              <details className="user-menu mobile-menu">
                <summary>☰</summary>
                <div className="dropdown mobile-dropdown">
                  <Link href="/tippa">Tippa</Link>
                  <Link href="/tabell">Tabell</Link>
                  <Link href="/liga">Liga</Link>
                  <Link href="/regler">Regler</Link>
                  <div className="divider" />
                  <form action="/api/logout" method="POST">
                    <button type="submit">Logga ut</button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <p className="footer-logo">KONTORS-TIPSET</p>
              <p>VM-tipset för kontoret.</p>
            </div>

            <div className="footer-links">
              <Link href="/regler">Regler</Link>
              <Link href="/liga">Liga</Link>
              <Link href="/tabell">Tabell</Link>
            </div>
          </div>
        </footer>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                background: #020304;
                color: white;
              }

              .site-header {
                position: sticky;
                top: 0;
                z-index: 999;
                background: rgba(8, 8, 9, 0.78);
                border-bottom: 1px solid rgba(255,255,255,0.09);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
              }

              .header-inner {
                max-width: 1380px;
                margin: 0 auto;
                padding: 18px 28px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
              }

              .logo {
                color: rgba(255,255,255,0.58);
                text-decoration: none;
                font-size: 14px;
                font-weight: 900;
                letter-spacing: 0.28em;
              }

              .desktop-nav {
                display: flex;
                gap: 34px;
                align-items: center;
              }

              .desktop-nav a,
              .footer-links a {
                color: rgba(255,255,255,0.55);
                text-decoration: none;
                font-size: 14px;
                font-weight: 700;
              }

              .desktop-nav a:hover,
              .footer-links a:hover {
                color: white;
              }

              .header-right {
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .season-pill {
                border: 1px solid rgba(255,255,255,0.10);
                background: rgba(0,0,0,0.35);
                color: rgba(255,255,255,0.75);
                padding: 6px 13px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 800;
                white-space: nowrap;
              }

              details > summary::-webkit-details-marker {
                display: none;
              }

              .user-menu {
                position: relative;
              }

              .user-menu summary {
                width: 38px;
                height: 38px;
                border-radius: 999px;
                display: grid;
                place-items: center;
                cursor: pointer;
                list-style: none;
                background: rgba(255,255,255,0.12);
                color: white;
                font-size: 13px;
                font-weight: 950;
                user-select: none;
              }

              .dropdown {
                position: absolute;
                right: 0;
                top: 48px;
                width: 170px;
                padding: 8px;
                border-radius: 16px;
                background: rgba(6,9,13,0.96);
                border: 1px solid rgba(255,255,255,0.12);
                box-shadow: 0 24px 80px rgba(0,0,0,0.45);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
              }

              .dropdown a,
              .dropdown button {
                width: 100%;
                display: block;
                border: 0;
                background: transparent;
                color: rgba(255,255,255,0.72);
                text-align: left;
                text-decoration: none;
                font-size: 14px;
                font-weight: 750;
                padding: 11px 12px;
                border-radius: 11px;
                cursor: pointer;
                font-family: inherit;
              }

              .dropdown a:hover,
              .dropdown button:hover {
                background: rgba(255,255,255,0.08);
                color: white;
              }

              .divider {
                height: 1px;
                margin: 6px 4px;
                background: rgba(255,255,255,0.10);
              }

              .mobile-menu {
                display: none;
              }

              .site-footer {
                background: #020304;
                border-top: 1px solid rgba(255,255,255,0.10);
              }

              .footer-inner {
                max-width: 1380px;
                margin: 0 auto;
                padding: 34px 28px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                color: rgba(255,255,255,0.45);
                font-size: 14px;
              }

              .footer-logo {
                margin: 0 0 8px;
                color: rgba(255,255,255,0.65);
                font-weight: 950;
                letter-spacing: 0.24em;
              }

              .footer-inner p {
                margin-top: 0;
              }

              .footer-links {
                display: flex;
                gap: 22px;
              }

              @media (max-width: 760px) {
                .header-inner {
                  padding: 16px 18px;
                }

                .desktop-nav,
                .desktop-user,
                .season-pill {
                  display: none;
                }

                .mobile-menu {
                  display: block;
                }

                .logo {
                  font-size: 13px;
                  letter-spacing: 0.22em;
                }

                .mobile-dropdown {
                  width: 210px;
                }

                .footer-inner {
                  padding: 30px 18px;
                  flex-direction: column;
                  align-items: flex-start;
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}