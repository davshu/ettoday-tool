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
  assert.match(v15, /option value="news-points"/);
  assert.match(v15, /id="v15Ratio"/);
  assert.match(v15, /id="v15Theme"/);
  assert.match(v15, /id="v15PointsEditor"/);
  assert.match(v15, /id="v15AddPoint"/);
  assert.match(v15, /id="v15ShowLogo"/);
  assert.match(v15, /id="v15Validation"/);
  assert.ok(v14.includes('ETtoday 神器 V14'));
});
