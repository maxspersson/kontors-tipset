import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type League = {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  created_at: string;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let leagues: League[] = [];

  if (user) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.email?.split("@")[0] ?? null,
      },
      { onConflict: "id" }
    );

    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    const leagueIds = memberships?.map((m) => m.league_id) ?? [];

    if (leagueIds.length > 0) {
      const { data: leagueRows } = await supabase
        .from("leagues")
        .select("*")
        .in("id", leagueIds);

      leagues = (leagueRows ?? []) as League[];
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 70% 20%, rgba(222,173,67,0.22), transparent 28%), linear-gradient(180deg, #05080c 0%, #020304 100%)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          backgroundImage:
            "linear-gradient(90deg, rgba(2,3,4,0.96) 0%, rgba(2,3,4,0.78) 42%, rgba(2,3,4,0.45) 70%, rgba(2,3,4,0.96) 100%), url('/stadium.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "90px 28px 42px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 48,
              alignItems: "center",
              minHeight: "72vh",
            }}
          >
            <div>
              <div
                style={{
                  color: "#e5b94d",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  marginBottom: 20,
                }}
              >
                VM 2026
              </div>

              <h1
                style={{
                  fontSize: "clamp(56px, 7vw, 112px)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.06em",
                  fontWeight: 950,
                  textTransform: "uppercase",
                  margin: 0,
                  maxWidth: 760,
                }}
              >
                Tippa.
                <br />
                Utmana.
                <br />
                Vinn äran.
              </h1>

              <p
                style={{
                  marginTop: 28,
                  maxWidth: 560,
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 18,
                  lineHeight: 1.7,
                }}
              >
                Skapa din egen liga med polarna, tippa matcher och klättra i
                tabellen. Vem blir bäst i gänget?
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginTop: 34,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={user ? "/liga" : "/login"}
                  style={{
                    height: 58,
                    padding: "0 32px",
                    borderRadius: 10,
                    background: "linear-gradient(180deg, #f3cf69, #d9a935)",
                    color: "#090909",
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    boxShadow: "0 18px 50px rgba(218,169,53,0.28)",
                  }}
                >
                  {user ? "Skapa liga" : "Skapa konto"} →
                </Link>

                <Link
                  href="/regler"
                  style={{
                    height: 58,
                    padding: "0 32px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  Se regler
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 16,
                  marginTop: 72,
                  maxWidth: 1180,
                }}
              >
                {[
                  ["👥", "Skapa din liga", "Starta en liga och bjud in vänner."],
                  ["🏆", "Tippa matcher", "Sätt resultaten före deadline."],
                  ["📊", "Klättra i tabellen", "Följ poängen live under VM."],
                  ["🎁", "Vinn ära", "Skryt resten av sommaren."],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    style={{
                      padding: 22,
                      borderRadius: 16,
                      background: "rgba(9,17,25,0.72)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                      backdropFilter: "blur(18px)",
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{icon}</div>
                    <h3 style={{ margin: "14px 0 6px", fontSize: 17 }}>
                      {title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: 22,
                  borderRadius: 22,
                  background: "rgba(5,12,18,0.78)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 30px 100px rgba(0,0,0,0.55)",
                  backdropFilter: "blur(18px)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#e5b94d",
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                  }}
                >
                  NÄSTA MATCH
                </p>

                <h2 style={{ margin: "10px 0 24px", fontSize: 28 }}>
                  Argentina vs Frankrike
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <Team flag="🇦🇷" name="Argentina" />
                  <strong style={{ color: "rgba(255,255,255,0.35)" }}>VS</strong>
                  <Team flag="🇫🇷" name="Frankrike" align="right" />
                </div>

                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 14,
                    background: "rgba(229,185,77,0.12)",
                    color: "#f3cf69",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  Tips låses 60 minuter före matchstart
                </div>

                <div style={{ marginTop: 18 }}>
                  {[
                    ["1", "Max", "84 p"],
                    ["2", "Linus", "78 p"],
                    ["3", "Anton", "71 p"],
                  ].map(([rank, name, points]) => (
                    <div
                      key={rank}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 0",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: "#e5b94d",
                          color: "#090909",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 950,
                        }}
                      >
                        {rank}
                      </span>
                      <strong style={{ flex: 1 }}>{name}</strong>
                      <strong style={{ color: "#e5b94d" }}>{points}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {user && leagues.length > 0 && (
            <div
              style={{
                marginTop: 36,
                padding: 24,
                borderRadius: 22,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(18px)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 26 }}>Dina ligor</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 16,
                  marginTop: 18,
                }}
              >
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/liga/${league.slug}`}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      textDecoration: "none",
                    }}
                  >
                    <strong style={{ fontSize: 20 }}>{league.name}</strong>
                    <p style={{ color: "#e5b94d", fontWeight: 800 }}>
                      Öppna liga →
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Team({
  flag,
  name,
  align = "left",
}: {
  flag: string;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 18,
        background: "rgba(255,255,255,0.06)",
        textAlign: align,
      }}
    >
      <div style={{ fontSize: 38 }}>{flag}</div>
      <div style={{ marginTop: 10, fontWeight: 900 }}>{name}</div>
    </div>
  );
}