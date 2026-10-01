const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

const colors = ['#38BDF8', '#34D399', '#FF6B6B', '#A78BFA', '#005BAC', '#009A44', '#28C8C8'];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
    await page.locator('.photo-meta.visible').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const extra = page.locator('#v16PaletteSwatches');
    assert.ok(await extra.isVisible(), 'Magazine extra palette is missing.');
    assert.equal(await extra.locator('[data-magazine-color]').count(), 7);
    assert.ok((await extra.locator('[data-magazine-color]').allTextContents()).every(text => !text.trim()));
    const pixels = () => page.locator('#myCanvas').evaluate(canvas => {
      const ctx = canvas.getContext('2d');
      return [[96, 860], [86, 1235]].map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3));
    });
    const assertColor = async color => {
      const rgb = color.match(/[0-9A-F]{2}/g).map(hex => parseInt(hex, 16));
      assert.deepEqual(await pixels(), [rgb, rgb], `Tag and intro line did not both use ${color}`);
    };
    const initialTitle = await page.locator('#mainTitle').inputValue();
    const initialColors = await page.evaluate(() => JSON.stringify(textColorMaps));
    await page.locator('[data-color-target="tag"]').click();
    for (const color of colors) {
      await extra.locator(`button[onclick="applyV16PaletteColor('${color}')"]`).click();
      await assertColor(color);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('et_chart_v16_config')).tagColor), color);
    }
    assert.equal(await page.locator('#mainTitle').inputValue(), initialTitle);
    assert.equal(await page.evaluate(() => JSON.stringify(textColorMaps)), initialColors);
    await page.reload({ waitUntil: 'networkidle' });
    await assertColor(colors.at(-1));
    await page.locator('[data-color-target="text"]').click();
    await page.locator('#m_Sub').evaluate(input => { input.focus(); input.setSelectionRange(0, 2); input.dispatchEvent(new Event('select')); });
    await extra.locator('button[onclick="applyV16PaletteColor(\'#FF6B6B\')"]').click();
    await assertColor(colors.at(-1));
    assert.deepEqual(await page.evaluate(() => textColorMaps.m_Sub.slice(0, 2)), ['#FF6B6B', '#FF6B6B']);
    for (const layout of ['glass', 'news-points']) {
      await page.locator(`.layout-card[data-layout="${layout}"]`).click();
      for (const button of await extra.locator('[data-magazine-color]').all()) {
        assert.equal(await button.isVisible(), false, `Extra colors leaked into ${layout}.`);
      }
    }
    await page.locator('.layout-card[data-layout="magazine"]').click();
    await page.locator('[data-color-target="tag"]').click();
    await extra.locator('button[onclick="applyV16PaletteColor(\'#005BAC\')"]').click();
    const downloaded = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const png = await fs.readFile(await (await downloaded).path());
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1350);
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      assert.ok(await extra.isVisible());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await extra.screenshot({ path: path.resolve(__dirname, `../docs/superpowers/verification/v16-magazine-colors-${width}.png`) });
      await assertColor('#005BAC');
    }
    assert.deepEqual(errors, []);
    console.log('Seven magazine-only colors, tag/intro-line canvas pixels, selection color isolation, persistence and PNG export passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
