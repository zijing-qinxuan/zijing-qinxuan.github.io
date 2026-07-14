const ONLINE_MEETING_URL = "";
const RSVP_DEADLINE_TEXT = "2026 年 12 月 20 日";
const SEAT_LOOKUP_OPEN_AT = "2026-12-19T00:00:00+08:00";
const SEAT_LOOKUP_DEV_PREVIEW_KEY = "wedding-seat-lookup-preview";
const RSVP_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyvs0LurNvxURz_e15WG-ky2d1EFydHfJtbLYkbb1XTk_7Ol1RndFNAQTbcvFQKGwFbKw/exec";
const VALID_INVITE_MODES = ["wedding", "full", "online"];
const INVITE_CONFIG = {
  wedding: {
    heroText: ["婚禮｜14:00"],
    sections: ["hero", "invitation-note", "rsvp", "gift-note", "ceremony-info", "ceremony-parking", "ceremony-notes", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "gallery", "share", "faq"],
    hiddenSections: ["wedding-info", "venue", "parking", "seating"],
    content: ["ceremony-venue"],
    ceremonyEntryLabel: "開放入場"
  },
  full: {
    heroText: ["婚禮｜14:00", "婚宴｜18:00"],
    sections: ["hero", "invitation-note", "rsvp", "gift-note", "ceremony-info", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    hiddenSections: [],
    content: ["ceremony-venue", "banquet-faq"],
    ceremonyEntryLabel: "開放入場"
  },
  online: {
    heroText: ["婚禮｜14:00"],
    sections: ["hero", "invitation-note", "rsvp", "ceremony-info", "gallery"],
    navigation: ["rsvp", "ceremony-info", "gallery"],
    hiddenSections: ["gift-note", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "share", "faq"],
    content: ["online-attendance"],
    ceremonyEntryLabel: "線上開放進入"
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
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(new Date(SEAT_LOOKUP_OPEN_AT));
  const dateValues = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  return `${dateValues.year} 年 ${dateValues.month} 月 ${dateValues.day} 日`;
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
  element.textContent = RSVP_DEADLINE_TEXT;
});

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

  ceremonyEntryLabel.textContent = config.ceremonyEntryLabel;
  config.heroText.forEach((text) => {
    const line = document.createElement('span');
    line.textContent = text;
    heroSchedule.append(line);
  });
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
    weddingCountdown.textContent = `距離我們的婚禮還有 ${daysRemaining} 天`;
  } else if (now < weddingDayEnd) {
    weddingCountdown.textContent = '今天，我們結婚了。';
  } else {
    weddingCountdown.textContent = '謝謝您與我們一起見證這一天。';
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
  onlineMeetingButton.textContent = '進入線上婚禮';
  onlineMeetingButton.href = ONLINE_MEETING_URL.trim();
  onlineMeetingButton.target = '_blank';
  onlineMeetingButton.rel = 'noopener noreferrer';
  onlineMeetingButton.removeAttribute('aria-disabled');
  onlineMeetingButton.classList.remove('is-unavailable');
} else {
  onlineMeetingButton.removeAttribute('href');
  onlineMeetingButton.setAttribute('aria-disabled', 'true');
  onlineMeetingButton.classList.add('is-unavailable');
  onlineMeetingButton.textContent = '線上參加連結將於婚禮前提供';
}

