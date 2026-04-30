import { supabase } from "@/app/lib/supabase";

export default async function Page() {
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("stage", "group")
    .order("group_name", { ascending: true })
    .order("fifa_match_number", { ascending: true });

  const groups = matches?.reduce((acc: any, match: any) => {
    if (!acc[match.group_name]) acc[match.group_name] = [];
    acc[match.group_name].push(match);
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">VM 2026</h1>

      {Object.keys(groups || {}).map((group) => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Grupp {group}</h2>

          <div className="space-y-2">
            {groups[group].map((match: any) => (
              <div
                key={match.id}
                className="flex justify-between bg-zinc-900 p-3 rounded-lg"
              >
                <span>{match.home_team}</span>
                <span className="text-zinc-400">vs</span>
                <span>{match.away_team}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}