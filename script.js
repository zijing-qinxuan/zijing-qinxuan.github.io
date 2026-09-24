// Fill in Zoom details here. Empty values are omitted from the invitation.
const onlineWedding = {
  zoomUrl: "",
  meetingId: "",
  passcode: ""
};
// Enable only after verifying that invite=online accepts an empty phone and
// appends by submissionId (never upserts by name + phone). No backend code is in this repo.
const ONLINE_MESSAGE_BACKEND_READY = false;
const ONLINE_MEETING_URL = onlineWedding.zoomUrl;
const SEAT_LOOKUP_OPEN_AT = "2026-12-19T00:00:00+08:00";
const SEAT_LOOKUP_DEV_PREVIEW_KEY = "wedding-seat-lookup-preview";
const RSVP_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyvs0LurNvxURz_e15WG-ky2d1EFydHfJtbLYkbb1XTk_7Ol1RndFNAQTbcvFQKGwFbKw/exec";
const VALID_INVITE_MODES = ["wedding", "full", "online"];
const i18n = window.WeddingI18n;
const t = (key, values = {}) => i18n.t(key, values);
const INVITE_CONFIG = {
  wedding: {
    heroKeys: ["hero.weddingSchedule"],
    sections: ["hero", "invitation-note", "rsvp", "gift-note", "ceremony-info", "ceremony-parking", "ceremony-notes", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "gallery", "share", "faq"],
    hiddenSections: ["wedding-info", "venue", "parking", "seating"],
    content: ["ceremony-venue"],
    ceremonyEntryKey: "hero.ceremonyEntry"
  },
  full: {
    heroKeys: ["hero.weddingSchedule", "hero.banquetSchedule"],
    sections: ["hero", "invitation-note", "rsvp", "gift-note", "ceremony-info", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    hiddenSections: [],
    content: ["ceremony-venue", "banquet-faq"],
    ceremonyEntryKey: "hero.ceremonyEntry"
  },
  online: {
    heroKeys: ["hero.zoomSchedule", "hero.onlineSchedule"],
    sections: ["hero", "rsvp", "ceremony-info", "gallery", "share"],
    navigation: ["rsvp", "ceremony-info", "gallery", "share"],
    hiddenSections: ["invitation-note", "gift-note", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "faq"],
    content: ["online-attendance"],
    ceremonyEntryKey: "hero.onlineEntry"
  }
};

const header = document.querySelector('#site-header');
const hero = document.querySelector('#home');
const heroMedia = document.querySelector('.hero-media');
const heroImage = document.querySelector('.hero-image');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const navMore = document.querySelector('#nav-more');
const navMoreToggle = document.querySelector('#nav-more-toggle');
const navMoreMenu = document.querySelector('#nav-more-menu');
const inviteMode = new URLSearchParams(window.location.search).get('invite');
const initialNavigation = window.__weddingInitialNavigation || {
  type: 'navigate',
  hash: window.location.hash,
  startAtTop: !window.location.hash
};
if (initialNavigation.startAtTop) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}
const heroSchedule = document.querySelector('#hero-schedule');
const weddingCountdown = document.querySelector('#wedding-countdown');
const scrollProgress = document.querySelector('#scroll-progress');
const scrollProgressBar = scrollProgress.querySelector('.scroll-progress__bar');
const backToTopButton = document.querySelector('#back-to-top');
const ceremonyEntryLabel = document.querySelector('#ceremony-entry-label');
const onlineMeetingButton = document.querySelector('.online-meeting-button');
const landingHelpButton = document.querySelector('#landing-help-button');
const landingDialog = document.querySelector('#landing-dialog');
const dialogCloseButton = document.querySelector('#dialog-close-button');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const seatLookupUnavailable = document.querySelector('#seat-lookup-unavailable');
const seatingDescription = document.querySelector('#seating-description');
const seatLookupOpenContent = [...document.querySelectorAll('[data-seat-lookup-open]')];
const quickNavWrapper = document.querySelector('#quick-nav-wrapper');
const quickNav = document.querySelector('#quick-nav');
const quickNavLinks = quickNav ? [...quickNav.querySelectorAll('[data-quick-nav]')] : [];
const infoAccordions = [...document.querySelectorAll('[data-info-accordion]')];
let quickNavObserver = null;
let scrollTicking = false;
let bottomCtaObserver = null;
const bottomCtaIntersections = new Set();
const quickNavIntersections = new Map();

const QUICK_NAV_SECTION_IDS = {
  ceremony: ['ceremony-info', 'ceremony-parking', 'ceremony-notes'],
  banquet: ['wedding-info', 'venue', 'parking', 'seating'],
  gallery: ['wedding-gallery'],
  share: ['share']
};

function isLocalDevelopmentHost() {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname);
}

function debugCarouselLifecycle(label, details = {}) {
  if (!isLocalDevelopmentHost()) return;
  console.debug(`[carousel] ${label}`, details);
}

function getSeatLookupOpenTimestamp() {
  return new Date(SEAT_LOOKUP_OPEN_AT).getTime();
}

function getSeatLookupEvaluationTime() {
  const actualTime = Date.now();
  if (!isLocalDevelopmentHost()) return actualTime;

  try {
    const previewState = window.sessionStorage.getItem(SEAT_LOOKUP_DEV_PREVIEW_KEY);
    if (previewState === 'before') return getSeatLookupOpenTimestamp() - 60000;
    if (previewState === 'open') return getSeatLookupOpenTimestamp();
  } catch {
    return actualTime;
  }

  return actualTime;
}

function isSeatLookupOpen(now = Date.now()) {
  return now >= getSeatLookupOpenTimestamp();
}

function formatSeatLookupOpenDate() {
  return t('seating.date');
}

document.querySelectorAll('[data-seat-lookup-open-date]').forEach((element) => {
  element.textContent = formatSeatLookupOpenDate();
});

function initializeSeatLookupAvailability() {
  if (inviteMode !== 'full') return;
  const lookupIsOpen = isSeatLookupOpen(getSeatLookupEvaluationTime());
  seatLookupUnavailable.hidden = lookupIsOpen;
  seatingDescription.hidden = !lookupIsOpen;
  seatLookupOpenContent.forEach((element) => {
    element.hidden = !lookupIsOpen;
  });
}

document.querySelectorAll('[data-rsvp-deadline]').forEach((element) => {
  element.textContent = t('seating.deadline');
});

function renderInviteModeLanguage() {
  if (!VALID_INVITE_MODES.includes(inviteMode)) return;
  const config = INVITE_CONFIG[inviteMode];
  ceremonyEntryLabel.textContent = t(config.ceremonyEntryKey);
  [...heroSchedule.children].forEach((line, index) => {
    line.textContent = t(config.heroKeys[index]);
  });
}

if (VALID_INVITE_MODES.includes(inviteMode)) {
  const config = INVITE_CONFIG[inviteMode];

  document.querySelectorAll('[data-invite^="section:"]').forEach((element) => {
    const key = element.dataset.invite.replace('section:', '');
    element.hidden = config.hiddenSections.includes(key) || !config.sections.includes(key);
  });

  document.querySelectorAll('[data-invite^="nav:"]').forEach((element) => {
    const key = element.dataset.invite.replace('nav:', '');
    element.hidden = !config.navigation.includes(key);
  });

  document.querySelectorAll('[data-invite^="content:"]').forEach((element) => {
    const key = element.dataset.invite.replace('content:', '');
    element.hidden = !config.content.includes(key);
  });

  config.heroKeys.forEach((key) => {
    const line = document.createElement('span');
    line.textContent = t(key);
    heroSchedule.append(line);
  });
  renderInviteModeLanguage();
  navMore.hidden = ![...navMoreMenu.querySelectorAll('a')].some((link) => !link.hidden);
} else {
  document.body.classList.add('invite-missing');
}

initializeSeatLookupAvailability();
document.body.classList.remove('invite-pending');

function updateWeddingCountdown() {
  const now = new Date();
  const weddingDayStart = new Date('2026-12-26T00:00:00+08:00');
  const weddingCeremony = new Date(inviteMode === 'online' ? '2026-12-26T14:30:00+08:00' : '2026-12-26T15:00:00+08:00');
  const weddingDayEnd = new Date('2026-12-27T00:00:00+08:00');

  if (now < weddingDayStart) {
    const daysRemaining = Math.ceil((weddingCeremony - now) / 86400000);
    const unit = daysRemaining === 1 ? t('countdown.day') : t('countdown.days');
    weddingCountdown.textContent = t('countdown.before', { days: daysRemaining, unit });
  } else if (now < weddingDayEnd) {
    weddingCountdown.textContent = t('countdown.today');
  } else {
    weddingCountdown.textContent = t('countdown.after');
  }
}

updateWeddingCountdown();
window.setInterval(updateWeddingCountdown, 3600000);

function openLandingDialog() {
  landingDialog.hidden = false;
  dialogCloseButton.focus();
}

function closeLandingDialog() {
  landingDialog.hidden = true;
  landingHelpButton.focus();
}

landingHelpButton.addEventListener('click', openLandingDialog);
dialogCloseButton.addEventListener('click', closeLandingDialog);
landingDialog.addEventListener('click', (event) => {
  if (event.target === landingDialog) closeLandingDialog();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !landingDialog.hidden) closeLandingDialog();
});

function renderOnlineDetails() {
  if (inviteMode !== 'online') return;
  document.querySelectorAll('[data-online-text]').forEach((element) => {
    element.textContent = t(`online.${element.dataset.onlineText}`);
  });
  document.querySelector('#online-wedding-date').textContent = i18n.formatWeddingDate().replace('（六）', '').trim();
  const zoomUrl = onlineWedding.zoomUrl.trim();
  let usableUrl = '';
  try {
    const parsed = new URL(zoomUrl);
    if (parsed.protocol === 'https:') usableUrl = parsed.href;
  } catch { /* Unfilled or incomplete settings are not actionable links. */ }
  const link = document.querySelector('#online-zoom-url');
  link.closest('.online-zoom-link').hidden = !usableUrl;
  link.textContent = zoomUrl;
  if (usableUrl) link.href = usableUrl;
  else link.removeAttribute('href');
  onlineMeetingButton.hidden = !usableUrl;
  if (usableUrl) onlineMeetingButton.href = usableUrl;
  else onlineMeetingButton.removeAttribute('href');
  document.querySelector('#online-zoom-pending').hidden = Boolean(usableUrl);
  ['meetingId', 'passcode'].forEach((key) => {
    const row = document.querySelector(`[data-zoom-field="${key}"]`);
    row.hidden = !onlineWedding[key].trim();
    row.querySelector('.online-zoom-value').textContent = onlineWedding[key].trim();
    row.querySelector('button').setAttribute('aria-label', t(key === 'meetingId' ? 'online.copyMeetingId' : 'online.copyPasscode'));
  });
  const status = document.querySelector('#online-copy-status');
  if (status.dataset.messageKey) status.textContent = t(status.dataset.messageKey);
}

async function copyOnlineDetail(button) {
  const key = button.dataset.zoomCopy;
  const value = onlineWedding[key]?.trim();
  if (!value || button.disabled) return;
  const status = document.querySelector('#online-copy-status');
  button.disabled = true;
  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    // Clipboard permission may be unavailable in an in-app browser.
    const active = document.activeElement;
    const input = document.createElement('textarea');
    input.value = value;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.append(input);
    input.select();
    input.setSelectionRange(0, value.length);
    try { copied = document.execCommand('copy'); } catch { /* Offer manual copy below. */ }
    input.remove();
    active?.focus({ preventScroll: true });
  } finally {
    button.disabled = false;
  }
  status.dataset.messageKey = copied
    ? (key === 'meetingId' ? 'online.copiedMeetingId' : 'online.copiedPasscode')
    : 'online.copyFailed';
  status.textContent = t(status.dataset.messageKey);
}

if (inviteMode === 'online') {
  document.body.classList.add('online-invitation');
  hero.after(quickNavWrapper);
  quickNavWrapper.after(document.querySelector('#ceremony-info'));
  document.querySelector('#ceremony-info .wedding-facts').hidden = true;
  document.querySelector('.scroll-cue').href = '#ceremony-info';
  document.querySelectorAll('[data-zoom-copy]').forEach((button) => {
    button.addEventListener('click', () => copyOnlineDetail(button));
  });
  renderOnlineDetails();
}

