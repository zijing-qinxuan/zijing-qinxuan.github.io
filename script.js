const ONLINE_MEETING_URL = "";
const RSVP_DEADLINE_TEXT = "2026 年 11 月 1 日";
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
    heroKeys: ["hero.weddingSchedule"],
    sections: ["hero", "invitation-note", "rsvp", "ceremony-info", "gallery"],
    navigation: ["rsvp", "ceremony-info", "gallery"],
    hiddenSections: ["gift-note", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "share", "faq"],
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
  const weddingCeremony = new Date('2026-12-26T14:00:00+08:00');
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

if (ONLINE_MEETING_URL.trim()) {
  onlineMeetingButton.textContent = t('online.enter');
  onlineMeetingButton.href = ONLINE_MEETING_URL.trim();
  onlineMeetingButton.target = '_blank';
  onlineMeetingButton.rel = 'noopener noreferrer';
  onlineMeetingButton.removeAttribute('aria-disabled');
  onlineMeetingButton.classList.remove('is-unavailable');
} else {
  onlineMeetingButton.removeAttribute('href');
  onlineMeetingButton.setAttribute('aria-disabled', 'true');
  onlineMeetingButton.classList.add('is-unavailable');
  onlineMeetingButton.textContent = t('online.unavailable');
}

const RSVP_STORAGE_KEY = "wedding-rsvp-submitted";
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
    titleKey: "rsvp.modeTitle.online",
    questions: ["online"],
    required: ["online"]
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
  element.dataset.errorKey = key;
  element.textContent = key ? t(key) : fallback;
}

function clearRsvpError(element) {
  delete element.dataset.errorKey;
  element.textContent = '';
}

function setRsvpExpanded(expanded, scrollToPanel = false) {
  rsvpToggle.setAttribute('aria-expanded', String(expanded));
  rsvpToggle.querySelector('span').textContent = expanded ? t('rsvp.collapse') : t('rsvp.expand');
  rsvpPanel.classList.toggle('is-expanded', expanded);
  rsvpPanel.setAttribute('aria-hidden', String(!expanded));

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
  rsvpSubmitLabel.textContent = submitting ? t('rsvp.submitting') : t('rsvp.submit');
  rsvpForm.setAttribute('aria-busy', String(submitting));
}

function scrollToRsvpSuccessCard() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      rsvpSuccess.scrollIntoView({
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
        block: 'center'
      });
      window.setTimeout(() => {
        rsvpSuccessTitle.focus({ preventScroll: true });
      }, reducedMotionQuery.matches ? 0 : 500);
    });
  });
}

function renderRsvpSuccess() {
  if (!rsvpSuccessState) return;
  const { previouslySubmitted, ceremonyAttendance, action } = rsvpSuccessState;
  const wasUpdated = !previouslySubmitted && action === 'updated';
  rsvpSuccessTitle.textContent = previouslySubmitted
    ? t('rsvp.submittedTitle')
    : (wasUpdated ? t('rsvp.updatedTitle') : t('rsvp.createdTitle'));
  const isOnlineCeremony = !previouslySubmitted && ceremonyAttendance === '線上參加';
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
  try {
    return JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY));
  } catch {
    return null;
  }
}

function storeRsvp(name) {
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
  clearRsvpError(document.querySelector('#rsvp-phone-error'));
  clearRsvpError(document.querySelector('#rsvp-vegetarian-error'));
  rsvpName.removeAttribute('aria-invalid');
  rsvpPhone.removeAttribute('aria-invalid');
  rsvpForm.querySelectorAll('[data-rsvp-question]').forEach((question) => {
    question.removeAttribute('aria-invalid');
  });
  rsvpForm.querySelectorAll('[data-rsvp-error]').forEach(clearRsvpError);

  if (!rsvpName.value.trim()) {
    setRsvpError(document.querySelector('#rsvp-name-error'), 'rsvp.nameRequired');
    rsvpName.setAttribute('aria-invalid', 'true');
    firstInvalid = rsvpName;
  }

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
  rsvpPhone.value = rsvpPhone.value.trim().replace(/[\s-]+/g, '');
  document.querySelector('#rsvp-note').value = document.querySelector('#rsvp-note').value.trim();
  document.querySelector('#rsvp-message').value = document.querySelector('#rsvp-message').value.trim();
  ['ceremony', 'banquet', 'online'].forEach(setEmptyRsvpFieldFallback);
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
  setRsvpSubmitting(false);
  pendingRsvpSubmission = null;
  const resultAction = result.action === 'updated' ? 'updated' : 'created';
  storeRsvp(completedSubmission.name);
  rsvpForm.classList.add('is-submitted');
  window.setTimeout(() => {
    showRsvpSuccess(false, completedSubmission.ceremonyAttendance, resultAction);
  }, reducedMotionQuery.matches ? 0 : 350);
}