const RSVP_STORAGE_KEY = "wedding-rsvp-submitted";
const RSVP_MODE_CONFIG = {
  wedding: {
    title: "婚禮出席回覆",
    questions: ["ceremony"],
    required: ["ceremony"]
  },
  full: {
    title: "婚禮與婚宴出席回覆",
    questions: ["ceremony", "banquet"],
    required: ["ceremony", "banquet"]
  },
  online: {
    title: "線上參加回覆",
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
const activeRsvpJsonpRequests = new Map();

function setRsvpExpanded(expanded, scrollToPanel = false) {
  rsvpToggle.setAttribute('aria-expanded', String(expanded));
  rsvpToggle.querySelector('span').textContent = expanded ? '收起回覆表單' : '立即回覆';
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
  rsvpSubmitLabel.textContent = submitting ? '正在送出⋯' : '送出回覆';
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

function showRsvpSuccess(previouslySubmitted = false, ceremonyAttendance = '', action = 'created') {
  const wasUpdated = !previouslySubmitted && action === 'updated';
  rsvpSuccessTitle.textContent = previouslySubmitted
    ? '您已完成出席回覆'
    : (wasUpdated ? '✔ 回覆已更新' : '✔ 回覆已送出');
  const isOnlineCeremony = !previouslySubmitted && ceremonyAttendance === '線上參加';
  let successMessage = previouslySubmitted
    ? '我們已收到您的出席資訊。<br>期待與您一起分享這個重要的日子。'
    : (wasUpdated
      ? '您的最新回覆已成功儲存，<br>已取代先前資料。'
      : '期待與您一起分享這個重要的日子。');

  if (isOnlineCeremony) {
    successMessage += '<br><br>我們已為您登記線上參加婚禮。<br>正式連結將於婚禮前透過原邀請訊息提供，<br>請於婚禮前再次查看 LINE 訊息。';
  }
  rsvpSuccessMessage.innerHTML = successMessage;

  const hasOnlineMeetingLink = isOnlineCeremony && Boolean(ONLINE_MEETING_URL.trim());
  rsvpOnlineLink.hidden = !hasOnlineMeetingLink;
  if (hasOnlineMeetingLink) {
    rsvpOnlineLink.href = ONLINE_MEETING_URL.trim();
  } else {
    rsvpOnlineLink.removeAttribute('href');
  }
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
  document.querySelector('#rsvp-name-error').textContent = '';
  document.querySelector('#rsvp-phone-error').textContent = '';
  document.querySelector('#rsvp-vegetarian-error').textContent = '';
  rsvpName.removeAttribute('aria-invalid');
  rsvpPhone.removeAttribute('aria-invalid');
  rsvpForm.querySelectorAll('[data-rsvp-question]').forEach((question) => {
    question.removeAttribute('aria-invalid');
  });
  rsvpForm.querySelectorAll('[data-rsvp-error]').forEach((error) => { error.textContent = ''; });

  if (!rsvpName.value.trim()) {
    document.querySelector('#rsvp-name-error').textContent = '請輸入您的姓名。';
    rsvpName.setAttribute('aria-invalid', 'true');
    firstInvalid = rsvpName;
  }

  const phoneValue = rsvpPhone.value.trim();
  const normalizedPhone = phoneValue.replace(/[\s-]+/g, '');
  const phoneDigitCount = (normalizedPhone.match(/\d/g) || []).length;
  if (!phoneValue) {
    document.querySelector('#rsvp-phone-error').textContent = '請輸入您的聯絡電話。';
    rsvpPhone.setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = rsvpPhone;
  } else if (phoneDigitCount < 8) {
    document.querySelector('#rsvp-phone-error').textContent = '請輸入至少 8 位數字的聯絡電話。';
    rsvpPhone.setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = rsvpPhone;
  }

  config.required.forEach((question) => {
    if (selectedRsvpValue(question)) return;
    const error = rsvpForm.querySelector(`[data-rsvp-error="${question}"]`);
    error.textContent = '請選擇您的出席狀況。';
    error.closest('.rsvp-question').setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = rsvpForm.querySelector(`input[name="${question}"]`);
  });

  if (!rsvpCounts.hidden && rsvpVegetarianCount > rsvpPeopleCount) {
    document.querySelector('#rsvp-vegetarian-error').textContent = '素食人數不得超過出席人數。';
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
  rsvpSubmitError.textContent = message;
}

function handleRsvpStatusResult(result) {
  if (!rsvpSubmitting || !pendingRsvpSubmission || !result || typeof result !== 'object') return;
  if (result.ready !== true) return;

  if (typeof result.success !== 'boolean') return;
  if (!result.success) {
    finishRsvpWithError(typeof result.message === 'string' && result.message.trim()
      ? result.message.trim()
      : '目前無法送出，請稍後再試。');
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
    finishRsvpWithError('目前無法確認回覆是否成功送達。\n請稍後查看或重新整理後再試一次。');
  }, 20000);
}

if (VALID_INVITE_MODES.includes(inviteMode)) {
  const modeConfig = RSVP_MODE_CONFIG[inviteMode];
  rsvpFormTitle.textContent = modeConfig.title;
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
    if (error) error.textContent = '';
    radio.closest('.rsvp-question')?.removeAttribute('aria-invalid');
    updateRsvpAttendanceCounts();
  });
});

