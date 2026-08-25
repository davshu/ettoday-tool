# ETtoday Canvas V15 News Card Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local `V15.html` draft that preserves both V14 layouts and adds a production-ready photo-plus-dynamic-points news layout without changing or publishing `index.html`.

**Architecture:** Keep the deliverable as one directly openable HTML file. Split its JavaScript into an inline pure core module (`globalThis.V15Core`) and a DOM/Canvas application module so state transitions and text-color behavior can be tested with Node's built-in test runner without browser dependencies. Clone the V14 rendering functions first, then add a third renderer and editor controls around a stable state model.

**Tech Stack:** HTML5, CSS, Canvas 2D, browser `localStorage`, Clipboard API, Node.js built-in `node:test` and `vm`.

**Spec:** `docs/superpowers/specs/2026-08-25-v15-news-card-layout-design.md`

## Global Constraints

- Output remains exactly 1080 x 1350 pixels.
- `index.html` remains unchanged throughout local review.
- Create `V15.html` as the only application deliverable in this plan.
- Preserve V14 magazine and glass layout behavior.
- Do not add a backend, package dependency, build step, GitHub push, or GitHub Pages deployment.
- Glass layout receives no new content fields.
- Logo geometry remains 180 x 64 pixels at top 80 and right 50, with radius 32.
- Download and copy are disabled when the V15 photo is missing or text overflows.

---

### Task 1: Establish the V15 Draft and Regression Guard

**Files:**
- Create: `V15.html`
- Create: `tests/v15-structure.test.mjs`
- Reference only: `index.html`

**Interfaces:**
- Consumes: V14 markup, styles, renderers, image loaders, persistence, download and clipboard functions from `index.html`.
- Produces: A standalone V15 draft with unchanged V14 selectors `magazine` and `glass`, plus a structural regression test used by every later task.

- [ ] **Step 1: Write the failing structural test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const v14 = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('V15 draft exists and keeps the V14 canvas and layouts', async () => {
  const v15 = await readFile(new URL('../V15.html', import.meta.url), 'utf8');
  assert.match(v15, /<canvas id="myCanvas" width="1080" height="1350"><\/canvas>/);
  assert.match(v15, /option value="magazine"/);
  assert.match(v15, /option value="glass"/);
  assert.match(v15, /function drawMagazine\(\)/);
  assert.match(v15, /function drawGlass\(\)/);
  assert.ok(v14.includes('ETtoday 神器 V14'));
});
```

- [ ] **Step 2: Run the test and verify the missing draft fails**

Run:

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/v15-structure.test.mjs
```

Expected: FAIL with `ENOENT` for `V15.html`.

- [ ] **Step 3: Copy V14 into the independent draft and update only its displayed version**

Create `V15.html` from `index.html`, then change the application heading to `ETtoday 神器 V15` and change the storage key from `et_chart_v8_3_config` to `et_chart_v15_config`. Do not edit `index.html`.

- [ ] **Step 4: Run the structural test**

Run the Step 2 command.

Expected: PASS.

- [ ] **Step 5: Verify V14 remains byte-for-byte untouched and commit**

```powershell
git diff --exit-code -- index.html
git add V15.html tests/v15-structure.test.mjs
git commit -m "chore: establish isolated V15 draft"
```

### Task 2: Add a Testable V15 Core State Model

**Files:**
- Modify: `V15.html`
- Create: `tests/v15-core.test.mjs`

**Interfaces:**
- Consumes: Inline script text identified by `id="v15-core"`.
- Produces: `globalThis.V15Core` with `createPoint(id, text)`, `syncColorMap(oldText, newText, colors)`, `movePoint(points, id, direction)`, `removePoint(points, id)`, `getLayoutRegions(ratio)`, and `getSafeBaseName(title, now)`.

- [ ] **Step 1: Write the core loader and failing behavior tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V15.html', import.meta.url), 'utf8');
const source = html.match(/<script id="v15-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'v15-core script must exist');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const core = context.globalThis.V15Core;

test('color positions survive insertion and deletion', () => {
  assert.deepEqual(
    Array.from(core.syncColorMap('新聞焦點', '新聞三焦點', [null, '#FC8416', null, null])),
    [null, '#FC8416', null, null, null]
  );
});

test('moving a point keeps its stable id and color map', () => {
  const points = [core.createPoint('a', '第一點'), core.createPoint('b', '第二點')];
  points[1].colors[0] = '#E72D48';
  const moved = core.movePoint(points, 'b', -1);
  assert.equal(moved[0].id, 'b');
  assert.equal(moved[0].colors[0], '#E72D48');
});

test('layout regions cover the complete canvas', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(core.getLayoutRegions(45))),
    { photo: { x: 0, y: 0, w: 1080, h: 608 }, text: { x: 0, y: 608, w: 1080, h: 742 } }
  );
});
```

- [ ] **Step 2: Run the core tests and verify the missing module fails**

Run:

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/v15-core.test.mjs
```

