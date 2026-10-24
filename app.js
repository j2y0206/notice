const tripDays = [...document.querySelectorAll('.day[data-date]')];
const navLinks = [...document.querySelectorAll('.day-nav a')];
const todayButton = document.querySelector('#today-button');
const offlineToast = document.querySelector('#offline-toast');
const dayNav = document.querySelector('.day-nav');
const speechStatus = document.querySelector('#speech-status');
const phraseSearch = document.querySelector('#phrase-search');
const phraseSearchStatus = document.querySelector('#phrase-search-status');
const navSections = ['overview', ...tripDays.map((day) => day.id), 'shopping', 'food', 'tools', 'quick', 'phrasebook', 'emergency-card']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const nowBadge = document.querySelector('#now-badge');
const nowTitle = document.querySelector('#now-title');
const nowMeta = document.querySelector('#now-meta');
const nowLink = document.querySelector('#now-link');
const dockLinks = [...document.querySelectorAll('.quick-dock a')];

const localDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const today = tripDays.find((day) => day.dataset.date === localDateKey());
if (today) {
  today.classList.add('is-today');
  todayButton.href = '#now';
  todayButton.textContent = '지금 일정 보기';
} else {
  todayButton.href = '#day-1';
  todayButton.textContent = '첫날 일정 보기';
}

const updateNowCard = () => {
  if (!nowTitle) return;
  const currentKey = localDateKey();
  const firstKey = tripDays[0]?.dataset.date;
  const lastKey = tripDays.at(-1)?.dataset.date;

  if (currentKey < firstKey) {
    const todayDate = new Date(`${currentKey}T00:00:00+09:00`);
    const startDate = new Date(`${firstKey}T00:00:00+09:00`);
    const days = Math.round((startDate - todayDate) / 86400000);
    nowBadge.textContent = `D-${days}`;
    nowTitle.textContent = '여행 준비 체크리스트를 확인하세요';
    nowMeta.textContent = '2026년 10월 28일 수요일 출발';
    nowLink.href = '#tools';
    nowLink.textContent = '준비물 확인 →';
    return;
  }

  if (currentKey > lastKey || !today) {
    nowBadge.textContent = '여행 완료';
    nowTitle.textContent = '우리 가족 나고야 여행이 끝났습니다';
    nowMeta.textContent = '메모와 체크리스트는 이 기기에 남아 있습니다';
    nowLink.href = '#overview';
    nowLink.textContent = '일정 다시 보기 →';
    return;
  }

  const timeParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const currentMinutes = Number(timeParts.hour) * 60 + Number(timeParts.minute);
  const schedules = [...today.querySelectorAll('.event')].map((event, index) => {
    const match = event.querySelector('time')?.textContent.trim().match(/^(\d{2}):(\d{2})/);
    if (!match) return null;
    event.id ||= `${today.id}-schedule-${index + 1}`;
    return {
      event,
      minutes: Number(match[1]) * 60 + Number(match[2]),
      time: `${match[1]}:${match[2]}`,
      title: event.querySelector('h3')?.textContent.trim() || '다음 일정'
    };
  }).filter(Boolean);
  const next = schedules.find((schedule) => schedule.minutes >= currentMinutes);

  if (next) {
    nowBadge.textContent = '다음 일정';
    nowTitle.textContent = `${next.time} · ${next.title}`;
    nowMeta.textContent = today.querySelector('.day-number')?.textContent.trim() || '오늘 일정';
    nowLink.href = `#${next.event.id}`;
    nowLink.textContent = '바로 이동 →';
  } else {
    nowBadge.textContent = '오늘 완료';
    nowTitle.textContent = '오늘 계획한 일정이 모두 끝났습니다';
    nowMeta.textContent = '아이들과 편하게 쉬세요';
    nowLink.href = `#${today.id}`;
    nowLink.textContent = '오늘 일정 보기 →';
  }
};

