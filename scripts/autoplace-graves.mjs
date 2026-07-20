import fs from "node:fs/promises";
import path from "node:path";

const gravesPath = path.join(process.cwd(), "data", "graves.json");
const regularLayoutPath = path.join(process.cwd(), "data", "regular-grave-layout.json");
const specialLayoutPath = path.join(process.cwd(), "data", "special-grave-layout.json");
const [graves, regularLayout, specialLayout] = await Promise.all([
  readJson(gravesPath),
  readJson(regularLayoutPath),
  readJson(specialLayoutPath),
]);

let placed = 0;
for (const [zone, columns] of Object.entries(regularLayout.zones)) {
  for (const [hang, column] of Object.entries(columns)) {
    const columnGraves = graves
      .filter((grave) => grave.khu === zone && Number(grave.hang) === Number(hang))
      .sort((a, b) => Number(b.mo) - Number(a.mo));

    if (columnGraves.length !== column.ys.length) {
      throw new Error(`${zone} hàng ${hang}: ${columnGraves.length} records for ${column.ys.length} map slots`);
    }

    columnGraves.forEach((grave, index) => {
      grave.x = toPercent(column.x, regularLayout.mapWidth);
      grave.y = toPercent(column.ys[index], regularLayout.mapHeight);
      grave.placed = true;
      placed += 1;
    });
  }
}

for (const position of specialLayout.positions) {
  const grave = graves.find((item) => (
    item.khu === position.khu
    && Number(item.hang) === Number(position.hang)
    && Number(item.mo) === Number(position.mo)
  ));
  if (!grave) throw new Error(`Missing special grave: ${position.khu} ${position.hang}/${position.mo}`);
  grave.x = position.x;
  grave.y = position.y;
  grave.placed = true;
  grave.type = "special";
  placed += 1;
}

await fs.writeFile(gravesPath, `${JSON.stringify(graves, null, 2)}\n`, "utf8");
console.log(`Placed ${placed} graves from reviewed cemetery layouts`);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function toPercent(pixels, dimension) {
  return round((pixels / dimension) * 100);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
