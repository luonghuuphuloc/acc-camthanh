import fs from "node:fs/promises";
import path from "node:path";

const gravesPath = path.join(process.cwd(), "data", "graves.json");
const graves = JSON.parse(await fs.readFile(gravesPath, "utf8"));

const groups = {
  B: { x1: 5.0, x2: 19.8, y1: 26.2, y2: 55.4, maxHang: 13, maxMo: 11 },
  N: { x1: 66.6, x2: 82.9, y1: 29.0, y2: 55.4, maxHang: 15, maxMo: 12 },
  "TĐ B": { x1: 22.4, x2: 34.2, y1: 31.8, y2: 53.0, maxHang: 3, maxMo: 6 },
  "TĐ N": { x1: 53.2, x2: 64.7, y1: 34.5, y2: 53.2, maxHang: 2, maxMo: 6 },
};

let placed = 0;
for (const grave of graves) {
  const key = String(grave.khu || "").trim();
  const group = groups[key];
  if (!group || !grave.hang || !grave.mo) continue;

  const maxMo = Math.max(group.maxMo, Number(grave.mo));
  const maxHang = Math.max(group.maxHang, Number(grave.hang));
  const colRatio = maxMo === 1 ? 0.5 : (Number(grave.mo) - 1) / (maxMo - 1);
  const rowRatio = maxHang === 1 ? 0.5 : (Number(grave.hang) - 1) / (maxHang - 1);

  grave.x = round(group.x1 + (group.x2 - group.x1) * colRatio);
  grave.y = round(group.y1 + (group.y2 - group.y1) * rowRatio);
  grave.placed = true;
  placed += 1;
}

const looseSpecials = graves.filter((grave) => !grave.placed && grave.type === "special");
looseSpecials.forEach((grave, index) => {
  grave.x = round(85.0 + (index % 10) * 1.45);
  grave.y = round(8.5 + Math.floor(index / 10) * 5.0);
  grave.placed = true;
  placed += 1;
});

await fs.writeFile(gravesPath, `${JSON.stringify(graves, null, 2)}\n`, "utf8");
console.log(`Auto-placed ${placed} graves from cemetery map layout`);

function round(value) {
  return Math.round(value * 100) / 100;
}
