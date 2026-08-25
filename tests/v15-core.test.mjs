import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V15.html', import.meta.url), 'utf8');
const source = html.match(/<script id="v15-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'v15-core script must exist');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const core = context.globalThis.V15Core;

test('color positions survive insertion and deletion', () => {
  assert.deepEqual(
    Array.from(core.syncColorMap('新聞焦點', '新聞三焦點', [null, '#FC8416', null, null])),
    [null, '#FC8416', null, null, null]
  );
});

test('moving a point keeps its stable id and color map', () => {
  const points = [core.createPoint('a', '第一點'), core.createPoint('b', '第二點')];
  points[1].colors[0] = '#E72D48';
  const moved = core.movePoint(points, 'b', -1);
  assert.equal(moved[0].id, 'b');
  assert.equal(moved[0].colors[0], '#E72D48');
});

test('layout regions cover the complete canvas', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(core.getLayoutRegions(45))),
    { photo: { x: 0, y: 0, w: 1080, h: 608 }, text: { x: 0, y: 608, w: 1080, h: 742 } }
  );
});

test('legacy point divider becomes plain-list punctuation', () => {
  assert.equal(core.normalizePointText('審查時程｜本週進入逐案表決'), '審查時程：本週進入逐案表決');
  assert.equal(core.normalizePointText('完整重點文字'), '完整重點文字');
});
