if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.querySelectorAll('.btn-features-toggle').forEach((btn) => {
  const list = document.getElementById(btn.getAttribute('aria-controls'));
  if (!list || !list.classList.contains('is-collapsible')) return;
  list.classList.add('is-collapsed');
  btn.setAttribute('aria-expanded', 'false');
  btn.textContent = 'Voir plus';
  btn.addEventListener('click', () => {
    const collapsed = list.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.textContent = collapsed ? 'Voir plus' : 'Voir moins';
  });
});

(function initPhilosophyBarPause() {
  const track = document.getElementById('philosophy-track');
  const btn = document.getElementById('philosophy-pause-btn');
  const label = btn?.querySelector('.philosophy-pause-label');
  if (!track || !btn || !label) return;

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyReducedMotion() {
    if (mq.matches) {
      btn.hidden = true;
      track.classList.remove('is-paused');
      btn.setAttribute('aria-pressed', 'false');
      label.textContent = 'Pause';
    } else {
      btn.hidden = false;
    }
  }

  applyReducedMotion();
  mq.addEventListener('change', applyReducedMotion);

  btn.addEventListener('click', () => {
    if (mq.matches) return;
    const paused = track.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    label.textContent = paused ? 'Reprendre' : 'Pause';
  });
})();