const RSVP_STORAGE_KEY = inviteMode === 'online' ? "wedding-online-message-submitted" : "wedding-rsvp-submitted";
const RSVP_MODE_CONFIG = {
  wedding: {
    titleKey: "rsvp.modeTitle.wedding",
    questions: ["ceremony"],
    required: ["ceremony"]
  },
  full: {
    titleKey: "rsvp.modeTitle.full",
    questions: ["ceremony", "banquet"],
    required: ["ceremony", "banquet"]
  },
  online: {
    titleKey: "online.messageTitle",
    questions: [],
    required: []
  }
};

const rsvpToggle = document.querySelector('#rsvp-toggle');
const rsvpPanel = document.querySelector('#rsvp-panel');
const rsvpForm = document.querySelector('#rsvp-form');
const rsvpFormTitle = document.querySelector('#rsvp-form-title');
const rsvpName = document.querySelector('#rsvp-name');
const rsvpPhone = document.querySelector('#rsvp-phone');
const rsvpInviteValue = document.querySelector('#rsvp-invite-value');
const rsvpPeopleValue = document.querySelector('#rsvp-people-value');
const rsvpVegetarianValue = document.querySelector('#rsvp-vegetarian-value');
const rsvpCounts = document.querySelector('#rsvp-counts');
const rsvpPeople = document.querySelector('#rsvp-people');
const rsvpVegetarian = document.querySelector('#rsvp-vegetarian');
const rsvpSubmit = document.querySelector('#rsvp-submit');
const rsvpSubmitLabel = rsvpSubmit.querySelector('.rsvp-submit-label');
const rsvpSubmitError = document.querySelector('#rsvp-submit-error');
const rsvpSuccess = document.querySelector('#rsvp-success');
const rsvpSuccessTitle = document.querySelector('#rsvp-success-title');
const rsvpSuccessMessage = document.querySelector('#rsvp-success-message');
const rsvpOnlineLink = document.querySelector('#rsvp-online-link');
const rsvpEdit = document.querySelector('#rsvp-edit');
let rsvpPeopleCount = 1;
let rsvpVegetarianCount = 0;
let rsvpSubmitting = false;
let rsvpPollingTimer = null;
let rsvpStatusTimeout = null;
let pendingRsvpSubmission = null;
let rsvpSuccessState = null;
const activeRsvpJsonpRequests = new Map();

function setRsvpError(element, key = '', fallback = '') {
  if (inviteMode === 'online' && ['rsvp.localPreview', 'rsvp.submitFailed', 'rsvp.statusTimeout'].includes(key)) {
    key = key.replace('rsvp.', 'online.');
  }
  element.dataset.errorKey = key;
  element.textContent = key ? t(key) : fallback;
}

function clearRsvpError(element) {
  delete element.dataset.errorKey;
  element.textContent = '';
}

function setRsvpExpanded(expanded, scrollToPanel = false) {
  if (inviteMode === 'online') expanded = true;
  rsvpToggle.setAttribute('aria-expanded', String(expanded));
  rsvpToggle.querySelector('span').textContent = expanded ? t('rsvp.collapse') : t('rsvp.expand');
  rsvpPanel.classList.toggle('is-expanded', expanded);
  rsvpPanel.setAttribute('aria-hidden', String(!expanded));
  rsvpPanel.inert = !expanded;
  requestScrollUpdate();

  if (expanded && scrollToPanel) {
    window.setTimeout(() => {
      rsvpPanel.scrollIntoView({
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }, reducedMotionQuery.matches ? 0 : 180);
  }
}

function selectedRsvpValue(name) {
  return rsvpForm.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function updateRsvpCounters() {
  rsvpPeople.textContent = String(rsvpPeopleCount);
  rsvpVegetarian.textContent = String(rsvpVegetarianCount);

  rsvpForm.querySelectorAll('[data-counter]').forEach((button) => {
    const counter = button.dataset.counter;
    const action = button.dataset.action;
    if (counter === 'people') {
      button.disabled = action === 'decrease' ? rsvpPeopleCount <= 1 : rsvpPeopleCount >= 10;
    } else {
      button.disabled = action === 'decrease' ? rsvpVegetarianCount <= 0 : rsvpVegetarianCount >= rsvpPeopleCount;
    }
  });
}

function updateRsvpAttendanceCounts() {
  const config = RSVP_MODE_CONFIG[inviteMode];
  if (!config || inviteMode === 'online') {
    rsvpCounts.hidden = true;
    rsvpPeopleCount = 0;
    rsvpVegetarianCount = 0;
    updateRsvpCounters();
    return;
  }

  const ceremonyAttendance = selectedRsvpValue('ceremony');
  const banquetAttendance = selectedRsvpValue('banquet');
  const willOrMayAttend = ceremonyAttendance === '現場參加'
    || (inviteMode === 'full' && (banquetAttendance === '可以參加' || banquetAttendance === '尚未確定'));

  rsvpCounts.hidden = !willOrMayAttend;
  if (willOrMayAttend) {
    if (rsvpPeopleCount < 1) {
      rsvpPeopleCount = 1;
      rsvpVegetarianCount = 0;
    }
  } else {
    rsvpPeopleCount = 0;
    rsvpVegetarianCount = 0;
  }
  updateRsvpCounters();
}

function setRsvpSubmitting(submitting) {
  rsvpSubmitting = submitting;
  rsvpSubmit.disabled = submitting;
  rsvpSubmit.classList.toggle('loading', submitting);
  rsvpSubmitLabel.textContent = inviteMode === 'online'
    ? t(submitting ? 'online.sending' : 'online.send')
    : t(submitting ? 'rsvp.submitting' : 'rsvp.submit');
  rsvpForm.setAttribute('aria-busy', String(submitting));
}

function scrollToRsvpSuccessCard() {
  rsvpSuccessTitle.focus({ preventScroll: true });
  rsvpSuccess.scrollIntoView({
    behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
    block: 'center'
  });
}

function renderRsvpSuccess() {
  if (!rsvpSuccessState) return;
  const { previouslySubmitted, ceremonyAttendance, action } = rsvpSuccessState;
  if (inviteMode === 'online') {
    rsvpSuccessTitle.textContent = t('online.thanks');
    rsvpSuccessMessage.textContent = t('online.received');
    rsvpOnlineLink.hidden = true;
    return;
  }
  const wasUpdated = !previouslySubmitted && action === 'updated';
  rsvpSuccessTitle.textContent = previouslySubmitted
    ? t('rsvp.submittedTitle')
    : (wasUpdated ? t('rsvp.updatedTitle') : t('rsvp.createdTitle'));
  const isOnlineCeremony = !previouslySubmitted && ((inviteMode === 'online' && selectedRsvpValue('online') === '會參加') || ceremonyAttendance === '線上參加');
  let successMessage = previouslySubmitted
    ? t('rsvp.received')
    : (wasUpdated
      ? t('rsvp.updatedMessage')
      : t('rsvp.createdMessage'));

  if (isOnlineCeremony) {
    successMessage += `<br><br>${t('rsvp.onlineSuccess')}`;
  }
  rsvpSuccessMessage.innerHTML = successMessage;

  const hasOnlineMeetingLink = isOnlineCeremony && Boolean(ONLINE_MEETING_URL.trim());
  rsvpOnlineLink.hidden = !hasOnlineMeetingLink;
  if (hasOnlineMeetingLink) {
    rsvpOnlineLink.href = ONLINE_MEETING_URL.trim();
  } else {
    rsvpOnlineLink.removeAttribute('href');
  }
}

function showRsvpSuccess(previouslySubmitted = false, ceremonyAttendance = '', action = 'created') {
  rsvpSuccessState = { previouslySubmitted, ceremonyAttendance, action };
  renderRsvpSuccess();
  rsvpForm.hidden = true;
  rsvpForm.classList.remove('is-submitted');
  rsvpSuccess.hidden = false;
  setRsvpExpanded(true);
  if (!previouslySubmitted) scrollToRsvpSuccessCard();
}

function readStoredRsvp() {
  if (inviteMode === 'online') return null;
  try {
    return JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY));
  } catch {
    return null;
  }
}

function storeRsvp(name) {
  if (inviteMode === 'online') return;
  try {
    window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify({
      invite: inviteMode,
      name,
      timestamp: new Date().toISOString()
    }));
  } catch {
    // RSVP submission still succeeds when storage is unavailable.
  }
}

function validateRsvpForm() {
  const config = RSVP_MODE_CONFIG[inviteMode];
  let firstInvalid = null;
  clearRsvpError(document.querySelector('#rsvp-name-error'));
  if (inviteMode !== 'online') clearRsvpError(document.querySelector('#rsvp-phone-error'));
  clearRsvpError(document.querySelector('#rsvp-vegetarian-error'));
  rsvpName.removeAttribute('aria-invalid');
  if (inviteMode !== 'online') rsvpPhone.removeAttribute('aria-invalid');
  if (inviteMode === 'online') {
    clearRsvpError(document.querySelector('#online-message-error'));
    document.querySelector('#rsvp-message').removeAttribute('aria-invalid');
  }
  rsvpForm.querySelectorAll('[data-rsvp-question]').forEach((question) => {
    question.removeAttribute('aria-invalid');
  });
  rsvpForm.querySelectorAll('[data-rsvp-error]').forEach(clearRsvpError);

  if (!rsvpName.value.trim()) {
    setRsvpError(document.querySelector('#rsvp-name-error'), 'rsvp.nameRequired');
    rsvpName.setAttribute('aria-invalid', 'true');
    firstInvalid = rsvpName;
  }

  if (inviteMode !== 'online') {
    const phoneValue = rsvpPhone.value.trim();
    const normalizedPhone = phoneValue.replace(/[\s-]+/g, '');
    const phoneDigitCount = (normalizedPhone.match(/\d/g) || []).length;
    if (!phoneValue) {
      setRsvpError(document.querySelector('#rsvp-phone-error'), 'rsvp.phoneRequired');
      rsvpPhone.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = rsvpPhone;
    } else if (phoneDigitCount < 8) {
      setRsvpError(document.querySelector('#rsvp-phone-error'), 'rsvp.phoneInvalid');
      rsvpPhone.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = rsvpPhone;
    }
  }

  if (inviteMode === 'online' && !document.querySelector('#rsvp-message').value.trim()) {
    const message = document.querySelector('#rsvp-message');
    setRsvpError(document.querySelector('#online-message-error'), 'online.messageRequired');
    message.setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = message;
  }

  config.required.forEach((question) => {
    if (selectedRsvpValue(question)) return;
    const error = rsvpForm.querySelector(`[data-rsvp-error="${question}"]`);
    setRsvpError(error, 'rsvp.attendanceRequired');
    error.closest('.rsvp-question').setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = rsvpForm.querySelector(`input[name="${question}"]`);
  });

  if (!rsvpCounts.hidden && rsvpVegetarianCount > rsvpPeopleCount) {
    setRsvpError(document.querySelector('#rsvp-vegetarian-error'), 'rsvp.vegetarianInvalid');
    if (!firstInvalid) firstInvalid = rsvpForm.querySelector('[data-counter="vegetarian"]');
  }

  if (firstInvalid) {
    const errorSection = firstInvalid.closest('.rsvp-field, .rsvp-question, .rsvp-counts') || firstInvalid;
    errorSection.scrollIntoView({
      behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      block: 'center'
    });
    window.setTimeout(() => firstInvalid.focus({ preventScroll: true }), reducedMotionQuery.matches ? 0 : 300);
    return false;
  }
  return true;
}

function setEmptyRsvpFieldFallback(name) {
  const fallback = document.querySelector(`#rsvp-${name}-empty`);
  fallback.disabled = Boolean(selectedRsvpValue(name));
}

