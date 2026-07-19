import fs from "node:fs/promises";
import path from "node:path";

const [gravesPath = "data/graves.json", layoutPath = "data/special-grave-layout.json"] = process.argv.slice(2);
const [graves, layout] = await Promise.all([readJson(gravesPath), readJson(layoutPath)]);

const positions = new Map(layout.positions.map((position) => [key(position), position]));
const gravesById = new Map(graves.map((grave) => [grave.id, grave]));
const gravesByPosition = new Map();
for (const grave of graves) {
  const graveKey = key(grave);
  if (!positions.has(graveKey)) continue;
  if (gravesByPosition.has(graveKey)) throw new Error(`Duplicate grave location: ${graveKey}`);
  gravesByPosition.set(graveKey, grave);
}

const resolved = new Map(
  [...positions].map(([graveKey, position]) => [
    graveKey,
    gravesById.get(expectedId(position)) || gravesByPosition.get(graveKey),
  ]),
);
const missing = [...resolved].filter(([, grave]) => !grave).map(([graveKey]) => graveKey);
if (missing.length) throw new Error(`Layout positions without grave records: ${missing.join(", ")}`);

let updated = 0;
for (const [graveKey, position] of positions) {
  const grave = resolved.get(graveKey);
  if (
    grave.khu !== position.khu ||
    Number(grave.hang) !== position.hang ||
    Number(grave.mo) !== position.mo ||
    grave.x !== position.x ||
    grave.y !== position.y ||
    grave.placed !== true ||
    grave.type !== "special"
  ) updated += 1;
  grave.khu = position.khu;
  grave.hang = position.hang;
  grave.mo = position.mo;
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

function expectedId({ khu, hang, mo }) {
  if (khu === "E" && hang === 1 && mo === 1) return "HS-326";
  const zone = khu === "TĐ B" ? "TDB" : khu === "TĐ N" ? "TDN" : khu;
  return `${zone}-${String(hang).padStart(2, "0")}-${String(mo).padStart(2, "0")}`;
}
