(() => {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const toast = (message, { actionLabel, onAction } = {}) => {
    const region = qs('#ToastRegion');
    if (!region) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <p class="toast__msg">${message}</p>
      <div class="row" style="gap:8px;align-items:center;flex-direction:row">
        ${actionLabel ? `<button class="toast__btn" data-toast-action>${actionLabel}</button>` : ''}
        <button class="toast__btn" aria-label="Close" data-toast-close>✕</button>
      </div>
    `;
    const close = () => {
      el.remove();
    };
    el.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.matches('[data-toast-close]')) close();
      if (t.matches('[data-toast-action]') && typeof onAction === 'function') {
        onAction();
        close();
      }
    });
    region.appendChild(el);
    window.setTimeout(() => close(), 5200);
  };

  const drawer = (() => {
    const backdrop = qs('[data-drawer-backdrop]');
    const panel = qs('[data-drawer]');
    if (!backdrop || !panel) return null;
    const open = () => {
      panel.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      panel.setAttribute('aria-hidden', 'false');
    };
    const close = () => {
      panel.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      panel.setAttribute('aria-hidden', 'true');
    };
    backdrop.addEventListener('click', close);
    qsa('[data-drawer-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    return { open, close };
  })();

  qsa('[data-drawer-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.open();
    });
  });

  // Product gallery thumbs
  qsa('[data-gallery]').forEach((gallery) => {
    const main = qs('[data-gallery-main]', gallery);
    const thumbs = qsa('[data-gallery-thumb]', gallery);
    if (!main || thumbs.length === 0) return;
    thumbs.forEach((t) => {
      t.addEventListener('click', () => {
        const src = t.getAttribute('data-src');
        if (!src) return;
        const img = main.querySelector('img');
        if (img) img.src = src;
        thumbs.forEach((x) => x.setAttribute('aria-current', 'false'));
        t.setAttribute('aria-current', 'true');
      });
    });
  });

  // Ajax add-to-cart (progress, button state)
  qsa('form[action="/cart/add"]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      const f = e.target;
      if (!(f instanceof HTMLFormElement)) return;
      const submit = qs('button[type="submit"]', f);
      if (!(submit instanceof HTMLButtonElement)) return;

      e.preventDefault();
      const fd = new FormData(f);
      const originalText = submit.textContent || '';
      submit.disabled = true;
      submit.textContent = submit.getAttribute('data-loading-label') || 'Adding…';

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
        if (!res.ok) throw new Error('add_failed');
        toast('Added to cart', { actionLabel: 'View cart', onAction: () => (window.location.href = '/cart') });
        const cartRes = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
        if (cartRes.ok) {
          const cart = await cartRes.json();
          qsa('[data-cart-count]').forEach((n) => (n.textContent = String(cart.item_count)));
        }
        drawer?.open();
      } catch (_) {
        toast('Could not add to cart. Please try again.');
      } finally {
        submit.disabled = false;
        submit.textContent = originalText;
      }
    });
  });
})();

