const assert = require('node:assert/strict');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

const presets = {
  '預設': '資料來源：ETtoday 採訪團隊',
  '路透社': '資料來源：路透社',
  '達志影像': '資料來源：達志影像',
  '美聯社': '資料來源：美聯社'
};

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
    const source = page.locator('#sourceText');
    assert.equal(await source.inputValue(), presets['預設']);
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      for (const layout of ['magazine', 'glass', 'news-points']) {
        await page.locator(`.layout-card[data-layout="${layout}"]`).click();
        for (const [name, text] of Object.entries(presets)) {
          const button = page.locator('.source-shortcuts').getByRole('button', { name, exact: true });
          assert.ok(await button.isVisible(), `${layout} ${width}: ${name} preset is hidden`);
          await button.click();
          assert.equal(await source.inputValue(), text);
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('et_chart_v16_config')).sourceText), text);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      }
    }
    await source.fill('資料來源：編輯自訂');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await source.inputValue(), '資料來源：編輯自訂');
    await source.fill('');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await source.inputValue(), '');
    await page.locator('.source-shortcuts').getByRole('button', { name: '預設', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await source.inputValue(), presets['預設']);
    assert.deepEqual(errors, []);
    console.log('Source presets work in all three desktop/mobile layouts; custom, empty, and default values persist.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
