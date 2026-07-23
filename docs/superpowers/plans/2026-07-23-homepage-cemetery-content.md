# Homepage and Cemetery Content Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved customer feedback to the homepage imagery, hero content, and all runtime references to Nghĩa trang Liệt sĩ Thiên Bút.

**Architecture:** Keep the current React/Vite structure and replace only content, static assets, and focused hero styling. Add a Node built-in regression test that reads the runtime sources so future edits cannot restore the old name, old hero, or removed CTA.

**Tech Stack:** React 18, Vite 6, CSS, Node.js built-in test runner

## Global Constraints

- The displayed name is exactly `Nghĩa trang Liệt sĩ Thiên Bút`; runtime content must not contain `Nghĩa trang Liệt sĩ Núi Thiên Bút`.
- The homepage title is exactly `KHÁM PHÁ DI SẢN LỊCH SỬ & VĂN HOÁ PHƯỜNG CẨM THÀNH`.
- The homepage must not show the `Tra cứu mộ liệt sĩ` CTA.
- Keep cemetery routes, coordinates, grave data, and the cemetery detail hero unchanged.
- Use the supplied sunset composite for the homepage hero and the supplied tower photograph for the cemetery thumbnail.
- Preserve text legibility with a warm dark overlay and responsive cropping.

---

### Task 1: Add content regression coverage

**Files:**
- Create: `scripts/homepage-content.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: UTF-8 source files in `src/App.jsx`, `src/heritageSites.js`, `data/settings.json`, and `server/index.js`.
- Produces: `npm test`, which validates approved copy, asset references, and CTA removal.

- [ ] **Step 1: Write the failing test**

```js
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
  assert.equal(files.some((content) => content.includes("Nghĩa trang Liệt sĩ Núi Thiên Bút")), false);
  assert.equal(files.every((content) => content.includes("Nghĩa trang Liệt sĩ Thiên Bút")), true);
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
```

Add this script to `package.json`:

```json
"test": "node --test scripts/*.test.mjs"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`

Expected: FAIL because the old cemetery name, old hero asset, old CTA, and missing new image files still exist.

- [ ] **Step 3: Commit the failing regression test**

```powershell
git add package.json scripts/homepage-content.test.mjs
git commit -m "test: cover approved homepage content"
```

### Task 2: Replace assets and runtime content

**Files:**
- Create: `public/homepage-sunset-heritage.png`
- Create: `public/cemetery-tower-thumbnail.png`
- Modify: `src/App.jsx`
- Modify: `src/heritageSites.js`
- Modify: `data/settings.json`
- Modify: `server/index.js`

**Interfaces:**
- Consumes: the two customer-supplied PNG files.
- Produces: stable public asset URLs and approved runtime copy.

- [ ] **Step 1: Copy the approved image files**

```powershell
Copy-Item -LiteralPath 'C:\Users\luong\AppData\Local\Temp\codex-clipboard-d6502760-3e04-4972-93d5-0be375161eae.png' -Destination 'public\homepage-sunset-heritage.png'
Copy-Item -LiteralPath 'C:\Users\luong\AppData\Local\Temp\codex-clipboard-e942e217-f3e8-46b1-86ab-ede2a9d94e28.png' -Destination 'public\cemetery-tower-thumbnail.png'
```

- [ ] **Step 2: Apply the approved React content**

In `src/App.jsx`, set the cemetery place thumbnail to `/cemetery-tower-thumbnail.png`, the homepage hero image to `/homepage-sunset-heritage.png`, and the hero heading to the approved uppercase title. Remove the `heroPrimary` button while retaining `heroSecondary`. Replace every exact runtime occurrence of the old cemetery name with the approved name.

- [ ] **Step 3: Update content data and server defaults**

Replace every exact runtime occurrence of `Nghĩa trang Liệt sĩ Núi Thiên Bút` with `Nghĩa trang Liệt sĩ Thiên Bút` in `src/heritageSites.js`, `data/settings.json`, and `server/index.js`.

- [ ] **Step 4: Run the regression test**

Run: `npm test`

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit the content and asset change**

```powershell
git add public/homepage-sunset-heritage.png public/cemetery-tower-thumbnail.png src/App.jsx src/heritageSites.js data/settings.json server/index.js
git commit -m "feat: refresh homepage heritage presentation"
```

### Task 3: Tune hero contrast and verify responsive output

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing `.heroImage`, `.heroImage::after`, `.heroOverlay`, and mobile breakpoint styles.
- Produces: a readable warm overlay and responsive hero crop without changing component structure.

- [ ] **Step 1: Implement the warm contrast layer**

Set `.heroImage img` to `filter: saturate(1.02) contrast(1.02) brightness(0.86)`. Set `.heroImage::after` to a central radial vignette plus `linear-gradient(180deg, rgba(48, 24, 15, 0.16) 0%, rgba(57, 20, 22, 0.4) 52%, rgba(27, 11, 10, 0.8) 100%)`. At the mobile breakpoint, set the hero image to `object-position: 50% center`.

- [ ] **Step 2: Tune the long uppercase heading**

Set the desktop heading to `max-width: 980px`, `font-size: clamp(34px, 5.2vw, 68px)`, and `line-height: 1.08`. At the mobile breakpoint set `max-width: 94vw`, `font-size: clamp(30px, 9.5vw, 46px)`, and `line-height: 1.08` so the long uppercase title wraps without colliding with the logo or button.

- [ ] **Step 3: Run automated verification**

Run: `npm test`

Expected: PASS with 2 tests and 0 failures.

Run: `npm run build`

Expected: Vite build exits with code 0.

- [ ] **Step 4: Verify desktop and mobile visually**

Run the local app, capture the homepage at approximately 1440 × 900 and 390 × 844, and verify that the title is readable, the sunset remains visible, the remaining map CTA is centered, and key structures are not cropped incorrectly.

- [ ] **Step 5: Commit the visual tuning**

```powershell
git add src/styles.css
git commit -m "style: improve sunset hero contrast"
```