function prepareRsvpSubmissionFields() {
  rsvpInviteValue.value = inviteMode;
  rsvpPeopleValue.value = String(inviteMode === 'online' ? 0 : rsvpPeopleCount);
  rsvpVegetarianValue.value = String(inviteMode === 'online' ? 0 : rsvpVegetarianCount);
  rsvpName.value = rsvpName.value.trim();
  if (inviteMode !== 'online') rsvpPhone.value = rsvpPhone.value.trim().replace(/[\s-]+/g, '');
  document.querySelector('#rsvp-note').value = document.querySelector('#rsvp-note').value.trim();
  document.querySelector('#rsvp-message').value = document.querySelector('#rsvp-message').value.trim();
  ['ceremony', 'banquet', 'online'].forEach(setEmptyRsvpFieldFallback);
  if (inviteMode === 'online') {
    // Existing backend canonical value and form field names remain unchanged.
    ['ceremony', 'banquet', 'online'].forEach((name) => {
      const field = document.querySelector(`#rsvp-${name}-empty`);
      field.disabled = false;
      field.value = name === 'online' ? '會參加' : '';
    });
    document.querySelector('#rsvp-note').value = '';
  }
}

function createRsvpSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function cleanupRsvpJsonpRequest(callbackName, absorbLateResponse = false) {
  const request = activeRsvpJsonpRequests.get(callbackName);
  if (!request) return;
  window.clearTimeout(request.cleanupTimer);
  request.script.remove();
  activeRsvpJsonpRequests.delete(callbackName);

  if (!absorbLateResponse) {
    delete window[callbackName];
    return;
  }

  const retiredCallback = () => {};
  window[callbackName] = retiredCallback;
  window.setTimeout(() => {
    if (window[callbackName] === retiredCallback) delete window[callbackName];
  }, 6000);
}

function stopRsvpStatusPolling() {
  if (rsvpPollingTimer !== null) {
    window.clearInterval(rsvpPollingTimer);
    rsvpPollingTimer = null;
  }
  if (rsvpStatusTimeout !== null) {
    window.clearTimeout(rsvpStatusTimeout);
    rsvpStatusTimeout = null;
  }
  [...activeRsvpJsonpRequests.keys()].forEach((callbackName) => {
    cleanupRsvpJsonpRequest(callbackName, true);
  });
}

function finishRsvpWithError(message) {
  stopRsvpStatusPolling();
  setRsvpSubmitting(false);
  pendingRsvpSubmission = null;
  delete rsvpSubmitError.dataset.errorKey;
  rsvpSubmitError.dataset.backendMessage = message;
  const translatedMessage = i18n.translatePhrase(message);
  if (inviteMode === 'online') {
    rsvpSubmitError.textContent = t('online.submitFailed');
    rsvpSubmitError.dataset.errorKey = 'online.submitFailed';
    delete rsvpSubmitError.dataset.backendMessage;
    return;
  }
  rsvpSubmitError.textContent = i18n.getLanguage() === 'en' && translatedMessage === message
    ? t('rsvp.submitFailed')
    : translatedMessage;
}

function finishRsvpWithErrorKey(key) {
  stopRsvpStatusPolling();
  setRsvpSubmitting(false);
  pendingRsvpSubmission = null;
  delete rsvpSubmitError.dataset.backendMessage;
  setRsvpError(rsvpSubmitError, key);
}

function handleRsvpStatusResult(result) {
  if (!rsvpSubmitting || !pendingRsvpSubmission || !result || typeof result !== 'object') return;
  if (result.ready !== true) return;

  if (typeof result.success !== 'boolean') return;
  if (!result.success) {
    finishRsvpWithError(typeof result.message === 'string' && result.message.trim()
      ? result.message.trim()
      : t('rsvp.submitFailed'));
    return;
  }

  const completedSubmission = pendingRsvpSubmission;
  stopRsvpStatusPolling();
  pendingRsvpSubmission = null;
  const resultAction = result.action === 'updated' ? 'updated' : 'created';
  storeRsvp(completedSubmission.name);
  rsvpForm.classList.add('is-submitted');
  window.setTimeout(() => {
    showRsvpSuccess(false, completedSubmission.ceremonyAttendance, resultAction);
    setRsvpSubmitting(false);
  }, reducedMotionQuery.matches ? 0 : 350);
}

function pollRsvpSubmissionStatus(submissionId) {
  if (!rsvpSubmitting || pendingRsvpSubmission?.submissionId !== submissionId || activeRsvpJsonpRequests.size) return;

  const callbackName = `weddingRsvpStatus_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const statusUrl = new URL(RSVP_ENDPOINT);
  statusUrl.searchParams.set('action', 'status');
  statusUrl.searchParams.set('id', submissionId);
  statusUrl.searchParams.set('callback', callbackName);

  const script = document.createElement('script');
  script.async = true;
  script.src = statusUrl.toString();
  window[callbackName] = (result) => {
    cleanupRsvpJsonpRequest(callbackName);
    if (pendingRsvpSubmission?.submissionId === submissionId) handleRsvpStatusResult(result);
  };
  script.onerror = () => cleanupRsvpJsonpRequest(callbackName);

  const cleanupTimer = window.setTimeout(() => cleanupRsvpJsonpRequest(callbackName, true), 5000);
  activeRsvpJsonpRequests.set(callbackName, { script, cleanupTimer });
  document.head.append(script);
}

function startRsvpStatusPolling(submissionId) {
  stopRsvpStatusPolling();
  rsvpPollingTimer = window.setInterval(() => pollRsvpSubmissionStatus(submissionId), 1000);
  rsvpStatusTimeout = window.setTimeout(() => {
    finishRsvpWithErrorKey('rsvp.statusTimeout');
  }, 20000);
}

function renderOnlineMessageLanguage() {
  if (inviteMode !== 'online') return;
  const text = (selector, key) => { document.querySelector(selector).textContent = t(`online.${key}`); };
  text('#rsvp-title', 'messageTitle');
  text('.rsvp-intro', 'messageIntro');
  text('label[for="rsvp-message"]', 'messageLabel');
  document.querySelector('#rsvp-message').placeholder = t('online.messagePlaceholder');
  document.querySelectorAll('a[data-invite="nav:rsvp"]').forEach((link) => { link.textContent = t('online.messageTitle'); });
  document.querySelectorAll('a[data-invite="nav:ceremony-info"]:not([data-quick-nav])').forEach((link) => { link.textContent = t('online.ceremony'); });
  text('#ceremony-info-title', 'ceremony');
  document.querySelector('#ceremony-info .section-header__eyebrow').textContent = 'ONLINE CEREMONY';
}

if (inviteMode === 'online') {
  rsvpPhone.closest('.rsvp-field').remove();
  document.querySelectorAll('.rsvp-deadline-note, .rsvp-update-note').forEach(element => element.remove());
  rsvpEdit.remove();
  rsvpForm.querySelectorAll('input[type="radio"]').forEach((input) => { input.disabled = true; });
  document.querySelector('#rsvp-note').closest('.rsvp-field').hidden = true;
  document.querySelector('#rsvp-message-description').hidden = true;
  const message = document.querySelector('#rsvp-message');
  document.querySelector('#online-message-error').hidden = false;
  message.required = true;
  message.setAttribute('aria-required', 'true');
  message.setAttribute('aria-describedby', 'online-message-error');
  message.addEventListener('input', () => {
    if (!message.value.trim()) return;
    message.removeAttribute('aria-invalid');
    clearRsvpError(document.querySelector('#online-message-error'));
  });
  [rsvpToggle, rsvpFormTitle, document.querySelector('.rsvp-duration'), document.querySelector('.rsvp-heading .section-header__eyebrow')].forEach((element) => { element.hidden = true; });
  setRsvpExpanded(true);
  renderOnlineMessageLanguage();
}

if (VALID_INVITE_MODES.includes(inviteMode)) {
  const modeConfig = RSVP_MODE_CONFIG[inviteMode];
  rsvpFormTitle.textContent = t(modeConfig.titleKey);
  document.querySelectorAll('[data-rsvp-question]').forEach((question) => {
    question.hidden = !modeConfig.questions.includes(question.dataset.rsvpQuestion);
  });
  updateRsvpAttendanceCounts();

  const storedRsvp = readStoredRsvp();
  if (storedRsvp?.invite === inviteMode) {
    rsvpName.value = storedRsvp.name || '';
    showRsvpSuccess(true);
  }
}

rsvpToggle.addEventListener('click', () => {
  const expanded = rsvpToggle.getAttribute('aria-expanded') === 'true';
  setRsvpExpanded(!expanded, !expanded);
});

rsvpForm.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const error = rsvpForm.querySelector(`[data-rsvp-error="${radio.name}"]`);
    if (error) clearRsvpError(error);
    radio.closest('.rsvp-question')?.removeAttribute('aria-invalid');
    updateRsvpAttendanceCounts();
  });
});

rsvpName.addEventListener('input', () => {
  if (!rsvpName.value.trim()) return;
  rsvpName.removeAttribute('aria-invalid');
  clearRsvpError(document.querySelector('#rsvp-name-error'));
});

if (inviteMode !== 'online') rsvpPhone.addEventListener('input', () => {
  const normalizedPhone = rsvpPhone.value.trim().replace(/[\s-]+/g, '');
  if ((normalizedPhone.match(/\d/g) || []).length < 8) return;
  rsvpPhone.removeAttribute('aria-invalid');
  clearRsvpError(document.querySelector('#rsvp-phone-error'));
});

rsvpForm.querySelectorAll('[data-counter]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.counter === 'people') {
      rsvpPeopleCount += button.dataset.action === 'increase' ? 1 : -1;
      rsvpPeopleCount = Math.min(10, Math.max(1, rsvpPeopleCount));
      rsvpVegetarianCount = Math.min(rsvpVegetarianCount, rsvpPeopleCount);
    } else {
      rsvpVegetarianCount += button.dataset.action === 'increase' ? 1 : -1;
      rsvpVegetarianCount = Math.min(rsvpPeopleCount, Math.max(0, rsvpVegetarianCount));
    }
    clearRsvpError(document.querySelector('#rsvp-vegetarian-error'));
    updateRsvpCounters();
  });
});

rsvpForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (rsvpSubmitting || rsvpForm.hidden || !validateRsvpForm()) return;
  // Local previews must never write to the production RSVP endpoint.
  if (isLocalDevelopmentHost() || window.location.protocol === 'file:') {
    finishRsvpWithErrorKey('rsvp.localPreview');
    return;
  }

  if (inviteMode === 'online' && !ONLINE_MESSAGE_BACKEND_READY) {
    finishRsvpWithErrorKey('online.submitFailed');
    return;
  }

  delete rsvpSubmitError.dataset.backendMessage;
  clearRsvpError(rsvpSubmitError);
  const ceremonyAttendance = inviteMode === 'online' ? '' : selectedRsvpValue('ceremony');
  const submissionId = createRsvpSubmissionId();
  pendingRsvpSubmission = {
    name: rsvpName.value.trim(),
    ceremonyAttendance,
    submissionId
  };
  prepareRsvpSubmissionFields();
  const formData = new FormData(rsvpForm);
  formData.set('submissionId', submissionId);
  if (inviteMode === 'online') formData.set('phone', '');
  setRsvpSubmitting(true);
  startRsvpStatusPolling(submissionId);

  fetch(RSVP_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  }).catch(() => {
    if (pendingRsvpSubmission?.submissionId !== submissionId) return;
    finishRsvpWithErrorKey('rsvp.submitFailed');
  });
});

if (inviteMode !== 'online') rsvpEdit.addEventListener('click', () => {
  rsvpSuccess.hidden = true;
  rsvpForm.hidden = false;
  rsvpForm.classList.remove('is-submitted');
  setRsvpExpanded(true, true);
  rsvpName.focus({ preventScroll: true });
});

function navigationTargetFromHash(hash) {
  if (hash === '#gallery') return document.querySelector('#wedding-gallery');
  return document.getElementById(hash.slice(1));
}

function renderQuickNavigationLanguage() {
  if (!quickNav) return;
  quickNav.setAttribute('aria-label', t('quickNav.label'));
  quickNavLinks.forEach((link) => {
    const key = link.dataset.quickNav;
    const isOnlineCeremony = key === 'ceremony' && inviteMode === 'online';
    const labelKey = isOnlineCeremony
      ? 'quickNav.onlineCeremony'
      : `quickNav.${key}`;
    link.textContent = t(labelKey);
    link.setAttribute('aria-label', t(isOnlineCeremony ? 'quickNav.onlineCeremonyFull' : `quickNav.${key}Full`));
  });
  const visibleCount = quickNavLinks.filter((link) => !link.hidden && !link.closest('[hidden]')).length;
  quickNav.style.setProperty('--quick-nav-count', String(Math.max(visibleCount, 1)));
}

function renderInfoAccordionLanguage(accordion) {
  const trigger = accordion.querySelector('.info-accordion__trigger');
  const label = accordion.querySelector('[data-info-accordion-label]');
  if (!trigger || !label) return;
  const labelText = t(`accordion.${accordion.dataset.infoAccordion}`);
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  const separator = i18n.getLanguage() === 'en' ? ', ' : '，';
  label.textContent = labelText;
  trigger.setAttribute('aria-label', `${labelText}${separator}${t(expanded ? 'accordion.collapse' : 'accordion.expand')}`);
}

function renderInfoAccordionsLanguage() {
  infoAccordions.forEach(renderInfoAccordionLanguage);
}

function navigationOffsetForSection(section) {
  const headerHeight = header?.getBoundingClientRect().height || 0;
  const quickNavHeight = quickNavWrapper?.getBoundingClientRect().height || 0;
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  const quickNavTop = quickNavWrapper
    ? quickNavWrapper.getBoundingClientRect().top + window.scrollY
    : Number.POSITIVE_INFINITY;
  return headerHeight + (sectionTop >= quickNavTop ? quickNavHeight : 0);
}

function scrollToSection(section, {
  updateHistory = true,
  hash = null
} = {}) {
  if (!section || section.hidden || section.closest('[hidden]') || !section.getClientRects().length) return false;
  const target = section.getBoundingClientRect().top + window.scrollY - navigationOffsetForSection(section);
  window.scrollTo({
    top: Math.max(0, target),
    behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
  });
  if (updateHistory) {
    const url = new URL(window.location.href);
    url.hash = hash || `#${section.id}`;
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
  requestScrollUpdate();
  return true;
}

