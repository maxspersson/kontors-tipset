import fs from "fs";

const text = fs.readFileSync("scripts/annex-c.txt", "utf8");

const fifaColumns = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"] as const;

const fifaColumnToSlot: Record<string, string> = {
  "1A": "3CEFHI",
  "1B": "3EFGIJ",
  "1D": "3BEFIJ",
  "1E": "3ABCDF",
  "1G": "3AEHIJ",
  "1I": "3CDFGH",
  "1K": "3DEIJL",
  "1L": "3EHIJK",
};

const rows = text
  .split("\n")
  .map((line) => line.trim())
  .map((line) =>
    line.match(
      /^(\d+)\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])$/
    )
  )
  .filter(Boolean) as RegExpMatchArray[];

if (rows.length !== 495) {
  throw new Error(`Förväntade 495 rader, hittade ${rows.length}`);
}

const output: Record<string, Record<string, string>> = {};

for (const row of rows) {
  const values = row.slice(2, 10);

  const key = Array.from(
    new Set(values.map((value) => value.replace("3", "")))
  )
    .sort()
    .join("");

  const mapping: Record<string, string> = {};

  values.forEach((value, index) => {
    const column = fifaColumns[index];
    const slot = fifaColumnToSlot[column];

    mapping[slot] = value.replace("3", "");
  });

  output[key] = mapping;
}

const ts = `export const annexCThirdPlaceAssignments: Record<string, Record<string, string>> = ${JSON.stringify(
  output,
  null,
  2
)};
`;

fs.writeFileSync("scripts/annex-c.generated.ts", ts);

console.log("Klar!");
console.log(`Skapade scripts/annex-c.generated.ts`);
console.log(`Antal kombinationer: ${Object.keys(output).length}`);