Expected: FAIL with `v15-core script must exist`.

- [ ] **Step 3: Implement the pure core module inside V15.html**

Add `<script id="v15-core">` before the DOM application script. Implement immutable point-array operations, prefix/suffix color-map synchronization, the exact 55/45, 45/55 and 35/65 Canvas regions, and filename sanitization. Assign only the public functions to `globalThis.V15Core`.

- [ ] **Step 4: Run all tests and commit**

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
git add V15.html tests/v15-core.test.mjs
git commit -m "feat: add V15 state and layout core"
```

Expected: all tests PASS.

### Task 3: Build the Third Layout Editor and Persistent State

**Files:**
- Modify: `V15.html`
- Modify: `tests/v15-structure.test.mjs`

**Interfaces:**
- Consumes: `V15Core` point operations and existing V14 classification/source controls.
- Produces: `v15State`, `renderPointEditors()`, `addV15Point()`, `removeV15Point(id)`, `moveV15Point(id, direction)`, `saveConfig()`, and `loadConfig()` support for layout 3.

- [ ] **Step 1: Extend the structural test for required controls**

Add assertions for:

```js
assert.match(v15, /option value="news-points"/);
assert.match(v15, /id="v15Ratio"/);
assert.match(v15, /id="v15Theme"/);
assert.match(v15, /id="v15PointsEditor"/);
assert.match(v15, /id="v15AddPoint"/);
assert.match(v15, /id="v15ShowLogo"/);
assert.match(v15, /id="v15Validation"/);
```

- [ ] **Step 2: Run the structural test and verify it fails**

Run Task 1 Step 2 command.

Expected: FAIL on the first missing V15 control.

- [ ] **Step 3: Implement the layout-specific controls**

Add `版型 3：新聞三點整理` to `layoutSelector`. Add one `group-news-points` section containing a three-option ratio segmented control, light/dark segmented control, shared point font-size range, point editor container, add-point button, Logo visibility checkbox, overflow status, and no glass-layout fields.

Each point row contains one text input using `標題｜說明`, move-up, move-down and delete icon buttons. Use the existing partial-color palette after a point input selection; store the active selection as `{ pointId, start, end }`.

- [ ] **Step 4: Extend persistence without changing the V14 fields**

Save `v15State` as:

```js
{
  ratio: 45,
  theme: 'light',
  pointSize: 40,
  showLogo: true,
  photo: { zoom: 1, panX: 0.5, panY: 0.5, filter: 'none' },
  points: [{ id: 'point-1', text: '審查時程｜本週進入逐案表決', colors: [] }]
}
```

Validate loaded values against the three ratios and two themes. Recreate malformed or duplicate point IDs. Keep uploaded image bytes out of `localStorage`.

- [ ] **Step 5: Run all tests and commit**

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
git add V15.html tests/v15-structure.test.mjs
git commit -m "feat: add dynamic V15 news editor"
```

Expected: all tests PASS.

### Task 4: Render the Photo and Dynamic News Points

**Files:**
- Modify: `V15.html`
- Create: `tests/v15-render-contract.test.mjs`

**Interfaces:**
- Consumes: `V15Core.getLayoutRegions`, `v15State`, `bgImg`, existing `drawImageProp`, `wrapText`, `drawTag`, `drawSource`, and `drawDate` primitives.
- Produces: `drawNewsPoints()`, `measureWrappedText()`, `drawColoredWrappedText()`, and `v15RenderResult = { valid, reasons, contentBottom, safeBottom }`.

- [ ] **Step 1: Write the failing render contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V15.html', import.meta.url), 'utf8');