function setQuickNavActive(activeKey) {
  quickNavLinks.forEach((link) => {
    const active = link.dataset.quickNav === activeKey && !link.hidden && !link.closest('[hidden]');
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function initializeQuickNavScrollSpy() {
  quickNavObserver?.disconnect();
  quickNavObserver = null;
  quickNavIntersections.clear();
  setQuickNavActive(null);
  if (!quickNav || !('IntersectionObserver' in window)) return;

  const items = quickNavLinks
    .filter((link) => !link.hidden && !link.closest('[hidden]'))
    .flatMap((link) => (QUICK_NAV_SECTION_IDS[link.dataset.quickNav] || [])
      .map((id) => document.getElementById(id))
      .filter((section) => section
        && !section.hidden
        && !section.closest('[hidden]')
        && section.getClientRects().length)
      .map((section) => ({ link, section })));
  if (!items.length) return;

  const keyBySection = new Map(items.map(({ link, section }) => [section, link.dataset.quickNav]));
  const topOffset = (header?.getBoundingClientRect().height || 0)
    + (quickNavWrapper?.getBoundingClientRect().height || 0)
    + 16;
  quickNavObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) quickNavIntersections.set(entry.target, entry);
      else quickNavIntersections.delete(entry.target);
    });
    const candidates = [...quickNavIntersections.values()]
      .sort((first, second) => Math.abs(first.boundingClientRect.top - topOffset)
        - Math.abs(second.boundingClientRect.top - topOffset));
    setQuickNavActive(candidates[0] ? keyBySection.get(candidates[0].target) : null);
  }, {
    threshold: [0, .15, .35],
    rootMargin: `-${Math.round(topOffset)}px 0px -62% 0px`
  });
  items.forEach(({ section }) => quickNavObserver.observe(section));
}

function setInfoAccordionOpen(accordion, open) {
  const trigger = accordion.querySelector('.info-accordion__trigger');
  const body = accordion.querySelector('.info-accordion__body');
  if (!trigger || !body) return;
  accordion.classList.toggle('is-open', open);
  trigger.setAttribute('aria-expanded', String(open));
  body.setAttribute('aria-hidden', String(!open));
  body.inert = !open;
  if (open) {
    body.querySelectorAll('.reveal').forEach((element) => {
      element.classList.add('is-visible');
      element.dataset.revealed = 'true';
    });
  }
  renderInfoAccordionLanguage(accordion);
  window.requestAnimationFrame(() => {
    requestScrollUpdate();
  });
}

function initializeInformationAccordions() {
  infoAccordions.forEach((accordion) => {
    const trigger = accordion.querySelector('.info-accordion__trigger');
    if (!trigger) return;
    setInfoAccordionOpen(accordion, false);
    const body = accordion.querySelector('.info-accordion__body');
    body?.addEventListener('transitionend', (event) => {
      if (event.target === body && event.propertyName === 'grid-template-rows') requestScrollUpdate();
    });
    trigger.addEventListener('click', () => {
      setInfoAccordionOpen(accordion, trigger.getAttribute('aria-expanded') !== 'true');
    });
  });
}

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('.quick-nav__link, #nav-links a.nav-link[href^="#"]');
  if (!anchor) return;
  const targetHash = anchor.getAttribute('href');
  const target = navigationTargetFromHash(targetHash);
  if (!target || target.hidden || target.closest('[hidden]')) return;
  event.preventDefault();
  if (anchor.matches('.quick-nav__link')) setQuickNavActive(anchor.dataset.quickNav);
  scrollToSection(target, { hash: targetHash });
}, true);

initializeInformationAccordions();
renderQuickNavigationLanguage();
renderInfoAccordionsLanguage();
initializeQuickNavScrollSpy();
document.fonts?.ready.then(initializeQuickNavScrollSpy);
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? t('nav.closeMenu') : t('nav.openMenu'));
  navLinks.classList.toggle('open', open);
  header.classList.toggle('menu-active', open);
  document.body.classList.toggle('menu-open', open);
}

function setMoreMenu(open, restoreFocus = false) {
  if (navMore.hidden) return;
  navMoreToggle.setAttribute('aria-expanded', String(open));
  navMore.classList.toggle('open', open);
  if (!open && restoreFocus) navMoreToggle.focus({ preventScroll: true });
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    const wasMobileMenuOpen = window.innerWidth <= 820 && menuButton.getAttribute('aria-expanded') === 'true';
    const wasDesktopMoreItem = window.innerWidth > 820 && navMoreMenu.contains(link);
    setActiveNavLink(link);
    setMoreMenu(false);
    setMenu(false);
    if (wasMobileMenuOpen) {
      window.requestAnimationFrame(() => menuButton.focus({ preventScroll: true }));
    } else if (wasDesktopMoreItem) {
      window.requestAnimationFrame(() => navMoreToggle.focus({ preventScroll: true }));
    }
  });
});

function availableMoreMenuItems() {
  return [...navMoreMenu.querySelectorAll('a[role="menuitem"]')]
    .filter((link) => !link.hidden && !link.closest('[hidden]'));
}

function focusMoreMenuEdge(edge) {
  const menuItems = availableMoreMenuItems();
  const target = edge === 'last' ? menuItems[menuItems.length - 1] : menuItems[0];
  target?.focus({ preventScroll: true });
}

navMoreToggle.addEventListener('click', () => {
  setMoreMenu(navMoreToggle.getAttribute('aria-expanded') !== 'true');
});

navMoreToggle.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  setMoreMenu(true);
  window.requestAnimationFrame(() => focusMoreMenuEdge(event.key === 'ArrowUp' ? 'last' : 'first'));
});

navMoreMenu.addEventListener('keydown', (event) => {
  const menuItems = availableMoreMenuItems();
  if (!menuItems.length) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setMoreMenu(false, true);
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = Math.max(0, menuItems.indexOf(document.activeElement));
  const targetIndex = event.key === 'Home'
    ? 0
    : (event.key === 'End'
      ? menuItems.length - 1
      : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length);
  menuItems[targetIndex].focus({ preventScroll: true });
});

navMore.addEventListener('focusout', () => {
  window.requestAnimationFrame(() => {
    if (!navMore.contains(document.activeElement)) setMoreMenu(false);
  });
});

document.addEventListener('pointerdown', (event) => {
  if (!navMore.contains(event.target)) setMoreMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || navMoreToggle.getAttribute('aria-expanded') !== 'true') return;
  setMoreMenu(false, true);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
  setMenu(false);
  menuButton.focus({ preventScroll: true });
});

let resizeTicking = false;
let heroInView = true;
let lastHeroParallaxOffset = null;

function requestResizeUpdate() {
  if (resizeTicking) return;
  resizeTicking = true;
  window.requestAnimationFrame(() => {
    if (window.innerWidth > 820) setMenu(false);
    else setMoreMenu(false);
    renderQuickNavigationLanguage();
    renderInfoAccordionsLanguage();
    initializeQuickNavScrollSpy();
    initializeScrollSpy();
    initializeBottomCtaObserver();
    requestScrollUpdate();
    resizeTicking = false;
  });
}

window.addEventListener('resize', requestResizeUpdate, { passive: true });

function updateHeader() {
  const heroBottom = hero.offsetTop + hero.offsetHeight - header.offsetHeight;
  header.classList.toggle('scrolled', window.scrollY >= heroBottom);
}


function updateScrollEffects() {
  const currentScrollY = window.scrollY;
  updateHeader();

  const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = scrollableDistance > 0
    ? Math.min(1, Math.max(0, currentScrollY / scrollableDistance))
    : 0;
  scrollProgressBar.style.transform = `scaleX(${scrollRatio})`;
  scrollProgress.setAttribute('aria-valuenow', String(Math.round(scrollRatio * 100)));

  const backToTopThreshold = Math.max(500, window.innerHeight * .7);
  backToTopButton.classList.toggle('is-visible', currentScrollY > backToTopThreshold && !bottomCtaIntersections.size);

  if (window.innerWidth > 820 && heroInView && !reducedMotionQuery.matches && !document.body.classList.contains('invite-missing')) {
    const parallaxOffset = Math.min(26, Math.max(0, currentScrollY * .055));
    if (parallaxOffset !== lastHeroParallaxOffset) {
      heroMedia.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
      lastHeroParallaxOffset = parallaxOffset;
    }
  } else if (lastHeroParallaxOffset !== null) {
    heroMedia.style.transform = '';
    lastHeroParallaxOffset = null;
  }

  scrollTicking = false;
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
}

requestScrollUpdate();
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(requestScrollUpdate).observe(document.querySelector('main'));

// Keep the floating control clear of primary actions near the bottom of the screen.
function initializeBottomCtaObserver() {
  bottomCtaObserver?.disconnect();
  bottomCtaIntersections.clear();
  if (!('IntersectionObserver' in window)) return;
  bottomCtaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) bottomCtaIntersections.add(entry.target);
      else bottomCtaIntersections.delete(entry.target);
    });
    requestScrollUpdate();
  }, { rootMargin: `-${Math.max(0, window.innerHeight - 110)}px 0px 0px 0px` });
  document.querySelectorAll('main .button').forEach((button) => bottomCtaObserver.observe(button));
}
initializeBottomCtaObserver();

backToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
  });
});

const navSectionLinks = [...navLinks.querySelectorAll('a.nav-link[href^="#"]')];
let scrollSpyObserver = null;

function clearNavActiveState() {
  navSectionLinks.forEach((link) => {
    link.classList.remove('is-active');
    link.removeAttribute('aria-current');
  });
  navMoreToggle.classList.remove('is-active');
  navMore.classList.remove('has-active-section');
}

function setActiveNavLink(activeLink) {
  clearNavActiveState();
  if (!activeLink || activeLink.hidden || activeLink.closest('[hidden]')) return;

  activeLink.classList.add('is-active');
  activeLink.setAttribute('aria-current', 'location');

  const activeIsInMoreMenu = navMoreMenu.contains(activeLink);
  navMoreToggle.classList.toggle('is-active', activeIsInMoreMenu);
  navMore.classList.toggle('has-active-section', activeIsInMoreMenu);
}

