const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
    await page.locator('.photo-meta.visible').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const setRange = async (id, value) => {
      await page.locator(`#${id}`).fill(String(value));
      await page.locator(`#${id}`).dispatchEvent('input');
    };
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      for (const layout of ['magazine', 'glass', 'news-points']) {
        await page.locator(`.layout-card[data-layout="${layout}"]`).click();
        for (const id of ['bgPanX', 'bgPanY']) {
          assert.ok(await page.locator(`#${id}`).isVisible(), `${layout} ${width}: ${id} slider is hidden`);
        }
        assert.equal(await page.locator('#referencePhotoPosition').count(), 0);
        await setRange('bgZoom', 160);
        await setRange('bgPanX', 50);
        await setRange('bgPanY', 50);
        const before = await page.locator('#myCanvas').evaluate(canvas => canvas.toDataURL());
        await setRange('bgPanX', 28);
        await setRange('bgPanY', 74);
        assert.notEqual(await page.locator('#myCanvas').evaluate(canvas => canvas.toDataURL()), before);
        assert.equal(await page.locator('#v_bgPanX').textContent(), '28%');
        assert.equal(await page.locator('#v_bgPanY').textContent(), '74%');
        await page.locator('#bgPanX').focus();
        await page.locator('#bgPanX').press('ArrowRight');
        assert.equal(await page.locator('#bgPanX').inputValue(), '30');
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('#bgPanX').inputValue(), '30');
        assert.equal(await page.locator('#bgPanY').inputValue(), '74');
        await setRange('bgPanX', 0);
        await setRange('bgPanY', 100);
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('#bgPanX').inputValue(), '0');
        assert.equal(await page.locator('#bgPanY').inputValue(), '100');
        await page.getByRole('button', { name: '重設照片位置', exact: true }).click();
        assert.equal(await page.locator('#bgPanX').inputValue(), '50');
        assert.equal(await page.locator('#bgPanY').inputValue(), '50');
        assert.equal(await page.locator('#bgZoom').inputValue(), '100');
        assert.equal(await page.locator('#v_bgPanX').textContent(), '50%');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        await page.locator('#v16-section-photo').screenshot({ path: path.resolve(__dirname, `../docs/superpowers/verification/v16-${layout}-position-${width}.png`) });
      }
    }
    assert.deepEqual(errors, []);
    console.log('Visible X/Y sliders, canvas changes, keyboard input, saved endpoints and reset passed for all desktop/mobile layouts.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
