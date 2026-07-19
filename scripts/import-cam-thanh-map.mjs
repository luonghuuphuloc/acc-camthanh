import fs from "node:fs/promises";
import path from "node:path";

const [sourcePath, outputPath = "src/data/cam-thanh-map-data.json"] = process.argv.slice(2);
if (!sourcePath) throw new Error("Usage: node scripts/import-cam-thanh-map.mjs <map.html> [output.json]");

const source = await fs.readFile(path.resolve(sourcePath), "utf8");
const ward = extractJsonConstant(source, "WARD");
const zones = extractJsonConstant(source, "TO_ZONES");

if (ward.features?.length !== 1) throw new Error("Expected one ward boundary feature");
if (zones.features?.length !== 15) throw new Error("Expected 15 residential-zone features");

const resolvedOutputPath = path.resolve(outputPath);
await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
await fs.writeFile(
  resolvedOutputPath,
  `${JSON.stringify({ ward, zones }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify({ wardFeatures: ward.features.length, zoneFeatures: zones.features.length, outputPath }));

function extractJsonConstant(text, name) {
  const marker = `const ${name} =`;
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing ${name} constant`);

  const start = text.indexOf("{", markerIndex + marker.length);
  let depth = 0;
  let quoted = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new Error(`Unterminated ${name} JSON`);
}
