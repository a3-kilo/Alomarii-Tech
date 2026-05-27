/**
 * ALOMARI TECH — Static JavaScript
 * Replaces: React + Framer Motion + Firebase
 * All interactivity, animations, and form handling recreated in vanilla JS
 */

'use strict';

// ── Initialize Lucide Icons ──────────────────────────────────
lucide.createIcons();

// ── Global State ─────────────────────────────────────────────
let selectedPlan = null;
let billingCycle = 'monthly';

// ============================================================
// SCROLL PROGRESS BAR
// ============================================================
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + '%';
}, { passive: true });

// ============================================================
// NAVBAR — Scroll State
// ============================================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ============================================================
// MOBILE MENU
// ============================================================
const mobileToggle = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileBackdrop = document.getElementById('mobile-backdrop');
const mobileClose = document.getElementById('mobile-close');
const menuIcon = document.getElementById('menu-icon');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  mobileBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  mobileBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
}

mobileToggle.addEventListener('click', () => {
  if (mobileMenu.classList.contains('open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});
mobileClose.addEventListener('click', closeMobileMenu);
mobileBackdrop.addEventListener('click', closeMobileMenu);

// Close on nav link click
document.querySelectorAll('[data-close-menu]').forEach(el => {
  el.addEventListener('click', closeMobileMenu);
});

// ============================================================
// PARTICLES
// ============================================================
const particlesContainer = document.getElementById('particles-container');
if (particlesContainer) {
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = (Math.random() * 10 + 10);
    const delay = Math.random() * 10;
    p.style.cssText = `
      left: ${x}%;
      top: ${y}%;
      animation-duration: ${duration}s;
      animation-delay: -${delay}s;
      opacity: ${Math.random() * 0.4 + 0.1};
      width: ${Math.random() > 0.7 ? 6 : 4}px;
      height: ${Math.random() > 0.7 ? 6 : 4}px;
    `;
    particlesContainer.appendChild(p);
  }
}

// ============================================================
// HERO SPOTLIGHT — Mouse Follow
// ============================================================
const heroSection = document.getElementById('hero');
const heroSpotlight = document.getElementById('hero-spotlight');
if (heroSection && heroSpotlight) {
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heroSpotlight.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(124,111,224,0.08), transparent 40%)`;
  });
}

// ============================================================
// SPOTLIGHT CARDS — Mouse Follow Glow
// ============================================================
document.querySelectorAll('.spotlight-card').forEach(card => {
  // Create the spotlight element
  const spotlight = document.createElement('div');
  spotlight.className = 'card-spotlight';
  card.insertBefore(spotlight, card.firstChild);

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlight.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(124,111,224,0.1), transparent 40%)`;
  });
});

// ============================================================
// MAGNETIC BUTTONS
// ============================================================
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.3;
    const dy = (e.clientY - cy) * 0.3;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0,0)';
  });
});

// ============================================================
// REVEAL ON SCROLL (IntersectionObserver)
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '-60px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

// ============================================================
// BILLING TOGGLE
// ============================================================
const billingToggleBtn = document.getElementById('billing-toggle');
const toggleKnob = document.getElementById('toggle-knob');
const labelMonthly = document.getElementById('label-monthly');
const labelYearly = document.getElementById('label-yearly');

function updatePrices() {
  document.querySelectorAll('.pricing-price').forEach(el => {
    const val = billingCycle === 'monthly' ? el.dataset.monthly : el.dataset.yearly;
    el.textContent = val;
  });
  document.querySelectorAll('.pricing-period').forEach(el => {
    el.textContent = billingCycle === 'monthly' ? '/mo' : '/yr';
  });
}

if (billingToggleBtn) {
  billingToggleBtn.addEventListener('click', () => {
    billingCycle = billingCycle === 'monthly' ? 'yearly' : 'monthly';
    if (billingCycle === 'yearly') {
      toggleKnob.classList.add('yearly');
      labelYearly.classList.add('active');
      labelMonthly.classList.remove('active');
    } else {
      toggleKnob.classList.remove('yearly');
      labelMonthly.classList.add('active');
      labelYearly.classList.remove('active');
    }
    updatePrices();
  });
}