updateNowCard();
window.setInterval(updateNowCard, 60000);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const activeDayId = visible.target.id.startsWith('day-') ? visible.target.id : '';
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${activeDayId}`));
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });

navSections.forEach((section) => sectionObserver.observe(section));

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const navHeight = dayNav?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top, behavior: 'auto' });
    navLinks.forEach((item) => item.classList.toggle('active', item === link));
    window.requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

const scrollToAnchor = (link) => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  const stickyOffset = target.id.startsWith('day-') ? (dayNav?.getBoundingClientRect().height ?? 0) + 8 : 14;
  const top = target.id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - stickyOffset;
  window.scrollTo({ top, behavior: 'smooth' });
  history.replaceState(null, '', link.getAttribute('href'));
};

dockLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToAnchor(link);
    dockLinks.forEach((item) => item.classList.toggle('active', item === link));
    navLinks.forEach((item) => item.classList.remove('active'));
  });
});

const dockTargets = ['top', 'overview', ...tripDays.map((day) => day.id), 'shopping', 'food', 'tools', 'quick', 'phrasebook', 'emergency-card']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const dockObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  let activeId = visible.target.id;
  if (activeId.startsWith('day-')) activeId = 'overview';
  if (activeId === 'quick') activeId = 'tools';
  dockLinks.forEach((link) => link.classList.toggle('active', link.dataset.dockTarget === activeId));
}, { rootMargin: '-18% 0px -68% 0px', threshold: [0.01, 0.2] });
dockTargets.forEach((section) => dockObserver.observe(section));

document.querySelectorAll('.speak-btn').forEach((button) => {
  button.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      speechStatus.textContent = '이 브라우저에서는 음성 재생을 지원하지 않습니다.';
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(button.dataset.speech);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.92;
    utterance.pitch = 1;

    document.querySelectorAll('.speak-btn.is-speaking').forEach((item) => item.classList.remove('is-speaking'));
    button.classList.add('is-speaking');
    speechStatus.textContent = '일본어 발음을 재생합니다.';

    utterance.onend = () => {
      button.classList.remove('is-speaking');
      speechStatus.textContent = '';
    };
    utterance.onerror = () => {
      button.classList.remove('is-speaking');
      speechStatus.textContent = '음성을 재생하지 못했습니다. 기기의 일본어 음성 설정을 확인해 주세요.';
    };
    window.speechSynthesis.speak(utterance);
  });
});

if (phraseSearch) {
  const phraseCards = [...document.querySelectorAll('.phrase-card')];
  const phraseGroups = [...document.querySelectorAll('.phrase-group')];

  phraseSearch.addEventListener('input', () => {
    const query = phraseSearch.value.trim().toLocaleLowerCase('ko-KR');
    let matches = 0;

    phraseCards.forEach((card) => {
      const isMatch = !query || card.textContent.toLocaleLowerCase('ko-KR').includes(query);
      card.hidden = !isMatch;
      if (isMatch && query) matches += 1;
    });

    phraseGroups.forEach((group) => {
      group.hidden = query && !group.querySelector('.phrase-card:not([hidden])');
    });

    phraseSearchStatus.textContent = query
      ? (matches ? `${matches}개의 표현을 찾았습니다.` : '일치하는 표현이 없습니다.')
      : '';
  });
}

const readLocalValue = (key, fallback = '') => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const writeLocalValue = (key, value) => {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
};

const shoppingInputs = [...document.querySelectorAll('[data-shop-check]')];
const shopProgress = document.querySelector('#shop-progress');
const shopProgressBar = document.querySelector('#shop-progress-bar');
const resetShopList = document.querySelector('#reset-shop-list');
const savedShopping = (() => {
  try { return JSON.parse(readLocalValue('nagoya-shopping-list-v1', '{}')); } catch { return {}; }
})();

const updateShoppingList = () => {
  const state = Object.fromEntries(shoppingInputs.map((input) => [input.dataset.shopCheck, input.checked]));
  writeLocalValue('nagoya-shopping-list-v1', JSON.stringify(state));
  const completed = shoppingInputs.filter((input) => input.checked).length;
  if (shopProgress) shopProgress.textContent = `${completed} / ${shoppingInputs.length}`;
  if (shopProgressBar) shopProgressBar.style.width = `${shoppingInputs.length ? (completed / shoppingInputs.length) * 100 : 0}%`;
};

shoppingInputs.forEach((input) => {
  input.checked = Boolean(savedShopping[input.dataset.shopCheck]);
  input.addEventListener('change', updateShoppingList);
});
resetShopList?.addEventListener('click', () => {
  shoppingInputs.forEach((input) => { input.checked = false; });
  updateShoppingList();
});
updateShoppingList();

const checklistInputs = [...document.querySelectorAll('[data-check]')];
const checkProgress = document.querySelector('#check-progress');
const checkProgressBar = document.querySelector('#check-progress-bar');
const resetChecklist = document.querySelector('#reset-checklist');
const savedChecks = (() => {
  try { return JSON.parse(readLocalValue('nagoya-checklist-v1', '{}')); } catch { return {}; }
})();

const updateChecklist = () => {
  const state = Object.fromEntries(checklistInputs.map((input) => [input.dataset.check, input.checked]));
  writeLocalValue('nagoya-checklist-v1', JSON.stringify(state));
  const completed = checklistInputs.filter((input) => input.checked).length;
  if (checkProgress) checkProgress.textContent = `${completed} / ${checklistInputs.length}`;
  if (checkProgressBar) checkProgressBar.style.width = `${checklistInputs.length ? (completed / checklistInputs.length) * 100 : 0}%`;
};

checklistInputs.forEach((input) => {
  input.checked = Boolean(savedChecks[input.dataset.check]);
  input.addEventListener('change', updateChecklist);
});
resetChecklist?.addEventListener('click', () => {
  checklistInputs.forEach((input) => { input.checked = false; });
  updateChecklist();
});
updateChecklist();

const tripMemo = document.querySelector('#trip-memo');
const memoStatus = document.querySelector('#memo-status');
const clearMemo = document.querySelector('#clear-memo');
let memoStatusTimer;
if (tripMemo) {
  tripMemo.value = readLocalValue('nagoya-trip-memo-v1');
  tripMemo.addEventListener('input', () => {
    const saved = writeLocalValue('nagoya-trip-memo-v1', tripMemo.value);
    memoStatus.textContent = saved ? '저장됨' : '저장할 수 없습니다';
    window.clearTimeout(memoStatusTimer);
    memoStatusTimer = window.setTimeout(() => { memoStatus.textContent = '이 기기에 자동 저장'; }, 1400);
  });
}
clearMemo?.addEventListener('click', () => {
  tripMemo.value = '';
  writeLocalValue('nagoya-trip-memo-v1', '');
  memoStatus.textContent = '메모를 지웠습니다';
});

const installButton = document.querySelector('#install-button');
const installHelp = document.querySelector('#install-help');
const offlineStatus = document.querySelector('#offline-status');
let deferredInstallPrompt;

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone && installButton) {
  installButton.textContent = '홈 화면에서 실행 중';
  installButton.disabled = true;
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.textContent = '홈 화면에 설치';
});

installButton?.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.textContent = '설치 방법 보기';
    return;
  }
  installHelp.hidden = !installHelp.hidden;
});

window.addEventListener('appinstalled', () => {
  if (installButton) {
    installButton.textContent = '설치 완료';
    installButton.disabled = true;
  }
});

if (offlineStatus) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      offlineStatus.textContent = '✓ 일정과 회화 수첩을 오프라인에서도 열 수 있습니다.';
    }).catch(() => {
      offlineStatus.textContent = '브라우저 메뉴에서 홈 화면에 추가해 주세요.';
    });
  } else {
    offlineStatus.textContent = '이 브라우저는 오프라인 저장을 지원하지 않습니다.';
  }
}

const showConnectionState = () => {
  const isOffline = !navigator.onLine;
  offlineToast.classList.toggle('show', isOffline);
  if (!isOffline) offlineToast.textContent = '인터넷에 다시 연결되었습니다.';
};

window.addEventListener('offline', showConnectionState);
window.addEventListener('online', () => {
  offlineToast.classList.add('show');
  offlineToast.textContent = '인터넷에 다시 연결되었습니다.';
  window.setTimeout(() => offlineToast.classList.remove('show'), 2200);
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
