const tripDays = [...document.querySelectorAll('.day[data-date]')];
const navLinks = [...document.querySelectorAll('.day-nav a')];
const todayButton = document.querySelector('#today-button');
const offlineToast = document.querySelector('#offline-toast');

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
