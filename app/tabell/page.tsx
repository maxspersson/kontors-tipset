import Container from "../components/Container";

const standings = [
  { id: 1, name: "Max", points: 84, exacts: 6 },
  { id: 2, name: "Linus", points: 79, exacts: 5 },
  { id: 3, name: "Johan", points: 76, exacts: 4 },
  { id: 4, name: "Emil", points: 71, exacts: 4 },
  { id: 5, name: "Anton", points: 68, exacts: 3 },
];

export default function TabellPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Leaderboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Tabell</h1>
            <p className="mt-4 text-neutral-400">
              Ställningen i ligan just nu.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Liga
            </p>
            <p className="mt-1 font-medium text-neutral-100">VM 2026 Kontoret</p>
          </div>
        </div>

        {/* Mobilvy */}
        <div className="mt-10 space-y-4 md:hidden">
          {standings.map((player, index) => (
            <div
              key={player.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 font-semibold">
                  {index + 1}
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Poäng
                  </p>
                  <p className="text-xl font-bold text-neutral-100">
                    {player.points}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-lg font-medium text-neutral-100">{player.name}</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
                <span>Fullträffar</span>
                <span>{player.exacts}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktopvy */}
        <div className="mt-10 hidden overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 md:block">
          <div className="grid grid-cols-12 border-b border-neutral-800 px-6 py-4 text-sm text-neutral-500">
            <div className="col-span-2">Placering</div>
            <div className="col-span-5">Namn</div>
            <div className="col-span-3">Poäng</div>
            <div className="col-span-2">Fullträffar</div>
          </div>

          <div>
            {standings.map((player, index) => (
              <div
                key={player.id}
                className="grid grid-cols-12 items-center border-b border-neutral-800 px-6 py-5 text-sm last:border-b-0"
              >
                <div className="col-span-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 font-semibold">
                    {index + 1}
                  </span>
                </div>

                <div className="col-span-5">
                  <p className="font-medium text-neutral-100">{player.name}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-lg font-semibold text-neutral-100">
                    {player.points}
                  </p>
                </div>

                <div className="col-span-2 text-neutral-400">{player.exacts}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}