function pollRsvpSubmissionStatus(submissionId) {
  if (!rsvpSubmitting || pendingRsvpSubmission?.submissionId !== submissionId) return;

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
    handleRsvpStatusResult(result);
  };
  script.onerror = () => cleanupRsvpJsonpRequest(callbackName);

  const cleanupTimer = window.setTimeout(() => cleanupRsvpJsonpRequest(callbackName), 5000);
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

rsvpPhone.addEventListener('input', () => {
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
  if (rsvpSubmitting || !validateRsvpForm()) return;

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

rsvpEdit.addEventListener('click', () => {
  rsvpSuccess.hidden = true;
  rsvpForm.hidden = false;
  rsvpForm.classList.remove('is-submitted');
  setRsvpExpanded(true, true);
  rsvpName.focus({ preventScroll: true });
});

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
    setActiveNavLink(link);
    setMoreMenu(false);
    setMenu(false);
    if (wasMobileMenuOpen) {
      window.requestAnimationFrame(() => menuButton.focus({ preventScroll: true }));
    }
  });
});

navMoreToggle.addEventListener('click', () => {
  setMoreMenu(navMoreToggle.getAttribute('aria-expanded') !== 'true');
});

navMore.addEventListener('mouseenter', () => {
  if (window.innerWidth > 820) setMoreMenu(true);
});

navMore.addEventListener('mouseleave', () => {
  if (window.innerWidth > 820 && !navMore.contains(document.activeElement)) setMoreMenu(false);
});

