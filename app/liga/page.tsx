import Container from "../components/Container";

export default function LigaPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <h1 className="text-4xl font-bold tracking-tight">Min liga</h1>

        <p className="mt-4 text-neutral-400">
          Här kommer ligainformation, medlemmar och inbjudningar att visas.
        </p>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-neutral-400">Ligainformation kommer här</p>
        </div>
      </Container>
    </main>
  );
}