function initializeScrollSpy() {
  scrollSpyObserver?.disconnect();
  scrollSpyObserver = null;
  clearNavActiveState();

  if (!VALID_INVITE_MODES.includes(inviteMode) || !('IntersectionObserver' in window)) return;

  const observedSections = new Set();
  const observedItems = navSectionLinks
    .filter((link) => !link.hidden
      && !link.closest('[hidden]')
      && window.getComputedStyle(link).display !== 'none')
    .map((link) => {
      const section = navigationTargetFromHash(link.getAttribute('href'));
      return section && !section.hidden && !section.closest('[hidden]') && section.getClientRects().length > 0
        ? { link, section }
        : null;
    })
    .filter((item) => {
      if (!item || observedSections.has(item.section)) return false;
      observedSections.add(item.section);
      return true;
    });

  const linkBySection = new Map(observedItems.map(({ link, section }) => [section, link]));
  const intersectingSections = new Map();

  scrollSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersectingSections.set(entry.target, entry);
      else intersectingSections.delete(entry.target);
    });

    const readingLine = window.innerHeight * .3;
    const activeEntry = [...intersectingSections.values()].sort((first, second) => {
      const firstDistance = Math.abs(first.target.getBoundingClientRect().top - readingLine);
      const secondDistance = Math.abs(second.target.getBoundingClientRect().top - readingLine);
      return firstDistance - secondDistance || second.intersectionRatio - first.intersectionRatio;
    })[0];

    setActiveNavLink(activeEntry ? linkBySection.get(activeEntry.target) : null);
  }, {
    threshold: [0, .15, .35, .6],
    rootMargin: '-20% 0px -60% 0px'
  });

  observedItems.forEach(({ section }) => scrollSpyObserver.observe(section));
}

initializeScrollSpy();

const unifiedRevealTargets = document.querySelectorAll([
  '.page-section .section-title',
  '.page-section .glass-card',
  '.page-section .share-step',
  '.story-gallery .story-title',
  '.site-footer'
].join(','));

unifiedRevealTargets.forEach((item) => item.classList.add('reveal'));

document.querySelectorAll('.wedding-facts, .ceremony-parking-grid, .ceremony-note-grid, .arrival-guides, .banquet-parking-grid, .share-steps').forEach((group) => {
  [...group.children].forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index * 110, 330)}ms`);
  });
});

const revealItems = [...document.querySelectorAll('.reveal')]
  .filter((item) => !item.hidden
    && !item.closest('[hidden]')
    && !item.closest('.info-accordion__body[aria-hidden="true"]')
    && item.getClientRects().length > 0);
revealItems.forEach((item) => {
  if (item.dataset.revealed === 'true') item.classList.add('is-visible');
});
const pendingRevealItems = revealItems.filter((item) => !item.classList.contains('is-visible'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      entry.target.dataset.revealed = 'true';
      if (entry.target.matches('.wedding-carousel')) {
        debugCarouselLifecycle('reveal observer callback', { revealed: true });
      }
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  pendingRevealItems.forEach((item) => revealObserver.observe(item));
} else {
  pendingRevealItems.forEach((item) => {
    item.classList.add('is-visible');
    item.dataset.revealed = 'true';
  });
}

document.querySelectorAll('.faq-list details').forEach((details) => {
  const summary = details.querySelector('summary');
  const syncExpandedState = () => {
    summary.setAttribute('aria-expanded', String(details.open));
    requestScrollUpdate();
  };
  syncExpandedState();
  details.addEventListener('toggle', syncExpandedState);
});

const seatData = {
  '王小明': { table: 'A12', guests: '2 位', meal: '一般餐' },
  '林美玲': { table: 'B08', guests: '1 位', meal: '素食' },
  '陳大華': { table: 'C05', guests: '4 位', meal: '一般餐' }
};

const seatSearch = document.querySelector('#seat-search');
const guestNameInput = document.querySelector('#guest-name');
const lookupResult = document.querySelector('#lookup-result');
const lookupHint = document.querySelector('#lookup-hint');
const lookupButton = seatSearch.querySelector('.lookup-button');
const lookupButtonLabel = lookupButton.querySelector('.button-label');
let lookupTimer;
let lookupState = null;

function revealLookupResult(type) {
  lookupResult.className = `lookup-result ${type}`;
  void lookupResult.offsetWidth;
  lookupResult.classList.add('show');

  requestAnimationFrame(() => {
    const bounds = lookupResult.getBoundingClientRect();
    if (bounds.top < header.offsetHeight || bounds.bottom > window.innerHeight) {
      lookupResult.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'center' });
    }
  });
}

function showSeatResult(name, seat, reveal = true) {
  lookupResult.innerHTML = `
    <p class="result-welcome"></p>
    <h3 class="result-name"></h3>
    <p class="table-number"></p>
    <div class="result-rule" aria-hidden="true"></div>
    <p class="guest-count"></p>
    <p class="result-closing">期待與您共度美好時光</p>
    <p class="special-meal" hidden></p>`;
  lookupResult.querySelector('.result-welcome').textContent = t('seating.welcome');
  lookupResult.querySelector('.result-name').textContent = name;
  lookupResult.querySelector('.table-number').textContent = t('seating.table', { table: seat.table });
  const guestCount = String(seat.guests).match(/\d+/)?.[0] ?? seat.guests;
  lookupResult.querySelector('.guest-count').textContent = t('seating.guests', { guests: guestCount });
  lookupResult.querySelector('.result-closing').textContent = t('seating.closing');
  if (seat.meal !== '一般餐') {
    const specialMeal = lookupResult.querySelector('.special-meal');
    const meal = seat.meal === '素食' ? t('seating.vegetarianMeal') : seat.meal;
    specialMeal.textContent = t('seating.specialMeal', { meal });
    specialMeal.hidden = false;
  }
  lookupState = { type: 'success', name, seat };
  if (reveal) revealLookupResult('success');
  else lookupResult.className = 'lookup-result success show';
}

function showNotFound(reveal = true) {
  lookupResult.innerHTML = `
    <span class="not-found-icon" aria-hidden="true"></span>
    <h3 class="not-found-title">${t('seating.notFoundTitle')}</h3>
    <p class="not-found-copy">${t('seating.notFound')}</p>`;
  lookupState = { type: 'not-found' };
  if (reveal) revealLookupResult('not-found');
  else lookupResult.className = 'lookup-result not-found show';
}

function setLookupLoading(loading) {
  lookupButton.disabled = loading;
  lookupButton.classList.toggle('loading', loading);
  lookupButtonLabel.textContent = loading ? t('seating.loading') : t('seating.lookup');
  seatSearch.setAttribute('aria-busy', String(loading));
}

seatSearch.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = guestNameInput.value.trim();
  clearTimeout(lookupTimer);

  if (!name) {
    setLookupLoading(false);
    lookupResult.className = 'lookup-result';
    lookupResult.replaceChildren();
    lookupHint.classList.add('show');
    guestNameInput.focus();
    return;
  }

  lookupHint.classList.remove('show');
  lookupResult.className = 'lookup-result';
  setLookupLoading(true);

  lookupTimer = window.setTimeout(() => {
    const seat = seatData[name];
    if (seat) showSeatResult(name, seat);
    else showNotFound();
    setLookupLoading(false);
  }, 500);
});

guestNameInput.addEventListener('input', () => {
  if (guestNameInput.value.trim()) lookupHint.classList.remove('show');
});

document.querySelectorAll('.image-shell img').forEach((image) => {
  const markLoaded = () => {
    image.closest('.image-shell').classList.add('loaded');
    requestScrollUpdate();
  };
  image.addEventListener('animationend', (event) => {
    if (event.animationName === 'image-content-reveal') {
      image.closest('.image-shell').classList.add('image-reveal-complete');
    }
  }, { once: true });
  if (image.complete) markLoaded();
  else image.addEventListener('load', markLoaded, { once: true });
});

const lightbox = document.querySelector('#gallery-lightbox');
const lightboxStage = lightbox.querySelector('.lightbox-stage');
const lightboxImage = lightbox.querySelector('.lightbox-image');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxPrev = lightbox.querySelector('.lightbox-prev');
const lightboxNext = lightbox.querySelector('.lightbox-next');
const weddingCarousel = document.querySelector('.wedding-carousel');
const carouselViewport = weddingCarousel?.querySelector('.wedding-carousel__viewport');
const carouselTrack = weddingCarousel?.querySelector('.wedding-carousel__track');
const carouselPrevious = weddingCarousel?.querySelector('.wedding-carousel__arrow--previous');
const carouselNext = weddingCarousel?.querySelector('.wedding-carousel__arrow--next');
const galleryProgress = weddingCarousel?.querySelector('.gallery-progress');
const carouselMobileQuery = window.matchMedia('(max-width: 820px)');
const gallerySection = weddingCarousel?.closest('#wedding-gallery');

function reportMissingGalleryImage(path) {
  console.error(`Missing gallery image: ${path}`);
}

function normalizeGalleryData(source) {
  if (!Array.isArray(source)) {
    reportMissingGalleryImage('assets/wedding-gallery/wedding-gallery-data.js');
    return [];
  }

  const seenIds = new Set();
  return source.flatMap((item, index) => {
    const id = String(item?.id ?? '').trim();
    const thumb = String(item?.thumb ?? '').trim();
    const large = String(item?.large ?? '').trim();
    const dimensions = ['width', 'height', 'largeWidth', 'largeHeight']
      .map((key) => Number(item?.[key]));
    const valid = id
      && !seenIds.has(id)
      && thumb
      && large
      && dimensions.every((value) => Number.isFinite(value) && value > 0);
    if (!valid) {
      reportMissingGalleryImage(thumb || large || id || `gallery item ${index + 1}`);
      return [];
    }
    seenIds.add(id);
    return [{
      id,
      thumb,
      large,
      width: dimensions[0],
      height: dimensions[1],
      largeWidth: dimensions[2],
      largeHeight: dimensions[3],
      alt: item.alt,
      objectPosition: typeof item.objectPosition === 'string'
        ? item.objectPosition.trim()
        : ''
    }];
  });
}

let galleryImages = normalizeGalleryData(window.weddingGallery);

function galleryItemAlt(item) {
  const localizedAlt = item?.alt;
  if (typeof localizedAlt === 'string') {
    return /^Zeric and Lily wedding photo \d+$/.test(localizedAlt)
      ? t('gallery.photoAlt', { current: item.id })
      : localizedAlt;
  }
  const language = i18n.getLanguage();
  return localizedAlt?.[language]
    || localizedAlt?.['zh-TW']
    || localizedAlt?.en
    || t('gallery.region');
}

function createGallerySlide(item, index) {
  const slide = document.createElement('article');
  const orientation = item.width > item.height ? 'landscape' : 'portrait';
  slide.className = `wedding-carousel__slide is-${orientation}`;
  slide.dataset.orientation = orientation;
  slide.dataset.galleryId = item.id;
  slide.dataset.revealed = 'true';
  slide.classList.add('is-revealed');
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-hidden', String(index !== 0));

  const button = document.createElement('button');
  button.className = 'gallery-media wedding-carousel__media';
  button.type = 'button';
  button.dataset.galleryId = item.id;
  button.tabIndex = index === 0 ? 0 : -1;

  const image = document.createElement('img');
  image.alt = galleryItemAlt(item);
  image.width = item.width;
  image.height = item.height;
  image.draggable = false;
  image.decoding = 'async';
  image.loading = index === 0 ? 'eager' : 'lazy';
  if (item.objectPosition) image.style.objectPosition = item.objectPosition;
  if (index === 0) {
    image.src = item.thumb;
    image.fetchPriority = 'high';
  } else {
    image.dataset.src = item.thumb;
  }

  const photoIndex = document.createElement('span');
  photoIndex.className = 'photo-index';
  photoIndex.textContent = item.id;
  button.append(image, photoIndex);
  slide.append(button);
  return slide;
}

if (carouselTrack) {
  carouselTrack.replaceChildren(...galleryImages.map(createGallerySlide));
}

let carouselSlides = weddingCarousel ? [...weddingCarousel.querySelectorAll('.wedding-carousel__slide')] : [];
let galleryButtons = [...document.querySelectorAll('[data-gallery-id].gallery-media')];
const galleryImagePreloads = new Map();
const missingGalleryItems = new Set();
let currentGalleryIndex = 0;
let requestedGalleryIndex = 0;
let lastGalleryTrigger;
let lightboxScrollY = 0;
let lightboxImageRequestToken = 0;
let isLightboxOpening = false;
let lightboxBodyInlineStyles = null;
let lightboxBackgroundState = [];
const LIGHTBOX_SWIPE_DISTANCE = 40;
const LIGHTBOX_SWIPE_VELOCITY = 0.45;
const LIGHTBOX_SWIPE_AXIS_RATIO = 1.2;
const LIGHTBOX_SWIPE_AXIS_SLOP = 6;
const LIGHTBOX_SWIPE_FOLLOW_FACTOR = 0.35;
const LIGHTBOX_SWIPE_FOLLOW_LIMIT = 72;
let lightboxGesture = null;
let suppressLightboxClick = false;
let suppressLightboxClickTimer = null;

const carouselIsEnabled = Boolean(
  weddingCarousel
  && carouselSlides.length
  && VALID_INVITE_MODES.includes(inviteMode)
  && gallerySection
  && !gallerySection.hidden
);
if (weddingCarousel) {
  weddingCarousel.dataset.revealed = 'true';
  weddingCarousel.classList.add('is-visible');
}
let carouselLeadingClone;
let carouselTrailingClone;
let carouselActiveIndex = 0;
let isUpdatingCarouselMetrics = false;
let carouselRequestToken = 0;
let carouselMotionTimer = null;
let lightboxCarouselState = null;
let lightboxScrollX = 0;
let isLightboxClosing = false;
let isRestoringScroll = false;
let carouselMetricsPending = false;
let carouselFrozenForLightbox = false;

function galleryAlt(index) {
  if (!galleryImages.length) return t('gallery.region');
  return galleryItemAlt(galleryImages[normalizeGalleryIndex(index)]);
}

function syncGalleryLanguage() {
  if (!weddingCarousel) return;
  weddingCarousel.setAttribute('aria-label', t('gallery.region'));
  weddingCarousel.setAttribute('aria-roledescription', t('gallery.carouselRole'));
  carouselSlides.forEach((slide, index) => {
    slide.setAttribute('aria-roledescription', t('gallery.slideRole'));
    slide.setAttribute('aria-label', t('gallery.slideLabel', { current: index + 1, total: carouselSlides.length }));
    const button = slide.querySelector('.gallery-media');
    button?.setAttribute('aria-label', t('gallery.openPhoto', { current: index + 1 }));
    const image = slide.querySelector('img');
    if (image) image.alt = galleryAlt(index);
  });
  updateGalleryProgress();
  carouselPrevious?.setAttribute('aria-label', t('gallery.previous'));
  carouselNext?.setAttribute('aria-label', t('gallery.next'));
  lightbox?.setAttribute('aria-label', t('gallery.lightbox'));
  lightboxClose?.setAttribute('aria-label', t('gallery.close'));
  lightboxPrev?.setAttribute('aria-label', t('gallery.previousPhoto'));
  lightboxNext?.setAttribute('aria-label', t('gallery.nextPhoto'));
  if (!lightbox.hidden && lightboxImage.hasAttribute('src')) {
    lightboxImage.alt = galleryAlt(currentGalleryIndex);
    lightboxCounter.textContent = t('gallery.counter', {
      current: currentGalleryIndex + 1,
      total: galleryImages.length
    });
  }
}

function carouselIndex(index) {
  if (!carouselSlides.length) return 0;
  return (index + carouselSlides.length) % carouselSlides.length;
}

function getCarouselLayoutMetrics() {
  if (!weddingCarousel || !carouselViewport || !carouselTrack) return null;
  const activeSlide = carouselSlides[carouselActiveIndex];
  return {
    activeIndex: carouselActiveIndex,
    scrollY: window.scrollY,
    sectionHeight: weddingCarousel.closest('#wedding-gallery')?.getBoundingClientRect().height ?? 0,
    viewportHeight: carouselViewport.getBoundingClientRect().height,
    trackHeight: carouselTrack.getBoundingClientRect().height,
    slideHeight: activeSlide?.getBoundingClientRect().height ?? 0,
    documentHeight: document.documentElement.scrollHeight
  };
}

function debugCarouselMetrics(label) {
  if (!isLocalDevelopmentHost()) return;
  const metrics = getCarouselLayoutMetrics();
  if (metrics) console.table({ event: label, ...metrics });
}

function createCarouselClone(slide) {
  const clone = slide.cloneNode(true);
  clone.className = 'wedding-carousel__clone';
  delete clone.dataset.galleryId;
  if (slide.classList.contains('is-portrait')) clone.classList.add('is-portrait');
  else clone.classList.add('is-landscape');
  clone.removeAttribute('role');
  clone.removeAttribute('aria-roledescription');
  clone.removeAttribute('aria-label');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  const button = clone.querySelector('.gallery-media');
  button.removeAttribute('data-gallery-id');
  button.removeAttribute('aria-label');
  button.tabIndex = -1;
  const image = button.querySelector('img');
  image.loading = 'lazy';
  image.removeAttribute('fetchpriority');
  if (!image.getAttribute('src') && image.dataset.src) {
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
  return clone;
}

function rebuildCarouselClones() {
  carouselLeadingClone?.remove();
  carouselTrailingClone?.remove();
  carouselLeadingClone = null;
  carouselTrailingClone = null;
  if (!carouselIsEnabled || !carouselSlides.length) return;

  carouselLeadingClone = createCarouselClone(carouselSlides[carouselSlides.length - 1]);
  carouselTrailingClone = createCarouselClone(carouselSlides[0]);
  carouselLeadingClone.classList.add('is-before-active', 'is-adjacent');
  carouselTrailingClone.classList.add('is-after-active', 'is-adjacent');
  carouselTrack.prepend(carouselLeadingClone);
  carouselTrack.append(carouselTrailingClone);
  registerCarouselImage(carouselLeadingClone.querySelector('img'));
  registerCarouselImage(carouselTrailingClone.querySelector('img'));
}

function updateGalleryProgress() {
  if (!galleryProgress) return;
  const total = carouselSlides.length;
  const current = total ? carouselActiveIndex + 1 : 0;
  galleryProgress.hidden = !total;
  galleryProgress.querySelector('.gallery-progress__count').textContent = `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  galleryProgress.querySelector('.gallery-progress__bar').style.transform = `scaleX(${total ? current / total : 0})`;
  const status = galleryProgress.querySelector('.gallery-progress__status');
  const label = t('gallery.slideLabel', { current, total });
  if (status.textContent !== label) status.textContent = label;
}

