import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V15.html', import.meta.url), 'utf8');

test('V15 renderer uses measured overflow and exact V14 logo geometry', () => {
  assert.match(html, /function drawNewsPoints\(\)/);
  assert.match(html, /function measureWrappedText\(/);
  assert.match(html, /const logoWidth = 180/);
  assert.match(html, /const logoHeight = 64/);
  assert.match(html, /const logoX = canvas\.width - logoWidth - 50/);
  assert.match(html, /const logoY = 80/);
  assert.match(html, /contentBottom > safeBottom/);
});
