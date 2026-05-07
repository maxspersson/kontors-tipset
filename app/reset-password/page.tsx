"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setStatus("Lösenordet behöver vara minst 8 tecken.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setStatus(
        "Kunde inte uppdatera lösenordet. Testa att skicka en ny återställningslänk."
      );
      setIsSaving(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-wrap">
          <div>
            <p className="eyebrow">Kontors-tipset</p>
            <h1>Välj nytt lösenord.</h1>
            <p className="intro">
              Skriv ett nytt lösenord för ditt konto. Efter att du sparat kan du
              logga in som vanligt igen.
            </p>
          </div>

          <div className="auth-card">
            <p>VM 2026</p>
            <h2>Nytt lösenord</h2>

            <form onSubmit={handleSubmit}>
              <label>Nytt lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minst 8 tecken"
                minLength={8}
                required
              />

              {status && <div className="status-box">{status}</div>}

              <button type="submit" disabled={isSaving}>
                {isSaving ? "Sparar..." : "Spara nytt lösenord"}
              </button>
            </form>

            <Link href="/login">Tillbaka till login</Link>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .auth-page {
              min-height: 100vh;
              background: #020304;
              color: white;
            }

            .auth-hero {
              min-height: calc(100vh - 73px);
              background-image:
                linear-gradient(90deg, rgba(2,3,4,0.96), rgba(2,3,4,0.68)),
                url('/stadium.jpg');
              background-size: cover;
              background-position: center;
            }

            .auth-wrap {
              max-width: 1120px;
              margin: 0 auto;
              padding: 92px 24px;
              display: grid;
              grid-template-columns: 1fr 420px;
              gap: 48px;
              align-items: center;
            }

            .eyebrow {
              color: #e5b94d;
              font-size: 13px;
              font-weight: 950;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            h1 {
              margin: 16px 0 0;
              font-size: clamp(46px, 6vw, 82px);
              line-height: 1;
              letter-spacing: -0.06em;
            }

            .intro {
              max-width: 560px;
              margin-top: 22px;
              color: rgba(255,255,255,0.68);
              font-size: 17px;
              line-height: 1.65;
            }

            .auth-card {
              padding: 26px;
              border-radius: 26px;
              background: rgba(5,12,18,0.84);
              border: 1px solid rgba(255,255,255,0.12);
              box-shadow: 0 34px 110px rgba(0,0,0,0.58);
              backdrop-filter: blur(18px);
            }

            .auth-card p {
              margin: 0;
              color: #e5b94d;
              font-size: 12px;
              font-weight: 950;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }

            .auth-card h2 {
              margin: 10px 0 24px;
              font-size: 30px;
              letter-spacing: -0.04em;
            }

            form label {
              display: block;
              margin-bottom: 10px;
              color: rgba(255,255,255,0.60);
              font-size: 14px;
              font-weight: 800;
            }

            form input {
              width: 100%;
              height: 56px;
              padding: 0 16px;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(0,0,0,0.34);
              color: white;
              font-size: 15px;
              outline: none;
            }

            form input:focus {
              border-color: rgba(229,185,77,0.65);
              box-shadow: 0 0 0 4px rgba(229,185,77,0.12);
            }

            form button {
              width: 100%;
              height: 56px;
              margin-top: 16px;
              border: 0;
              border-radius: 16px;
              background: linear-gradient(180deg, #f3cf69, #d9a935);
              color: #090909;
              font-size: 15px;
              font-weight: 950;
              cursor: pointer;
            }

            form button:disabled {
              opacity: 0.55;
              cursor: not-allowed;
            }

            .status-box {
              margin-top: 16px;
              padding: 14px;
              border-radius: 14px;
              border: 1px solid rgba(229,185,77,0.22);
              background: rgba(229,185,77,0.08);
              color: rgba(255,255,255,0.78);
              font-size: 14px;
              line-height: 1.45;
            }

            .auth-card a {
              display: inline-block;
              margin-top: 20px;
              color: #e5b94d;
              text-decoration: none;
              font-size: 14px;
              font-weight: 900;
            }

            @media (max-width: 900px) {
              .auth-wrap {
                grid-template-columns: 1fr;
                padding: 64px 18px;
              }
            }
          `,
        }}
      />
    </main>
  );
}