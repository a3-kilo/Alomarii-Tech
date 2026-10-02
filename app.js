(() => {
  'use strict';

  const SUPABASE_FUNCTION_URL = 'https://ltrtkzdszuvnmwppjxij.supabase.co/functions/v1/submit-lead';
  const allowedPlans = new Set(['Core AI', 'Scale AI', 'Nexus AI', 'Project Inquiry', 'General Inquiry']);

  let selectedPlan = null;
  let billingCycle = 'monthly';
  let requestStep = 1;
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

  /* Contact and project request modal */
  const requestModal = qs('#request-modal');
  const requestDialog = qs('.request-dialog', requestModal);
  const requestScroll = qs('#request-dialog-scroll');
  const requestForm = qs('#request-form');
  const requestSuccess = qs('#request-success');
  const requestEyebrow = qs('#request-eyebrow');
  const requestTitle = qs('#request-title');
  const requestDescription = qs('#request-description');
  const requestProgress = qs('#request-progress');
  const requestStepLabel = qs('#request-step-label');
  const requestStepCount = qs('#request-step-count');
  const requestProgressBar = qs('#request-progress-bar');
  const projectPlanBar = qs('#project-plan-bar');
  const modalPlanName = qs('#modal-plan-name');
  const modalPlanBilling = qs('#modal-plan-billing');
  const modalChangePlan = qs('#modal-change-plan');
  const modalPlanSelector = qs('#modal-plan-selector');
  const successEyebrow = qs('#request-success-eyebrow');
  const successTitle = qs('#request-success-title');
  const successMessage = qs('#request-success-message');
  const successLabel = qs('#request-success-label');
  const successValue = qs('#request-success-value');

  let requestMode = 'contact';
  let lastRequestTrigger = null;

  const isSpecificPlan = (plan) => ['Core AI', 'Scale AI', 'Nexus AI'].includes(plan);
  const normalizedPlan = () => allowedPlans.has(selectedPlan) ? selectedPlan : 'Project Inquiry';
  const planDisplayName = () => normalizedPlan() === 'Project Inquiry' ? 'Not sure yet' : normalizedPlan();
  const billingDisplay = () => billingCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing';

  const setRequestError = (message = '') => {
    qsa('.request-error', requestForm).forEach((el) => {
      el.textContent = message;
      el.hidden = !message;
    });
  };

  const renderPlanSummary = () => {
    const plan = normalizedPlan();
    if (modalPlanName) modalPlanName.textContent = planDisplayName();
    if (modalPlanBilling) {
      modalPlanBilling.textContent = isSpecificPlan(plan)
        ? billingDisplay()
        : 'We’ll recommend the right fit.';
    }

    qsa('[data-modal-plan]', requestForm).forEach((button) => {
      const active = button.dataset.modalPlan === plan;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const closePlanSelector = () => {
    if (!modalPlanSelector || !modalChangePlan) return;
    modalPlanSelector.hidden = true;
    modalChangePlan.setAttribute('aria-expanded', 'false');
  };

  const setRequestStep = (step, { focus = true } = {}) => {
    requestStep = Math.min(2, Math.max(1, step));
    setRequestError();
    closePlanSelector();

    qsa('[data-request-step]', requestForm).forEach((panel) => {
      const panelStep = Number(panel.dataset.requestStep);
      const active = requestMode === 'contact' ? panelStep === 1 : panelStep === requestStep;
      panel.hidden = !active;
    });

    if (requestMode === 'project') {
      if (requestProgress) requestProgress.hidden = false;
      if (requestStepLabel) requestStepLabel.textContent = requestStep === 1 ? 'Your details' : 'Project details';
      if (requestStepCount) requestStepCount.textContent = `${requestStep} of 2`;
      if (requestProgressBar) requestProgressBar.style.width = requestStep === 1 ? '50%' : '100%';
    } else if (requestProgress) {
      requestProgress.hidden = true;
    }

    if (requestScroll) {
      requestScroll.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }

    if (focus) {
      window.setTimeout(() => {
        const panel = qs(`[data-request-step="${requestStep}"]`, requestForm);
        const target = requestStep === 1
          ? qs('[name="fullName"]', panel)
          : qs('input[name="projectFocus"]', panel);
        target?.focus({ preventScroll: true });
      }, reduceMotion.matches ? 0 : 220);
    }

    refreshIcons();
  };

  const setModeVisibility = () => {
    if (!requestForm) return;
    requestForm.dataset.mode = requestMode;

    const projectMode = requestMode === 'project';
    if (projectPlanBar) projectPlanBar.hidden = !projectMode;
    if (requestProgress) requestProgress.hidden = !projectMode;

    const projectStepActions = qs('#project-step-one-actions');
    if (projectStepActions) projectStepActions.hidden = !projectMode;

    if (requestEyebrow) requestEyebrow.textContent = projectMode ? 'Start a project' : 'Contact Alomari Tech';
    if (requestTitle) requestTitle.textContent = projectMode ? 'Tell us what you’re building.' : 'Send us a message.';
    if (requestDescription) {
      requestDescription.textContent = projectMode
        ? 'Two short steps. We only ask for what helps us give you a useful first response.'
        : 'Have a question, partnership idea, or support request? Send a message and we’ll reply by email.';
    }
  };

  const resetRequestForm = () => {
    if (!requestForm) return;
    requestForm.reset();
    requestForm.hidden = false;
    if (requestSuccess) requestSuccess.hidden = true;
    setRequestError();
    closePlanSelector();
  };

  const getModalFocusable = () => qsa(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    requestDialog,
  ).filter((el) => !el.hidden && el.getClientRects().length > 0);

  const openRequestModal = (mode, planName = null, trigger = document.activeElement) => {
    if (!requestModal || !requestForm) return;

    requestMode = mode === 'project' ? 'project' : 'contact';
    lastRequestTrigger = trigger instanceof HTMLElement ? trigger : null;
    resetRequestForm();

    if (requestMode === 'project') {
      selectedPlan = allowedPlans.has(planName) && planName !== 'General Inquiry' ? planName : 'Project Inquiry';
    } else {
      selectedPlan = 'General Inquiry';
    }

    setModeVisibility();
    renderPlanSummary();
    setRequestStep(1, { focus: false });

    requestModal.hidden = false;
    requestModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('request-open');
    requestScroll?.scrollTo({ top: 0, behavior: 'auto' });

    window.requestAnimationFrame(() => {
      requestModal.classList.add('is-open');
      qs('[name="fullName"]', requestForm)?.focus({ preventScroll: true });
    });

    refreshIcons();
  };

  const closeRequestModal = ({ restoreFocus = true } = {}) => {
    if (!requestModal || requestModal.hidden) return;
    requestModal.classList.remove('is-open');
    requestModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('request-open');

    window.setTimeout(() => {
      requestModal.hidden = true;
      if (restoreFocus && lastRequestTrigger instanceof HTMLElement) lastRequestTrigger.focus({ preventScroll: true });
    }, reduceMotion.matches ? 0 : 180);
  };

  qsa('[data-contact-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      if (mobileMenu?.classList.contains('open')) closeMobileMenu({ restoreFocus: false });
      openRequestModal('contact', null, trigger);
    });
  });

  qsa('[data-project-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      if (mobileMenu?.classList.contains('open')) closeMobileMenu({ restoreFocus: false });
      openRequestModal('project', 'Project Inquiry', trigger);
    });
  });

  qsa('[data-close-request]', requestModal).forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeRequestModal();
    });
  });

  modalChangePlan?.addEventListener('click', () => {
    const opening = modalPlanSelector?.hidden !== false;
    if (modalPlanSelector) modalPlanSelector.hidden = !opening;
    modalChangePlan.setAttribute('aria-expanded', String(opening));
    if (opening) qs('[data-modal-plan]', modalPlanSelector)?.focus();
  });

  qsa('[data-modal-plan]', requestForm).forEach((button) => {
    button.addEventListener('click', () => {
      selectedPlan = allowedPlans.has(button.dataset.modalPlan) ? button.dataset.modalPlan : 'Project Inquiry';
      renderPlanSummary();
      closePlanSelector();
      modalChangePlan?.focus();
    });
  });

  window.selectPlan = (planName) => {
    const plan = isSpecificPlan(planName) ? planName : 'Project Inquiry';
    openRequestModal('project', plan, document.activeElement);
  };

  const validateIdentity = () => {
    if (!requestForm) return false;
    const formData = new FormData(requestForm);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();

    if (fullName.length < 2) {
      setRequestError('Please enter your name.');
      qs('[name="fullName"]', requestForm)?.focus();
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRequestError('Please enter a valid email address.');
      qs('[name="email"]', requestForm)?.focus();
      return false;
    }

    return true;
  };

  const validateContact = () => {
    if (!validateIdentity()) return false;
    const message = String(new FormData(requestForm).get('contactMessage') || '').trim();
    if (message.length < 5) {
      setRequestError('Please add a short message so we know how to help.');
      qs('[name="contactMessage"]', requestForm)?.focus();
      return false;
    }
    setRequestError();
    return true;
  };

  const validateProjectDetails = () => {
    const formData = new FormData(requestForm);
    const focus = String(formData.get('projectFocus') || '').trim();
    const timeline = String(formData.get('timeline') || '').trim();
    const message = String(formData.get('projectMessage') || '').trim();

    if (!focus) {
      setRequestError('Choose the option that best matches the project.');
      qs('input[name="projectFocus"]', requestForm)?.focus();
      return false;
    }

    if (!timeline) {
      setRequestError('Choose a timeframe. “Just exploring” is completely fine.');
      qs('input[name="timeline"]', requestForm)?.focus();
      return false;
    }

    if (message.length < 10) {
      setRequestError('Tell us a little about the outcome you want. Two or three sentences is enough.');
      qs('[name="projectMessage"]', requestForm)?.focus();
      return false;
    }

    setRequestError();
    return true;
  };

  qs('[data-project-next]', requestForm)?.addEventListener('click', () => {
    if (!validateIdentity()) return;
    setRequestStep(2);
  });

  qs('[data-project-back]', requestForm)?.addEventListener('click', () => setRequestStep(1));

  requestForm?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.target?.tagName === 'TEXTAREA') return;
    if (event.target?.matches('input[type="radio"]')) return;

    if (requestMode === 'project' && requestStep === 1) {
      event.preventDefault();
      if (validateIdentity()) setRequestStep(2);
    }
  });

  const setSubmitting = (submitting) => {
    qsa('[data-submit-request]', requestForm).forEach((button) => {
      button.disabled = submitting;
    });
    qsa('[data-submit-label]', requestForm).forEach((label) => { label.hidden = submitting; });
    qsa('[data-submit-loading]', requestForm).forEach((loading) => { loading.hidden = !submitting; });
  };

  requestForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const valid = requestMode === 'contact'
      ? validateContact()
      : validateIdentity() && validateProjectDetails();
    if (!valid) return;

    const formData = new FormData(requestForm);
    const plan = requestMode === 'contact' ? 'General Inquiry' : normalizedPlan();
    const email = String(formData.get('email') || '').trim();
    const projectSummary = requestMode === 'contact'
      ? String(formData.get('contactMessage') || '').trim()
      : String(formData.get('projectMessage') || '').trim();

    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email,
      phone: String(formData.get('phone') || '').trim(),
      company: requestMode === 'project' ? String(formData.get('company') || '').trim() : '',
      selectedPlan: plan,
      billingCycle: requestMode === 'project' && isSpecificPlan(plan) ? billingCycle : null,
      projectSummary,
      website: String(formData.get('website') || '').trim(),
      answers: requestMode === 'contact'
        ? {
            request_type: 'Contact message',
          }
        : {
            request_type: 'Project request',
            project_focus: String(formData.get('projectFocus') || '').trim(),
            timeline: String(formData.get('timeline') || '').trim(),
            current_tools: String(formData.get('currentTools') || '').trim(),
          },
    };

    setSubmitting(true);
    setRequestError();

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

      requestForm.hidden = true;
      if (requestSuccess) requestSuccess.hidden = false;

      if (requestMode === 'contact') {
        if (successEyebrow) successEyebrow.textContent = 'Message sent';
        if (successTitle) successTitle.textContent = 'Thanks. We’ve got your message.';
        if (successMessage) {
          successMessage.textContent = result.emailSent === false
            ? 'Your message is saved with our team. We’ll reply using the email you provided.'
            : 'A confirmation is on its way to your inbox. We’ll reply as soon as we can.';
        }
        if (successLabel) successLabel.textContent = 'Confirmation';
        if (successValue) successValue.textContent = email;
      } else {
        if (successEyebrow) successEyebrow.textContent = 'Project request received';
        if (successTitle) successTitle.textContent = 'You’re all set.';
        if (successMessage) {
          successMessage.textContent = result.emailSent === false
            ? 'Your request is safely saved with our team. We’ll follow up using the details you submitted.'
            : 'We sent you a confirmation and your request is now with our team.';
        }
        if (successLabel) successLabel.textContent = 'Request';
        if (successValue) {
          const planText = plan === 'Project Inquiry' ? 'Project · plan not selected' : `${plan}${isSpecificPlan(plan) ? ` · ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}` : ''}`;
          successValue.textContent = planText;
        }
      }

      requestScroll?.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      requestSuccess?.focus({ preventScroll: true });
    } catch (error) {
      console.error('Website request failed:', error);
      const message = error?.name === 'AbortError'
        ? 'The request took too long. Please check your connection and try again.'
        : error?.message || 'Something went wrong. Please try again or email us directly.';
      setRequestError(message);
    } finally {
      window.clearTimeout(timeout);
      setSubmitting(false);
      refreshIcons();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!requestModal || requestModal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeRequestModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getModalFocusable();
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


  /* Smooth in-page navigation */
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
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
    refreshIcons();
    if (reduceMotion.matches) revealElements.forEach((el) => el.classList.add('visible'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.addEventListener('load', refreshIcons, { once: true });
})();
