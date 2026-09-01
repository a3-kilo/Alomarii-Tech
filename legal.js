(() => {
  'use strict';
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = qs('#legal-progress');
  const sections = qsa('.legal-section[id]');
  const tocLinks = qsa('.legal-toc a[href^="#"]');
  let lastY = window.scrollY;
  let direction = 'down';
  let ticking = false;

  document.documentElement.classList.add('legal-js');
  document.body.classList.add('legal-motion-ready');

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  };

  const updateScroll = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) > 3) direction = delta > 0 ? 'down' : 'up';
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
    lastY = Math.max(0, y);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });
  updateScroll();

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    qsa('.legal-reveal').forEach((el) => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.dataset.from = direction === 'up' ? 'top' : 'bottom';
          window.requestAnimationFrame(() => el.classList.add('visible'));
        } else {
          const r = entry.boundingClientRect;
          if ((r.bottom < -100 || r.top > innerHeight + 100) && el.classList.contains('visible')) {
            el.classList.add('instant-reset');
            el.classList.remove('visible');
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('instant-reset')));
          }
        }
      });
    }, { threshold: .08, rootMargin: '-5% 0px -5% 0px' });
    qsa('.legal-reveal').forEach((el) => revealObserver.observe(el));
  }

  if ('IntersectionObserver' in window && sections.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .1, .5] });
    sections.forEach((section) => activeObserver.observe(section));
  }

  tocLinks.forEach((link) => link.addEventListener('click', (event) => {
    const target = qs(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshIcons, { once: true });
  else refreshIcons();
  window.addEventListener('load', refreshIcons, { once: true });
})();
