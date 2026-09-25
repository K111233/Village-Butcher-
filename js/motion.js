/* Village Butchers — motion. Scroll reveals, the map pin drop and the
   rating count. Does nothing if the visitor has asked their device to
   reduce motion, or if the browser can't observe scrolling. */
(() => {
  'use strict';
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || (reduce && reduce.matches)) return;

  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* Groups: every direct child reveals in turn */
  $$('[data-reveal-group]').forEach((group) => {
    const kind = group.dataset.revealGroup || '';
    Array.from(group.children).forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', kind);
      child.style.setProperty('--i', String(i));
    });
  });

  /* Rating counts up from 0.0 to 5.0 the first time it's seen */
  function countUp(el) {
    const target = parseFloat(el.textContent) || 0;
    const start = performance.now(), dur = 1100;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * eased).toFixed(1);
      if (k < 1) requestAnimationFrame(tick); else el.textContent = target.toFixed(1);
    };
    el.textContent = '0.0';
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-in');
      if (el.matches('[data-count]')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  $$('[data-reveal], .map, [data-count]').forEach((el) => io.observe(el));
  document.documentElement.classList.add('motion');

  /* Hero photo drifts a little slower than the page on large screens */
  const photo = document.querySelector('.hero-c__photo img');
  const wide = window.matchMedia('(min-width: 860px) and (hover: hover)');
  if (photo) {
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!wide.matches) { photo.style.removeProperty('--m-par'); return; }
      const y = Math.min(window.scrollY, 900);
      photo.style.setProperty('--m-par', `${Math.min(16, y * 0.045).toFixed(1)}px`);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* If the visitor turns on "reduce motion" while the page is open, show everything */
  if (reduce && reduce.addEventListener) {
    reduce.addEventListener('change', (ev) => {
      if (!ev.matches) return;
      $$('[data-reveal], .map').forEach((el) => el.classList.add('is-in'));
      document.documentElement.classList.remove('motion');
    });
  }
})();
