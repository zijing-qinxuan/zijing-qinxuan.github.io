# Online invitation update — 2026-09-24

Scope: only the online invitation experience. No commit, push, deployment or production RSVP write.

## Guest experience

The online page now follows Hero → Quick Nav → Online Ceremony / Zoom → Leave a Message → Gallery → Share. The original invitation-note section is hidden in this mode so it does not separate ceremony access from the message form. Existing on-site modes retain their original order.

The ceremony is on **Saturday, December 26, 2026 at 3:00 PM**. The online group photo was removed following the user's clarification; neither 15:10 nor 16:10 is displayed.

Zoom settings are centralized in `onlineWedding` at the top of `script.js`:

```js
const onlineWedding = {
  zoomUrl: "",
  meetingId: "",
  passcode: ""
};
```

Use an HTTPS Zoom invitation URL and string values for Meeting ID / Passcode, preserving any leading zeros. Configured values appear in the online ceremony card. Join Zoom is the first action in the Zoom block. Empty URL, Meeting ID or Passcode rows/buttons are hidden; an unfilled URL shows the existing announcement that the link will be provided before the wedding. The card supports copying either value, with localized status and a manual-copy hint when browser permissions deny automatic copying. Actual Zoom details have not yet been provided and remain blank in the source.

## Form and payload

- Visible fields: name, phone number and message, all required. Phone remains required for compatibility with the existing name + phone update flow; its help text concerns contacting the sender and updating a message.
- Removed from the online UI: ceremony / banquet / online attendance questions, guest counts, vegetarian counts, notes, RSVP deadline and the expand/collapse RSVP step. The form is immediately usable.
- Titles, explanation, submit/sending/success/update/error messages are localized as a message form, not an RSVP form.
- Online attendance is fixed by the frontend: `invite=online`, `online=會參加`, `ceremony=""`, `banquet=""`, `people="0"`, `vegetarian="0"`, `note=""`. Existing `name`, `phone`, `message`, `submissionId` names and JSONP status flow are retained.
- Endpoint and Apps Script are unchanged; no new Sheet column or column-order change is introduced. Compatibility follows the previous online form's canonical value and payload schema. Actual backend row updates were not exercised against production.
- The message form uses a separate local completion-storage key so a prior online RSVP does not falsely indicate that a message was submitted.

## Regression boundaries

Source comparison confirms full / wedding invitation configuration and RSVP question configuration are unchanged. The Quick Nav implementation and the Gallery / Carousel / Lightbox code block are unchanged. Only the online Quick Nav English label now reads “Online Ceremony,” as requested. New styles are scoped under `.online-invitation`. Full / wedding keep attendance options, guest and vegetarian counts, notes, existing message field, deadline and success flow.

## Verification

- `npm test`: PASS — HTML structure, assets, duplicate IDs, JS syntax and translation-key parity.
- `node tools/rc-qa/browser.mjs --online`: 375, 390, 430, 1440px × Chinese/English; all 8 cases PASS. Tests include no visible RSVP/attendance/group-photo content, form field scope, page order, fixed canonical payload, duplicate-submit protection, create/update/error states, language-state preservation, Zoom empty/ID-only/full/no-passcode settings and clipboard success/fallback/denial paths.
- `node tools/rc-qa/browser.mjs --quick`: 390 and 1440px × full/wedding/online × Chinese/English; all 12 cases PASS. Covers existing RSVP, navigation, gallery/lightbox and no horizontal overflow.
- Mobile keyboard conditions are approximated by focusing the textarea and reducing viewport height to 500px. Actual iPhone keyboard behavior, native clipboard permissions, real Zoom joining and production Apps Script writes need device/account verification.
- All RSVP/message POSTs and JSONP responses are intercepted by the harness; clipboard permission outcomes use controlled fixtures. No official guest data is written.

Changed files: `index.html`, `styles.css`, `script.js`, `i18n.js`, `tools/rc-qa/browser.mjs`, `tools/rc-qa/README.md`, and this report.