rsvpName.addEventListener('input', () => {
  if (!rsvpName.value.trim()) return;
  rsvpName.removeAttribute('aria-invalid');
  document.querySelector('#rsvp-name-error').textContent = '';
});

rsvpPhone.addEventListener('input', () => {
  const normalizedPhone = rsvpPhone.value.trim().replace(/[\s-]+/g, '');
  if ((normalizedPhone.match(/\d/g) || []).length < 8) return;
  rsvpPhone.removeAttribute('aria-invalid');
  document.querySelector('#rsvp-phone-error').textContent = '';
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
    document.querySelector('#rsvp-vegetarian-error').textContent = '';
    updateRsvpCounters();
  });
});

rsvpForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (rsvpSubmitting || !validateRsvpForm()) return;

  rsvpSubmitError.textContent = '';
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
    finishRsvpWithError('目前無法送出，請稍後再試。');
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
  menuButton.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
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
  const scrollRatio = scrollableDistance > 0 ? Math.min(1, currentScrollY / scrollableDistance) : 0;
  scrollProgress.style.width = `${scrollRatio * 100}%`;

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
  '.story-gallery .wedding-carousel',
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

function showSeatResult(name, seat) {
  lookupResult.innerHTML = `
    <p class="result-welcome">歡迎蒞臨</p>
    <h3 class="result-name"></h3>
    <p class="table-number"></p>
    <div class="result-rule" aria-hidden="true"></div>
    <p class="guest-count"></p>
    <p class="result-closing">期待與您共度美好時光</p>
    <p class="special-meal" hidden></p>`;
  lookupResult.querySelector('.result-name').textContent = name;
  lookupResult.querySelector('.table-number').textContent = `${seat.table} 桌`;
  lookupResult.querySelector('.guest-count').textContent = `${seat.guests}賓客`;
  if (seat.meal !== '一般餐') {
    const specialMeal = lookupResult.querySelector('.special-meal');
    specialMeal.textContent = `※ 已安排${seat.meal}`;
    specialMeal.hidden = false;
  }
  revealLookupResult('success');
}

function showNotFound() {
  lookupResult.innerHTML = `
    <span class="not-found-icon" aria-hidden="true"></span>
    <h3 class="not-found-title">很抱歉</h3>
    <p class="not-found-copy">目前找不到您的座位資訊。<br>請確認姓名是否與喜帖相同，<br>或向現場接待人員詢問。</p>`;
  revealLookupResult('not-found');
}

