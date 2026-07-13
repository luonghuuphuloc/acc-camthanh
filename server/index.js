import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const gravesPath = path.join(dataDir, "graves.json");
const settingsPath = path.join(dataDir, "settings.json");

const PORT = process.env.PORT || 5174;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));
app.use(rateLimit({ limit: 50, windowMs: 1000 }));

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function requireAdmin(req, res, next) {
  if (req.header("x-admin-token") === ADMIN_PASSWORD) return next();
  res.status(401).json({ error: "UNAUTHORIZED" });
}

function rateLimit({ limit, windowMs }) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "local";
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= windowMs) {
      buckets.set(key, { start: now, count: 1 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) return res.status(429).json({ error: "RATE_LIMITED" });
    next();
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/settings", async (req, res, next) => {
  try {
    res.json({ ...defaultSettings(), ...(await readJson(settingsPath, {})) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings", requireAdmin, async (req, res, next) => {
  try {
    const settings = { ...defaultSettings(), ...req.body };
    await writeJson(settingsPath, settings);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.get("/api/graves", async (req, res, next) => {
  try {
    res.json(await readJson(gravesPath, []));
  } catch (error) {
    next(error);
  }
});

app.put("/api/graves/:id", requireAdmin, async (req, res, next) => {
  try {
    const graves = await readJson(gravesPath, []);
    const index = graves.findIndex((grave) => grave.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "NOT_FOUND" });

    const allowed = [
      "x",
      "y",
      "placed",
      "type",
      "ten",
      "namSinh",
      "queQuan",
      "capBac",
      "donVi",
      "hySinh",
      "noiHySinh",
      "ghiChu",
      "khu",
      "hang",
      "mo",
      "lo",
      "tt",
    ];
    const patch = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );
    graves[index] = { ...graves[index], ...patch, updatedAt: new Date().toISOString() };
    await writeJson(gravesPath, graves);
    res.json(graves[index]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/graves", requireAdmin, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: "ARRAY_REQUIRED" });
    await writeJson(gravesPath, req.body);
    res.json({ ok: true, count: req.body.length });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(rootDir, "dist")));
app.get("*", async (req, res, next) => {
  try {
    await fs.access(path.join(rootDir, "dist", "index.html"));
    res.sendFile(path.join(rootDir, "dist", "index.html"));
  } catch {
    next();
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "SERVER_ERROR" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});

function defaultSettings() {
  return {
    heritageTitle: "Khám phá di sản Cẩm Thành",
    heritageIntro:
      "Không gian số hóa giới thiệu các địa điểm văn hóa, lịch sử và tiện ích địa phương của phường Cẩm Thành.",
    cemeteryTitle: "Sa bàn Nghĩa trang Liệt sĩ Núi Thiên Bút",
    cemeteryIntro:
      "Tra cứu thông tin, định vị phần mộ và hỗ trợ thân nhân tìm đến đúng vị trí trong khuôn viên nghĩa trang.",
    youtubeUrl: "",
    mapImage: "/cemetery-map.jpg",
    footerAgency: "Đoàn phường Cẩm Thành",
    footerAddress: "Phường Cẩm Thành, Quảng Ngãi",
    footerPhone: "SĐT: đang cập nhật",
    footerEmail: "Email: contact@accheritagepro.vn",
    footerCopyright: "Bản quyền thuộc về ACC Heritage Pro",
  };
}