navMore.addEventListener('focusout', () => {
  window.setTimeout(() => {
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
    requestScrollUpdate();
    resizeTicking = false;
  });
}

window.addEventListener('resize', requestResizeUpdate, { passive: true });

function updateHeader() {
  const heroBottom = hero.offsetTop + hero.offsetHeight - header.offsetHeight;
  header.classList.toggle('scrolled', window.scrollY >= heroBottom);
}

let scrollTicking = false;

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
  backToTopButton.classList.toggle('is-visible', currentScrollY > backToTopThreshold);

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

  const observedItems = navSectionLinks
    .filter((link) => !link.hidden && !link.closest('[hidden]'))
    .map((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      return section && !section.hidden && !section.closest('[hidden]') && section.getClientRects().length > 0
        ? { link, section }
        : null;
    })
    .filter(Boolean);

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
  .filter((item) => !item.hidden && !item.closest('[hidden]') && item.getClientRects().length > 0);
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
  const syncExpandedState = () => summary.setAttribute('aria-expanded', String(details.open));
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

const galleryButtons = [...document.querySelectorAll('[data-gallery-index]')];
const lightbox = document.querySelector('#gallery-lightbox');
const lightboxStage = lightbox.querySelector('.lightbox-stage');
const lightboxImage = lightbox.querySelector('.lightbox-image');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxPrev = lightbox.querySelector('.lightbox-prev');
const lightboxNext = lightbox.querySelector('.lightbox-next');
const galleryImages = [
  { src: 'assets/gallery/01.jpg', width: 1620, height: 1080 },
  { src: 'assets/gallery/02.jpg', width: 1620, height: 1078 },
  { src: 'assets/gallery/03.jpg', width: 1414, height: 1804 },
  { src: 'assets/gallery/04.jpg', width: 1618, height: 1076 },
  { src: 'assets/gallery/05.jpg', width: 1414, height: 1806 },
  { src: 'assets/gallery/06.jpg', width: 1620, height: 1080 },
  { src: 'assets/gallery/07.jpg', width: 1410, height: 1802 },
  { src: 'assets/gallery/08.jpg', width: 1412, height: 1800 },
  { src: 'assets/gallery/09.jpg', width: 1408, height: 1806 },
  { src: 'assets/gallery/10.jpg', width: 1620, height: 1080 },
  { src: 'assets/gallery/11.jpg', width: 1622, height: 1080 }
];
const gallerySequence = galleryButtons.map((button) => Number(button.dataset.galleryIndex));
const galleryImagePreloads = new Map();
let currentGalleryIndex = 0;
let requestedGalleryIndex = 0;
let lastGalleryTrigger;
let lightboxScrollY = 0;
let lightboxImageRequestToken = 0;
let isLightboxOpening = false;
let lightboxBodyInlineStyles = null;
const LIGHTBOX_SWIPE_DISTANCE = 40;
const LIGHTBOX_SWIPE_VELOCITY = 0.45;
const LIGHTBOX_SWIPE_AXIS_RATIO = 1.2;
const LIGHTBOX_SWIPE_AXIS_SLOP = 6;
const LIGHTBOX_SWIPE_FOLLOW_FACTOR = 0.35;
const LIGHTBOX_SWIPE_FOLLOW_LIMIT = 72;
let lightboxGesture = null;
let suppressLightboxClick = false;
let suppressLightboxClickTimer = null;

const weddingCarousel = document.querySelector('.wedding-carousel');
const carouselViewport = weddingCarousel?.querySelector('.wedding-carousel__viewport');
const carouselTrack = weddingCarousel?.querySelector('.wedding-carousel__track');
const carouselSlides = weddingCarousel ? [...weddingCarousel.querySelectorAll('.wedding-carousel__slide')] : [];
const carouselPrevious = weddingCarousel?.querySelector('.wedding-carousel__arrow--previous');
const carouselNext = weddingCarousel?.querySelector('.wedding-carousel__arrow--next');
const carouselDots = weddingCarousel?.querySelector('.wedding-carousel__dots');
const carouselReturn = weddingCarousel?.querySelector('.wedding-carousel__return');
const carouselMobileQuery = window.matchMedia('(max-width: 820px)');
const carouselIsEnabled = Boolean(
  weddingCarousel
  && carouselSlides.length
  && VALID_INVITE_MODES.includes(inviteMode)
  && !weddingCarousel.closest('[hidden]')
);
if (weddingCarousel) {
  weddingCarousel.dataset.revealed = 'true';
  weddingCarousel.classList.add('is-visible');
}
let carouselLeadingClone;
let carouselTrailingClone;
let carouselActiveIndex = 0;
let carouselAutoplayTimer = null;
let carouselUserPaused = false;
let carouselPointerInside = false;
let carouselFocusInside = false;
let carouselInView = false;
let carouselScrollTicking = false;
let isUpdatingCarouselMetrics = false;
let carouselRequestToken = 0;
let carouselMotionTimer = null;
let lightboxCarouselState = null;
let lightboxScrollX = 0;
let isLightboxClosing = false;
let isRestoringScroll = false;
let carouselMetricsPending = false;
let carouselFrozenForLightbox = false;
let carouselGesture = null;
let suppressCarouselClick = false;
let suppressCarouselClickUntil = 0;
let carouselDragFrame = null;
let carouselSnapFrame = null;
let carouselSnapCompletion = null;
let carouselProgrammaticScroll = false;
const CAROUSEL_GESTURE_AXIS_RATIO = 1.2;
const CAROUSEL_GESTURE_SLOP = 8;
const CAROUSEL_SWIPE_VELOCITY = 0.45;
const CAROUSEL_SNAP_DURATION = 440;

function galleryAlt(index) {
  return i18n.value('gallery.imageAlt')?.[normalizeGalleryIndex(index)] || t('gallery.region');
}

function syncGalleryLanguage() {
  if (!weddingCarousel) return;
  weddingCarousel.setAttribute('aria-label', t('gallery.region'));
  weddingCarousel.setAttribute('aria-roledescription', t('gallery.carouselRole'));
  carouselSlides.forEach((slide, index) => {
    const galleryIndex = Number(slide.querySelector('[data-gallery-index]')?.dataset.galleryIndex ?? index);
    slide.setAttribute('aria-roledescription', t('gallery.slideRole'));
    slide.setAttribute('aria-label', t('gallery.slideLabel', { current: index + 1, total: carouselSlides.length }));
    const button = slide.querySelector('.gallery-media');
    button?.setAttribute('aria-label', t('gallery.openPhoto', { current: index + 1 }));
    const image = slide.querySelector('img');
    if (image) image.alt = galleryAlt(galleryIndex);
  });
  [...carouselDots?.children ?? []].forEach((dot, index) => {
    dot.setAttribute('aria-label', t('gallery.viewPhoto', { current: index + 1 }));
  });
  carouselPrevious?.setAttribute('aria-label', t('gallery.previous'));
  carouselNext?.setAttribute('aria-label', t('gallery.next'));
  carouselReturn?.setAttribute('aria-label', t('gallery.returnFirst'));
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
  return (index + carouselSlides.length) % carouselSlides.length;
}

function getCarouselLayoutMetrics() {
  if (!weddingCarousel || !carouselViewport || !carouselTrack) return null;
  const activeSlide = carouselSlides[carouselActiveIndex];
  return {
    activeIndex: carouselActiveIndex,
    scrollY: window.scrollY,
    sectionHeight: weddingCarousel.closest('#gallery')?.getBoundingClientRect().height ?? 0,
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
  if (slide.classList.contains('is-portrait')) clone.classList.add('is-portrait');
  else clone.classList.add('is-landscape');
  clone.removeAttribute('role');
  clone.removeAttribute('aria-roledescription');
  clone.removeAttribute('aria-label');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  const button = clone.querySelector('.gallery-media');
  button.removeAttribute('data-gallery-index');
  button.removeAttribute('aria-label');
  button.tabIndex = -1;
  const image = button.querySelector('img');
  image.loading = 'lazy';
  image.removeAttribute('fetchpriority');
  return clone;
}

carouselSlides.forEach((slide) => {
  setCarouselImageOrientation(slide.querySelector('img'), false);
  slide.dataset.revealed = 'true';
  slide.classList.add('is-revealed');
});

if (carouselIsEnabled) {
  carouselLeadingClone = createCarouselClone(carouselSlides[carouselSlides.length - 1]);
  carouselTrailingClone = createCarouselClone(carouselSlides[0]);
  carouselLeadingClone.classList.add('is-before-active', 'is-adjacent');
  carouselTrailingClone.classList.add('is-after-active', 'is-adjacent');
  carouselTrack.prepend(carouselLeadingClone);
  carouselTrack.append(carouselTrailingClone);
}

function primeCarouselImages(index) {
  if (!carouselSlides.length) return;
  [index - 1, index, index + 1].forEach((candidate) => {
    const image = carouselSlides[carouselIndex(candidate)].querySelector('img');
    if (image) image.loading = 'eager';
  });
}

function setCarouselActiveState(index) {
  carouselActiveIndex = carouselIndex(index);
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
  [...carouselDots.children].forEach((dot, dotIndex) => {
    const active = dotIndex === carouselActiveIndex;
    dot.classList.toggle('is-active', active);
    if (active) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
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

function carouselSnapEase(progress) {
  const sample = (time, point1, point2) => {
    const inverse = 1 - time;
    return (3 * inverse * inverse * time * point1)
      + (3 * inverse * time * time * point2)
      + (time * time * time);
  };
  const derivative = (time, point1, point2) => {
    const inverse = 1 - time;
    return (3 * inverse * inverse * point1)
      + (6 * inverse * time * (point2 - point1))
      + (3 * time * time * (1 - point2));
  };
  let time = progress;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const slope = derivative(time, 0.22, 0.36);
    if (Math.abs(slope) < 0.0001) break;
    time -= (sample(time, 0.22, 0.36) - progress) / slope;
    time = Math.min(1, Math.max(0, time));
  }
  return sample(time, 1, 1);
}

function cancelMobileCarouselSnap() {
  if (carouselSnapFrame !== null) window.cancelAnimationFrame(carouselSnapFrame);
  carouselSnapFrame = null;
  carouselSnapCompletion = null;
  carouselProgrammaticScroll = false;
  carouselViewport?.classList.remove('is-settling');
}

function positionMobileCarousel(left, animate, onSettled) {
  cancelMobileCarouselSnap();
  const startLeft = carouselViewport.scrollLeft;
  const distance = left - startLeft;
  const immediate = !animate || reducedMotionQuery.matches || Math.abs(distance) < 0.5;

  if (immediate) {
    carouselViewport.scrollLeft = left;
    onSettled?.();
    return;
  }

  carouselProgrammaticScroll = true;
  carouselSnapCompletion = onSettled;
  carouselViewport.classList.add('is-settling');
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / CAROUSEL_SNAP_DURATION);
    carouselViewport.scrollLeft = startLeft + (distance * carouselSnapEase(progress));
    if (progress < 1) {
      carouselSnapFrame = window.requestAnimationFrame(step);
      return;
    }

    carouselViewport.scrollLeft = left;
    carouselSnapFrame = null;
    carouselProgrammaticScroll = false;
    carouselViewport.classList.remove('is-settling');
    const completion = carouselSnapCompletion;
    carouselSnapCompletion = null;
    completion?.();
  };

  carouselSnapFrame = window.requestAnimationFrame(step);
}

function positionMobileCarouselElement(element, animate, onSettled) {
  const left = element.offsetLeft - ((carouselViewport.clientWidth - element.offsetWidth) / 2);
  positionMobileCarousel(left, animate, onSettled);
}

function positionCarousel(index, smooth = true, onSettled = null) {
  const slide = carouselSlides[index];
  if (!slide) return;
  if (carouselMobileQuery.matches) {
    setCarouselTrackMoving(false);
    carouselTrack.style.transform = '';
    positionMobileCarouselElement(slide, smooth, onSettled);
    return;
  }

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
  onSettled?.();
}

function canAutoplayCarousel() {
  return carouselInView
    && !carouselUserPaused
    && !carouselPointerInside
    && !carouselFocusInside
    && !carouselFrozenForLightbox
    && lightbox.hidden
    && !document.hidden
    && !reducedMotionQuery.matches;
}

function scheduleCarouselAutoplay() {
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = null;
  if (!canAutoplayCarousel()) return;
  carouselAutoplayTimer = window.setTimeout(() => {
    carouselAutoplayTimer = null;
    showCarouselSlide(carouselActiveIndex + 1);
  }, 6000);
}

function pauseCarouselForUser() {
  carouselRequestToken += 1;
  carouselUserPaused = true;
  scheduleCarouselAutoplay();
}

function showCarouselSlide(index, userInitiated = false, animate = true, resumeAutoplay = true) {
  if (carouselFrozenForLightbox) return;
  if (userInitiated) pauseCarouselForUser();
  const targetIndex = carouselIndex(index);
  const wrapped = index < 0 || index >= carouselSlides.length;
  const image = carouselSlides[targetIndex]?.querySelector('img');
  const requestToken = ++carouselRequestToken;
  const activate = () => {
    if (requestToken !== carouselRequestToken || carouselFrozenForLightbox) return;
    debugCarouselMetrics('slide change before');
    setCarouselActiveState(targetIndex);
    const finish = () => {
      if (resumeAutoplay) scheduleCarouselAutoplay();
    };
    const mobileWrapClone = carouselMobileQuery.matches && animate && wrapped
      ? (index < 0 ? carouselLeadingClone : carouselTrailingClone)
      : null;
    if (mobileWrapClone) {
      positionMobileCarouselElement(mobileWrapClone, true, () => {
        positionCarousel(carouselActiveIndex, false, finish);
      });
    } else {
      positionCarousel(carouselActiveIndex, animate && !wrapped, finish);
    }
    debugCarouselMetrics('slide change after');
  };

  if (!image || image.complete) {
    activate();
    return;
  }

  image.loading = 'eager';
  image.addEventListener('load', activate, { once: true });
  image.addEventListener('error', activate, { once: true });
}

function beginCarouselGesture(point, source, pointerId = null) {
  if (!carouselMobileQuery.matches || carouselFrozenForLightbox || !lightbox.hidden) return;
  const autoplayWasRunning = carouselAutoplayTimer !== null || canAutoplayCarousel();
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = null;
  carouselRequestToken += 1;
  cancelMobileCarouselSnap();
  carouselGesture = {
    source,
    pointerId,
    startX: point.clientX,
    startY: point.clientY,
    currentX: point.clientX,
    currentY: point.clientY,
    startTime: performance.now(),
    startScrollLeft: carouselViewport.scrollLeft,
    startIndex: carouselActiveIndex,
    viewportWidth: carouselViewport.clientWidth,
    pendingScrollLeft: carouselViewport.scrollLeft,
    autoplayWasRunning,
    axis: null
  };
  debugCarouselMetrics('swipe start');
}

function updateCarouselGesture(point, event) {
  if (!carouselGesture) return;
  carouselGesture.currentX = point.clientX;
  carouselGesture.currentY = point.clientY;
  const distanceX = point.clientX - carouselGesture.startX;
  const distanceY = point.clientY - carouselGesture.startY;
  const absoluteX = Math.abs(distanceX);
  const absoluteY = Math.abs(distanceY);

  if (!carouselGesture.axis && Math.max(absoluteX, absoluteY) >= CAROUSEL_GESTURE_SLOP) {
    if (absoluteX > absoluteY * CAROUSEL_GESTURE_AXIS_RATIO) {
      carouselGesture.axis = 'horizontal';
      carouselViewport.classList.add('is-dragging');
    } else if (absoluteY > absoluteX * CAROUSEL_GESTURE_AXIS_RATIO) {
      carouselGesture.axis = 'vertical';
    }
  }

  if (carouselGesture.axis !== 'horizontal') return;
  if (event.cancelable) event.preventDefault();
  carouselGesture.pendingScrollLeft = carouselGesture.startScrollLeft - distanceX;
  if (carouselDragFrame === null) {
    const gesture = carouselGesture;
    carouselDragFrame = window.requestAnimationFrame(() => {
      carouselDragFrame = null;
      carouselViewport.scrollLeft = gesture.pendingScrollLeft;
    });
  }
  suppressCarouselClick = true;
}

function finishCarouselGesture(point, cancelled = false) {
  if (!carouselGesture) return;
  const gesture = carouselGesture;
  if (carouselDragFrame !== null) {
    window.cancelAnimationFrame(carouselDragFrame);
    carouselDragFrame = null;
  }
  if (gesture.axis === 'horizontal') carouselViewport.scrollLeft = gesture.pendingScrollLeft;
  carouselGesture = null;
  carouselViewport.classList.remove('is-dragging');
  const currentPoint = point ?? { clientX: gesture.currentX, clientY: gesture.currentY };
  const distanceX = currentPoint.clientX - gesture.startX;
  const distanceY = currentPoint.clientY - gesture.startY;
  const elapsed = performance.now() - gesture.startTime;
  const velocityX = Math.abs(distanceX) / Math.max(elapsed, 1);
  const isHorizontal = gesture.axis === 'horizontal'
    || Math.abs(distanceX) > Math.abs(distanceY) * CAROUSEL_GESTURE_AXIS_RATIO;
  const distanceThreshold = Math.min(gesture.viewportWidth * 0.18, 72);
  const shouldChange = Math.abs(distanceX) >= distanceThreshold
    || velocityX > CAROUSEL_SWIPE_VELOCITY;

  if (isHorizontal) {
    suppressCarouselClick = true;
    suppressCarouselClickUntil = performance.now() + 500;
  }

  if (!cancelled && isHorizontal && shouldChange) {
    showCarouselSlide(
      gesture.startIndex + (distanceX < 0 ? 1 : -1),
      false,
      true,
      gesture.autoplayWasRunning
    );
  } else if (isHorizontal) {
    setCarouselActiveState(gesture.startIndex);
    positionCarousel(gesture.startIndex, true, () => {
      if (gesture.autoplayWasRunning) scheduleCarouselAutoplay();
    });
  } else if (gesture.autoplayWasRunning) {
    scheduleCarouselAutoplay();
  }
}

function cancelCarouselGesture() {
  finishCarouselGesture(null, true);
}

function initializeCarouselGestures() {
  carouselViewport.addEventListener('click', (event) => {
    if (!suppressCarouselClick || performance.now() > suppressCarouselClickUntil) {
      suppressCarouselClick = false;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressCarouselClick = false;
    suppressCarouselClickUntil = 0;
  }, true);

  const useTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!useTouchEvents && 'PointerEvent' in window) {
    carouselViewport.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) return;
      beginCarouselGesture({ clientX: event.clientX, clientY: event.clientY }, 'pointer', event.pointerId);
    }, { passive: true });

    carouselViewport.addEventListener('pointermove', (event) => {
      if (!carouselGesture
        || carouselGesture.source !== 'pointer'
        || carouselGesture.pointerId !== event.pointerId) return;
      updateCarouselGesture({ clientX: event.clientX, clientY: event.clientY }, event);
      if (carouselGesture?.axis === 'horizontal' && !carouselViewport.hasPointerCapture(event.pointerId)) {
        try {
          carouselViewport.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is optional on older mobile Safari versions.
        }
      }
    }, { passive: false });

    carouselViewport.addEventListener('pointerup', (event) => {
      if (!carouselGesture
        || carouselGesture.source !== 'pointer'
        || carouselGesture.pointerId !== event.pointerId) return;
      finishCarouselGesture({ clientX: event.clientX, clientY: event.clientY });
    }, { passive: true });

    carouselViewport.addEventListener('pointercancel', (event) => {
      if (!carouselGesture
        || carouselGesture.source !== 'pointer'
        || carouselGesture.pointerId !== event.pointerId) return;
      cancelCarouselGesture();
    }, { passive: true });
    return;
  }

  const findCarouselTouch = (touchList) => Array.from(touchList).find(
    (touch) => touch.identifier === carouselGesture?.pointerId
  );

  carouselViewport.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) {
      cancelCarouselGesture();
      return;
    }
    const touch = event.touches[0];
    beginCarouselGesture({ clientX: touch.clientX, clientY: touch.clientY }, 'touch', touch.identifier);
  }, { passive: true });

  carouselViewport.addEventListener('touchmove', (event) => {
    const touch = findCarouselTouch(event.touches);
    if (!touch) return;
    updateCarouselGesture({ clientX: touch.clientX, clientY: touch.clientY }, event);
  }, { passive: false });

  carouselViewport.addEventListener('touchend', (event) => {
    const touch = findCarouselTouch(event.changedTouches);
    if (!touch) return;
    finishCarouselGesture({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: true });

  carouselViewport.addEventListener('touchcancel', cancelCarouselGesture, { passive: true });
}

function updateCarouselFromScroll() {
  if (!carouselMobileQuery.matches
    || carouselScrollTicking
    || carouselGesture
    || carouselProgrammaticScroll
    || carouselFrozenForLightbox
    || isLightboxClosing
    || isRestoringScroll
    || !lightbox.hidden) return;
  carouselScrollTicking = true;
  window.requestAnimationFrame(() => {
    const viewportCenter = carouselViewport.scrollLeft + (carouselViewport.clientWidth / 2);
    const items = [carouselLeadingClone, ...carouselSlides, carouselTrailingClone].filter(Boolean);
    const closestItem = items.reduce((closest, item) => {
      const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
      const closestCenter = closest.offsetLeft + (closest.offsetWidth / 2);
      return Math.abs(itemCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter) ? item : closest;
    }, items[0]);

    if (closestItem === carouselLeadingClone) {
      setCarouselActiveState(carouselSlides.length - 1);
      positionCarousel(carouselActiveIndex, false);
    } else if (closestItem === carouselTrailingClone) {
      setCarouselActiveState(0);
      positionCarousel(carouselActiveIndex, false);
    } else {
      const closestIndex = carouselSlides.indexOf(closestItem);
      if (closestIndex !== carouselActiveIndex) setCarouselActiveState(closestIndex);
    }
    carouselScrollTicking = false;
  });
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
  const portrait = imageHeight > imageWidth;
  const orientationChanged = portrait
    ? !slide.classList.contains('is-portrait')
    : !slide.classList.contains('is-landscape');
  slide.classList.toggle('is-portrait', portrait);
  slide.classList.toggle('is-landscape', !portrait);
  if (orientationChanged && updateMetrics) updateCarouselMetrics();
  return orientationChanged;
}

[...carouselTrack.querySelectorAll('img')].forEach((image) => {
  if (!image) return;
  const markLoaded = () => {
    setCarouselImageOrientation(image);
    image.closest('.gallery-media').classList.add('loaded');
    debugCarouselMetrics('image load');
    requestScrollUpdate();
  };
  if (image.complete && image.naturalWidth) markLoaded();
  else image.addEventListener('load', markLoaded, { once: true });
});

if (carouselIsEnabled) {
  carouselSlides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.className = 'wedding-carousel__dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', t('gallery.viewPhoto', { current: index + 1 }));
    dot.setAttribute('aria-controls', 'gallery-carousel-viewport');
    dot.addEventListener('click', () => showCarouselSlide(index, true));
    carouselDots.append(dot);
  });

  carouselPrevious.addEventListener('click', () => showCarouselSlide(carouselActiveIndex - 1, true));
  carouselNext.addEventListener('click', () => showCarouselSlide(carouselActiveIndex + 1, true));
  carouselReturn.addEventListener('click', () => {
    window.clearTimeout(carouselAutoplayTimer);
    carouselAutoplayTimer = null;
    carouselUserPaused = false;
    carouselFocusInside = false;
    showCarouselSlide(0, false, true, true);
  });

  initializeCarouselGestures();
  carouselViewport.addEventListener('scroll', updateCarouselFromScroll, { passive: true });
  weddingCarousel.addEventListener('mouseenter', () => {
    carouselPointerInside = true;
    scheduleCarouselAutoplay();
  });
  weddingCarousel.addEventListener('mouseleave', () => {
    carouselPointerInside = false;
    scheduleCarouselAutoplay();
  });
  weddingCarousel.addEventListener('focusin', () => {
    carouselFocusInside = true;
    scheduleCarouselAutoplay();
  });
  weddingCarousel.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      carouselFocusInside = weddingCarousel.contains(document.activeElement);
      scheduleCarouselAutoplay();
    });
  });
  weddingCarousel.addEventListener('keydown', (event) => {
    if (!lightbox.hidden || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showCarouselSlide(carouselActiveIndex + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  carouselTrack.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-index]');
    if (!button) return;
    const index = carouselSlides.indexOf(button.closest('.wedding-carousel__slide'));
    if (index < 0 || index === carouselActiveIndex) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showCarouselSlide(index, true);
  }, true);
  carouselTrack.addEventListener('transitionend', (event) => {
    if (event.target === carouselTrack && event.propertyName === 'transform') setCarouselTrackMoving(false);
  });

  document.addEventListener('visibilitychange', scheduleCarouselAutoplay);
  reducedMotionQuery.addEventListener?.('change', () => {
    updateCarouselMetrics();
    scheduleCarouselAutoplay();
  });
  carouselMobileQuery.addEventListener?.('change', updateCarouselMetrics);
  window.addEventListener('resize', () => {
    debugCarouselLifecycle('resize fired', {
      width: window.innerWidth,
      height: window.innerHeight,
      isLightboxClosing,
      isRestoringScroll
    });
    updateCarouselMetrics();
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => {
    debugCarouselLifecycle('visualViewport resize fired', {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      isLightboxClosing,
      isRestoringScroll
    });
  }, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      debugCarouselMetrics('ResizeObserver callback');
      updateCarouselMetrics();
    }).observe(carouselViewport);
  }
  document.fonts?.ready.then(updateCarouselMetrics);
  if ('IntersectionObserver' in window) {
    const carouselVisibilityObserver = new IntersectionObserver(([entry]) => {
      carouselInView = entry.isIntersecting;
      scheduleCarouselAutoplay();
    }, { threshold: .25 });
    carouselVisibilityObserver.observe(weddingCarousel);
  } else {
    carouselInView = true;
  }

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
  return (index + galleryImages.length) % galleryImages.length;
}

