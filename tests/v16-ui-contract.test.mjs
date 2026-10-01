import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V16.html', import.meta.url), 'utf8');

test('layout picker can collapse while retaining the active layout label', () => {
  assert.match(html, /<details id="layoutPicker" open>/);
  assert.match(html, /<summary class="layout-picker-summary">/);
  assert.match(html, /id="layoutPickerSelected"/);
  assert.match(html, /getElementById\('layoutPickerSelected'\)\.textContent/);
});

test('V16 exposes three visual layout selectors and grouped editor sections', () => {
  assert.match(html, /ETtoday 神器 V16/);
  assert.match(html, /class="layout-card[^"\n]*"[^>]*data-layout="magazine"/);
  assert.match(html, /class="layout-card[^"\n]*"[^>]*data-layout="glass"/);
  assert.match(html, /class="layout-card[^"\n]*"[^>]*data-layout="news-points"/);
  assert.match(html, /function setV16Layout\(layout\)/);
  assert.match(html, /function syncV16LayoutCards\(\)/);
  assert.match(html, /id="v16-section-layout"/);
  assert.match(html, /id="v16-section-content"/);
  assert.match(html, /id="v16-section-photo"/);
  assert.match(html, /id="v16-section-style-output"/);
  assert.match(html, /class="sticky-actions"/);
});

test('V16 color palettes include brand extensions without visible captions', () => {
  assert.match(html, /東森新媒體品牌延伸色/);
  assert.match(html, /常用新聞色/);
  for (const color of ['#F58220', '#183D5D', '#F6C344', '#E84A82', '#46B9B0', '#7654A8']) {
    assert.ok(html.includes(color), `missing brand color ${color}`);
  }
  assert.doesNotMatch(html, /class="color-name"/);
  assert.doesNotMatch(html, /class="swatch-caption"/);
  assert.match(html, /title="ETtoday 橘 · #F58220"/);
  assert.match(html, /aria-label="電競紫 · #7654A8"/);
});

test('V16 preserves existing image workflows and saves separately from V15', () => {
  assert.match(html, /images\.weserv\.nl/);
  assert.match(html, /wsrv\.nl/);
  assert.match(html, /corsproxy\.io/);
  assert.match(html, /id="bgUpload"/);
  assert.match(html, /id="imgUrl"/);
  assert.match(html, /id="downloadButton"/);
  assert.match(html, /id="copyButton"/);
  assert.match(html, /id="resetAllButton"/);
  assert.match(html, /et_chart_v16_config/);
  assert.doesNotMatch(html, /et_chart_v15_config/);
});

test('magazine-only extra palettes contain four bright and three representative party colors', () => {
  const extra = html.match(/<div class="magazine-extra-palette">[\s\S]*?(?=\n\s*<p class="subsection-title">右上 Logo)/)?.[0] || '';
  assert.equal((extra.match(/class="palette-swatch"/g) || []).length, 7);
  for (const color of ['#38BDF8', '#34D399', '#FF6B6B', '#A78BFA', '#005BAC', '#009A44', '#28C8C8']) {
    assert.ok(extra.includes(color), `missing magazine color ${color}`);
  }
  assert.match(html, /body\[data-layout="magazine"\] \.magazine-extra-palette/);
  assert.match(html, /ctx\.fillStyle = currentTagColor;\s*ctx\.fillRect\(80, subTop, 12, contentBottom - subTop\)/);
});

test('glass editor remains a title, card title, and description form', () => {
  const group = html.match(/<div id="group-glass"[\s\S]*?(?=<div id="group-news-points")/)?.[0] || '';
  assert.match(group, /id="g_Title"/);
  assert.match(group, /id="g_Desc"/);
  assert.doesNotMatch(group, /v15PointsEditor|新增重點/);
});