function setLookupLoading(loading) {
  lookupButton.disabled = loading;
  lookupButton.classList.toggle('loading', loading);
  lookupButtonLabel.textContent = loading ? '查詢中...' : '查詢座位';
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
let currentGalleryIndex = 0;
let lastGalleryTrigger;
let touchStartX = 0;
let lightboxScrollY = 0;
let lightboxCloseTimer;

const weddingCarousel = document.querySelector('.wedding-carousel');
const carouselViewport = weddingCarousel?.querySelector('.wedding-carousel__viewport');
const carouselTrack = weddingCarousel?.querySelector('.wedding-carousel__track');
const carouselSlides = weddingCarousel ? [...weddingCarousel.querySelectorAll('.wedding-carousel__slide')] : [];
const carouselPrevious = weddingCarousel?.querySelector('.wedding-carousel__arrow--previous');
const carouselNext = weddingCarousel?.querySelector('.wedding-carousel__arrow--next');
const carouselDots = weddingCarousel?.querySelector('.wedding-carousel__dots');
const carouselRestart = weddingCarousel?.querySelector('.wedding-carousel__restart');
const carouselMobileQuery = window.matchMedia('(max-width: 820px)');
const carouselIsEnabled = Boolean(
  weddingCarousel
  && carouselSlides.length
  && VALID_INVITE_MODES.includes(inviteMode)
  && !weddingCarousel.closest('[hidden]')
);
let carouselLeadingClone;
let carouselTrailingClone;
let carouselActiveIndex = 0;
let carouselAutoplayTimer = null;
let carouselUserPaused = false;
let carouselPointerInside = false;
let carouselFocusInside = false;
let carouselInView = false;
let carouselScrollTicking = false;
let carouselLayoutTicking = false;
let carouselRequestToken = 0;
let carouselMotionTimer = null;
let lightboxCarouselState = null;
let lightboxScrollX = 0;
let isLightboxClosing = false;
let isRestoringScroll = false;
let carouselLayoutPending = false;

function carouselIndex(index) {
  return (index + carouselSlides.length) % carouselSlides.length;
}

function createCarouselClone(slide) {
  const clone = slide.cloneNode(true);
  clone.className = 'wedding-carousel__clone';
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

function positionCarousel(index, smooth = true) {
  const slide = carouselSlides[index];
  if (!slide) return;
  if (carouselMobileQuery.matches) {
    setCarouselTrackMoving(false);
    carouselTrack.style.transform = '';
    const left = slide.offsetLeft - ((carouselViewport.clientWidth - slide.offsetWidth) / 2);
    carouselViewport.scrollTo({
      left,
      behavior: smooth && !reducedMotionQuery.matches ? 'smooth' : 'auto'
    });
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
}

function canAutoplayCarousel() {
  return carouselInView
    && !carouselUserPaused
    && !carouselPointerInside
    && !carouselFocusInside
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

function showCarouselSlide(index, userInitiated = false) {
  if (userInitiated) pauseCarouselForUser();
  const targetIndex = carouselIndex(index);
  const wrapped = index < 0 || index >= carouselSlides.length;
  const image = carouselSlides[targetIndex]?.querySelector('img');
  const requestToken = ++carouselRequestToken;
  const activate = () => {
    if (requestToken !== carouselRequestToken) return;
    setCarouselActiveState(targetIndex);
    positionCarousel(carouselActiveIndex, !wrapped);
    scheduleCarouselAutoplay();
  };

  if (!image || image.complete) {
    activate();
    return;
  }

  image.loading = 'eager';
  image.addEventListener('load', activate, { once: true });
  image.addEventListener('error', activate, { once: true });
}

function updateCarouselFromScroll() {
  if (!carouselMobileQuery.matches || carouselScrollTicking || isLightboxClosing || isRestoringScroll || !lightbox.hidden) return;
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

function requestCarouselLayout() {
  debugCarouselLifecycle('carousel refresh called', {
    activeIndex: carouselActiveIndex,
    isLightboxClosing,
    isRestoringScroll
  });
  if (isLightboxClosing || isRestoringScroll || !lightbox.hidden) {
    carouselLayoutPending = true;
    return;
  }
  if (carouselLayoutTicking) return;
  carouselLayoutTicking = true;
  window.requestAnimationFrame(() => {
    positionCarousel(carouselActiveIndex, false);
    carouselLayoutTicking = false;
  });
}

function setCarouselImageOrientation(image) {
  if (!image.naturalWidth || !image.naturalHeight) return;
  const slide = image.closest('.wedding-carousel__slide, .wedding-carousel__clone');
  if (!slide) return;
  const portrait = image.naturalHeight > image.naturalWidth;
  slide.classList.toggle('is-portrait', portrait);
  slide.classList.toggle('is-landscape', !portrait);
  requestCarouselLayout();
}

[...carouselTrack.querySelectorAll('img')].forEach((image) => {
  if (!image) return;
  const markLoaded = () => {
    setCarouselImageOrientation(image);
    image.closest('.gallery-media').classList.add('loaded');
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
    dot.setAttribute('aria-label', `查看第 ${index + 1} 張婚紗照`);
    dot.setAttribute('aria-controls', 'gallery-carousel-viewport');
    dot.addEventListener('click', () => showCarouselSlide(index, true));
    carouselDots.append(dot);
  });

  carouselPrevious.addEventListener('click', () => showCarouselSlide(carouselActiveIndex - 1, true));
  carouselNext.addEventListener('click', () => showCarouselSlide(carouselActiveIndex + 1, true));
  carouselRestart.addEventListener('click', () => {
    carouselUserPaused = false;
    carouselFocusInside = false;
    scheduleCarouselAutoplay();
  });

  carouselViewport.addEventListener('pointerdown', pauseCarouselForUser, { passive: true });
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
    requestCarouselLayout();
    scheduleCarouselAutoplay();
  });
  carouselMobileQuery.addEventListener?.('change', requestCarouselLayout);
  window.addEventListener('resize', () => {
    debugCarouselLifecycle('resize fired', {
      width: window.innerWidth,
      height: window.innerHeight,
      isLightboxClosing,
      isRestoringScroll
    });
    requestCarouselLayout();
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => {
    debugCarouselLifecycle('visualViewport resize fired', {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      isLightboxClosing,
      isRestoringScroll
    });
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(requestCarouselLayout).observe(carouselViewport);
  document.fonts?.ready.then(requestCarouselLayout);
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

function showGalleryImage(index) {
  currentGalleryIndex = (index + galleryImages.length) % galleryImages.length;
  const image = galleryImages[currentGalleryIndex];
  lightboxImage.width = image.width;
  lightboxImage.height = image.height;
  lightboxImage.src = image.src;
  lightboxImage.alt = '子靖與勤萱婚紗照';
  lightboxCounter.textContent = `${String(currentGalleryIndex + 1).padStart(2, '0')} / ${galleryImages.length}`;
  if (!lightbox.hidden && !reducedMotionQuery.matches) {
    lightboxImage.classList.remove('switching');
    void lightboxImage.offsetWidth;
    lightboxImage.classList.add('switching');
  } else {
    lightboxImage.classList.remove('switching');
  }
}

function showAdjacentGalleryImage(step) {
  const currentPosition = gallerySequence.indexOf(currentGalleryIndex);
  const nextPosition = (currentPosition + step + gallerySequence.length) % gallerySequence.length;
  showGalleryImage(gallerySequence[nextPosition]);
}

function openLightbox(index, trigger) {
  window.clearTimeout(lightboxCloseTimer);
  lastGalleryTrigger = trigger;
  isLightboxClosing = false;
  isRestoringScroll = false;
  lightboxCarouselState = carouselIsEnabled ? {
    activeIndex: carouselActiveIndex,
    mobileLayout: carouselMobileQuery.matches,
    trackTransform: carouselTrack.style.transform,
    scrollLeft: carouselViewport.scrollLeft,
    autoplayWasScheduled: carouselAutoplayTimer !== null
  } : null;
  window.clearTimeout(carouselAutoplayTimer);
  carouselAutoplayTimer = null;
  showGalleryImage(index);
  lightbox.classList.remove('closing');
  lightbox.hidden = false;
  lightboxScrollY = window.scrollY;
  lightboxScrollX = window.scrollX;
  debugCarouselLifecycle('lightbox open', {
    savedScrollX: lightboxScrollX,
    savedScrollY: lightboxScrollY,
    activeIndex: carouselActiveIndex
  });
  document.documentElement.classList.add('lightbox-open');
  document.body.classList.add('lightbox-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lightboxScrollY}px`;
  document.body.style.left = `-${lightboxScrollX}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function restorePagePositionAfterLightbox() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  root.getBoundingClientRect();
  window.scrollTo({ top: lightboxScrollY, left: lightboxScrollX, behavior: 'auto' });

  if (lightboxCarouselState && carouselActiveIndex === lightboxCarouselState.activeIndex) {
    if (lightboxCarouselState.mobileLayout === carouselMobileQuery.matches) {
      if (carouselMobileQuery.matches) carouselViewport.scrollLeft = lightboxCarouselState.scrollLeft;
      else carouselTrack.style.transform = lightboxCarouselState.trackTransform;
    }
    positionCarousel(lightboxCarouselState.activeIndex, false);
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (lastGalleryTrigger) {
        try {
          lastGalleryTrigger.focus({ preventScroll: true });
        } catch {
          lastGalleryTrigger.focus();
        }
      }

      if (Math.abs(window.scrollY - lightboxScrollY) > 1 || Math.abs(window.scrollX - lightboxScrollX) > 1) {
        window.scrollTo({ top: lightboxScrollY, left: lightboxScrollX, behavior: 'auto' });
      }

      debugCarouselLifecycle('lightbox close restored', {
        activeIndex: carouselActiveIndex,
        expectedActiveIndex: lightboxCarouselState?.activeIndex,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        focusTarget: document.activeElement?.dataset?.galleryIndex ?? null
      });

      const autoplayWasScheduled = lightboxCarouselState?.autoplayWasScheduled;
      root.style.scrollBehavior = previousScrollBehavior;
      isRestoringScroll = false;
      isLightboxClosing = false;
      lightboxCarouselState = null;
      if (carouselLayoutPending) {
        carouselLayoutPending = false;
        requestCarouselLayout();
      }
      if (autoplayWasScheduled) scheduleCarouselAutoplay();
    });
  });
}

function finishClosingLightbox() {
  lightbox.hidden = true;
  lightbox.classList.remove('closing');
  lightboxImage.removeAttribute('src');
  const lockedBodyTop = document.body.style.top;
  const lockedBodyLeft = document.body.style.left;
  document.documentElement.classList.remove('lightbox-open');
  document.body.classList.remove('lightbox-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  debugCarouselLifecycle('lightbox scroll lock cleared', {
    bodyTop: lockedBodyTop,
    bodyLeft: lockedBodyLeft
  });
  restorePagePositionAfterLightbox();
}

function closeLightbox() {
  if (lightbox.hidden || lightbox.classList.contains('closing')) return;
  isLightboxClosing = true;
  isRestoringScroll = true;
  debugCarouselLifecycle('lightbox close start', {
    savedScrollY: lightboxScrollY,
    bodyTop: document.body.style.top,
    activeIndex: carouselActiveIndex
  });
  lightbox.classList.add('closing');
  lightboxCloseTimer = window.setTimeout(finishClosingLightbox, reducedMotionQuery.matches ? 0 : 480);
}

galleryButtons.forEach((button) => {
  button.addEventListener('click', () => openLightbox(Number(button.dataset.galleryIndex), button));
});

lightboxPrev.addEventListener('click', () => showAdjacentGalleryImage(-1));
lightboxNext.addEventListener('click', () => showAdjacentGalleryImage(1));
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target.classList.contains('lightbox-stage')) closeLightbox();
});

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

lightbox.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 50) return;
  showAdjacentGalleryImage(distance < 0 ? 1 : -1);
}, { passive: true });

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
