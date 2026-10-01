import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V16.html', import.meta.url), 'utf8');

test('all photo layouts share the added photo effects and keep filter state restorable', () => {
  for (const effect of ['vivid', 'soft', 'desaturated']) {
    assert.match(html, new RegExp(`option value="${effect}"`));
    assert.match(html, new RegExp(`if \\(filter === '${effect}'\\) ctx\\.filter`));
  }
  assert.match(html, /function drawFullBg\(\)[\s\S]*?applyCanvasImageFilter\(filter\)/);
  assert.match(html, /filter: \['none', 'grayscale', 'brightness', 'darken', 'contrast', 'vivid', 'soft', 'desaturated'\]/);
});

test('V16 preserves approved canvas and layout geometry', () => {
  assert.match(html, /<canvas id="myCanvas" width="1080" height="1350"><\/canvas>/);
  assert.match(html, /drawTag\(80, 850, tag\)/);
  assert.match(html, /const x = 80, y = 750, w = 920, h = 500/);
  assert.match(html, /roundRect\(ctx, x, y, w, h, 40\)/);
  assert.match(html, /drawTag\(x \+ 60, y - 40, tag\)/);
  assert.match(html, /drawTag\(50, V15_HEADER_TOP, document\.getElementById\('tagText'\)\.value\)/);
});

test('glass card renderer does not become a numbered-points layout', () => {
  const renderer = html.match(/function drawGlass\(\)[\s\S]*?(?=\n\s*function drawTag)/)?.[0] || '';
  assert.match(renderer, /id\('g_Title'\)|getElementById\('g_Title'\)/);
  assert.match(renderer, /id\('g_Desc'\)|getElementById\('g_Desc'\)/);
  assert.doesNotMatch(renderer, /v15State\.points|ctx\.arc\(/);
});

test('company logo is transparent and capsule uses the real PNG', () => {
  const renderer = html.match(/function drawV15LogoLayer\(\)[\s\S]*?(?=\n\s*function drawV15TitleBand)/)?.[0] || '';
  assert.match(renderer, /const logoWidth = 180/);
  assert.match(renderer, /const logoHeight = 64/);
  assert.match(renderer, /const logoX = canvas\.width - logoWidth - 50/);
  assert.match(renderer, /const logoY = V15_HEADER_TOP/);
  assert.doesNotMatch(renderer, /rgba\(255,255,255,0\.92\)/);
  assert.doesNotMatch(renderer, /ctx\.stroke\(\)/);
  assert.match(renderer, /logoMode === 'capsule'[\s\S]*?ctx\.drawImage\(\s*companyLogoImg/);
  assert.match(renderer, /ctx\.drawImage\(\s*companyLogoImg/);
  assert.match(html, /function setV16LogoChoice\(choice\)/);
  assert.match(html, /data-logo-choice="hidden"/);
});