carouselSlides.forEach((slide) => {
  setCarouselImageOrientation(slide.querySelector('img'), false);
  slide.dataset.revealed = 'true';
  slide.classList.add('is-revealed');
});

rebuildCarouselClones();

function ensureCarouselThumbnail(index, priority = false) {
  if (!carouselSlides.length) return null;
  const image = carouselSlides[carouselIndex(index)]?.querySelector('img');
  if (image && priority) image.loading = 'eager';
  if (image && !image.getAttribute('src') && image.dataset.src) {
    image.src = image.dataset.src;
    delete image.dataset.src;
  }
  return image;
}

function primeCarouselImages(index) {
  if (!carouselSlides.length) return;
  [index - 1, index, index + 1, index + 2].forEach((candidate) => {
    const image = ensureCarouselThumbnail(candidate);
    if (!image) return;
    if (image.dataset.decoded === 'true'
      || image.dataset.decoding === 'true'
      || typeof image.decode !== 'function') return;
    image.dataset.decoding = 'true';
    image.decode().then(() => {
      image.dataset.decoded = 'true';
    }).catch(() => {
      // The load event remains the fallback for browsers with partial decode support.
    }).finally(() => {
      delete image.dataset.decoding;
    });
  });
}

function setCarouselActiveState(index) {
  const normalizedIndex = carouselIndex(index);
  const nextSlide = carouselSlides[normalizedIndex];
  if (carouselActiveIndex === normalizedIndex
    && nextSlide?.classList.contains('is-active')) {
    updateGalleryProgress();
    primeCarouselImages(normalizedIndex);
    return;
  }
  carouselActiveIndex = normalizedIndex;
  const previousIndex = carouselIndex(carouselActiveIndex - 1);
  const nextIndex = carouselIndex(carouselActiveIndex + 1);
  carouselSlides.forEach((slide, slideIndex) => {
    const active = slideIndex === carouselActiveIndex;
    slide.classList.toggle('is-active', active);
    slide.classList.toggle('is-adjacent', !active && (slideIndex === previousIndex || slideIndex === nextIndex));
    slide.classList.toggle('is-before-active', slideIndex < carouselActiveIndex);
    slide.classList.toggle('is-after-active', slideIndex > carouselActiveIndex);
    slide.setAttribute('aria-hidden', String(!active));
    slide.querySelector('.gallery-media').tabIndex = active ? 0 : -1;
  });
  updateGalleryProgress();
  primeCarouselImages(carouselActiveIndex);
}

function setCarouselTrackMoving(moving) {
  window.clearTimeout(carouselMotionTimer);
  carouselMotionTimer = null;
  carouselTrack.classList.toggle('is-moving', moving);
  if (moving) {
    carouselMotionTimer = window.setTimeout(() => {
      carouselTrack.classList.remove('is-moving');
      carouselMotionTimer = null;
    }, 800);
  }
}

function positionCarousel(index, smooth = true) {
  const slide = carouselSlides[index];
  if (!slide) return;
  carouselViewport.scrollLeft = 0;
  const offset = (carouselViewport.clientWidth / 2)
    - (carouselTrack.offsetLeft + slide.offsetLeft + (slide.offsetWidth / 2));
  const immediate = !smooth || reducedMotionQuery.matches;
  setCarouselTrackMoving(!immediate);
  if (immediate) carouselTrack.style.transition = 'none';
  carouselTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
  if (immediate) {
    void carouselTrack.offsetWidth;
    window.requestAnimationFrame(() => { carouselTrack.style.transition = ''; });
  }
}

function goToSlide(index, { animate = true } = {}) {
  if (carouselFrozenForLightbox || !carouselSlides.length) return;
  const targetIndex = carouselIndex(index);
  const wrapped = index < 0 || index >= carouselSlides.length;
  const image = ensureCarouselThumbnail(targetIndex, true);
  const requestToken = ++carouselRequestToken;
  const activate = () => {
    if (requestToken !== carouselRequestToken || carouselFrozenForLightbox) return;
    debugCarouselMetrics('slide change before');
    setCarouselActiveState(targetIndex);
    positionCarousel(carouselActiveIndex, animate && !wrapped);
    debugCarouselMetrics('slide change after');
  };

  if (!image || image.complete) {
    activate();
    return;
  }

  image.addEventListener('load', activate, { once: true });
  image.addEventListener('error', activate, { once: true });
}

function updateCarouselMetrics() {
  debugCarouselLifecycle('carousel refresh called', {
    activeIndex: carouselActiveIndex,
    isLightboxClosing,
    isRestoringScroll
  });
  if (carouselFrozenForLightbox || isLightboxClosing || isRestoringScroll || !lightbox.hidden) {
    carouselMetricsPending = true;
    return;
  }
  if (isUpdatingCarouselMetrics) return;
  isUpdatingCarouselMetrics = true;
  window.requestAnimationFrame(() => {
    if (carouselFrozenForLightbox || isLightboxClosing || isRestoringScroll || !lightbox.hidden) {
      carouselMetricsPending = true;
      isUpdatingCarouselMetrics = false;
      return;
    }
    positionCarousel(carouselActiveIndex, false);
    isUpdatingCarouselMetrics = false;
    debugCarouselMetrics('metrics updated');
  });
}

function setCarouselImageOrientation(image, updateMetrics = true) {
  if (!image) return false;
  const imageWidth = image.naturalWidth || Number(image.getAttribute('width'));
  const imageHeight = image.naturalHeight || Number(image.getAttribute('height'));
  if (!imageWidth || !imageHeight) return false;
  const slide = image.closest('.wedding-carousel__slide, .wedding-carousel__clone');
  if (!slide) return false;
  const portrait = imageWidth <= imageHeight;
  const orientation = portrait ? 'portrait' : 'landscape';
  const orientationChanged = portrait
    ? !slide.classList.contains('is-portrait')
    : !slide.classList.contains('is-landscape');
  slide.classList.toggle('is-portrait', portrait);
  slide.classList.toggle('is-landscape', !portrait);
  slide.dataset.orientation = orientation;
  if (orientationChanged && updateMetrics) updateCarouselMetrics();
  return orientationChanged;
}

function galleryIndexFromId(id) {
  return galleryImages.findIndex((item) => item.id === id);
}

