(() => {
  'use strict';

  let selectedPlan = null;
  let billingCycle = 'monthly';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const navbar = qs('#navbar');
  const progress = qs('#scroll-progress');
  let lastScrollY = window.scrollY;
  let scrollDirection = 'down';
  let scrollTicking = false;

  const updateScrollUI = () => {
    const y = window.scrollY;
    const delta = y - lastScrollY;
    if (Math.abs(delta) > 3) scrollDirection = delta > 0 ? 'down' : 'up';

    // Keep the navigation stable. Scrolling only changes its surface treatment;
    // it never auto-hides, which avoids the distracting disappear/reappear cycle.
    navbar?.classList.toggle('scrolled', y > 12);

    if (progress) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(y / scrollable, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
    lastScrollY = Math.max(y, 0);
    scrollTicking = false;
  };

  const onScroll = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  };

  updateScrollUI();
  window.addEventListener('scroll', onScroll, { passive: true });

  const mobileToggle = qs('#mobile-toggle');
  const mobileClose = qs('#mobile-close');
  const mobileMenu = qs('#mobile-menu');
  const mobileBackdrop = qs('#mobile-backdrop');
  let lastFocusedElement = null;

  const getFocusable = () => qsa('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', mobileMenu)
    .filter((el) => !el.hasAttribute('hidden'));

  const openMobileMenu = () => {
    if (!mobileMenu || !mobileBackdrop || !mobileToggle) return;
    lastFocusedElement = document.activeElement;
    mobileMenu.classList.add('open');
    mobileBackdrop.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.removeAttribute('inert');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    getFocusable()[0]?.focus();
  };

  const closeMobileMenu = ({ restoreFocus = true } = {}) => {
    if (!mobileMenu || !mobileBackdrop || !mobileToggle) return;
    mobileMenu.classList.remove('open');
    mobileBackdrop.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('inert', '');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (restoreFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  };

  mobileToggle?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeMobileMenu() : openMobileMenu());
  mobileClose?.addEventListener('click', () => closeMobileMenu());
  mobileBackdrop?.addEventListener('click', () => closeMobileMenu());
  qsa('[data-close-menu]').forEach((el) => el.addEventListener('click', () => closeMobileMenu({ restoreFocus: false })));

  document.addEventListener('keydown', (event) => {
    if (!mobileMenu?.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMobileMenu();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const revealElements = qsa('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('visible'));
  } else {
    const resetReveal = (el) => {
      // Re-arm only after the element has completely left the viewport. This lets
      // sections respond in both directions without flickering at the viewport edge.
      el.classList.add('reveal-reset');
      el.classList.remove('visible');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => el.classList.remove('reveal-reset'));
      });
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.dataset.revealFrom = scrollDirection === 'up' ? 'top' : 'bottom';
          window.requestAnimationFrame(() => el.classList.add('visible'));
          return;
        }

        const rect = entry.boundingClientRect;
        const fullyOutside = rect.bottom < -110 || rect.top > window.innerHeight + 110;
        if (fullyOutside && el.classList.contains('visible')) resetReveal(el);
      });
    }, { threshold: 0.1, rootMargin: '-6% 0px -6% 0px' });

    revealElements.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 28}ms`);
      revealObserver.observe(el);
    });
  }

  const billingToggle = qs('#billing-toggle');
  const labelMonthly = qs('#label-monthly');
  const labelYearly = qs('#label-yearly');

  const updatePrices = () => {
    qsa('.pricing-price-row').forEach((row) => row.classList.add('changing'));
    const apply = () => {
      qsa('.pricing-price').forEach((price) => {
        price.textContent = billingCycle === 'monthly' ? price.dataset.monthly : price.dataset.yearly;
      });
      qsa('.pricing-period').forEach((period) => {
        period.textContent = billingCycle === 'monthly' ? '/mo' : '/yr';
      });
      qsa('.pricing-price-row').forEach((row) => row.classList.remove('changing'));
    };
    if (reduceMotion.matches) apply();
    else window.setTimeout(apply, 140);
  };

  billingToggle?.addEventListener('click', () => {
    billingCycle = billingCycle === 'monthly' ? 'yearly' : 'monthly';
    const yearly = billingCycle === 'yearly';
    billingToggle.setAttribute('aria-checked', String(yearly));
    billingToggle.setAttribute('aria-label', yearly ? 'Switch to monthly billing' : 'Switch to yearly billing');
    labelMonthly?.classList.toggle('active', !yearly);
    labelYearly?.classList.toggle('active', yearly);
    updatePrices();
  });

  window.selectPlan = (planName) => {
    selectedPlan = planName || null;
    const banner = qs('#selected-plan-banner');
    const bannerName = qs('#selected-plan-name');
    const formPlanRow = qs('#form-plan-row');
    const formPlanText = qs('#form-plan-text');

    if (banner && bannerName) {
      banner.hidden = !selectedPlan;
      bannerName.textContent = selectedPlan || '';
    }
    if (formPlanRow && formPlanText) {
      formPlanRow.hidden = !selectedPlan;
      formPlanText.textContent = selectedPlan ? `Selected Plan: ${selectedPlan}` : '';
    }

    if (selectedPlan) {
      qs('#contact')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    refreshIcons();
  };

  qsa('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const controls = trigger.getAttribute('aria-controls');
      const content = controls ? qs(`#${controls}`) : null;
      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';

      qsa('.accordion-trigger').forEach((item) => item.setAttribute('aria-expanded', 'false'));
      qsa('.accordion-content').forEach((item) => {
        item.classList.remove('open');
        item.setAttribute('aria-hidden', 'true');
      });

      if (willOpen && content) {
        trigger.setAttribute('aria-expanded', 'true');
        content.classList.add('open');
        content.setAttribute('aria-hidden', 'false');
      }
    });
  });

  const contactForm = qs('#contact-form');
  const contactSuccess = qs('#contact-success');
  const submitBtn = qs('#submit-btn');
  const submitText = qs('#submit-text');
  const submitLoading = qs('#submit-loading');
  const formError = qs('#form-error');

  const setFormError = (message = '') => {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = !message;
  };

  window.resetForm = () => {
    if (!contactForm || !contactSuccess) return;
    contactSuccess.hidden = true;
    contactForm.hidden = false;
    setFormError();
    contactForm.querySelector('input')?.focus();
    refreshIcons();
  };

  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      selectedPlan: selectedPlan || 'General Inquiry',
      timestamp: new Date().toISOString()
    };

    if (!data.fullName || !data.email || !data.message) {
      setFormError('Please fill in all required fields.');
      const invalid = !data.fullName ? qs('[name="fullName"]', form) : !data.email ? qs('[name="email"]', form) : qs('[name="message"]', form);
      invalid?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setFormError('Please enter a valid work email address.');
      qs('[name="email"]', form)?.focus();
      return;
    }

    setFormError();
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.hidden = true;
    if (submitLoading) submitLoading.hidden = false;

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      console.log('Form submission:', data);

      form.reset();
      window.selectPlan(null);
      form.hidden = true;
      if (contactSuccess) {
        contactSuccess.hidden = false;
        contactSuccess.focus();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      setFormError('Something went wrong. Please try again or email us directly.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.hidden = false;
      if (submitLoading) submitLoading.hidden = true;
      refreshIcons();
    }
  });

  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = qs(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const initialize = () => {
    refreshIcons();
    if (reduceMotion.matches) revealElements.forEach((el) => el.classList.add('visible'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.addEventListener('load', refreshIcons, { once: true });
})();
