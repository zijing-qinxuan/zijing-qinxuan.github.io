const ONLINE_MEETING_URL = "";
const RSVP_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyvs0LurNvxURz_e15WG-ky2d1EFydHfJtbLYkbb1XTk_7Ol1RndFNAQTbcvFQKGwFbKw/exec";
const VALID_INVITE_MODES = ["wedding", "full", "online"];

const INVITE_CONFIG = {
  wedding: {
    heroText: ["婚禮｜14:00"],
    sections: ["hero", "invitation-note", "rsvp", "ceremony-info", "ceremony-parking", "ceremony-notes", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "gallery", "share", "faq"],
    hiddenSections: ["wedding-info", "venue", "parking", "seating"],
    content: ["ceremony-venue"],
    ceremonyEntryLabel: "開放入場"
  },
  full: {
    heroText: ["婚禮｜14:00", "婚宴｜18:00"],
    sections: ["hero", "invitation-note", "rsvp", "ceremony-info", "ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    navigation: ["rsvp", "ceremony-info", "ceremony-parking", "wedding-info", "venue", "parking", "seating", "gallery", "share", "faq"],
    hiddenSections: [],
    content: ["ceremony-venue", "banquet-faq"],
    ceremonyEntryLabel: "開放入場"
  },
  online: {
    heroText: ["婚禮｜14:00"],
    sections: ["hero", "invitation-note", "rsvp", "ceremony-info", "gallery"],
    navigation: ["rsvp", "ceremony-info", "gallery"],
    hiddenSections: ["ceremony-parking", "ceremony-notes", "wedding-info", "venue", "parking", "seating", "share", "faq"],
    content: ["online-attendance"],
    ceremonyEntryLabel: "線上開放進入"
  }
};

const header = document.querySelector('#site-header');
const hero = document.querySelector('#home');
const heroMedia = document.querySelector('.hero-media');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
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
} else {
  document.body.classList.add('invite-missing');
}

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
  rsvpSubmitLabel.textContent = submitting ? '正在送出…' : '送出回覆';
  rsvpForm.setAttribute('aria-busy', String(submitting));
}

function showRsvpSuccess(previouslySubmitted = false, ceremonyAttendance = '') {
  rsvpSuccessTitle.textContent = previouslySubmitted ? '您已完成出席回覆' : '謝謝您的回覆';
  const isOnlineCeremony = !previouslySubmitted && ceremonyAttendance === '線上參加';
  rsvpSuccessMessage.innerHTML = isOnlineCeremony
    ? '我們已為您登記線上參加婚禮。<br>正式連結將於婚禮前透過原邀請訊息提供，<br>請於婚禮前再次查看 LINE 訊息。'
    : '我們已收到您的出席資訊。<br>期待與您一起分享這個重要的日子。';

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
  rsvpName.removeAttribute('aria-invalid');
  rsvpForm.querySelectorAll('[data-rsvp-error]').forEach((error) => { error.textContent = ''; });

  if (!rsvpName.value.trim()) {
    document.querySelector('#rsvp-name-error').textContent = '請輸入您的姓名。';
    rsvpName.setAttribute('aria-invalid', 'true');
    firstInvalid = rsvpName;
  }

  config.required.forEach((question) => {
    if (selectedRsvpValue(question)) return;
    const error = rsvpForm.querySelector(`[data-rsvp-error="${question}"]`);
    error.textContent = '請選擇您的出席狀況。';
    if (!firstInvalid) firstInvalid = rsvpForm.querySelector(`input[name="${question}"]`);
  });

  if (firstInvalid) {
    firstInvalid.closest('.rsvp-field, .rsvp-question').scrollIntoView({
      behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
      block: 'center'
    });
    window.setTimeout(() => firstInvalid.focus({ preventScroll: true }), reducedMotionQuery.matches ? 0 : 300);
    return false;
  }
  return true;
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
    updateRsvpAttendanceCounts();
  });
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
    updateRsvpCounters();
  });
});

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (rsvpSubmitting || !validateRsvpForm()) return;

  rsvpSubmitError.textContent = '';
  setRsvpSubmitting(true);
  const ceremonyAttendance = inviteMode === 'online' ? '' : selectedRsvpValue('ceremony');
  const formData = new FormData();
  formData.append('invite', inviteMode);
  formData.append('name', rsvpName.value.trim());
  formData.append('phone', document.querySelector('#rsvp-phone').value.trim());
  formData.append('ceremony', ceremonyAttendance);
  formData.append('banquet', inviteMode === 'full' ? selectedRsvpValue('banquet') : '');
  formData.append('online', inviteMode === 'online' ? selectedRsvpValue('online') : '');
  formData.append('people', String(inviteMode === 'online' ? 0 : rsvpPeopleCount));
  formData.append('vegetarian', String(inviteMode === 'online' ? 0 : rsvpVegetarianCount));
  formData.append('note', document.querySelector('#rsvp-note').value.trim());
  formData.append('message', document.querySelector('#rsvp-message').value.trim());

  try {
    await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });
    storeRsvp(rsvpName.value.trim());
    rsvpForm.classList.add('is-submitted');
    window.setTimeout(() => showRsvpSuccess(false, ceremonyAttendance), reducedMotionQuery.matches ? 0 : 350);
  } catch {
    rsvpSubmitError.textContent = '目前無法送出，請稍後再試。';
  } finally {
    setRsvpSubmitting(false);
  }
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
  if (open) header.classList.remove('compact');
  document.body.classList.toggle('menu-open', open);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setMenu(false);
  requestScrollUpdate();
});

