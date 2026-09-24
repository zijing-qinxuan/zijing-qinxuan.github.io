# Online message form without phone — 2026-09-24

## Frontend changes
- Online initialization removes the phone field group (input, label, placeholder, help/error elements and ARIA relationships) from the live DOM. Shared HTML remains intact for full/wedding.
- Online skips telephone validation, normalization and input handlers. Only name and message/wishes are visible and required.
- Remove online update hints and the edit button. Online ignores legacy local storage and does not store RSVP return state.
- Online payload explicitly uses `phone: ""`, `online: "會參加"`, empty ceremony/banquet, and zero people/vegetarian. Each send creates a fresh submissionId. No fake phone.
- Full/wedding retain their existing telephone validation, payload and update flow.
- Latest online times remain 14:00 Zoom opens / 14:30 ceremony begins.
- No Carousel, Lightbox, Quick Nav, Apps Script or endpoint changes.

## Backend limitation / release blocker
No Apps Script source exists in this repository. The prior name + phone upsert contract does not establish that blank phones are accepted or that same-name blank-phone messages append safely. The frontend submissionId is used for status polling; that alone does not establish backend row identity.

`ONLINE_MESSAGE_BACKEND_READY = false` prevents online production POSTs pending verification. Full/wedding are unaffected. This change is not a claim that production messages can currently be submitted. Source was requested from the user; no production test rows were written.

Minimum backend requirement, only if current implementation lacks it:
1. Branch on `invite === "online"` before phone validation and name/phone lookup.
2. Validate name/message, allow blank phone and append new messages without searching by name.
3. Reuse submissionId solely for idempotency of the same request, never to merge different same-name messages. Preserve created/error status polling.
4. Leave full/wedding validation, matching, Sheet column order and endpoint untouched.
5. After confirming this contract, enable the frontend readiness flag.

## Verification
- `npm test`: HTML/JS checks, references, duplicate IDs, image inventory and translation keys pass.
- `node tools/rc-qa/browser.mjs --online`: 10/10 viewport/language cases (375, 390, 430, 1280, 1440 × zh-TW/en). Checks absence of phone/attendance/update DOM and text, two visible fields, required message, unchanged times, overflow and console errors.
- Real-source guard checked: zero POSTs until backend readiness is established.
- Test-only source fixture enables the flag under intercepted transport. Empty phone succeeds against that mock, repeated same-name submissions get distinct IDs, and double click sends once. This does NOT prove production acceptance or row semantics.
- `node tools/rc-qa/browser.mjs --quick`: 12/12 cases pass (390/1440 × three modes × two languages). Full/wedding retain required phone, leading zero, created and updated responses under the existing mock contract.
- Mobile and desktop screenshots reviewed. Physical iPhone keyboard/VoiceOver not tested.
- No commit or push.

## Supplied backend inspection — confirmed
The user supplied the current Apps Script source after the initial report. Isolated execution of that exact source with mocked Sheet/Cache/Lock services confirmed:
- Online with empty phone: `success: false`, `請填寫聯絡電話`, zero rows written; the same failure is available through status polling.
- Online with a valid phone: `created`.
- Same name and phone with a different submissionId: `updated`, still only one row.
- Both phone checks are unconditional. findExistingGuestRow runs for all invite modes.
- submissionId is cached for status reporting only; doPost does not consult it before writing. The 300-second cache is not persistent idempotency.

The production readiness flag must remain false until a backend revision is deployed. Minimum revision: gate both phone checks to non-online modes; require an online message; use null existingRow for online so new submissions append. Do not merely relax phone validation, because identical name + blank phone would still match. Full/wedding matching and the eleven-column layout can remain unchanged. No production endpoint call, Apps Script edit, commit or push was performed during this inspection.
