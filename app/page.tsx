import Link from "next/link";
import Container from "./components/Container";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Kontors-tipset
            </p>

            <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-neutral-100 sm:text-6xl lg:text-7xl">
              VM-tipset för kontoret.
              <span className="block text-neutral-400">
                Snyggare, smidigare och roligare än Excel.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
              Skapa en liga, samla kollegorna, tippa matcherna och följ
              tabellen under Fotbolls-VM 2026 i en upplevelse som känns mer
              klubbhus än kalkylblad.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/liga"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
              >
                Skapa liga
              </Link>

              <Link
                href="/tabell"
                className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:border-neutral-700"
              >
                Se tabell
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
              Matchkväll
            </p>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Nästa match</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-100">
                    Sverige vs Tyskland
                  </p>
                </div>
                <p className="text-sm text-neutral-400">19:00</p>
              </div>

              <div className="mt-6 grid grid-cols-3 items-center text-center">
                <div>
                  <p className="text-sm text-neutral-500">Sverige</p>
                  <p className="mt-2 text-3xl font-bold">2</p>
                </div>

                <div className="text-neutral-500">-</div>

                <div>
                  <p className="text-sm text-neutral-500">Tyskland</p>
                  <p className="mt-2 text-3xl font-bold">1</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Liga
                </p>
                <p className="mt-2 font-medium text-neutral-100">
                  VM 2026 Kontoret
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Deltagare
                </p>
                <p className="mt-2 font-medium text-neutral-100">18 personer</p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Ledare
                </p>
                <p className="mt-2 font-medium text-neutral-100">Max · 84 p</p>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}