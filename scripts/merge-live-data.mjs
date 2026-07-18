import fs from "node:fs/promises";
import path from "node:path";

const [livePath, importedPath = "data/graves.json"] = process.argv.slice(2);
if (!livePath) throw new Error("Usage: node scripts/merge-live-data.mjs <live-graves.json> [imported-graves.json]");

const [live, imported] = await Promise.all([
  readJson(livePath),
  readJson(importedPath),
]);

const liveById = new Map(live.map((grave) => [grave.id, grave]));
const liveByName = new Map(live.map((grave) => [fold(grave.ten), grave]));
let preservedPositions = 0;
let preservedAdminEdits = 0;

const merged = imported.map((grave) => {
  const previous = liveById.get(grave.id) || liveByName.get(fold(grave.ten));
  if (!previous) return grave;

  const next = { ...grave };
  if (previous.x != null && previous.y != null) {
    next.x = previous.x;
    next.y = previous.y;
    next.placed = previous.placed !== false;
    preservedPositions += 1;
  }

  if (previous.updatedAt) {
    for (const field of ["ten", "namSinh", "queQuan", "capBac", "donVi", "hySinh", "noiHySinh", "ghiChu", "khu", "hang", "mo", "lo", "type"]) {
      next[field] = previous[field];
    }
    next.updatedAt = previous.updatedAt;
    preservedAdminEdits += 1;
  }
  return next;
});

await fs.writeFile(importedPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ records: merged.length, preservedPositions, preservedAdminEdits }));

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(file), "utf8"));
}

function fold(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
