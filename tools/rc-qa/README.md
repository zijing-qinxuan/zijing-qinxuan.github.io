# Wedding website RC verification

These tools have no npm dependencies and are excluded from GitHub Pages by `_config.yml`.

- `npm test`: HTML nesting, duplicate IDs, local references, image dimensions/decoding, JS syntax and dynamic translation-key parity. Pillow is optional for binary image verification.
- `npm run build-gallery -- --help`: inspect the existing builder. Use `--source <fixture> --output <temporary-folder> --no-publish` to test without replacing the real gallery.
- `npm run test:browser`: run the full Chrome matrix against a separately launched Chrome DevTools endpoint on port 9225.
- `node tools/rc-qa/browser.mjs --edge`: use an independently launched Edge endpoint on port 9230.
- `node tools/rc-qa/browser.mjs --extra` (optionally `--edge`): navigation, all gallery items, focus, reduced motion, resize, RSVP states and seat opening boundary.
- `node tools/rc-qa/browser.mjs --online`: online invitation checks at 375, 390, 430 and 1440px in both languages, including empty/filled Zoom settings, clipboard success/fallback/error, required message, fixed attendance, created/updated/error responses and reduced viewport height. Zoom values used by the test are temporary fixtures, not saved settings.
- `node tools/rc-qa/browser.mjs --quick`: 390 and 1440px smoke matrix. `--desktop` selects 1280, 1440 and 1680px.
- `node tools/rc-qa/safari.mjs`: requires native `safaridriver -p 4444` and a local HTTP server on port 8765. Checks the actual viewport dimensions and runs Safari's desktop matrix.
- `python3 tools/rc-qa/links.py`: read-only HTTP checks of the map/shared-album URLs and published developer page.

The CDP harness fulfills `http://wedding-rc.test/` from this checkout. RSVP POSTs are intercepted in the page before any network request; Google Apps Script JSONP status responses are fulfilled by the test harness. It never writes to production RSVP. Localhost/file previews are also blocked from submitting production RSVP by the application itself. Do not remove these protections to test the production backend.

Use dedicated browser profiles. Do not run two harnesses against the same debugging port simultaneously. Each run uses a fresh document URL and disables browser cache. JSON and screenshots go to `/private/tmp/wedding-rc-qa-9225`, `/private/tmp/wedding-rc-qa-9230`, or `/private/tmp/wedding-rc-safari`. An `--extra` run writes a separate JSON file from the size matrix.

The current verified fixture contains **22** gallery items. The request specified 23; the missing original must be supplied and then the fixture count and tests updated. Do not duplicate an existing photo to satisfy that count.

Emulated mobile viewports do not constitute real iPhone Safari/Edge/Chrome testing. Real RSVP row creation/update, account upload permissions, final seat assignments and the online wedding URL require owner verification.

## Explicitly authorized production Online probe (local CLI only)

`node tools/rc-qa/online-backend-live.mjs` only prints usage. With `--write-online-test`, it reads the current endpoint from script.js and requires ONLINE_MESSAGE_BACKEND_READY to remain false. It sends exactly the two specified Online test messages with fresh UUIDs, then replays the entire second request once. It does not send Full/Wedding data and never retries a POST automatically. This is not part of npm test or the mocked browser harness.

**This command writes test data to the production Sheet.** Run only for an explicitly authorized verification. A new invocation creates two new IDs, so do not rerun to recover an ambiguous network failure. Evidence (including IDs before each request, exact payloads, raw POST/JSONP responses and transport errors) is saved to `/private/tmp/wedding-online-backend-<first-id>.json`.

The script is not referenced by any website page, and `tools/` is excluded from GitHub Pages. It never changes the frontend readiness flag. API created responses and identical replay results do not independently prove the physical Sheet row count; obtain Sheet evidence and review the deployed backend code before enabling Online submissions.

Read-only browser check: `node tools/rc-qa/online-status-browser.mjs <existing-evidence.json>` uses a fresh Chrome CDP target (port 9225) and a local-only fixture page to request the two existing IDs via real JSONP. It does not POST. Transport/console success and availability of the 300-second status cache are reported separately. A late `ready:false` does not erase the immediate successful status evidence.
