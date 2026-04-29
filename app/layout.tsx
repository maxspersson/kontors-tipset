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
      <body className="bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link
              href="/"
              className="text-sm font-black tracking-[0.28em] text-neutral-400 transition hover:text-white"
            >
              KONTORS-TIPSET
            </Link>

            <nav className="hidden items-center gap-8 text-sm md:flex">
              <Link href="/tippa" className="text-neutral-400 transition hover:text-white">
                Tippa
              </Link>
              <Link href="/tabell" className="text-neutral-400 transition hover:text-white">
                Tabell
              </Link>
              <Link href="/liga" className="text-neutral-400 transition hover:text-white">
                Liga
              </Link>
              <Link href="/regler" className="text-neutral-400 transition hover:text-white">
                Regler
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 sm:block">
                VM 2026
              </div>

              <details className="relative hidden md:block">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-neutral-800 text-xs font-black text-white marker:hidden">
                  MP
                </summary>

                <div className="absolute right-0 mt-3 w-44 rounded-2xl border border-white/10 bg-[#080B10] p-2 shadow-2xl">
                  <Link
                    href="/liga"
                    className="block rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white"
                  >
                    Mina ligor
                  </Link>

                  <form action="/api/logout" method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-neutral-300 hover:bg-white/10 hover:text-white"
                    >
                      Logga ut
                    </button>
                  </form>
                </div>
              </details>

              <details className="relative md:hidden">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-black text-white marker:hidden">
                  ☰
                </summary>

                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-[#080B10] p-2 shadow-2xl">
                  <Link className="mobile-link" href="/tippa">Tippa</Link>
                  <Link className="mobile-link" href="/tabell">Tabell</Link>
                  <Link className="mobile-link" href="/liga">Liga</Link>
                  <Link className="mobile-link" href="/regler">Regler</Link>

                  <div className="my-2 h-px bg-white/10" />

                  <form action="/api/logout" method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-neutral-300 hover:bg-white/10 hover:text-white"
                    >
                      Logga ut
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        {children}

        <footer className="border-t border-white/10 bg-[#020304]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black tracking-[0.28em] text-neutral-400">
                KONTORS-TIPSET
              </p>
              <p className="mt-2">VM-tipset för kontoret.</p>
            </div>

            <div className="flex gap-5">
              <Link href="/regler" className="hover:text-white">
                Regler
              </Link>
              <Link href="/liga" className="hover:text-white">
                Liga
              </Link>
              <Link href="/tabell" className="hover:text-white">
                Tabell
              </Link>
            </div>
          </div>
        </footer>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              details > summary::-webkit-details-marker {
                display: none;
              }

              .mobile-link {
                display: block;
                border-radius: 12px;
                padding: 12px;
                color: rgb(212 212 212);
                font-size: 14px;
                font-weight: 700;
                text-decoration: none;
              }

              .mobile-link:hover {
                background: rgba(255,255,255,0.10);
                color: white;
              }
            `,
          }}
        />
      </body>
    </html>
  );
}