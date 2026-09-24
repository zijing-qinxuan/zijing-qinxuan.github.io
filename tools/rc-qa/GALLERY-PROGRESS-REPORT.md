# Gallery progress and online schedule — 2026-09-24

## Scope
- Replace the dots and circular return-to-first button with `.gallery-progress`, `__count`, `__track`, `__bar`, and an `__status` live region.
- `setCarouselActiveState()` calls `updateGalleryProgress()`: zero-padded active index + 1 / actual slide count, and `transform: scaleX(current / total)`.
- Actual gallery data contains 22 images. No photos, ordering, builder, Lightbox implementation, or RSVP endpoint changed.
- Remove obsolete dots generation, dot event handlers, active-dot state, return-button binding, responsive dot styles and unused translations.
- Retain existing previous/next and circular navigation. No autoplay existed in the inspected implementation; none added.
- Padding below the progress: desktop 120 → 60 px (−60), mobile 80 → 44 px (−36). Removing multirow controls further reduces section height.
- Online uses separate schedule translations and countdown target: 14:00 Zoom opens, 14:30 Ceremony begins (2:00 PM / 2:30 PM).
- Full and wedding retain 14:00 admission / 15:00 ceremony. Shared Hero translation was separated for online; there was no single canonical ceremony-time data source.
- No online group photo exists: it had already been removed following the user's earlier clarification. Not reintroduced.

## Verification
- `npm test`: HTML/JS syntax, asset references, duplicate IDs, gallery file sizes and translation keys pass.
- `node tools/rc-qa/browser.mjs --gallery`: **36/36 PASS**, six widths (375, 390, 430, 1280, 1440, 1680), full/wedding/online, zh-TW/en. Checks numeric progress and scale, old control absence, padding and width, one-photo navigation, stable document height/scroll, language preservation, Lightbox keyboard/close/focus restore, mode visibility, online schedule, missing images and console errors.
- `node tools/rc-qa/browser.mjs --extra`: **16/16 PASS**, including every photo, padded count through 22, circular navigation, reduced motion, touch, resize, Lightbox focus and mocked RSVP regressions. The legacy dot-click test was updated to use Next after its obsolete selector failed.
- Browser artifacts: `/private/tmp/wedding-rc-qa-9225/`.
- Browser automation uses isolated request interception; no production RSVP submissions.
- Native iPhone Safari/Edge/Chrome and VoiceOver require manual device confirmation; desktop Chrome viewport emulation is not a physical iPhone test.
- No commit or push.