function removeMissingGalleryItem(item, missingPath) {
  if (!item || missingGalleryItems.has(item.id)) return;
  missingGalleryItems.add(item.id);
  reportMissingGalleryImage(missingPath);

  const removedIndex = galleryIndexFromId(item.id);
  if (removedIndex < 0) return;
  const activeId = galleryImages[carouselActiveIndex]?.id;
  const currentId = galleryImages[currentGalleryIndex]?.id;
  const requestedId = galleryImages[requestedGalleryIndex]?.id;
  carouselSlides[removedIndex]?.remove();
  galleryImages.splice(removedIndex, 1);
  carouselSlides = [...carouselTrack.querySelectorAll('.wedding-carousel__slide')];
  galleryButtons = carouselSlides.map((slide) => slide.querySelector('.gallery-media')).filter(Boolean);
  galleryImagePreloads.clear();

  if (!galleryImages.length) {
    updateGalleryProgress();
    rebuildCarouselClones();
    weddingCarousel?.setAttribute('aria-disabled', 'true');
    return;
  }

  const preservedIndex = (id, fallback) => {
    const index = galleryIndexFromId(id);
    return index >= 0 ? index : Math.min(fallback, galleryImages.length - 1);
  };
  carouselActiveIndex = preservedIndex(activeId, removedIndex);
  currentGalleryIndex = preservedIndex(currentId, removedIndex);
  requestedGalleryIndex = preservedIndex(requestedId, removedIndex);
  if (!lastGalleryTrigger?.isConnected) {
    lastGalleryTrigger = carouselSlides[carouselActiveIndex]?.querySelector('.gallery-media') || null;
  }
  rebuildCarouselClones();
  updateGalleryProgress();
  setCarouselActiveState(carouselActiveIndex);
  syncGalleryLanguage();
  updateCarouselMetrics();
}

function registerCarouselImage(image) {
  if (!image || image.dataset.galleryObserved === 'true') return;
  image.dataset.galleryObserved = 'true';
  const markLoaded = () => {
    setCarouselImageOrientation(image);
    image.dataset.loaded = 'true';
    image.closest('.gallery-media').classList.add('loaded');
    debugCarouselMetrics('image load');
    requestScrollUpdate();
  };
  const reportError = () => {
    const slide = image.closest('.wedding-carousel__slide');
    const item = slide ? galleryImages.find((candidate) => candidate.id === slide.dataset.galleryId) : null;
    if (item) removeMissingGalleryItem(item, image.currentSrc || image.src || image.dataset.src || item.thumb);
  };
  if (image.complete && image.naturalWidth) markLoaded();
  else {
    image.addEventListener('load', markLoaded, { once: true });
    image.addEventListener('error', reportError, { once: true });
  }
}

[...carouselTrack.querySelectorAll('img')].forEach(registerCarouselImage);

if (carouselIsEnabled) {
  updateGalleryProgress();

  carouselPrevious.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    goToSlide(carouselActiveIndex - 1);
  });
  carouselNext.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    goToSlide(carouselActiveIndex + 1);
  });

  weddingCarousel.addEventListener('keydown', (event) => {
    if (!lightbox.hidden || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    goToSlide(carouselActiveIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  carouselTrack.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-id]');
    if (!button) return;
    const index = carouselSlides.indexOf(button.closest('.wedding-carousel__slide'));
    if (index < 0 || index === carouselActiveIndex) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goToSlide(index);
  }, true);
  carouselTrack.addEventListener('transitionend', (event) => {
    if (event.target === carouselTrack && event.propertyName === 'transform') setCarouselTrackMoving(false);
  });

  reducedMotionQuery.addEventListener?.('change', () => {
    updateCarouselMetrics();
  });
  carouselMobileQuery.addEventListener?.('change', updateCarouselMetrics);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      debugCarouselMetrics('ResizeObserver callback');
      updateCarouselMetrics();
    }).observe(carouselViewport);
  }
  document.fonts?.ready.then(updateCarouselMetrics);
  setCarouselActiveState(0);
  syncGalleryLanguage();
  window.requestAnimationFrame(() => positionCarousel(0, false));
}

function initializeViewportAnimations() {
  const animationTargets = [hero, ...document.querySelectorAll('.image-shell, .gallery-media')]
    .filter((element) => element && !element.closest('[hidden]') && element.getClientRects().length > 0);

  heroInView = animationTargets.includes(hero);
  if (!('IntersectionObserver' in window)) {
    const syncFallbackAnimationState = () => {
      animationTargets.forEach((element) => element.classList.toggle('is-animation-visible', !document.hidden));
      heroInView = animationTargets.includes(hero) && !document.hidden;
      requestScrollUpdate();
    };
    syncFallbackAnimationState();
    document.addEventListener('visibilitychange', syncFallbackAnimationState);
    return;
  }

  const targetVisibility = new Map(animationTargets.map((element) => [element, false]));
  const syncViewportAnimationState = () => {
    targetVisibility.forEach((isIntersecting, element) => {
      const animationIsVisible = isIntersecting && !document.hidden;
      element.classList.toggle('is-animation-visible', animationIsVisible);
      if (element === hero) heroInView = animationIsVisible;
    });
    requestScrollUpdate();
  };

  const viewportAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      targetVisibility.set(entry.target, entry.isIntersecting);
    });
    syncViewportAnimationState();
  }, { threshold: 0, rootMargin: '120px 0px' });

  animationTargets.forEach((element) => viewportAnimationObserver.observe(element));
  document.addEventListener('visibilitychange', syncViewportAnimationState);
}

initializeViewportAnimations();

function normalizeGalleryIndex(index) {
  if (!galleryImages.length) return 0;
  return (index + galleryImages.length) % galleryImages.length;
}

function preloadGalleryImage(index) {
  if (!galleryImages.length) return Promise.reject(new Error('Gallery is empty'));
  const normalizedIndex = normalizeGalleryIndex(index);
  const imageData = galleryImages[normalizedIndex];
  const preloadKey = imageData.id;
  if (galleryImagePreloads.has(preloadKey)) return galleryImagePreloads.get(preloadKey);
  const preloadPromise = new Promise((resolve, reject) => {
    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.onload = async () => {
      try {
        await preloader.decode?.();
      } catch {
        // The load event already confirms a usable decoded resource on older Safari versions.
      }
      resolve(normalizedIndex);
    };
    preloader.onerror = () => {
      removeMissingGalleryItem(imageData, imageData.large);
      reject(new Error(`Missing gallery image: ${imageData.large}`));
    };
    preloader.src = imageData.large;
  }).catch((error) => {
    galleryImagePreloads.delete(preloadKey);
    throw error;
  });

  galleryImagePreloads.set(preloadKey, preloadPromise);
  return preloadPromise;
}

function gallerySequenceIndex(index, step) {
  return normalizeGalleryIndex(normalizeGalleryIndex(index) + step);
}

function preloadAdjacentGalleryImages(index) {
  [-1, 1].forEach((step) => {
    preloadGalleryImage(gallerySequenceIndex(index, step)).catch(() => {
      // Keep the current decoded image visible if an adjacent resource cannot be preloaded.
    });
  });
}

function showGalleryImage(index) {
  currentGalleryIndex = normalizeGalleryIndex(index);
  requestedGalleryIndex = currentGalleryIndex;
  const image = galleryImages[currentGalleryIndex];
  lightboxImage.width = image.largeWidth;
  lightboxImage.height = image.largeHeight;
  lightboxImage.style.transform = '';
  lightboxImage.src = image.large;
  lightboxImage.alt = galleryAlt(currentGalleryIndex);
  lightboxCounter.textContent = t('gallery.counter', {
    current: currentGalleryIndex + 1,
    total: galleryImages.length
  });
  preloadAdjacentGalleryImages(currentGalleryIndex);
}

async function requestLightboxImage(index) {
  const normalizedIndex = normalizeGalleryIndex(index);
  const requestToken = ++lightboxImageRequestToken;
  requestedGalleryIndex = normalizedIndex;
  try {
    await preloadGalleryImage(normalizedIndex);
  } catch {
    return false;
  }
  if (requestToken !== lightboxImageRequestToken || lightbox.hidden) return false;
  showGalleryImage(normalizedIndex);
  return true;
}

function showAdjacentGalleryImage(step) {
  requestLightboxImage(gallerySequenceIndex(requestedGalleryIndex, step));
}

function lightboxGesturePoint(clientX, clientY) {
  return { clientX, clientY };
}

function beginLightboxGesture(point, source, pointerId = null) {
  if (lightbox.hidden || isLightboxClosing || isLightboxOpening) return;
  window.clearTimeout(suppressLightboxClickTimer);
  suppressLightboxClick = false;
  lightboxGesture = {
    source,
    pointerId,
    startX: point.clientX,
    startY: point.clientY,
    currentX: point.clientX,
    currentY: point.clientY,
    startTime: Date.now(),
    axis: null
  };
  lightboxImage.style.transform = '';
}

function updateLightboxGesture(point, event) {
  if (!lightboxGesture) return;
  lightboxGesture.currentX = point.clientX;
  lightboxGesture.currentY = point.clientY;
  const distanceX = lightboxGesture.currentX - lightboxGesture.startX;
  const distanceY = lightboxGesture.currentY - lightboxGesture.startY;
  const absoluteX = Math.abs(distanceX);
  const absoluteY = Math.abs(distanceY);

  if (!lightboxGesture.axis && Math.max(absoluteX, absoluteY) >= LIGHTBOX_SWIPE_AXIS_SLOP) {
    if (absoluteX > absoluteY * LIGHTBOX_SWIPE_AXIS_RATIO) lightboxGesture.axis = 'horizontal';
    else if (absoluteY > absoluteX * LIGHTBOX_SWIPE_AXIS_RATIO) lightboxGesture.axis = 'vertical';
  }

  if (lightboxGesture.axis !== 'horizontal') return;
  if (event.cancelable) event.preventDefault();
  const followDistance = Math.max(
    -LIGHTBOX_SWIPE_FOLLOW_LIMIT,
    Math.min(LIGHTBOX_SWIPE_FOLLOW_LIMIT, distanceX * LIGHTBOX_SWIPE_FOLLOW_FACTOR)
  );
  lightboxImage.style.transform = `translate3d(${followDistance}px, 0, 0)`;
  suppressLightboxClick = true;
}

function finishLightboxGesture(point, cancelled = false) {
  if (!lightboxGesture) return;
  const gesture = lightboxGesture;
  lightboxGesture = null;
  const currentPoint = point ?? lightboxGesturePoint(gesture.currentX, gesture.currentY);
  const distanceX = currentPoint.clientX - gesture.startX;
  const distanceY = currentPoint.clientY - gesture.startY;
  const elapsed = Date.now() - gesture.startTime;
  const velocityX = Math.abs(distanceX) / Math.max(elapsed, 1);
  const isHorizontal = gesture.axis === 'horizontal'
    || Math.abs(distanceX) > Math.abs(distanceY) * LIGHTBOX_SWIPE_AXIS_RATIO;
  const shouldChange = Math.abs(distanceX) >= LIGHTBOX_SWIPE_DISTANCE
    || velocityX > LIGHTBOX_SWIPE_VELOCITY;

  lightboxImage.style.transform = '';
  if (isHorizontal) {
    suppressLightboxClick = true;
    window.clearTimeout(suppressLightboxClickTimer);
    suppressLightboxClickTimer = window.setTimeout(() => {
      suppressLightboxClick = false;
    }, 400);
  }
  if (!cancelled && isHorizontal && shouldChange) {
    showAdjacentGalleryImage(distanceX < 0 ? 1 : -1);
  }
}

function cancelLightboxGesture() {
  finishLightboxGesture(null, true);
}

