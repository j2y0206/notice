const tripDays = [...document.querySelectorAll('.day[data-date]')];
const navLinks = [...document.querySelectorAll('.day-nav a')];
const todayButton = document.querySelector('#today-button');
const offlineToast = document.querySelector('#offline-toast');
const dayNav = document.querySelector('.day-nav');
const speechStatus = document.querySelector('#speech-status');
const phraseSearch = document.querySelector('#phrase-search');
const phraseSearchStatus = document.querySelector('#phrase-search-status');

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
  todayButton.href = `#${today.id}`;
  todayButton.textContent = '오늘 일정 바로 보기';
} else {
  todayButton.href = '#day-1';
  todayButton.textContent = '첫날 일정 보기';
}

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });

tripDays.forEach((day) => sectionObserver.observe(day));

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

document.querySelectorAll('.speak-btn').forEach((button) => {
  button.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      speechStatus.textContent = '이 브라우저에서는 음성 재생을 지원하지 않습니다.';
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(button.dataset.speech);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.82;
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
