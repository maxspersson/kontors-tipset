import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="mx-auto flex max-w-5xl flex-col px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Kontors-tipset
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          VM-tipset för kontoret. Enkelt, snyggt och roligare än Excel.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          Skapa en liga, tippa matcherna och följ tabellen under Fotbolls-VM 2026.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
  <Link
    href="/liga"
    className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
  >
    Skapa liga
  </Link>

  <Link
    href="/regler"
    className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-900"
  >
    Läs regler
  </Link>
</div>
      </section>
    </main>
  );
}