function preloadGalleryImage(index) {
  const normalizedIndex = normalizeGalleryIndex(index);
  if (galleryImagePreloads.has(normalizedIndex)) return galleryImagePreloads.get(normalizedIndex);

  const imageData = galleryImages[normalizedIndex];
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
    preloader.onerror = reject;
    preloader.src = imageData.src;
  }).catch((error) => {
    galleryImagePreloads.delete(normalizedIndex);
    throw error;
  });

  galleryImagePreloads.set(normalizedIndex, preloadPromise);
  return preloadPromise;
}

function gallerySequenceIndex(index, step) {
  const currentPosition = gallerySequence.indexOf(normalizeGalleryIndex(index));
  const safePosition = currentPosition < 0 ? 0 : currentPosition;
  const nextPosition = (safePosition + step + gallerySequence.length) % gallerySequence.length;
  return gallerySequence[nextPosition];
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
  lightboxImage.width = image.width;
  lightboxImage.height = image.height;
  lightboxImage.style.transform = '';
  lightboxImage.src = image.src;
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
  const autoplayWasRunning = carouselAutoplayTimer !== null || canAutoplayCarousel();
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
    scrollLeft: carouselViewport.scrollLeft,
    focusWasInside: carouselFocusInside,
    autoplayWasScheduled: autoplayWasRunning
  } : null;
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = null;

  try {
    await preloadGalleryImage(normalizedIndex);
  } catch {
    const autoplayWasScheduled = lightboxCarouselState?.autoplayWasScheduled;
    lightboxCarouselState = null;
    isLightboxOpening = false;
    carouselFrozenForLightbox = false;
    if (carouselMetricsPending) {
      carouselMetricsPending = false;
      updateCarouselMetrics();
    }
    if (autoplayWasScheduled) scheduleCarouselAutoplay();
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
        focusTarget: document.activeElement?.dataset?.galleryIndex ?? null
      });

      const autoplayWasScheduled = lightboxCarouselState?.autoplayWasScheduled;
      const focusWasInside = lightboxCarouselState?.focusWasInside ?? false;
      root.style.scrollBehavior = previousScrollBehavior;
      isRestoringScroll = false;
      isLightboxClosing = false;
      carouselFrozenForLightbox = false;
      carouselFocusInside = focusWasInside;
      debugCarouselMetrics('lightbox close restored');
      lightboxCarouselState = null;
      if (carouselMetricsPending) {
        carouselMetricsPending = false;
        updateCarouselMetrics();
      }
      if (autoplayWasScheduled) scheduleCarouselAutoplay();
    });
  });
}

function finishClosingLightbox() {
  cancelLightboxGesture();
  lightboxImage.style.transform = '';
  lightbox.hidden = true;
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
  button.addEventListener('click', () => openLightbox(Number(button.dataset.galleryIndex), button));
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
      ? t('rsvp.submitFailed')
      : translatedMessage;
  }
  if (!rsvpSuccess.hidden) renderRsvpSuccess();
  if (ONLINE_MEETING_URL.trim()) onlineMeetingButton.textContent = t('online.enter');
  else onlineMeetingButton.textContent = t('online.unavailable');
  setMenu(menuButton.getAttribute('aria-expanded') === 'true');
  setLookupLoading(lookupButton.classList.contains('loading'));
  if (lookupState?.type === 'success') showSeatResult(lookupState.name, lookupState.seat, false);
  else if (lookupState?.type === 'not-found') showNotFound(false);
  syncGalleryLanguage();
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
