const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      for (const layout of ['magazine', 'glass', 'news-points']) {
        await page.locator(`.layout-card[data-layout="${layout}"]`).click();
        await page.locator('.photo-meta.visible').waitFor({ state: 'attached' });
        const organization = await page.evaluate(() => {
          const tag = document.getElementById('tagText');
          const filter = document.getElementById('bgFilter');
          const palette = document.getElementById('v16PaletteSwatches');
          const buttons = [...document.querySelectorAll('.palette-swatch')].filter(button => getComputedStyle(button).display !== 'none');
          return {
            customInContent: Boolean(tag.closest('#v16-section-content')),
            customAfterTags: Boolean(document.querySelector('.tag-buttons').compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING),
            filterInPhotos: Boolean(filter.closest('#v16-section-photo')),
            filterBeforeZoom: Boolean(filter.compareDocumentPosition(document.getElementById('bgZoom')) & Node.DOCUMENT_POSITION_FOLLOWING),
            singlePalette: Boolean(palette) && buttons.every(button => button.parentElement === palette),
            categories: [...document.querySelectorAll('.palette-main .subsection-title, .compact-colors .subsection-title')].filter(element => element.offsetWidth > 0).length,
            overflow: document.documentElement.scrollWidth > innerWidth + 1
          };
        });
        assert.ok(organization.customInContent, `${layout}: custom category is still at the bottom`);
        assert.ok(organization.customAfterTags);
        assert.ok(organization.filterInPhotos, `${layout}: photo filter is still at the bottom`);
        assert.ok(organization.filterBeforeZoom);
        assert.ok(organization.singlePalette, `${layout}: colors are not in one palette`);
        assert.equal(organization.categories, 0);
        assert.equal(organization.overflow, false);
        if (layout === 'magazine') assert.equal(await page.locator('label[for="m_Overlay"]').textContent(), '遮罩深度');
        await page.locator('#bgFilter').selectOption('none');
        const original = await page.locator('#myCanvas').evaluate(canvas => Array.from(canvas.getContext('2d').getImageData(480, 180, 40, 40).data));
        for (const effect of ['vivid', 'soft', 'desaturated']) {
          await page.evaluate(() => {
          window.filterTextLeaks = [];
          const original = ctx.fillText;
          ctx.fillText = function(...args) {
            if (this.filter !== 'none') window.filterTextLeaks.push(this.filter);
            return original.apply(this, args);
          };
          });
          await page.locator('#bgFilter').selectOption(effect);
          assert.notDeepEqual(await page.locator('#myCanvas').evaluate(canvas => Array.from(canvas.getContext('2d').getImageData(480, 180, 40, 40).data)), original);
          assert.deepEqual(await page.evaluate(() => window.filterTextLeaks), []);
          await page.reload({ waitUntil: 'networkidle' });
          await page.locator('.photo-meta.visible').waitFor({ state: 'attached' });
          assert.equal(await page.locator('#bgFilter').inputValue(), effect, `${layout}: ${effect} did not persist`);
        }
        const downloaded = page.waitForEvent('download');
        await page.locator('#downloadButton').click();
        const png = await fs.readFile(await (await downloaded).path());
        assert.equal(png.readUInt32BE(16), 1080);
        assert.equal(png.readUInt32BE(20), 1350);
        await page.locator('#bgFilter').selectOption('none');
        await page.locator('#tagText').fill('社會');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('et_chart_v16_config')).tagText), '社會');
        assert.equal(await page.locator('#downloadButton').isDisabled(), false);
        const photo = page.locator('#v16-section-photo');
        await photo.evaluate(element => element.scrollIntoView({ block: 'start' }));
        await photo.screenshot({ path: path.resolve(__dirname, `../docs/superpowers/verification/v16-${layout}-reorganized-photo-${width}.png`) });
        const palette = page.locator('#v16PaletteSwatches');
        await palette.evaluate(element => element.scrollIntoView({ block: 'start' }));
        await palette.screenshot({ path: path.resolve(__dirname, `../docs/superpowers/verification/v16-${layout}-unified-palette-${width}.png`) });
      }
    }
    assert.deepEqual(errors, []);
    console.log('Unified palettes, relocated controls, three image effects, persistence, text isolation and responsive layouts passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
