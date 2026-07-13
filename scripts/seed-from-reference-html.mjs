import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const files = await fs.readdir(root);
const htmlFiles = files.filter((file) => file.toLowerCase().endsWith(".html"));
let htmlFile = null;
let html = "";
for (const candidate of htmlFiles) {
  const content = await fs.readFile(path.join(root, candidate), "utf8");
  if (content.includes('__bundler/manifest"')) {
    htmlFile = candidate;
    html = content;
    break;
  }
}
if (!htmlFile) throw new Error("No reference HTML bundle file found");
const manifestMatch = html.match(/<script type="__bundler\/manifest">\s*(\{[\s\S]*?\})\s*<\/script>/);
if (!manifestMatch) throw new Error("Reference HTML bundle manifest not found");

const manifest = JSON.parse(manifestMatch[1]);
const jsonAsset = Object.values(manifest).find((asset) => asset.mime === "application/json");
if (!jsonAsset) throw new Error("No JSON data asset found in reference HTML");

let buffer = Buffer.from(jsonAsset.data, "base64");
if (jsonAsset.compressed) buffer = zlib.gunzipSync(buffer);
const source = JSON.parse(buffer.toString("utf8"));

const graves = source
  .filter((item) => item && item.ten && item.tt)
  .map((item) => {
    const khu = String(item.khu || "").trim();
    const hang = Number(item.hang) || null;
    const mo = Number(item.mo) || null;
    const isSpecial = String(item.ghiChu || "").toLowerCase().includes("mộ lớn") || khu.startsWith("TĐ");
    return {
      id: makeId(khu, hang, mo, item.tt),
      tt: Number(item.tt),
      ten: item.ten || "",
      namSinh: item.namSinh || "",
      queQuan: item.queQuan || "",
      capBac: item.capBac || "",
      donVi: item.donVi || "",
      hySinh: item.hySinh || "",
      noiHySinh: item.noiHySinh || "",
      mo,
      hang,
      lo: item.lo || "",
      khu,
      ghiChu: item.ghiChu || "",
      type: isSpecial ? "special" : "normal",
      placed: false,
      x: null,
      y: null,
    };
  });

await fs.mkdir(path.join(root, "data"), { recursive: true });
await fs.writeFile(path.join(root, "data", "graves.json"), `${JSON.stringify(graves, null, 2)}\n`, "utf8");
await fs.writeFile(
  path.join(root, "data", "settings.json"),
  `${JSON.stringify(
    {
      heritageTitle: "Khám phá di sản Cẩm Thành",
      heritageIntro:
        "Không gian số hóa giới thiệu các địa điểm văn hóa, lịch sử và tiện ích địa phương của phường Cẩm Thành.",
      cemeteryTitle: "Sa bàn Nghĩa trang Liệt sĩ Núi Thiên Bút",
      cemeteryIntro:
        "Tra cứu thông tin, định vị phần mộ và hỗ trợ thân nhân tìm đến đúng vị trí trong khuôn viên nghĩa trang.",
      youtubeUrl: "",
      mapImage: "/cemetery-map.jpg",
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Seeded ${graves.length} graves from ${htmlFile}`);

function makeId(khu, hang, mo, tt) {
  const cleanKhu = (khu || "NA").replace(/\s+/g, "").replace("Đ", "D").replace("đ", "d");
  if (!hang || !mo) return `HS-${String(tt).padStart(3, "0")}`;
  return `${cleanKhu}-${String(hang).padStart(2, "0")}-${String(mo).padStart(2, "0")}`;
}