async function openLightbox(index, trigger) {
  if (!lightbox.hidden || isLightboxOpening) return;
  const normalizedIndex = normalizeGalleryIndex(index);
  const requestToken = ++lightboxImageRequestToken;
  isLightboxOpening = true;
  carouselFrozenForLightbox = true;
  carouselRequestToken += 1;
  lastGalleryTrigger = trigger;
  isLightboxClosing = false;
  isRestoringScroll = false;
  lightboxCarouselState = carouselIsEnabled ? {
    activeIndex: carouselActiveIndex,
    mobileLayout: carouselMobileQuery.matches,
    trackTransform: carouselTrack.style.transform,
    scrollLeft: carouselViewport.scrollLeft
  } : null;

  try {
    await preloadGalleryImage(normalizedIndex);
  } catch {
    lightboxCarouselState = null;
    isLightboxOpening = false;
    carouselFrozenForLightbox = false;
    if (carouselMetricsPending) {
      carouselMetricsPending = false;
      updateCarouselMetrics();
    }
    return;
  }
  if (requestToken !== lightboxImageRequestToken) {
    lightboxCarouselState = null;
    isLightboxOpening = false;
    carouselFrozenForLightbox = false;
    return;
  }

  showGalleryImage(normalizedIndex);
  lightboxScrollY = window.scrollY;
  lightboxScrollX = window.scrollX;
  debugCarouselLifecycle('lightbox open', {
    savedScrollX: lightboxScrollX,
    savedScrollY: lightboxScrollY,
    activeIndex: carouselActiveIndex
  });
  debugCarouselMetrics('lightbox open');
  const bodyStyle = document.body.style;
  lightboxBodyInlineStyles = {
    position: bodyStyle.position,
    top: bodyStyle.top,
    left: bodyStyle.left,
    width: bodyStyle.width,
    overflow: bodyStyle.overflow,
    paddingRight: bodyStyle.paddingRight
  };
  const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  if (scrollbarWidth) {
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    bodyStyle.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
  }
  document.documentElement.classList.add('lightbox-open');
  document.body.classList.add('lightbox-open');
  bodyStyle.position = 'fixed';
  bodyStyle.top = `-${lightboxScrollY}px`;
  bodyStyle.left = `-${lightboxScrollX}px`;
  bodyStyle.width = '100%';
  bodyStyle.overflow = 'hidden';
  lightboxBackgroundState = [...document.body.children]
    .filter((element) => element !== lightbox && !element.matches('script'))
    .map((element) => ({ element, inert: element.inert }));
  lightboxBackgroundState.forEach(({ element }) => { element.inert = true; });
  lightbox.hidden = false;
  isLightboxOpening = false;
  lightboxClose.focus();
}

function restorePagePositionAfterLightbox() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  if (lightboxCarouselState) {
    setCarouselActiveState(lightboxCarouselState.activeIndex);
    if (lightboxCarouselState.mobileLayout === carouselMobileQuery.matches) {
      if (carouselMobileQuery.matches) carouselViewport.scrollLeft = lightboxCarouselState.scrollLeft;
      else carouselTrack.style.transform = lightboxCarouselState.trackTransform;
    }
    positionCarousel(lightboxCarouselState.activeIndex, false);
  }
  root.getBoundingClientRect();
  window.scrollTo({ top: lightboxScrollY, left: lightboxScrollX, behavior: 'auto' });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (lastGalleryTrigger) {
        try {
          lastGalleryTrigger.focus({ preventScroll: true });
        } catch {
          lastGalleryTrigger.focus();
        }
      }

      debugCarouselLifecycle('lightbox close restored', {
        activeIndex: carouselActiveIndex,
        expectedActiveIndex: lightboxCarouselState?.activeIndex,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        focusTarget: document.activeElement?.dataset?.galleryId ?? null
      });

      root.style.scrollBehavior = previousScrollBehavior;
      isRestoringScroll = false;
      isLightboxClosing = false;
      carouselFrozenForLightbox = false;
      debugCarouselMetrics('lightbox close restored');
      lightboxCarouselState = null;
      if (carouselMetricsPending) {
        carouselMetricsPending = false;
        updateCarouselMetrics();
      }
    });
  });
}

function finishClosingLightbox() {
  cancelLightboxGesture();
  lightboxImage.style.transform = '';
  lightbox.hidden = true;
  lightboxBackgroundState.forEach(({ element, inert }) => { element.inert = inert; });
  lightboxBackgroundState = [];
  lightboxImage.removeAttribute('src');
  const lockedBodyTop = document.body.style.top;
  const lockedBodyLeft = document.body.style.left;
  document.documentElement.classList.remove('lightbox-open');
  document.body.classList.remove('lightbox-open');
  const bodyStyle = document.body.style;
  bodyStyle.position = lightboxBodyInlineStyles?.position ?? '';
  bodyStyle.top = lightboxBodyInlineStyles?.top ?? '';
  bodyStyle.left = lightboxBodyInlineStyles?.left ?? '';
  bodyStyle.width = lightboxBodyInlineStyles?.width ?? '';
  bodyStyle.overflow = lightboxBodyInlineStyles?.overflow ?? '';
  bodyStyle.paddingRight = lightboxBodyInlineStyles?.paddingRight ?? '';
  lightboxBodyInlineStyles = null;
  debugCarouselLifecycle('lightbox scroll lock cleared', {
    bodyTop: lockedBodyTop,
    bodyLeft: lockedBodyLeft
  });
  restorePagePositionAfterLightbox();
}

function closeLightbox() {
  if (lightbox.hidden || isLightboxClosing) return;
  isLightboxClosing = true;
  isRestoringScroll = true;
  lightboxImageRequestToken += 1;
  debugCarouselLifecycle('lightbox close start', {
    savedScrollY: lightboxScrollY,
    bodyTop: document.body.style.top,
    activeIndex: carouselActiveIndex
  });
  finishClosingLightbox();
}

galleryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const galleryIndex = galleryIndexFromId(button.dataset.galleryId);
    if (galleryIndex >= 0) openLightbox(galleryIndex, button);
  });
});

lightboxPrev.addEventListener('click', () => showAdjacentGalleryImage(-1));
lightboxNext.addEventListener('click', () => showAdjacentGalleryImage(1));
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (suppressLightboxClick) {
    event.preventDefault();
    suppressLightboxClick = false;
    window.clearTimeout(suppressLightboxClickTimer);
    return;
  }
  if (event.target === lightbox || event.target.classList.contains('lightbox-stage')) closeLightbox();
});
lightboxImage.addEventListener('dragstart', (event) => event.preventDefault());

if ('PointerEvent' in window) {
  lightboxStage.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) return;
    beginLightboxGesture(lightboxGesturePoint(event.clientX, event.clientY), 'pointer', event.pointerId);
  }, { passive: true });

  lightboxStage.addEventListener('pointermove', (event) => {
    if (!lightboxGesture
      || lightboxGesture.source !== 'pointer'
      || lightboxGesture.pointerId !== event.pointerId) return;
    updateLightboxGesture(lightboxGesturePoint(event.clientX, event.clientY), event);
    if (lightboxGesture?.axis === 'horizontal' && !lightboxStage.hasPointerCapture(event.pointerId)) {
      try {
        lightboxStage.setPointerCapture(event.pointerId);
      } catch {
        // Some older mobile browsers do not allow capture after gesture recognition.
      }
    }
  }, { passive: false });

  lightboxStage.addEventListener('pointerup', (event) => {
    if (!lightboxGesture
      || lightboxGesture.source !== 'pointer'
      || lightboxGesture.pointerId !== event.pointerId) return;
    finishLightboxGesture(lightboxGesturePoint(event.clientX, event.clientY));
  }, { passive: true });

  lightboxStage.addEventListener('pointercancel', (event) => {
    if (!lightboxGesture
      || lightboxGesture.source !== 'pointer'
      || lightboxGesture.pointerId !== event.pointerId) return;
    cancelLightboxGesture();
  }, { passive: true });
} else {
  const findGestureTouch = (touchList) => Array.from(touchList).find(
    (touch) => touch.identifier === lightboxGesture?.pointerId
  );

  lightboxStage.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) {
      cancelLightboxGesture();
      return;
    }
    const touch = event.touches[0];
    beginLightboxGesture(lightboxGesturePoint(touch.clientX, touch.clientY), 'touch', touch.identifier);
  }, { passive: true });

  lightboxStage.addEventListener('touchmove', (event) => {
    if (!lightboxGesture || lightboxGesture.source !== 'touch') return;
    const touch = findGestureTouch(event.touches);
    if (!touch) return;
    updateLightboxGesture(lightboxGesturePoint(touch.clientX, touch.clientY), event);
  }, { passive: false });

  lightboxStage.addEventListener('touchend', (event) => {
    if (!lightboxGesture || lightboxGesture.source !== 'touch') return;
    const touch = findGestureTouch(event.changedTouches);
    if (!touch) return;
    finishLightboxGesture(lightboxGesturePoint(touch.clientX, touch.clientY));
  }, { passive: true });

  lightboxStage.addEventListener('touchcancel', cancelLightboxGesture, { passive: true });
}

document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeLightbox();
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showAdjacentGalleryImage(-1);
    return;
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    showAdjacentGalleryImage(1);
    return;
  }
  if (event.key !== 'Tab') return;

  const focusableControls = [lightboxClose, lightboxPrev, lightboxNext];
  const firstControl = focusableControls[0];
  const lastControl = focusableControls[focusableControls.length - 1];
  if (event.shiftKey && document.activeElement === firstControl) {
    event.preventDefault();
    lastControl.focus();
  } else if (!event.shiftKey && document.activeElement === lastControl) {
    event.preventDefault();
    firstControl.focus();
  } else if (!lightbox.contains(document.activeElement)) {
    event.preventDefault();
    firstControl.focus();
  }
});

function syncDynamicLanguage() {
  renderInviteModeLanguage();
  if (inviteMode === 'wedding' || inviteMode === 'online') {
    document.querySelector('#share-title').textContent = t('share.title');
    document.querySelector('.share-intro').innerHTML = t('share.intro');
  }
  renderQuickNavigationLanguage();
  renderInfoAccordionsLanguage();
  updateWeddingCountdown();
  document.querySelectorAll('[data-rsvp-deadline]').forEach((element) => {
    element.textContent = t('seating.deadline');
  });
  document.querySelectorAll('[data-seat-lookup-open-date]').forEach((element) => {
    element.textContent = t('seating.date');
  });
  if (VALID_INVITE_MODES.includes(inviteMode)) {
    rsvpFormTitle.textContent = t(RSVP_MODE_CONFIG[inviteMode].titleKey);
  }
  setRsvpExpanded(rsvpToggle.getAttribute('aria-expanded') === 'true');
  setRsvpSubmitting(rsvpSubmitting);
  document.querySelectorAll('[data-error-key]').forEach((element) => {
    if (element.dataset.errorKey) element.textContent = t(element.dataset.errorKey);
  });
  if (rsvpSubmitError.dataset.backendMessage) {
    const message = rsvpSubmitError.dataset.backendMessage;
    const translatedMessage = i18n.translatePhrase(message);
    rsvpSubmitError.textContent = i18n.getLanguage() === 'en' && translatedMessage === message
      ? t(inviteMode === 'online' ? 'online.submitFailed' : 'rsvp.submitFailed')
      : translatedMessage;
  }
  if (!rsvpSuccess.hidden) renderRsvpSuccess();
  renderOnlineDetails();
  renderOnlineMessageLanguage();
  setMenu(menuButton.getAttribute('aria-expanded') === 'true');
  setLookupLoading(lookupButton.classList.contains('loading'));
  if (lookupState?.type === 'success') showSeatResult(lookupState.name, lookupState.seat, false);
  else if (lookupState?.type === 'not-found') showNotFound(false);
  syncGalleryLanguage();
  initializeQuickNavScrollSpy();
  requestScrollUpdate();
}

window.addEventListener('wedding:languagechange', syncDynamicLanguage);
syncDynamicLanguage();

if (!reducedMotionQuery.matches) {
  document.documentElement.classList.add('motion-enabled');
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
  });
} else {
  document.documentElement.classList.add('is-ready');
}

document.querySelectorAll('.landing-image, .landing-brand, .landing-title, .landing-kicker, .landing-date, .landing-line, .landing-message, .landing-help-button').forEach((element) => {
  element.addEventListener('animationend', () => element.classList.add('initial-motion-complete'), { once: true });
});

heroImage.addEventListener('animationend', () => heroImage.classList.add('motion-complete'), { once: true });
reducedMotionQuery.addEventListener?.('change', (event) => {
  document.documentElement.classList.toggle('motion-enabled', !event.matches);
  document.documentElement.classList.add('is-ready');
  if (event.matches) heroImage.classList.add('motion-complete');
});

if (initialNavigation.hash && initialNavigation.type !== 'back_forward') {
  const restoreInitialAnchor = () => scrollToSection(navigationTargetFromHash(initialNavigation.hash), { updateHistory: false });
  (document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(restoreInitialAnchor));
}