// ============================================================
// PLAN SELECTION
// ============================================================
window.selectPlan = function(planName) {
  selectedPlan = planName;

  // Update left panel banner
  const banner = document.getElementById('selected-plan-banner');
  const bannerName = document.getElementById('selected-plan-name');
  if (banner && bannerName) {
    if (planName) {
      bannerName.textContent = planName;
      banner.style.display = 'flex';
      banner.style.animation = 'none';
      banner.offsetHeight; // reflow
      banner.style.animation = 'slideInBanner 0.4s ease forwards';
    } else {
      banner.style.display = 'none';
    }
  }

  // Update form plan row
  const formPlanRow = document.getElementById('form-plan-row');
  const formPlanText = document.getElementById('form-plan-text');
  if (formPlanRow && formPlanText) {
    if (planName) {
      formPlanText.textContent = `Selected Plan: ${planName}`;
      formPlanRow.style.display = 'flex';
    } else {
      formPlanRow.style.display = 'none';
    }
  }

  // Scroll to contact
  if (planName) {
    const contact = document.getElementById('contact');
    if (contact) {
      setTimeout(() => {
        contact.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  // Re-init lucide icons for any new SVGs
  lucide.createIcons();
};

// Add CSS for banner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInBanner {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);

// ============================================================
// ACCORDION (FAQ)
// ============================================================
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', function() {
    const idx = this.dataset.accordion;
    const content = document.getElementById(`accordion-content-${idx}`);
    const icon = this.querySelector('.accordion-icon');
    const isOpen = this.getAttribute('aria-expanded') === 'true';

    // Close all
    document.querySelectorAll('.accordion-trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.accordion-content').forEach(c => {
      c.style.maxHeight = '0';
    });

    // Open current if it was closed
    if (!isOpen) {
      this.setAttribute('aria-expanded', 'true');
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
  trigger.setAttribute('aria-expanded', 'false');
});

// ============================================================
// CONTACT FORM — Local Submission (replaces Firebase)
// ============================================================
const contactForm = document.getElementById('contact-form');
const contactSuccess = document.getElementById('contact-success');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitLoading = document.getElementById('submit-loading');
const formError = document.getElementById('form-error');

window.resetForm = function() {
  contactSuccess.style.display = 'none';
  contactForm.style.display = 'flex';
  lucide.createIcons();
};

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      company: formData.get('company'),
      message: formData.get('message'),
      selectedPlan: selectedPlan || 'General Inquiry',
      timestamp: new Date().toISOString()
    };

    // Validate
    if (!data.fullName || !data.email || !data.message) {
      formError.textContent = 'Please fill in all required fields.';
      formError.style.display = 'block';
      return;
    }

    formError.style.display = 'none';

    // Show loading state
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline-flex';

    // Simulate network request (replaces Firebase addDoc)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log to console (visible in dev tools — replace with mailto: or Formspree in production)
    console.log('Form submission:', data);

    // For production: use Formspree, Netlify Forms, or EmailJS
    // Example Formspree: fetch('https://formspree.io/f/YOUR_ID', { method: 'POST', body: JSON.stringify(data), headers: {'Content-Type':'application/json'} })

    // Show success
    submitBtn.disabled = false;
    submitText.style.display = 'inline-flex';
    submitLoading.style.display = 'none';
    contactForm.style.display = 'none';
    contactSuccess.style.display = 'flex';

    // Re-init icons
    lucide.createIcons();

    // Reset form fields
    e.target.reset();
    selectPlan(null);
  });
}

// ============================================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================================
// PARALLAX ORBS on Hero (lightweight version)
// ============================================================
const heroOrbLeft = document.querySelector('.hero-orb-left');
const heroOrbRight = document.querySelector('.hero-orb-right');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY < window.innerHeight && heroOrbLeft && heroOrbRight) {
    heroOrbLeft.style.transform = `translateY(${scrollY * 0.4}px)`;
    heroOrbRight.style.transform = `translateY(${-scrollY * 0.3}px)`;
  }
}, { passive: true });

// ============================================================
// STAGGERED ANIMATION for process steps connector lines
// ============================================================
const stepConnectors = document.querySelectorAll('.step-connector-h');
const connectorObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.width = '2rem';
        entry.target.style.opacity = '1';
      }, i * 300);
    }
  });
}, { threshold: 0.5 });

stepConnectors.forEach(c => {
  c.style.width = '0';
  c.style.opacity = '0';
  c.style.transition = 'width 1s ease, opacity 0.5s ease';
  connectorObserver.observe(c);
});

// ============================================================
// NEWSLETTER FORM
// ============================================================
const newsletterInput = document.querySelector('.newsletter-input');
const newsletterBtn = document.querySelector('.newsletter-row .btn-icon');
if (newsletterBtn) {
  newsletterBtn.addEventListener('click', () => {
    if (newsletterInput && newsletterInput.value) {
      const email = newsletterInput.value;
      console.log('Newsletter signup:', email);
      newsletterInput.value = '';
      newsletterInput.placeholder = 'Subscribed! ✓';
      setTimeout(() => {
        newsletterInput.placeholder = 'Email address';
      }, 3000);
    }
  });
}

// ============================================================
// FINALIZE — Re-init icons after DOM modifications
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Animate hero badge with slide-in
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) {
    heroBadge.style.opacity = '0';
    heroBadge.style.transform = 'translateY(20px)';
    heroBadge.style.transition = 'opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s';
    setTimeout(() => {
      heroBadge.style.opacity = '1';
      heroBadge.style.transform = 'translateY(0)';
    }, 100);
  }
});

// Safe fallback: re-create icons after all dynamic content
setTimeout(() => {
  lucide.createIcons();
}, 500);