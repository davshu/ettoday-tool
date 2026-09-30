const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');
const path = require('node:path');
const fs = require('node:fs/promises');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'docs', 'superpowers', 'verification');
const url = process.env.V16_QA_URL || 'http://127.0.0.1:8765/index.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.photo-meta.visible').waitFor();

  for (const layout of ['magazine', 'glass', 'news-points']) {
    await page.locator(`.layout-card[data-layout="${layout}"]`).click();
    const currentLabel = await page.locator('#layoutPickerSelected').textContent();
    const currentTitle = await page.locator('#mainTitle').inputValue();
    await page.locator('#layoutPicker > summary').click();
    if (await page.locator('.layout-card').first().isVisible()) throw new Error('Layout picker did not collapse.');
    if (!(await page.locator('#layoutPickerSelected').isVisible())) throw new Error('Collapsed layout label is hidden.');
    await page.locator('#layoutPicker > summary').press('Enter');
    if (!(await page.locator('.layout-card').first().isVisible())) throw new Error('Layout picker keyboard toggle failed.');
    if ((await page.locator('#layoutPickerSelected').textContent()) !== currentLabel ||
        (await page.locator('#mainTitle').inputValue()) !== currentTitle) throw new Error('Collapse changed editor state.');
    if (layout === 'news-points') await page.locator('#referenceLogoSelect').selectOption('company');
    else await page.locator(`[data-logo-choice="${layout === 'glass' ? 'capsule' : 'company'}"]`).click();
    if (layout === 'news-points') {
      await page.locator('#mainTitle').evaluate(input => {
        input.focus();
        const start = input.value.indexOf('新高');
        input.setSelectionRange(start, input.value.length);
        input.dispatchEvent(new Event('select'));
      });
      await page.locator('[title="亮橘 · #FC8416"]').click();
    }
    await page.locator('.editor').evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: path.join(outputDir, `v16-${layout}-desktop.png`) });
  }

  await page.locator('.layout-card[data-layout="magazine"]').click();
  const originalIntro = await page.locator('#m_Sub').inputValue();
  const originalTitle = await page.locator('#mainTitle').inputValue();
  const originalTitleSize = await page.locator('#titleSize').inputValue();
  if (!(await page.evaluate(() => v15RenderResult.valid && v15RenderResult.contentBottom <= v15RenderResult.safeBottom))) {
    throw new Error('Magazine intro exceeds the source safe area.');
  }
  await page.locator('#m_Sub').fill(Array(8).fill('測試引言過長必須禁止輸出').join('\n'));
  if (!(await page.locator('#downloadButton').isDisabled())) throw new Error('Overflow did not block download.');
  if (!(await page.locator('#copyButton').isDisabled())) throw new Error('Overflow did not block clipboard output.');
  if (!(await page.locator('#v15Validation').textContent()).includes('精簡')) throw new Error('Overflow guidance is missing.');
  await page.locator('#m_Sub').fill(originalIntro);
  if (await page.locator('#downloadButton').isDisabled()) throw new Error('Restoring intro did not restore export.');
  await page.locator('#mainTitle').fill('測試主標過長'.repeat(10));
  await page.locator('#titleSize').fill('120');
  await page.locator('#titleSize').dispatchEvent('input');
  if (!(await page.locator('#downloadButton').isDisabled())) throw new Error('Long title did not block export.');
  await page.locator('#mainTitle').fill(originalTitle);
  await page.locator('#titleSize').fill(originalTitleSize);
  await page.locator('#titleSize').dispatchEvent('input');
  await page.locator('.layout-card[data-layout="news-points"]').click();

  await page.locator('#bgPanX').fill('0');
  await page.locator('#bgPanX').dispatchEvent('input');
  const panX = await page.locator('#bgPanX').inputValue();
  if (panX !== '0') throw new Error('Left photo alignment did not update the crop.');
  await page.getByRole('button', { name: '重設照片位置', exact: true }).click();
  if ((await page.locator('#bgPanX').inputValue()) !== '50') throw new Error('Photo reset failed.');
  await page.getByText('圖片網址（URL）', { exact: true }).click();
  if (!(await page.locator('#imgUrl').isVisible())) throw new Error('URL entry is unavailable.');
  await page.getByText('圖片網址（URL）', { exact: true }).click();
  const countBefore = await page.locator('.v15-point-row').count();
  await page.locator('#v15AddPoint').click();
  if ((await page.locator('.v15-point-row').count()) !== countBefore + 1) throw new Error('Add point failed.');
  await page.getByRole('button', { name: `刪除第 ${countBefore + 1} 點`, exact: true }).click();

  const uploadPath = path.join(root, 'assets', 'ettoday-logo-v15.png');
  await page.locator('#bgUpload').setInputFiles(uploadPath);
  await page.waitForFunction(() => document.getElementById('photoMetaName').textContent.includes('ettoday-logo-v15.png'));
  const uploadedName = await page.locator('.photo-meta.visible').textContent();
  if (!uploadedName.includes('ettoday-logo-v15.png')) {
    throw new Error(`Unexpected upload metadata: ${uploadedName}`);
  }
  if (await page.locator('#downloadButton').isDisabled()) {
    throw new Error('Download should be enabled after a local image is uploaded.');
  }
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#downloadButton').click();
  const download = await downloadEvent;
  const png = await fs.readFile(await download.path());
  if (png.readUInt32BE(16) !== 1080 || png.readUInt32BE(20) !== 1350) {
    throw new Error('Export dimensions changed from V15.');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.photo-meta.visible').waitFor({ state: 'attached' });
  for (const layout of ['magazine', 'glass', 'news-points']) {
    await page.locator(`.layout-card[data-layout="${layout}"]`).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) throw new Error(`Mobile ${layout} has horizontal overflow.`);
    await page.screenshot({ path: path.join(outputDir, `v16-${layout}-mobile.png`) });
    await page.locator('#layoutPicker > summary').click();
    if (await page.locator('.layout-card').first().isVisible()) throw new Error('Mobile picker did not collapse.');
    await page.locator('#layoutPicker > summary').click();
  }

  await browser.close();
  if (errors.length) {
    console.error(JSON.stringify(errors, null, 2));
    process.exitCode = 1;
  } else {
    console.log('Captured V16 desktop layouts and mobile view with no browser errors.');
  }
})();
