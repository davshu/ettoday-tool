const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:\\Users\\ETtoday\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');

const root = path.resolve(__dirname, '..');
const url = process.env.V17_QA_URL || 'http://127.0.0.1:8765/V17.html';
const out = path.join(root, 'docs/superpowers/verification/v17');
const key = 'et_chart_v17_personal';
const draftKey = 'et_chart_v17_config';

(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => bgImg && companyLogoImg.complete);
    assert.equal(await page.locator('#layoutPicker #personalSection').count(), 1, 'Personal styles should collapse with the layout picker');
    assert.equal(await page.evaluate(() => v16ColorTarget), 'tag');
    assert.deepEqual(await page.locator('#v16ColorTarget button').allTextContents(), ['標籤底色', '局部文字']);
    const defaultCanvas = await page.locator('#myCanvas').evaluate(el => el.toDataURL());
    const profile = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const open = async tab => {
      await page.getByRole('button', { name: '個人設定（本機）', exact: true }).click();
      await page.locator(`[data-personal-tab="${tab}"]`).click();
    };
    const close = () => page.getByRole('button', { name: '關閉', exact: true }).click();
    const fillSlider = (id, value) => page.locator('#' + id).evaluate((el, value) => {
      el.value = value; el.dispatchEvent(new Event('input', { bubbles: true }));
    }, String(value));

    // Baseline pixels: the V17 personalization UI must not alter any approved renderer.
    const baselineContext = await browser.newContext();
    const baseline = await baselineContext.newPage();
    await baseline.goto(new URL('V16.html', url).href, { waitUntil: 'networkidle' });
    await baseline.waitForFunction(() => bgImg && companyLogoImg.complete);
    for (const layout of ['magazine', 'glass', 'news-points']) {
      await page.evaluate(layout => setV16Layout(layout), layout);
      await baseline.evaluate(layout => setV16Layout(layout), layout);
      assert.equal(await page.locator('#myCanvas').evaluate(el => el.toDataURL()), await baseline.locator('#myCanvas').evaluate(el => el.toDataURL()), layout + ': canvas changed');
    }
    await baselineContext.close();
    await page.evaluate(() => setV16Layout('magazine'));

    await page.locator('#tagText').fill('交通');
    await page.getByRole('button', { name: '儲存分類快捷', exact: true }).click();
    await page.locator('#tagText').fill('生活');
    await page.getByRole('button', { name: '儲存分類快捷', exact: true }).click();
    await page.getByRole('button', { name: '套用分類：交通', exact: true }).click();
    assert.equal(await page.locator('#tagText').inputValue(), '交通');
    await page.getByRole('button', { name: '儲存分類快捷', exact: true }).click();
    assert.deepEqual((await profile()).tags, ['交通', '生活']);

    await page.locator('#sourceText').fill('資料來源：攝影中心');
    await page.getByRole('button', { name: '儲存來源快捷', exact: true }).click();
    await page.locator('#sourceText').fill('');
    await page.getByRole('button', { name: '套用來源：資料來源：攝影中心', exact: true }).click();
    assert.equal(await page.locator('#sourceText').inputValue(), '資料來源：攝影中心');

    await open('tags');
    await page.getByRole('button', { name: '上移：生活', exact: true }).click();
    await page.getByRole('textbox', { name: '名稱：生活', exact: true }).fill('社會');
    await page.getByRole('button', { name: '儲存名稱：生活', exact: true }).click();
    assert.deepEqual((await profile()).tags, ['社會', '交通']);
    await page.locator('#personalNewName').fill('<img src=x>');
    await page.locator('#personalCreateForm button').click();
    assert.equal(await page.locator('#personalList img').count(), 0);
    await page.getByRole('button', { name: '刪除：<img src=x>', exact: true }).click();
    await close();

    await page.locator('#mainTitle').fill('目前新聞內容');
    await page.locator('#m_Sub').fill('這段引言不能被樣式覆蓋。');
    await fillSlider('titleSize', 84);
    await fillSlider('m_SubSize', 52);
    await fillSlider('m_Overlay', 0);
    await page.locator('#bgFilter').selectOption('soft');
    await page.locator('[data-logo-choice="capsule"]').click();
    await page.getByRole('button', { name: '儲存目前樣式', exact: true }).click();
    await page.locator('#personalNewName').fill('社會新聞');
    await page.locator('#personalCreateForm button').click();
    await close();
    const storedStyle = (await profile()).styles[0];
    assert.equal(await page.getByRole('button', { name: '套用樣式：社會新聞', exact: true }).count(), 1, 'Saved styles must be directly visible shortcuts');
    assert.ok(!JSON.stringify(storedStyle).includes('目前新聞內容'));
    assert.ok(!JSON.stringify(storedStyle).includes('攝影中心'));
    await page.locator('#mainTitle').fill('下一篇新聞');
    await fillSlider('titleSize', 64);
    await page.locator('#bgFilter').selectOption('none');
    await fillSlider('bgPanX', 24);
    await page.getByRole('button', { name: '套用樣式：社會新聞', exact: true }).click();
    assert.equal(await page.locator('#titleSize').inputValue(), '84');
    assert.equal(await page.locator('#mainTitle').inputValue(), '下一篇新聞');
    assert.equal(await page.locator('#mainTitle').locator('..').locator('.field-count').textContent(), '5/60');
    assert.equal(await page.locator('#bgPanX').inputValue(), '24');

    // A preset may switch layouts, but must not replace the active article or photo.
    await page.locator('.layout-card[data-layout="news-points"]').click();
    await page.locator('#referenceLogoSelect').selectOption('company');
    await page.locator('#referenceRatioSelect').selectOption('35');
    await page.locator('[data-theme="dark"]').click();
    await page.locator('#v15PointsEditor input').first().fill('保留目前重點文字');
    const articleBeforeStyle = await page.evaluate(() => ({ title: document.getElementById('mainTitle').value, points: v15State.points, photo: bgImg.src }));
    await page.getByRole('button', { name: '儲存目前樣式', exact: true }).click();
    await page.locator('#personalNewName').fill('深色整理');
    await page.locator('#personalCreateForm button').click();
    await close();
    await page.locator('.layout-card[data-layout="magazine"]').click();
    await page.getByRole('button', { name: '套用樣式：深色整理', exact: true }).click();
    assert.equal(await page.locator('#layoutSelector').inputValue(), 'news-points');
    assert.equal(await page.locator('#referenceRatioSelect').inputValue(), '35');
    assert.equal(await page.evaluate(() => v15State.theme), 'dark');
    assert.deepEqual(await page.evaluate(() => ({ title: document.getElementById('mainTitle').value, points: v15State.points, photo: bgImg.src })), articleBeforeStyle);
    assert.equal(await page.locator('#sourceText').inputValue(), '資料來源：攝影中心');
    assert.equal(await page.locator('#m_Overlay').inputValue(), '0');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#m_SubSize').inputValue(), '52');
    assert.equal(await page.locator('#m_Overlay').inputValue(), '0');
    assert.equal(await page.locator('#personal-tags button').count(), 2);
    assert.equal(await page.locator('#mainTitle').inputValue(), '下一篇新聞');
    assert.equal(await page.locator('#mainTitle').locator('..').locator('.field-count').textContent(), '5/60');
    await page.getByRole('button', { name: '套用樣式：社會新聞', exact: true }).click();
    assert.equal(await page.locator('#layoutSelector').inputValue(), 'magazine');
    assert.equal(await page.locator('#titleSize').inputValue(), '84');

    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
      for (const layout of ['magazine', 'glass', 'news-points']) {
        await page.locator(`.layout-card[data-layout="${layout}"]`).click();
        await page.locator('#layoutPicker > summary').click();
        assert.equal(await page.locator('#personalSection').isVisible(), false);
        assert.equal(await page.locator('.layout-grid').isVisible(), false);
        await page.locator('#layoutPicker > summary').press('Enter');
        assert.equal(await page.getByRole('button', { name: '套用樣式：社會新聞', exact: true }).isVisible(), true);
        assert.equal(await page.locator('[data-color-target="tag"]').isVisible(), true);
        assert.equal(await page.locator('[data-color-target="text"]').isVisible(), true);
        assert.deepEqual(await page.locator('.source-shortcuts button').allTextContents(), ['預設', '路透社', '達志影像／美聯社']);
        await page.locator('.source-shortcuts button').nth(2).click();
        assert.equal(await page.locator('#sourceText').inputValue(), '資料來源：達志影像／美聯社');
        await page.getByRole('button', { name: '套用分類：交通', exact: true }).click();
        await page.getByRole('button', { name: '套用來源：資料來源：攝影中心', exact: true }).click();
        assert.equal(await page.locator('#tagText').inputValue(), '交通');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        await page.locator('#personalSection').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, `${layout}-${width}.png`), fullPage: width === 390 });
        const downloaded = page.waitForEvent('download');
        await page.locator('#downloadButton').click();
        const png = await fs.readFile(await (await downloaded).path());
        assert.equal(png.readUInt32BE(16), 1080);
        assert.equal(png.readUInt32BE(20), 1350);
      }
      await open('tags');
      await page.locator('#personalDialog').screenshot({ path: path.join(out, `manager-${width}.png`) });
      assert.equal(await page.locator('#personalDialog').evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#personalDialog').isVisible(), false);
    }
    await page.setViewportSize({ width: 1536, height: 1024 });

    await open('settings');
    const exported = page.waitForEvent('download');
    await page.locator('#personalExport').click();
    const settingsFile = await fs.readFile(await (await exported).path());
    const exportedData = JSON.parse(settingsFile);
    assert.ok(!settingsFile.includes(Buffer.from('下一篇新聞')));
    await page.locator('#personalReset').click();
    assert.equal((await profile()).tags.length, 0);
    assert.equal(await page.locator('#mainTitle').inputValue(), '下一篇新聞');
    await page.locator('#personalImportFile').setInputFiles({ name: 'personal.json', mimeType: 'application/json', buffer: settingsFile });
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).tags.length === 2, key);
    assert.deepEqual(await profile(), exportedData);
    await page.locator('#personalImportFile').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
    await page.waitForFunction(() => document.getElementById('personalStatus').textContent.includes('匯入失敗'));
    assert.deepEqual(await profile(), exportedData);
    await close();

    await page.locator('#resetAllButton').click();
    assert.equal(await page.evaluate(() => v16ColorTarget), 'tag');
    await page.waitForFunction(() => bgImg !== null);
    assert.equal(await page.locator('#mainTitle').inputValue(), '北市房價再創新高！');
    assert.equal(await page.locator('#sourceText').inputValue(), '資料來源：ETtoday 採訪團隊');
    assert.equal(await page.locator('#myCanvas').evaluate(el => el.toDataURL()), defaultCanvas);
    assert.deepEqual(await profile(), exportedData);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => bgImg !== null);
    assert.equal(await page.locator('#myCanvas').evaluate(el => el.toDataURL()), defaultCanvas);
    assert.equal(await page.evaluate(() => v15State.points[0].text), '鎖定蛋白區潛力股');
    await page.locator('#bgUpload').setInputFiles(path.join(root, 'assets/v16-demo-taipei.png'));
    await page.waitForFunction(() => bgImg !== null);
    assert.equal(await page.locator('#downloadButton').isDisabled(), false);

    // Turning off retention deletes V17 drafts but never modifies the V16 draft.
    await page.evaluate(() => localStorage.setItem('et_chart_v16_config', '{"mainTitle":"V16 keep"}'));
    await open('settings');
    await page.locator('#personalRememberDraft').uncheck();
    await close();
    await page.locator('#mainTitle').fill('不可保留的草稿');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#mainTitle').inputValue(), '北市房價再創新高！');
    assert.equal(await page.evaluate(() => localStorage.getItem('et_chart_v16_config')), '{"mainTitle":"V16 keep"}');
    assert.equal((await profile()).rememberDraft, false);
    assert.equal(await page.locator('#personal-tags button').count(), 2);
    assert.deepEqual(errors, []);
    const unavailable = await browser.newContext();
    await unavailable.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
    const unavailablePage = await unavailable.newPage();
    const storageErrors = [];
    unavailablePage.on('pageerror', error => storageErrors.push(error.message));
    await unavailablePage.goto(url, { waitUntil: 'networkidle' });
    await unavailablePage.locator('#tagText').fill('不會當機');
    await unavailablePage.getByRole('button', { name: '儲存分類快捷', exact: true }).click();
    assert.match(await unavailablePage.locator('#personalToast').textContent(), /未儲存/);
    assert.deepEqual(storageErrors, []);
    await unavailable.close();

    const migration = await browser.newContext();
    await migration.addInitScript(() => localStorage.setItem('et_chart_v16_config', JSON.stringify({ mainTitle: '舊版草稿', tagText: '國際', sourceText: '原始來源' })));
    const migrationPage = await migration.newPage();
    await migrationPage.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await migrationPage.locator('#mainTitle').inputValue(), '舊版草稿');
    await migrationPage.locator('#mainTitle').fill('新版草稿');
    assert.equal(await migrationPage.evaluate(() => JSON.parse(localStorage.getItem('et_chart_v16_config')).mainTitle), '舊版草稿');
    await migrationPage.reload({ waitUntil: 'networkidle' });
    assert.equal(await migrationPage.locator('#mainTitle').inputValue(), '新版草稿');
    await migration.close();
    console.log('V17 passed: unchanged canvas pixels for 3 layouts; personal tags/sources CRUD; content-free styles; reload; desktop/mobile; PNG export; import/export/reject; isolated reset; draft privacy.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
