import fs from "node:fs/promises";
import path from "node:path";

const [gravesPath = "data/graves.json", layoutPath = "data/special-grave-layout.json"] = process.argv.slice(2);
const [graves, layout] = await Promise.all([readJson(gravesPath), readJson(layoutPath)]);

const positions = new Map(layout.positions.map((position) => [key(position), position]));
const gravesByPosition = new Map();
for (const grave of graves) {
  const graveKey = key(grave);
  if (!positions.has(graveKey)) continue;
  if (gravesByPosition.has(graveKey)) throw new Error(`Duplicate grave location: ${graveKey}`);
  gravesByPosition.set(graveKey, grave);
}

const missing = [...positions.keys()].filter((graveKey) => !gravesByPosition.has(graveKey));
if (missing.length) throw new Error(`Layout positions without grave records: ${missing.join(", ")}`);

let updated = 0;
for (const [graveKey, position] of positions) {
  const grave = gravesByPosition.get(graveKey);
  if (grave.x !== position.x || grave.y !== position.y || grave.placed !== true || grave.type !== "special") updated += 1;
  grave.x = position.x;
  grave.y = position.y;
  grave.placed = true;
  grave.type = "special";
}

await fs.writeFile(path.resolve(gravesPath), `${JSON.stringify(graves, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ records: graves.length, layoutPositions: positions.size, updated }));

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(file), "utf8"));
}

function key({ khu, hang, mo }) {
  return `${String(khu || "").trim()}|${Number(hang)}|${Number(mo)}`;
}
