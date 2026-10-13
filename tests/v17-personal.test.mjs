import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../V17.html', import.meta.url), 'utf8');
const source = html.match(/<script id="v17-personal-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'personal settings validator must exist');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const core = context.globalThis.V17Personal;
const plain = value => JSON.parse(JSON.stringify(value));
const profile = () => ({ version: 1, tags: ['交通'], sources: ['資料來源：攝影中心'], styles: [], rememberDraft: true });

test('personal settings retain ordering and strip unrelated content', () => {
  const input = { ...profile(), tags: ['交通', '生活'], mainTitle: 'private', photo: 'private' };
  assert.deepEqual(plain(core.validate(input)), { ...profile(), tags: ['交通', '生活'] });
});

test('reject malformed, duplicate, oversized and unsupported imports', () => {
  for (const input of [null, [], {}, { ...profile(), version: 2 },
    { ...profile(), tags: ['交通', ' 交通 '] }, { ...profile(), tags: ['x'.repeat(25)] },
    { ...profile(), sources: [123] }, { ...profile(), rememberDraft: 'false' },
    { ...profile(), styles: [{ name: 'broken', settings: { layout: 'unknown' } }] }]) {
    assert.throws(() => core.validate(input));
  }
});

test('style capture excludes copy, source, photo crop and point content', () => {
  const style = core.style({ layout: 'news-points', titleSize: 80, tagColor: '#005BAC',
    ratio: 35, pointSize: 44, theme: 'dark', logo: 'capsule', showDate: false,
    filter: 'soft', filterStrength: 20, mainTitle: 'private', sourceText: 'private',
    points: [{ text: 'private' }], photo: 'private', bgPanX: 14 });
  assert.equal(style.titleSize, 80);
  assert.equal(style.theme, 'dark');
  assert.equal(style.logo, 'capsule');
  assert.equal(style.showDate, false);
  for (const key of ['mainTitle', 'sourceText', 'points', 'photo', 'bgPanX']) assert.ok(!(key in style));
});

test('style validation enforces bounds and valid enums', () => {
  for (const bad of [{ titleSize: 999 }, { titleSize: '90' }, { filter: 'url(evil)' },
    { tagColor: 'red; evil' }, { ratio: 80 }, { theme: 'other' }, { logo: 'other' }]) {
    assert.throws(() => core.style({ layout: 'magazine', ...bad }));
  }
  assert.equal(core.style({ layout: 'magazine', overlay: 0 }).overlay, 0);
});

test('valid imported names remain plain data, not interpreted HTML', () => {
  const input = { ...profile(), tags: ['<img src=x>'] };
  assert.equal(core.validate(input).tags[0], '<img src=x>');
});

test('old presets default to top-right and new logo positions round-trip', () => {
  assert.equal(core.style({ layout: 'magazine' }).logoPosition, 'top-right');
  for (const logoPosition of ['top-right', 'top-left', 'bottom-center']) {
    const settings = core.style({ layout: 'glass', logoPosition });
    const parsed = core.validate({ ...profile(), styles: [{ name: 'Logo', settings }] });
    assert.equal(parsed.styles[0].settings.logoPosition, logoPosition);
  }
  assert.throws(() => core.style({ layout: 'glass', logoPosition: 'other' }));
});
