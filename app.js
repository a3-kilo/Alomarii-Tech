(() => {
  'use strict';

  const SUPABASE_FUNCTION_URL = 'https://ltrtkzdszuvnmwppjxij.supabase.co/functions/v1/submit-lead';
  const allowedPlans = new Set(['Core AI', 'Scale AI', 'Nexus AI', 'General Inquiry']);

  let selectedPlan = null;
  let billingCycle = 'monthly';
  let currentStep = 1;
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

  /* Mobile navigation */
  const mobileToggle = qs('#mobile-toggle');
  const mobileClose = qs('#mobile-close');
  const mobileMenu = qs('#mobile-menu');
  const mobileBackdrop = qs('#mobile-backdrop');
  let lastFocusedElement = null;

  const getFocusable = () => qsa(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    mobileMenu,
  ).filter((el) => !el.hasAttribute('hidden'));

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

  /* Existing reveal motion is intentionally preserved. */
  const revealElements = qsa('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('visible'));
  } else {
    const resetReveal = (el) => {
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

  /* Pricing */
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
      renderPlanSummary();
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

  /* FAQ */
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

  /* Project enquiry flow */
  const contactForm = qs('#contact-form');
  const contactSuccess = qs('#contact-success');
  const projectFormShell = qs('#project-form-shell');
  const submitBtn = qs('#submit-btn');
  const submitText = qs('#submit-text');
  const submitLoading = qs('#submit-loading');
  const formError = qs('#form-error-global');
  const inlinePlanSelector = qs('#inline-plan-selector');
  const changePlanBtn = qs('#change-plan-btn');
  const formPlanName = qs('#form-plan-name');
  const formPlanBilling = qs('#form-plan-billing');
  const reviewPlan = qs('#review-plan');
  const reviewFocus = qs('#review-focus');
  const reviewTimeline = qs('#review-timeline');
  const stepLabel = qs('#form-step-label');
  const stepCount = qs('#form-step-count');
  const progressBar = qs('#form-progress-bar');

  const stepLabels = {
    1: 'Your details',
    2: 'Your project',
    3: 'Timing & review',
  };

  const normalizedPlan = () => allowedPlans.has(selectedPlan) ? selectedPlan : 'General Inquiry';
  const planDisplayName = () => normalizedPlan() === 'General Inquiry' ? 'Not sure yet' : normalizedPlan();
  const billingDisplay = () => billingCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing';

  const setFormError = (message = '') => {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = !message;
  };

  const renderPlanSummary = () => {
    const plan = normalizedPlan();
    const display = planDisplayName();

    if (formPlanName) formPlanName.textContent = display;
    if (formPlanBilling) {
      formPlanBilling.textContent = plan === 'General Inquiry'
        ? "We'll help you choose the right fit."
        : billingDisplay();
    }

    if (reviewPlan) {
      reviewPlan.textContent = plan === 'General Inquiry'
        ? 'Not sure yet'
        : `${plan} · ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`;
    }

    qsa('.inline-plan-option').forEach((button) => {
      const active = button.dataset.plan === plan;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const renderReview = () => {
    renderPlanSummary();
    const focus = qs('input[name="projectFocus"]:checked', contactForm)?.value || '—';
    const timeline = qs('input[name="timeline"]:checked', contactForm)?.value || '—';
    if (reviewFocus) reviewFocus.textContent = focus;
    if (reviewTimeline) reviewTimeline.textContent = timeline;
  };

  const setStep = (step, { focus = true } = {}) => {
    currentStep = Math.min(3, Math.max(1, step));
    setFormError();

    qsa('[data-form-step]', contactForm).forEach((panel) => {
      const active = Number(panel.dataset.formStep) === currentStep;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    if (stepLabel) stepLabel.textContent = stepLabels[currentStep];
    if (stepCount) stepCount.textContent = `${currentStep} of 3`;
    if (progressBar) progressBar.style.width = `${(currentStep / 3) * 100}%`;

    if (currentStep === 3) renderReview();

    if (focus) {
      window.requestAnimationFrame(() => {
        const panel = qs(`[data-form-step="${currentStep}"]`, contactForm);
        const target = qs('input:not([type="radio"]):not([tabindex="-1"]), textarea, input[type="radio"]', panel);
        target?.focus({ preventScroll: true });
      });
    }

    refreshIcons();
  };

  const validateStep = (step) => {
    if (!contactForm) return false;
    const formData = new FormData(contactForm);

    if (step === 1) {
      const fullName = String(formData.get('fullName') || '').trim();
      const email = String(formData.get('email') || '').trim();

      if (fullName.length < 2) {
        setFormError('Please enter your name.');
        qs('[name="fullName"]', contactForm)?.focus();
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormError('Please enter a valid email address.');
        qs('[name="email"]', contactForm)?.focus();
        return false;
      }
    }

    if (step === 2) {
      const focus = String(formData.get('projectFocus') || '').trim();
      const message = String(formData.get('message') || '').trim();

      if (!focus) {
        setFormError('Choose the option that best matches your project.');
        qs('input[name="projectFocus"]', contactForm)?.focus();
        return false;
      }

      if (message.length < 10) {
        setFormError('Tell us a little about what you want to improve or build.');
        qs('[name="message"]', contactForm)?.focus();
        return false;
      }
    }

    if (step === 3) {
      const timeline = String(formData.get('timeline') || '').trim();
      if (!timeline) {
        setFormError('Choose a timeframe so we can prepare the right next step.');
        qs('input[name="timeline"]', contactForm)?.focus();
        return false;
      }
    }

    setFormError();
    return true;
  };

  const closePlanSelector = () => {
    if (!inlinePlanSelector || !changePlanBtn) return;
    inlinePlanSelector.hidden = true;
    changePlanBtn.setAttribute('aria-expanded', 'false');
  };

  const togglePlanSelector = () => {
    if (!inlinePlanSelector || !changePlanBtn) return;
    const opening = inlinePlanSelector.hidden;
    inlinePlanSelector.hidden = !opening;
    changePlanBtn.setAttribute('aria-expanded', String(opening));
    if (opening) qs('.inline-plan-option', inlinePlanSelector)?.focus();
  };

  changePlanBtn?.addEventListener('click', togglePlanSelector);

  qsa('.inline-plan-option').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPlan = allowedPlans.has(button.dataset.plan) ? button.dataset.plan : null;
      renderPlanSummary();
      closePlanSelector();
      changePlanBtn?.focus();
    });
  });

  window.selectPlan = (planName) => {
    selectedPlan = allowedPlans.has(planName) ? planName : null;
    renderPlanSummary();
    closePlanSelector();
    setStep(1, { focus: false });

    if (selectedPlan && projectFormShell) {
      projectFormShell.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });

      window.setTimeout(() => {
        qs('[name="fullName"]', contactForm)?.focus({ preventScroll: true });
      }, reduceMotion.matches ? 0 : 520);
    }
  };

  qsa('[data-next-step]', contactForm).forEach((button) => {
    button.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      setStep(currentStep + 1);
    });
  });

  qsa('[data-prev-step]', contactForm).forEach((button) => {
    button.addEventListener('click', () => setStep(currentStep - 1));
  });

  qsa('input[name="projectFocus"], input[name="timeline"]', contactForm).forEach((input) => {
    input.addEventListener('change', renderReview);
  });

  contactForm?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.target?.tagName === 'TEXTAREA') return;
    if (currentStep >= 3) return;
    if (event.target?.matches('input[type="radio"]')) return;

    event.preventDefault();
    if (validateStep(currentStep)) setStep(currentStep + 1);
  });

  const setSubmitting = (submitting) => {
    if (submitBtn) submitBtn.disabled = submitting;
    if (submitText) submitText.hidden = submitting;
    if (submitLoading) submitLoading.hidden = !submitting;
  };

  window.resetForm = () => {
    if (!contactForm || !contactSuccess) return;
    contactForm.reset();
    selectedPlan = null;
    currentStep = 1;
    closePlanSelector();
    renderPlanSummary();
    renderReview();
    setStep(1, { focus: false });
    setFormError();
    contactSuccess.hidden = true;
    contactForm.hidden = false;

    window.requestAnimationFrame(() => {
      qs('[name="fullName"]', contactForm)?.focus();
    });

    refreshIcons();
  };

  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const plan = normalizedPlan();
    const email = String(formData.get('email') || '').trim();
    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email,
      phone: String(formData.get('phone') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      selectedPlan: plan,
      billingCycle: plan === 'General Inquiry' ? null : billingCycle,
      projectSummary: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || '').trim(),
      answers: {
        project_focus: String(formData.get('projectFocus') || '').trim(),
        timeline: String(formData.get('timeline') || '').trim(),
        current_tools: String(formData.get('currentTools') || '').trim(),
      },
    };

    setSubmitting(true);
    setFormError();

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'We could not send your request. Please try again.');
      }

      const successPlan = qs('#success-plan');
      const successEmail = qs('#success-email');
      const successMessage = qs('#success-message');

      if (successPlan) {
        successPlan.textContent = plan === 'General Inquiry'
          ? 'General inquiry'
          : `${plan} · ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`;
      }
      if (successEmail) successEmail.textContent = email;
      if (successMessage) {
        successMessage.textContent = result.emailSent === false
          ? 'Your request is saved with our team. If you do not see a confirmation email, we can still follow up from the details you submitted.'
          : 'We sent a confirmation email and your project request is now with our team.';
      }

      form.hidden = true;
      if (contactSuccess) {
        contactSuccess.hidden = false;
        contactSuccess.focus({ preventScroll: true });
      }
    } catch (error) {
      console.error('Project request failed:', error);
      const message = error?.name === 'AbortError'
        ? 'The request took too long. Please check your connection and try again.'
        : error?.message || 'Something went wrong. Please try again or email us directly.';
      setFormError(message);
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
      refreshIcons();
    }
  });

  /* Smooth in-page navigation */
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
    renderPlanSummary();
    renderReview();
    setStep(1, { focus: false });
    refreshIcons();
    if (reduceMotion.matches) revealElements.forEach((el) => el.classList.add('visible'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.addEventListener('load', refreshIcons, { once: true });
})();
