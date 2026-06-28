import fs from "fs";

const text = fs.readFileSync("scripts/annex-c.txt", "utf8");

const currentSlotOrder = [
  "3ABCDF",
  "3CDFGH",
  "3CEFHI",
  "3EHIJK",
  "3BEFIJ",
  "3AEHIJ",
  "3EFGIJ",
  "3DEIJL",
];

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

function currentAssignment(groups: string[]) {
  const result = new Map<string, string>();

  function tryAssign(index: number, used: Set<string>): boolean {
    if (index >= currentSlotOrder.length) return true;

    const slot = currentSlotOrder[index];
    const allowed = slot.replace("3", "").split("");

    for (const group of groups) {
      if (!allowed.includes(group) || used.has(group)) continue;

      used.add(group);
      result.set(slot, `3${group}`);

      if (tryAssign(index + 1, used)) return true;

      used.delete(group);
      result.delete(slot);
    }

    return false;
  }

  tryAssign(0, new Set());
  return result;
}

const rows = text
  .split("\n")
  .map((line) => line.trim())
  .map((line) =>
    line.match(
      /^(\d+)\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])$/
    )
  )
  .filter(Boolean) as RegExpMatchArray[];

let checked = 0;
let mismatches = 0;

for (const row of rows) {
  const option = row[1];
  const values = row.slice(2, 10);
  const fifaColumns = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"];

  const groups = Array.from(
    new Set(values.map((value) => value.replace("3", "")))
  ).sort();

  const fifaBySlot = new Map<string, string>();

  values.forEach((value, index) => {
    const column = fifaColumns[index];
    fifaBySlot.set(fifaColumnToSlot[column], value);
  });

  const currentBySlot = currentAssignment(groups);
  const diffs: string[] = [];

  for (const [slot, fifaValue] of fifaBySlot.entries()) {
    const currentValue = currentBySlot.get(slot);

    if (currentValue !== fifaValue) {
      diffs.push(`${slot}: FIFA ${fifaValue}, nuvarande ${currentValue}`);
    }
  }

  checked += 1;

  if (diffs.length > 0) {
    mismatches += 1;

    if (mismatches <= 20) {
      console.log(`\nOption ${option} (${groups.join("")}) skiljer sig:`);
      diffs.forEach((diff) => console.log(`- ${diff}`));
    }
  }
}

console.log("\n---");
console.log(`Kontrollerade rader: ${checked}`);
console.log(`Avvikande rader: ${mismatches}`);

if (mismatches > 20) {
  console.log("Visar bara de första 20 avvikelserna ovan.");
}