const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.dismiss());
    await page.addInitScript(() => {
      window.testClipboardWrites = 0;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { write: async items => {
          if (!items[0].types.includes('image/png')) throw new Error('Clipboard PNG is missing.');
          window.testClipboardWrites += 1;
        } }
      });
    });
    await page.goto(process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
    await page.locator('.photo-meta.visible').waitFor();
    for (const layout of ['magazine', 'glass', 'news-points']) {
      await page.locator(`.layout-card[data-layout="${layout}"]`).click();
      await page.locator('#mainTitle').fill('測試大字級長主標'.repeat(12));
      await page.locator('#titleSize').fill('140');
      await page.locator('#titleSize').dispatchEvent('input');
      if (layout === 'magazine') {
        await page.locator('#m_Sub').fill(Array(8).fill('測試過長引言仍可輸出').join('\n'));
        await page.locator('#m_SubSize').fill('80');
        await page.locator('#m_SubSize').dispatchEvent('input');
      }
      if (layout === 'glass') await page.locator('#g_Desc').fill('測試過長內文仍可輸出'.repeat(20));
      if (layout === 'news-points') {
        for (const textarea of await page.locator('.v15-point-row textarea').all()) {
          await textarea.fill('測試過長重點仍可輸出'.repeat(20));
        }
      }
      assert.equal(await page.locator('#downloadButton').isDisabled(), false, `${layout}: long text blocks download`);
      assert.equal(await page.locator('#copyButton').isDisabled(), false, `${layout}: long text blocks copy`);
      assert.doesNotMatch(await page.locator('#v15Validation').textContent(), /精簡|行數過多|超出/);
      const downloaded = page.waitForEvent('download');
      await page.locator('#downloadButton').click();
      const png = await fs.readFile(await (await downloaded).path());
      assert.equal(png.readUInt32BE(16), 1080);
      assert.equal(png.readUInt32BE(20), 1350);
      const copied = await page.evaluate(() => window.testClipboardWrites);
      await page.locator('#copyButton').click();
      await page.waitForFunction(previous => window.testClipboardWrites > previous, copied);
    }
    await page.evaluate(() => { bgImg = null; draw(); });
    assert.equal(await page.locator('#downloadButton').isDisabled(), true, 'Missing photo check was removed.');
    assert.equal(await page.locator('#copyButton').isDisabled(), true);
    const copied = await page.evaluate(() => window.testClipboardWrites);
    await page.evaluate(async () => { downloadImage(); await copyImage(); });
    assert.equal(await page.evaluate(() => window.testClipboardWrites), copied);
    assert.deepEqual(errors, []);
    console.log('All layouts export long/large text as 1080x1350 PNG; clipboard PNG path (mocked) and missing-photo guard passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
