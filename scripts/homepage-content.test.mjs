import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("runtime content consistently spells liệt sĩ", async () => {
  const files = await Promise.all([
    read("src/App.jsx"),
    read("src/heritageSites.js"),
    read("data/settings.json"),
    read("data/graves.json"),
    read("server/index.js"),
  ]);

  assert.equal(files.some((content) => /liệt sỹ/i.test(content)), false);
});

test("homepage video sits before the heritage map", async () => {
  const app = await read("src/App.jsx");
  const videoIndex = app.indexOf('<section className="homeVideoSection"');
  const mapIndex = app.indexOf('<section className="heritageMapShell"');

  assert.notEqual(videoIndex, -1);
  assert.ok(videoIndex < mapIndex);
  assert.match(app, /<VideoFrame url=\{HOME_VIDEO_URL\} title="Video giới thiệu di sản Cẩm Thành" \/>/);
  assert.match(app, /const HOME_VIDEO_URL = "https:\/\/youtu\.be\/BlluoKb81bQ";/);
});

test("visitor marker and route share the approved origin", async () => {
  const [app, styles] = await Promise.all([read("src/App.jsx"), read("src/styles.css")]);

  assert.match(styles, /\.youAreHere[\s\S]*?left:\s*37\.5%;[\s\S]*?top:\s*40\.2%;/);
  assert.equal(
    app.includes('points={`37.5,40.2 37.5,67 ${selectedGrave.x},67 ${selectedGrave.x},${selectedGrave.y}`}'),
    true,
  );
});

test("homepage hero matches the approved replacement", async () => {
  const image = await readFile(new URL("../public/homepage-sunset-heritage.png", import.meta.url));
  const digest = createHash("sha256").update(image).digest("hex").toUpperCase();

  assert.equal(digest, "289673AE5CDCEF7CF572527A7F59D542335221FE4A9004AECD796FE85BF72F68");
});
