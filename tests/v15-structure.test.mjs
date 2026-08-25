import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const production = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('V15 production keeps the approved canvas and layouts', async () => {
  const v15 = await readFile(new URL('../V15.html', import.meta.url), 'utf8');
  assert.match(v15, /<canvas id="myCanvas" width="1080" height="1350"><\/canvas>/);
  assert.match(v15, /option value="magazine"/);
  assert.match(v15, /option value="glass"/);
  assert.match(v15, /function drawMagazine\(\)/);
  assert.match(v15, /function drawGlass\(\)/);
  assert.match(v15, /option value="news-points"/);
  assert.match(v15, /id="v15Ratio"/);
  assert.match(v15, /id="v15Theme"/);
  assert.match(v15, /id="v15PointsEditor"/);
  assert.match(v15, /id="v15AddPoint"/);
  assert.match(v15, /id="v15ShowLogo"/);
  assert.match(v15, /id="v15Validation"/);
  assert.match(v15, /images\.weserv\.nl/);
  assert.match(v15, /wsrv\.nl/);
  assert.match(v15, /corsproxy\.io/);
  assert.match(v15, /function startPhotoDrag\(/);
  assert.match(v15, /function movePhotoDrag\(/);
  assert.match(v15, /function resetV15PhotoPosition\(/);
  assert.match(v15, /id="downloadButton"/);
  assert.match(v15, /id="copyButton"/);
  assert.match(v15, /id="resetAllButton"/);
  assert.match(v15, /confirm\('確定要重設所有文字、照片位置與設定嗎？'\)/);
  assert.match(v15, /if \(!v15RenderResult\.valid\) return/);
  assert.ok(production.includes('ETtoday 神器 V15'));
});

test('production entry matches the approved V15 draft', async () => {
  const production = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const v15 = await readFile(new URL('../V15.html', import.meta.url), 'utf8');
  assert.equal(production, v15);
});
