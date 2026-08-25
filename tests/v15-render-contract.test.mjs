import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V15.html', import.meta.url), 'utf8');

test('V15 renderer uses measured overflow and preserves V14 capsule geometry', () => {
  assert.match(html, /function drawNewsPoints\(\)/);
  assert.match(html, /function measureWrappedText\(/);
  assert.match(html, /function drawV15LogoLayer\(/);
  assert.match(html, /data-logo-mode="company"/);
  assert.match(html, /data-logo-mode="capsule"/);
  assert.match(html, /logoMode: 'company'/);
  assert.match(html, /const logoWidth = 180/);
  assert.match(html, /const logoHeight = 64/);
  assert.match(html, /const logoX = canvas\.width - logoWidth - 50/);
  assert.match(html, /const logoY = 80/);
  assert.match(html, /drawV15LogoLayer\(\);\s*return \{ valid:/);
  assert.match(html, /contentBottom > safeBottom/);
});

test('V15 renderer separates the title from the photo with a title band', () => {
  assert.match(html, /function drawV15TitleBand\(/);
  assert.match(html, /const titleBandTop = regions\.text\.y/);
  assert.match(html, /const defaultTitleBandPaddingTop = 54/);
  assert.match(html, /ctx\.fillRect\(0, titleBandTop, canvas\.width, 12\)/);
});

test('photo-heavy ratio uses compact text spacing', () => {
  assert.match(html, /const compactText = v15State\.ratio === 55/);
  assert.match(html, /const titleBandPaddingTop = compactText \? 20 : defaultTitleBandPaddingTop/);
  assert.match(html, /const pointGap = v15State\.ratio === 55 \? 6 : 20/);
  assert.match(html, /cursorY \+= pointGap/);
});

test('logo controls and renderer are shared by every layout', () => {
  const newsGroupStart = html.indexOf('id="group-news-points"');
  const globalLogoStart = html.indexOf('id="globalLogoControls"');
  const sourceStart = html.indexOf('其他 (資料來源)');
  assert.ok(newsGroupStart >= 0 && globalLogoStart > newsGroupStart && sourceStart > globalLogoStart);
  assert.doesNotMatch(html.slice(newsGroupStart, globalLogoStart), /id="v15ShowLogo"/);
  assert.match(html, /drawSource\(\);\s*drawDate\(\);\s*drawV15LogoLayer\(\);/);
});

test('title and points share one background with whitespace separation', () => {
  const titleSection = html.match(/function drawV15TitleBand[\s\S]*?(?=\n\s*function drawNewsPoints)/)?.[0] || '';
  assert.doesNotMatch(titleSection, /#22252A|#FFFFFF|titleBandHeight - 2/);
  assert.match(titleSection, /const titleToPointsGap = compactText \? 55 : 64/);
  assert.match(titleSection, /ctx\.fillRect\(0, titleBandTop, canvas\.width, 12\)/);
});
