const year = document.getElementById('year');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const revealItems = document.querySelectorAll('.reveal');
const contactForm = document.getElementById('contact-form');

if (year) year.textContent = new Date().getFullYear();

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (contactForm) {
  const status = contactForm.querySelector('.form-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const successUrl = contactForm.dataset.successUrl || '/thanks';
  const isInternalAction = new URL(contactForm.action, window.location.href).origin === window.location.origin;

  if (isInternalAction) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (status) {
        status.hidden = false;
        status.textContent = 'Enviando mensaje...';
      }

      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: contactForm.method,
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Respuesta no exitosa');
        }

        window.location.assign(successUrl);
      } catch (error) {
        if (status) {
          status.textContent = 'No pudimos enviar el mensaje. Intenta nuevamente en unos segundos.';
        }
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
}
