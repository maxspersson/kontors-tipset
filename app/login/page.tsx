"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrorMessage("");

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-wrap">
          <div className="login-grid">
            <div className="login-copy">
              <p className="eyebrow">Kontors-tipset</p>
              <h1>Logga in och börja tippa.</h1>
              <p className="intro">
                Skapa ligor, gå med i kompisgängets VM-tips och håll koll på
                tabellen hela vägen till final.
              </p>

              <div className="mini-grid">
                <div>
                  <span>01</span>
                  <strong>Privata ligor</strong>
                  <p>Bjud in med kod.</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>Spara tips</strong>
                  <p>Ändra fram till låsning.</p>
                </div>
                <div>
                  <span>03</span>
                  <strong>Följ tabellen</strong>
                  <p>Se vem som leder.</p>
                </div>
              </div>
            </div>

            <div className="login-card">
              <div className="card-top">
                <div>
                  <p>VM 2026</p>
                  <h2>Logga in</h2>
                </div>
                <span>MP</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="google-btn"
              >
                {googleLoading ? "Öppnar Google..." : "Fortsätt med Google"}
              </button>

              <div className="divider">
                <span>eller</span>
              </div>

              <form onSubmit={handleLogin}>
                <label>E-post</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dinmail@foretag.se"
                  required
                />

                <label>Lösenord</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {errorMessage && <div className="error-box">{errorMessage}</div>}

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Loggar in..." : "Logga in med e-post →"}
                </button>
              </form>

              <div className="helper">
                <p>Ny här?</p>
                <Link href="/liga">Skapa en liga</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .login-page {
              min-height: 100vh;
              background: #020304;
              color: white;
              overflow-x: hidden;
            }

            .login-hero {
              min-height: calc(100vh - 73px);
              position: relative;
              background-image:
                linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.82) 48%, rgba(2,3,4,0.58) 100%),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center;
            }

            .login-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 78% 24%, rgba(229,185,77,0.22), transparent 28%),
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.07), transparent 22%);
            }

            .login-wrap {
              position: relative;
              z-index: 1;
              max-width: 1180px;
              margin: 0 auto;
              padding: 92px 24px;
            }

            .login-grid {
              display: grid;
              grid-template-columns: 1fr 460px;
              gap: 56px;
              align-items: center;
            }

            .eyebrow {
              margin: 0 0 18px;
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            .login-copy h1 {
              margin: 0;
              max-width: 680px;
              font-size: clamp(48px, 6vw, 86px);
              line-height: 1.02;
              letter-spacing: -0.06em;
              font-weight: 950;
            }

            .intro {
              margin: 26px 0 0;
              max-width: 570px;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.7;
            }

            .mini-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              margin-top: 44px;
              max-width: 680px;
            }

            .mini-grid div {
              min-height: 150px;
              padding: 18px;
              border-radius: 18px;
              background: rgba(9,17,25,0.68);
              border: 1px solid rgba(255,255,255,0.09);
              backdrop-filter: blur(18px);
              box-shadow: 0 24px 70px rgba(0,0,0,0.28);
            }

            .mini-grid span {
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
            }

            .mini-grid strong {
              display: block;
              margin-top: 28px;
              font-size: 17px;
            }

            .mini-grid p {
              margin: 8px 0 0;
              color: rgba(255,255,255,0.52);
              font-size: 14px;
              line-height: 1.45;
            }

            .login-card {
              padding: 26px;
              border-radius: 28px;
              background: rgba(5,12,18,0.82);
              border: 1px solid rgba(255,255,255,0.12);
              box-shadow: 0 34px 110px rgba(0,0,0,0.58);
              backdrop-filter: blur(20px);
            }

            .card-top {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              align-items: flex-start;
              margin-bottom: 28px;
            }

            .card-top p {
              margin: 0;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .card-top h2 {
              margin: 8px 0 0;
              font-size: 32px;
              letter-spacing: -0.04em;
            }

            .card-top span {
              width: 42px;
              height: 42px;
              display: grid;
              place-items: center;
              border-radius: 999px;
              background: rgba(255,255,255,0.10);
              color: white;
              font-size: 13px;
              font-weight: 950;
            }

            .google-btn,
            .submit-btn {
              width: 100%;
              height: 58px;
              border: 0;
              border-radius: 16px;
              font-size: 15px;
              font-weight: 950;
              cursor: pointer;
              font-family: inherit;
            }

            .google-btn {
              background: rgba(255,255,255,0.07);
              color: white;
              border: 1px solid rgba(255,255,255,0.12);
            }

            .google-btn:hover {
              background: rgba(255,255,255,0.10);
            }

            .google-btn:disabled,
            .submit-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .divider {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 24px 0;
              color: rgba(255,255,255,0.38);
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .divider::before {
              content: "";
              position: absolute;
              left: 0;
              right: 0;
              height: 1px;
              background: rgba(255,255,255,0.08);
            }

            .divider span {
              position: relative;
              z-index: 1;
              background: rgba(5,12,18,0.96);
              padding: 0 12px;
            }

            form label {
              display: block;
              margin: 16px 0 10px;
              color: rgba(255,255,255,0.60);
              font-size: 14px;
              font-weight: 800;
            }

            form input {
              width: 100%;
              height: 58px;
              padding: 0 16px;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(0,0,0,0.34);
              color: white;
              font-size: 15px;
              outline: none;
            }

            form input::placeholder {
              color: rgba(255,255,255,0.32);
            }

            form input:focus {
              border-color: rgba(229,185,77,0.65);
              box-shadow: 0 0 0 4px rgba(229,185,77,0.12);
            }

            .submit-btn {
              margin-top: 20px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              box-shadow: 0 18px 50px rgba(218,169,53,0.25);
            }

            .error-box {
              margin-top: 16px;
              padding: 14px;
              border-radius: 14px;
              border: 1px solid rgba(248,113,113,0.30);
              background: rgba(248,113,113,0.08);
              color: #fca5a5;
              font-size: 14px;
            }

            .helper {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              align-items: center;
              margin-top: 22px;
              padding-top: 20px;
              border-top: 1px solid rgba(255,255,255,0.08);
            }

            .helper p {
              margin: 0;
              color: rgba(255,255,255,0.42);
              font-size: 14px;
            }

            .helper a {
              color: #e5b94d;
              text-decoration: none;
              font-size: 14px;
              font-weight: 900;
            }

            @media (max-width: 900px) {
              .login-hero {
                min-height: auto;
                background-image:
                  linear-gradient(180deg, rgba(2,3,4,0.66) 0%, rgba(2,3,4,0.88) 45%, rgba(2,3,4,0.98) 100%),
                  url('/stadium.jpg');
                background-position: center top;
              }

              .login-wrap {
                padding: 64px 18px 40px;
              }

              .login-grid {
                grid-template-columns: 1fr;
                gap: 30px;
              }

              .login-copy h1 {
                font-size: 48px;
                line-height: 1.04;
                max-width: 360px;
              }

              .intro {
                font-size: 16px;
                max-width: 350px;
              }

              .mini-grid {
                grid-template-columns: 1fr;
                margin-top: 30px;
              }

              .mini-grid div {
                min-height: auto;
              }

              .mini-grid strong {
                margin-top: 16px;
              }

              .login-card {
                padding: 20px;
                border-radius: 24px;
              }

              .card-top h2 {
                font-size: 28px;
              }

              .helper {
                align-items: flex-start;
                flex-direction: column;
                gap: 8px;
              }
            }
          `,
        }}
      />
    </main>
  );
}