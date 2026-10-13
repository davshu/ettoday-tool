const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/V17.html', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => bgImg && companyLogoImg.complete);
    assert.equal(await page.locator('#v16-section-content #titleSize').count(), 1);
    assert.equal(await page.locator('#group-magazine #m_SubSize').count(), 1);
    assert.equal(await page.locator('#v16-section-photo > .section-title, #v16-section-style-output > .section-title').count(), 0);
    const trackText = () => page.evaluate(() => {
      const original = ctx.fillText;
      window.qaText = [];
      ctx.fillText = function(text, x, y, maxWidth) {
        window.qaText.push({ text, x, y, maxWidth, ascent: this.measureText(text).actualBoundingBoxAscent, descent: this.measureText(text).actualBoundingBoxDescent });
        return original.apply(this, arguments);
      };
    });
    await trackText();
    const output = path.join(root, 'docs/superpowers/verification/v17');
    await fs.mkdir(output, { recursive: true });
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      for (const layout of ['magazine', 'glass', 'news-points']) {
        await page.locator(`.layout-card[data-layout="${layout}"]`).click();
        assert.equal(await page.locator('#titleSize').isVisible(), true);
        for (const position of ['top-right', 'top-left', 'bottom-center']) {
          await page.locator(`[data-logo-position="${position}"]`).click();
          for (const mode of ['company', 'capsule']) {
            await page.evaluate(mode => setV16LogoChoice(mode), mode);
            const result = await page.evaluate(() => {
              window.qaText = [];
              draw();
              return { position: v15State.logoPosition, box: getLogoPlacement(), text: window.qaText };
            });
            assert.equal(result.position, position);
            assert.equal(result.box.w, 180);
            assert.equal(result.box.h, 64);
            if (position === 'top-left') {
              assert.equal(result.box.x, 50);
              if (layout === 'news-points') assert.ok(result.text.find(t => t.text === '房產').x > result.box.x + result.box.w);
            }
            if (position === 'top-right') assert.equal(result.box.x, 850);
            if (position === 'bottom-center') {
              assert.equal(result.box.x, 450);
              const source = result.text.find(t => t.text === '資料來源：ETtoday 採訪團隊');
              assert.ok(source.y - source.ascent >= result.box.y + result.box.h + 8, 'Logo and source overlap');
              assert.ok(source.y + source.descent < 1350, 'Source cropped');
            }
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
          if (position !== 'top-right') {
            await page.locator('#myCanvas').screenshot({ path: path.join(output, `${layout}-${position}-${width}-canvas.png`) });
          }
        }
        await page.locator('#v16-section-content').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${layout}-controls-${width}.png`), fullPage: width === 390 });
        const downloaded = page.waitForEvent('download');
        await page.locator('#downloadButton').click();
        const png = await fs.readFile(await (await downloaded).path());
        assert.equal(png.readUInt32BE(16), 1080);
        assert.equal(png.readUInt32BE(20), 1350);
      }
    }
    await page.evaluate(() => { setV15Theme('light'); setV16LogoChoice('company'); });
    await page.locator('#myCanvas').screenshot({ path: path.join(output, 'news-points-bottom-light-logo.png') });
    await page.getByRole('button', { name: '儲存目前樣式', exact: true }).click();
    await page.locator('#personalNewName').fill('底部 Logo');
    await page.locator('#personalCreateForm button').click();
    await page.getByRole('button', { name: '關閉', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await trackText();
    assert.equal(await page.evaluate(() => v15State.logoPosition), 'bottom-center');
    await page.locator('[data-logo-position="top-left"]').click();
    await page.getByRole('button', { name: '套用樣式：底部 Logo', exact: true }).click();
    assert.equal(await page.evaluate(() => v15State.logoPosition), 'bottom-center');
    await page.evaluate(() => {
      document.getElementById('sourceText').value = '資料來源：' + '來源測試'.repeat(25);
      window.qaText = [];
      draw();
    });
    const footer = await page.evaluate(() => {
      const source = window.qaText.find(t => t.text.startsWith('資料來源：'));
      const date = window.qaText.find(t => /^\d{4}\.\d{2}\.\d{2}$/.test(t.text));
      ctx.font = `bold 26px ${FONT_FAMILY}`;
      return { sourceEnd: source.x + source.maxWidth, dateStart: date.x - ctx.measureText(date.text).width };
    });
    assert.ok(footer.sourceEnd <= footer.dateStart - 29, 'Long source overlaps date');
    await page.evaluate(() => setV16LogoChoice('hidden'));
    assert.equal(await page.locator('[data-logo-position="top-right"]').isDisabled(), true);
    await page.evaluate(() => setV16LogoChoice('company'));
    await page.evaluate(() => {
      setLogoPosition('top-left');
      setTagText('這是比較長的自訂新聞分類用來檢查避讓與邊界');
      window.qaText = [];
      draw();
    });
    const longTag = await page.evaluate(() => {
      const text = window.qaText.find(t => t.text === document.getElementById('tagText').value);
      return { left: text.x - text.maxWidth / 2, right: text.x + text.maxWidth / 2, logoEnd: getLogoPlacement().x + getLogoPlacement().w };
    });
    assert.ok(longTag.left >= longTag.logoEnd + 20);
    assert.ok(longTag.right <= 1030);
    assert.deepEqual(errors, []);
    console.log('V17 content font controls, compact sections, 3 logo positions x 3 layouts x 2 modes, source separation, desktop/mobile, export and preset persistence passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
