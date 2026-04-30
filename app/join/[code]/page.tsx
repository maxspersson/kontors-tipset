import { createClient } from "@/app/lib/supabase/server";
import Link from "next/link";

type JoinPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: league, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (error || !league) {
    return (
      <main className="join-page">
        <section className="join-hero">
          <div className="join-wrap">
            <div className="center-card">
              <p className="eyebrow">Inbjudan</p>
              <h1>Ogiltig kod.</h1>
              <p>
                Vi kunde inte hitta någon liga med den här koden. Kontrollera
                länken eller be ligans skapare skicka en ny inbjudan.
              </p>

              <Link href="/" className="dark-btn">
                Till startsidan
              </Link>
            </div>
          </div>
        </section>

        <JoinStyles />
      </main>
    );
  }

  let isAlreadyMember = false;

  if (user) {
    const { data: existingMembership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .maybeSingle();

    isAlreadyMember = !!existingMembership;
  }

  return (
    <main className="join-page">
      <section className="join-hero">
        <div className="join-wrap">
          <div className="join-grid">
            <div>
              <p className="eyebrow">Inbjudan</p>
              <h1>Du är inbjuden till ligan.</h1>
              <p className="intro">
                Gå med i ligan, lägg dina tips och följ tabellen genom hela VM.
                Det här är där prestigen börjar.
              </p>

              <div className="info-grid">
                <div>
                  <span>01</span>
                  <strong>Gå med</strong>
                  <p>Anslut med inbjudningskod.</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>Tippa</strong>
                  <p>Lägg hela ditt VM-tips.</p>
                </div>
                <div>
                  <span>03</span>
                  <strong>Följ tabellen</strong>
                  <p>Se vem som leder ligan.</p>
                </div>
              </div>
            </div>

            <div className="join-card">
              <div className="card-top">
                <div>
                  <p>Kontors-tipset</p>
                  <h2>{league.name}</h2>
                </div>
                <span>VM 2026</span>
              </div>

              <div className="league-details">
                <div>
                  <p>Liga</p>
                  <strong>{league.name}</strong>
                </div>

                <div>
                  <p>Invite code</p>
                  <strong>{league.invite_code}</strong>
                </div>

                <div>
                  <p>Slug</p>
                  <strong>{league.slug}</strong>
                </div>
              </div>

              {!user ? (
                <div className="state-box warning">
                  <strong>Logga in först</strong>
                  <p>Du behöver vara inloggad för att gå med i ligan.</p>
                  <Link href="/login" className="gold-btn">
                    Logga in →
                  </Link>
                </div>
              ) : isAlreadyMember ? (
                <div className="state-box success">
                  <strong>Du är redan med</strong>
                  <p>Du kan gå direkt till ligan och fortsätta spela.</p>
                  <Link href={`/liga/${league.slug}`} className="gold-btn">
                    Öppna ligan →
                  </Link>
                </div>
              ) : (
                <form action="/api/join" method="POST">
                  <input type="hidden" name="code" value={league.invite_code} />

                  <button type="submit" className="gold-btn submit-btn">
                    Gå med i ligan →
                  </button>
                </form>
              )}

              <div className="helper">
                <p>Fel liga?</p>
                <Link href="/">Till startsidan</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JoinStyles />
    </main>
  );
}

function JoinStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .join-page {
            min-height: 100vh;
            background: #020304;
            color: white;
            overflow-x: hidden;
          }

          .join-hero {
            min-height: calc(100vh - 73px);
            position: relative;
            background-image:
              linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.82) 48%, rgba(2,3,4,0.58) 100%),
              url('/stadium.jpg');
            background-size: cover;
            background-position: center;
          }

          .join-hero::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 78% 24%, rgba(229,185,77,0.22), transparent 28%),
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.07), transparent 22%);
            pointer-events: none;
          }

          .join-wrap {
            position: relative;
            z-index: 1;
            max-width: 1180px;
            margin: 0 auto;
            padding: 92px 24px;
          }

          .join-grid {
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

          h1 {
            margin: 0;
            max-width: 700px;
            font-size: clamp(48px, 6vw, 86px);
            line-height: 1.02;
            letter-spacing: -0.06em;
            font-weight: 950;
          }

          .intro,
          .center-card p {
            margin: 26px 0 0;
            max-width: 570px;
            color: rgba(255,255,255,0.68);
            font-size: 17px;
            line-height: 1.7;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin-top: 44px;
            max-width: 680px;
          }

          .info-grid div {
            min-height: 150px;
            padding: 18px;
            border-radius: 18px;
            background: rgba(9,17,25,0.68);
            border: 1px solid rgba(255,255,255,0.09);
            backdrop-filter: blur(18px);
            box-shadow: 0 24px 70px rgba(0,0,0,0.28);
          }

          .info-grid span {
            color: #e5b94d;
            font-size: 12px;
            font-weight: 950;
          }

          .info-grid strong {
            display: block;
            margin-top: 28px;
            font-size: 17px;
          }

          .info-grid p {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.52);
            font-size: 14px;
            line-height: 1.45;
          }

          .join-card,
          .center-card {
            padding: 26px;
            border-radius: 28px;
            background: rgba(5,12,18,0.82);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 34px 110px rgba(0,0,0,0.58);
            backdrop-filter: blur(20px);
          }

          .center-card {
            max-width: 720px;
          }

          .card-top {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 26px;
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
            line-height: 1.05;
          }

          .card-top span {
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(229,185,77,0.12);
            border: 1px solid rgba(229,185,77,0.20);
            color: #e5b94d;
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
          }

          .league-details {
            display: grid;
            gap: 12px;
          }

          .league-details div {
            padding: 16px;
            border-radius: 16px;
            background: rgba(255,255,255,0.055);
            border: 1px solid rgba(255,255,255,0.08);
          }

          .league-details p {
            margin: 0;
            color: rgba(255,255,255,0.38);
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .league-details strong {
            display: block;
            margin-top: 8px;
            color: white;
            font-size: 18px;
            line-height: 1.2;
          }

          .league-details div:nth-child(2) strong {
            color: #e5b94d;
            letter-spacing: 0.10em;
          }

          .state-box {
            margin-top: 18px;
            padding: 18px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.10);
            background: rgba(255,255,255,0.045);
          }

          .state-box strong {
            display: block;
            font-size: 17px;
          }

          .state-box p {
            margin: 8px 0 16px;
            color: rgba(255,255,255,0.58);
            font-size: 14px;
            line-height: 1.5;
          }

          .warning {
            border-color: rgba(229,185,77,0.22);
            background: rgba(229,185,77,0.07);
          }

          .success {
            border-color: rgba(134,239,172,0.22);
            background: rgba(34,197,94,0.07);
          }

          .gold-btn,
          .dark-btn {
            height: 56px;
            padding: 0 26px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 14px;
            font-weight: 950;
          }

          .gold-btn {
            border: 0;
            background: linear-gradient(180deg, #f3cf69, #d9a935);
            color: #090909;
            box-shadow: 0 18px 50px rgba(218,169,53,0.25);
            cursor: pointer;
            font-family: inherit;
          }

          .dark-btn {
            margin-top: 28px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.055);
            color: white;
          }

          .submit-btn {
            width: 100%;
            margin-top: 18px;
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
            .join-hero {
              min-height: auto;
              background-image:
                linear-gradient(180deg, rgba(2,3,4,0.66) 0%, rgba(2,3,4,0.88) 45%, rgba(2,3,4,0.98) 100%),
                url('/stadium.jpg');
              background-position: center top;
            }

            .join-wrap {
              padding: 64px 18px 40px;
            }

            .join-grid {
              grid-template-columns: 1fr;
              gap: 30px;
            }

            h1 {
              font-size: 48px;
              line-height: 1.04;
              max-width: 360px;
            }

            .intro,
            .center-card p {
              font-size: 16px;
              max-width: 350px;
            }

            .info-grid {
              grid-template-columns: 1fr;
              margin-top: 30px;
            }

            .info-grid div {
              min-height: auto;
            }

            .info-grid strong {
              margin-top: 16px;
            }

            .join-card,
            .center-card {
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

            .gold-btn,
            .dark-btn {
              width: 100%;
            }
          }
        `,
      }}
    />
  );
}