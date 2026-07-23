import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("runtime content uses the approved cemetery name", async () => {
  const files = await Promise.all([
    read("src/App.jsx"),
    read("src/heritageSites.js"),
    read("data/settings.json"),
    read("server/index.js"),
  ]);

  assert.equal(
    files.some((content) => content.includes("Nghĩa trang Liệt sĩ Núi Thiên Bút")),
    false,
  );
  assert.equal(
    files.every((content) => content.includes("Nghĩa trang Liệt sĩ Thiên Bút")),
    true,
  );
});

test("homepage uses the approved hero content and assets", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /\/homepage-sunset-heritage\.png/);
  assert.match(app, /\/cemetery-tower-thumbnail\.png/);
  assert.match(app, /KHÁM PHÁ DI SẢN LỊCH SỬ & VĂN HOÁ PHƯỜNG CẨM THÀNH/);
  assert.equal(app.includes("Tra cứu mộ liệt sĩ"), false);
  await access(new URL("../public/homepage-sunset-heritage.png", import.meta.url));
  await access(new URL("../public/cemetery-tower-thumbnail.png", import.meta.url));
});
