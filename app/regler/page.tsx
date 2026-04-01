import Container from "../components/Container";

export default function ReglerPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <h1 className="text-4xl font-bold tracking-tight">Regler</h1>

        <p className="mt-4 text-neutral-400">
          Så här fungerar poängsystemet och tipset.
        </p>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-neutral-400">
            Poängsystem, bonusfrågor och deadlines kommer här
          </p>
        </div>
      </Container>
    </main>
  );
}