# V15 Local Verification

Date: 2026-08-25

## Scope

- Local-only `V15.html` draft based on V14.
- Existing `index.html` remains unchanged.
- No GitHub push or Pages deployment.

## Automated Checks

- Node test suite: 5 passed, 0 failed.
- JavaScript syntax: both inline scripts compile.
- `git diff --check`: passed (line-ending warnings only).
- `git diff --exit-code 300418d -- index.html`: passed.

## Browser Checks

- Desktop viewport: 1440 x 900.
  - Editor and preview remain in separate columns.
  - The 1080 x 1350 canvas stays fully inside the preview.
  - Uploaded local PNG renders and enables download/copy.
- Mobile viewport: 390 x 844.
  - Document width is 390 px with no horizontal overflow.
  - Canvas CSS width is 348 px while retaining 1080 x 1350 output pixels.
  - Three point rows render and output controls remain usable.
- Photo interaction:
  - Direct canvas drag changed pan controls from 50/50 to 36/32.
  - Photo position reset control is present.
- Content validation:
  - No photo disables download and copy.
  - Excess text shows `文字超出安全範圍，請精簡內容或調整比例。` and disables output.
  - Normal content shows `目前內容可以輸出。` and enables output.
- Layout options:
  - Light and dark text panels render.
  - 55/45, 45/55, and 35/65 photo/text ratios are available.
  - The 35/65 dark-panel combination remains valid with the default content.

## Environment Note

The sandbox blocked the external Google Fonts request during one headless mobile run. The page used its existing Microsoft JhengHei/PingFang TC fallback stack; there were no page script errors.

## Logo And Title Revision

- Company Logo and V14 text capsule are selectable from the V15 editor.
- The selected Logo mode persists after reload; Company Logo is the default.
- Both Logo styles use the V14 180 x 64 placement at the top-right and render after all other canvas layers.
- The title is separated from the photo by a full-width title band and a 12 px orange rule.
- Default three-point content remains exportable at every ratio:
  - 55/45 content bottom: 1252 px.
  - 45/55 content bottom: 1185 px.
  - 35/65 content bottom: 1050 px.
- Mobile recheck at 390 px: no horizontal overflow, Company Logo control active, canvas output valid.

## Final Shared-Logo Revision

- Logo controls are visible and usable in Magazine, Glass, and News Points layouts.
- Magazine renders the Company Logo option; Glass renders the V14 capsule option.
- Every layout draws the selected Logo through the same final canvas layer.
- News Points title and point areas share the same background pixel color.
- The orange photo boundary remains; the title-to-points separation uses whitespace only.
- Updated default content bottoms remain below the 1260 px safety line: 1251, 1217, and 1082 px.
- All three layouts retain a 390 px document width at a 390 px mobile viewport.
