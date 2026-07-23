# Home Video, Marker, and Copy Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved homepage video and replacement hero, standardize `liệt sĩ`, and move the visitor marker plus route origin to the annotated map location.

**Architecture:** Extend the existing source-reading regression test so content, ordering, coordinates, and the exact hero asset are locked down. Reuse `VideoFrame`, keep the public hero URL stable, and update only the focused React/CSS declarations that own the homepage and cemetery route.

**Tech Stack:** React 18, Vite 6, CSS, Node.js built-in test runner, YouTube embed

## Global Constraints

- Runtime website content must not use the phrase `liệt sỹ`, case-insensitively; use `liệt sĩ`.
- Preserve unrelated historical rank text such as `chiến sỹ`, `thượng sỹ`, and `hạ sỹ`.
- The homepage video URL is exactly `https://youtu.be/BlluoKb81bQ` and appears below the hero, before the heritage map.
- Keep the cemetery narration setting `youtubeUrl` unchanged.
- Keep the public hero URL `/homepage-sunset-heritage.png` and replace its bytes with the supplied image whose SHA-256 is `289673AE5CDCEF7CF572527A7F59D542335221FE4A9004AECD796FE85BF72F68`.
- The visitor marker is `left: 37.5%`, `top: 40.2%`; the route begins at `37.5,40.2` and first travels vertically to `37.5,67`.
- Deploy to `/home/viis/acc-camthanh` and restart PM2 process `acc-camthanh-test` only after local verification passes.

---

### Task 1: Add failing regression coverage

**Files:**
- Modify: `scripts/homepage-content.test.mjs`

**Interfaces:**
- Consumes: runtime sources, `src/styles.css`, and `public/homepage-sunset-heritage.png`.
- Produces: assertions for spelling, video placement, marker coordinates, route origin, and exact hero bytes.

- [ ] **Step 1: Add imports and regression tests**

Add `createHash` and these tests:

```js
import { createHash } from "node:crypto";

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`

Expected: the video, marker/route, and hero checksum tests fail because the approved changes are absent; the spelling guard passes because current runtime text is already correct.

- [ ] **Step 3: Commit the regression tests**

```powershell
git add scripts/homepage-content.test.mjs
git commit -m "test: cover home video and visitor marker"
```

### Task 2: Implement video, marker, and replacement hero

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Replace: `public/homepage-sunset-heritage.png`

**Interfaces:**
- Consumes: `VideoFrame`, the approved YouTube URL, and the supplied PNG.
- Produces: a responsive video section and aligned marker/route geometry.

- [ ] **Step 1: Replace the hero asset bytes**

```powershell
Copy-Item -LiteralPath 'C:\Users\luong\AppData\Local\Temp\codex-clipboard-383f74c8-a7ec-4e79-af27-86adee312206.png' -Destination 'public\homepage-sunset-heritage.png' -Force
```

- [ ] **Step 2: Add the homepage video before the map**

Add the constant near the other module constants:

```js
const HOME_VIDEO_URL = "https://youtu.be/BlluoKb81bQ";
```

Add this as the first child of `<main className="homePage">`:

```jsx
<section className="homeVideoSection" aria-label="Video giới thiệu di sản Cẩm Thành" data-reveal>
  <VideoFrame url={HOME_VIDEO_URL} title="Video giới thiệu di sản Cẩm Thành" />
</section>
```

- [ ] **Step 3: Move the marker and route origin**

In `src/styles.css`, set:

```css
.youAreHere {
  left: 37.5%;
  top: 40.2%;
}
```

In `src/App.jsx`, set the route points to:

```jsx
<polyline points={`37.5,40.2 37.5,67 ${selectedGrave.x},67 ${selectedGrave.x},${selectedGrave.y}`} />
```

- [ ] **Step 4: Style the video and daylight hero**

Add:

```css
.homeVideoSection {
  width: min(100%, 1120px);
  justify-self: center;
  padding: clamp(10px, 1.5vw, 16px);
  border: 1.5px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-primary);
  box-shadow: var(--shadow-md);
}

.homeVideoSection .videoFrame,
.homeVideoSection .videoPlaceholder {
  border: 0;
  box-shadow: none;
}
```

Set `.heroImage img` to `filter: saturate(0.92) contrast(1.02) brightness(0.84)`. Set `.heroImage::after` to:

```css
background:
  radial-gradient(circle at 50% 42%, rgba(20, 27, 27, 0.04) 0%, rgba(24, 22, 20, 0.32) 74%),
  linear-gradient(180deg, rgba(15, 24, 25, 0.12) 0%, rgba(26, 24, 22, 0.34) 52%, rgba(22, 16, 14, 0.76) 100%);
```

- [ ] **Step 5: Run the regression suite**

Run: `npm test`

Expected: PASS with 6 tests and 0 failures.

- [ ] **Step 6: Commit the implementation**

```powershell
git add src/App.jsx src/styles.css public/homepage-sunset-heritage.png
git commit -m "feat: add homepage video and move visitor marker"
```

### Task 3: Verify visually and deploy

**Files:**
- No source files expected.

**Interfaces:**
- Consumes: committed local branch.
- Produces: verified local build and updated PM2 deployment.

- [ ] **Step 1: Run fresh automated verification**

Run: `npm test`

Expected: PASS with 6 tests and 0 failures.

Run: `npm run build`

Expected: Vite exits with code 0.

- [ ] **Step 2: Verify desktop and mobile in the browser**

At `1440 × 900` and `390 × 844`, verify the hero text contrast, video placement before the map, 16:9 scaling without horizontal overflow, and centered mobile crop. On the cemetery page, select a grave and verify the marker sits at the annotated location and the blue route starts at its dot.

- [ ] **Step 3: Push the current branch**

```powershell
git push origin codex/heritage-pages-v3
```

- [ ] **Step 4: Deploy the verified commit**

```powershell
ssh viis@172.30.65.1 "set -e; cd /home/viis/acc-camthanh; git pull --ff-only origin codex/heritage-pages-v3; npm run build; pm2 restart acc-camthanh-test"
```

- [ ] **Step 5: Verify host and public endpoints**

Confirm PM2 is online, port `3001` is listening, the homepage/API return HTTP `200`, the new hero SHA-256 matches, and `https://tuoitrecamthanh.com.vn/` plus the hero asset return HTTP `200`.