test('V15 renderer uses measured overflow and exact V14 logo geometry', () => {
  assert.match(html, /function drawNewsPoints\(\)/);
  assert.match(html, /function measureWrappedText\(/);
  assert.match(html, /const logoWidth = 180/);
  assert.match(html, /const logoHeight = 64/);
  assert.match(html, /const logoX = canvas\.width - logoWidth - 50/);
  assert.match(html, /const logoY = 80/);
  assert.match(html, /contentBottom > safeBottom/);
});
```

- [ ] **Step 2: Run the render contract test and verify it fails**

Run all tests.

Expected: FAIL because `drawNewsPoints` is absent.

- [ ] **Step 3: Implement Canvas rendering and measured validation**

Draw the photo only in the selected region, applying the current filter and photo crop state. Draw the category at photo top-left. Draw the Logo at the exact V14 geometry. Draw the light or dark text surface, title, numbered dynamic points, date and source.

Measure every wrapped line using the actual selected font. Set `contentBottom` to the bottom of the last point and `safeBottom` above the footer. Return an invalid result when no image exists or `contentBottom > safeBottom`; never mutate ratio or font size during validation.

- [ ] **Step 4: Wire `draw()` to the third renderer and output-state controls**

Call `drawNewsPoints()` only for `layoutSelector.value === 'news-points'`. Use its result to set `v15Validation.textContent`, `downloadButton.disabled`, and `copyButton.disabled`. Keep V14 layouts downloadable under their original rules.

- [ ] **Step 5: Run all tests and commit**

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
git add V15.html tests/v15-render-contract.test.mjs
git commit -m "feat: render and validate V15 news cards"
```

Expected: all tests PASS.

### Task 5: Add Direct Photo Dragging and Preserve V14 Image Loading

**Files:**
- Modify: `V15.html`
- Modify: `tests/v15-structure.test.mjs`

**Interfaces:**
- Consumes: existing `handleBg`, `loadImgFromUrl`, proxy fallback array, Canvas pointer coordinates and `v15State.photo`.
- Produces: `startPhotoDrag(event)`, `movePhotoDrag(event)`, `endPhotoDrag(event)`, and `resetV15PhotoPosition()`.

- [ ] **Step 1: Add failing assertions for image and drag behavior**

```js
assert.match(v15, /images\.weserv\.nl/);
assert.match(v15, /wsrv\.nl/);
assert.match(v15, /corsproxy\.io/);
assert.match(v15, /function startPhotoDrag\(/);
assert.match(v15, /function movePhotoDrag\(/);
assert.match(v15, /function resetV15PhotoPosition\(/);
```

- [ ] **Step 2: Run the structural test and verify drag assertions fail**

Run all tests.

Expected: proxy assertions pass and drag-function assertions fail.

- [ ] **Step 3: Implement pointer dragging on the preview Canvas**

Activate dragging only when layout 3 is selected and the pointer begins inside the photo region. Convert pointer movement from displayed Canvas pixels to normalized pan values, clamp both axes to `[0, 1]`, update the existing pan sliders, save state and redraw. Use Pointer Events with pointer capture and end on `pointerup` or `pointercancel`.

- [ ] **Step 4: Keep URL loading and local upload behavior shared**

Retain the V14 three-proxy sequence and status text. On successful upload or URL load, reuse the same `bgImg`, reset only V15 photo position when layout 3 is active, and run validation. Do not save image bytes to browser settings.

- [ ] **Step 5: Run all tests and commit**

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
git add V15.html tests/v15-structure.test.mjs
git commit -m "feat: add direct V15 photo positioning"
```

Expected: all tests PASS.

### Task 6: Complete Reset, Export and Browser Verification

**Files:**
- Modify: `V15.html`
- Modify: `tests/v15-structure.test.mjs`
- Create: `docs/superpowers/verification/2026-08-25-v15-local-check.md`

**Interfaces:**
- Consumes: all V15 controls, render result, V14 `downloadImage`, `copyImage`, `resetConfig`, and safe filename behavior.
- Produces: a review-ready local V15 draft and recorded verification results.

- [ ] **Step 1: Add failing reset and output assertions**

```js
assert.match(v15, /id="downloadButton"/);
assert.match(v15, /id="copyButton"/);
assert.match(v15, /id="resetAllButton"/);
assert.match(v15, /confirm\('確定要重設所有文字、照片位置與設定嗎？'\)/);
assert.match(v15, /if \(!v15RenderResult\.valid\) return/);
```

- [ ] **Step 2: Run all tests and verify the new assertions fail**

Run all tests.

Expected: FAIL on missing stable button IDs or V15 output guard.

- [ ] **Step 3: Implement final reset and output guards**

Give download, copy and reset controls stable IDs. Confirm before clearing `et_chart_v15_config`; restore the default three points, ratio 45, light theme, V14 category defaults, source/date defaults and centered photo state. Guard both download and copy when layout 3 is invalid, while retaining their existing V14 error messages.

- [ ] **Step 4: Run automated verification**

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.mjs
git diff --check
git diff --exit-code 300418d -- index.html
```

Expected: all tests PASS, no whitespace errors, and no `index.html` difference from the approved-design commit.

- [ ] **Step 5: Start a local server and perform browser checks**

Run:

```powershell
& 'C:\Users\ETtoday\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/V15.html`. Verify at desktop and 390-pixel mobile width: layouts 1 and 2 render; layout 3 ratio/theme/category controls work; local image loads; photo drag and zoom agree; points add/delete/reorder; colors survive reorder; overflow disables download/copy; reset asks for confirmation; no text or controls overlap.

- [ ] **Step 6: Record evidence and commit the review draft**

Write the tested browser sizes, automated-test count, known limitation that uploaded image bytes do not survive reload, and local preview URL to `docs/superpowers/verification/2026-08-25-v15-local-check.md`.

```powershell
git add V15.html tests docs/superpowers/verification/2026-08-25-v15-local-check.md
git commit -m "feat: complete local V15 review draft"
```

Do not push any commit to GitHub.
