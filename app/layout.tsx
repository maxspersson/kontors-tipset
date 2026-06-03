import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import LogoutButton from "@/app/components/LogoutButton";
import { createClient } from "@/app/lib/supabase/server";

export const metadata = {
  title: "Kontors-tipset",
  description: "VM-tipset för kontoret",
};

function formatDisplayName(email?: string | null) {
  if (!email) return "Spelare";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "";
  let email = user?.email || null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .maybeSingle();

    email = profile?.email || user.email || null;
    displayName = profile?.display_name || formatDisplayName(email);
  }

  const initials = user ? getInitials(displayName) : "KT";
  const clarityUserId = user?.id || null;
  const clarityUserName = user ? displayName : null;

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

              {user ? (
                <details className="user-menu desktop-user">
                  <summary>
                    <span className="avatar-mini">{initials}</span>
                    <span className="user-name">{displayName}</span>
                    <span className="chevron">▾</span>
                  </summary>

                  <div className="dropdown account-dropdown">
                    <div className="account-head">
                      <div className="avatar-large">{initials}</div>
                      <div>
                        <strong>{displayName}</strong>
                        {email && <span>{email}</span>}
                      </div>
                    </div>

                    <div className="divider" />

                    <Link href="/profil">Min profil</Link>
                    <Link href="/liga">Mina ligor</Link>
                    <Link href="/tabell">Tabellen</Link>
                    <Link href="/regler">Regler</Link>

                    <div className="divider" />

                    <LogoutButton />
                  </div>
                </details>
              ) : (
                <Link href="/login" className="login-link desktop-user">
                  Logga in
                </Link>
              )}

              <details className="user-menu mobile-menu">
                <summary>☰</summary>

                <div className="dropdown mobile-dropdown">
                  {user && (
                    <>
                      <div className="account-head">
                        <div className="avatar-large">{initials}</div>
                        <div>
                          <strong>{displayName}</strong>
                          {email && <span>{email}</span>}
                        </div>
                      </div>

                      <div className="divider" />
                    </>
                  )}

                  <Link href="/tippa">Tippa</Link>
                  <Link href="/tabell">Tabell</Link>
                  <Link href="/liga">Liga</Link>
                  <Link href="/regler">Regler</Link>

                  <div className="divider" />

                  {user ? (
                    <>
                      <Link href="/profil">Min profil</Link>
                      <LogoutButton />
                    </>
                  ) : (
                    <Link href="/login">Logga in</Link>
                  )}
                </div>
              </details>
            </div>
          </div>
        </header>

        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener("click", function(event) {
                document.querySelectorAll("details.user-menu").forEach((detail) => {
                  const clickedInside = detail.contains(event.target);

                  if (!clickedInside) {
                    detail.removeAttribute("open");
                    return;
                  }

                  const target = event.target;

                  if (
                    target.closest("a") ||
                    target.closest("button")
                  ) {
                    detail.removeAttribute("open");
                  }
                });
              });
            `,
          }}
        />

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />

            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

                {clarityId && (
  <Script id="microsoft-clarity" strategy="afterInteractive">
    {`
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");

      ${
        clarityUserId
          ? `window.clarity("identify", ${JSON.stringify(
              clarityUserId
            )}, undefined, undefined, ${JSON.stringify(clarityUserName)});`
          : ""
      }
    `}
  </Script>
)}

        <footer className="site-footer">
  <div className="footer-inner">
    <p className="footer-copy">© 2026 Kontors-tipset</p>

    <div className="footer-links">
      <Link href="/regler">Regler</Link>
      <Link href="/integritet">Integritet</Link>
      <Link href="/villkor">Villkor</Link>
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
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo {
  color: rgba(255,255,255,0.62);
  text-decoration: none;
  font-size: 14px;
  font-weight: 950;
  letter-spacing: 0.28em;
  white-space: nowrap;
}

.desktop-nav {
  display: flex;
  gap: 34px;
  align-items: center;
}

.desktop-nav a {
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 750;
}

.desktop-nav a:hover {
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.season-pill {
  border: 1px solid rgba(229,185,77,0.18);
  background: rgba(229,185,77,0.10);
  color: #e5b94d;
  padding: 7px 13px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  white-space: nowrap;
}

.login-link {
  height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.82);
  text-decoration: none;
  font-size: 14px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
}

.login-link:hover {
  color: white;
  background: rgba(255,255,255,0.10);
}

details > summary::-webkit-details-marker {
  display: none;
}

.user-menu {
  position: relative;
}

.user-menu summary {
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  list-style: none;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: white;
  font-size: 13px;
  font-weight: 950;
  user-select: none;
  padding: 4px 11px 4px 4px;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.user-menu summary:hover {
  background: rgba(255,255,255,0.10);
  border-color: rgba(229,185,77,0.28);
}

.avatar-mini {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(180deg, #f3cf69, #d9a935);
  color: #090909;
  font-size: 12px;
  font-weight: 950;
  box-shadow: 0 12px 32px rgba(218,169,53,0.20);
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  color: rgba(255,255,255,0.46);
  font-size: 11px;
  margin-left: -2px;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 52px;
  width: 250px;
  padding: 10px;
  border-radius: 20px;
  background: rgba(6,9,13,0.97);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 24px 80px rgba(0,0,0,0.55);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.account-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
}

.avatar-large {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(180deg, #f3cf69, #d9a935);
  color: #090909;
  font-size: 15px;
  font-weight: 950;
  flex: 0 0 auto;
}

.account-head strong {
  display: block;
  color: white;
  font-size: 15px;
  line-height: 1.2;
}

.account-head span {
  display: block;
  margin-top: 4px;
  max-width: 160px;
  color: rgba(255,255,255,0.44);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown a,
.dropdown button {
  width: 100%;
  display: block;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.74);
  text-align: left;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
  padding: 11px 12px;
  border-radius: 12px;
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
  margin: 7px 4px;
  background: rgba(255,255,255,0.10);
}

.mobile-menu {
  display: none;
}

.mobile-menu summary {
  width: 42px;
  padding: 0;
  justify-content: center;
  font-size: 19px;
}

/* Footer */

.site-footer {
  background: #020304;
  border-top: 1px solid rgba(255,255,255,0.10);
}

.footer-inner {
  max-width: 1380px;
  margin: 0 auto;
  padding: 28px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: rgba(255,255,255,0.45);
  font-size: 14px;
}

.footer-copy {
  margin: 0;
  color: rgba(255,255,255,0.46);
  font-weight: 700;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

.footer-links a {
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 750;
}

.footer-links a:hover {
  color: white;
}

@media (max-width: 900px) {
  .desktop-nav {
    gap: 22px;
  }

  .user-name {
    display: none;
  }
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
    width: min(300px, calc(100vw - 32px));
  }

  .footer-inner {
    padding: 28px 18px 32px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 14px;
  }

  .footer-links {
    width: 100%;
    justify-content: center;
    gap: 18px;
    flex-wrap: wrap;
  }
}
            `,
          }}
        />
      </body>
    </html>
  );
}