function updateHeader() {
  const heroBottom = hero.offsetTop + hero.offsetHeight - header.offsetHeight;
  header.classList.toggle('scrolled', window.scrollY >= heroBottom);
}

let lastScrollY = window.scrollY;
let scrollTicking = false;

function updateScrollEffects() {
  const currentScrollY = window.scrollY;
  updateHeader();

  const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = scrollableDistance > 0 ? Math.min(1, currentScrollY / scrollableDistance) : 0;
  scrollProgress.style.width = `${scrollRatio * 100}%`;

  if (window.innerWidth > 820 && !reducedMotionQuery.matches && !document.body.classList.contains('invite-missing')) {
    const parallaxOffset = Math.min(26, Math.max(0, currentScrollY * .055));
    heroMedia.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
  } else {
    heroMedia.style.transform = '';
  }

  if (!header.classList.contains('menu-active')) {
    if (currentScrollY > lastScrollY + 4 && currentScrollY > 90) header.classList.add('compact');
    if (currentScrollY < lastScrollY - 4 || currentScrollY < 30) header.classList.remove('compact');
  }

  lastScrollY = currentScrollY;
  scrollTicking = false;
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
}

requestScrollUpdate();
window.addEventListener('scroll', requestScrollUpdate, { passive: true });

const unifiedRevealTargets = document.querySelectorAll([
  '.page-section .section-title',
  '.page-section .glass-card',
  '.page-section .share-step',
  '.story-gallery .story-title',
  '.story-gallery .gallery-media'
].join(','));

unifiedRevealTargets.forEach((item) => item.classList.add('reveal'));

document.querySelectorAll('.wedding-facts, .ceremony-parking-grid, .ceremony-note-grid, .parking-grid, .share-steps').forEach((group) => {
  [...group.children].forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index * 90, 180)}ms`);
  });
});

const revealItems = document.querySelectorAll('.reveal:not(.is-visible)');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -24px' });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

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
const gallerySources = galleryButtons
  .sort((a, b) => Number(a.dataset.galleryIndex) - Number(b.dataset.galleryIndex))
  .map((button) => button.querySelector('img').getAttribute('src'));
let currentGalleryIndex = 0;
let lastGalleryTrigger;
let touchStartX = 0;
let lightboxScrollY = 0;
let lightboxCloseTimer;

document.querySelectorAll('.gallery-media img').forEach((image) => {
  const markLoaded = () => {
    image.closest('.gallery-media').classList.add('loaded');
    requestScrollUpdate();
  };
  if (image.complete) markLoaded();
  else image.addEventListener('load', markLoaded, { once: true });
});

function showGalleryImage(index) {
  currentGalleryIndex = (index + gallerySources.length) % gallerySources.length;
  lightboxImage.src = gallerySources[currentGalleryIndex];
  lightboxImage.alt = `子靖與勤萱婚紗照 ${currentGalleryIndex + 1}`;
  lightboxCounter.textContent = `${String(currentGalleryIndex + 1).padStart(2, '0')} / ${gallerySources.length}`;
}

function openLightbox(index, trigger) {
  window.clearTimeout(lightboxCloseTimer);
  lastGalleryTrigger = trigger;
  showGalleryImage(index);
  lightbox.classList.remove('closing');
  lightbox.hidden = false;
  lightboxScrollY = window.scrollY;
  document.body.classList.add('lightbox-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lightboxScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  lightboxClose.focus();
}

function finishClosingLightbox() {
  lightbox.hidden = true;
  lightbox.classList.remove('closing');
  lightboxImage.removeAttribute('src');
  document.body.classList.remove('lightbox-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, lightboxScrollY);
  if (lastGalleryTrigger) lastGalleryTrigger.focus();
}

function closeLightbox() {
  if (lightbox.hidden || lightbox.classList.contains('closing')) return;
  lightbox.classList.add('closing');
  lightboxCloseTimer = window.setTimeout(finishClosingLightbox, reducedMotionQuery.matches ? 0 : 250);
}

galleryButtons.forEach((button) => {
  button.addEventListener('click', () => openLightbox(Number(button.dataset.galleryIndex), button));
});

lightboxPrev.addEventListener('click', () => showGalleryImage(currentGalleryIndex - 1));
lightboxNext.addEventListener('click', () => showGalleryImage(currentGalleryIndex + 1));
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target.classList.contains('lightbox-stage')) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showGalleryImage(currentGalleryIndex - 1);
  if (event.key === 'ArrowRight') showGalleryImage(currentGalleryIndex + 1);
});

lightbox.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 50) return;
  showGalleryImage(currentGalleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });
