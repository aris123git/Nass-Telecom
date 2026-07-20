/* Nass-Telecom — Application client */

const NT = window.NT = {
  api: {
    async get(url) {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) throw new Error(await safeErr(r));
      return r.json();
    },
    async post(url, body, opts = {}) {
      const isForm = body instanceof FormData;
      const headers = isForm ? {} : { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('nt_token');
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const r = await fetch(url, {
        method: opts.method || 'POST',
        credentials: 'include',
        headers,
        body: isForm ? body : JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await safeErr(r));
      return r.json();
    },
    put(url, body) { return this.post(url, body, { method: 'PUT' }); },
    patch(url, body) { return this.post(url, body, { method: 'PATCH' }); },
    async del(url) {
      const token = localStorage.getItem('nt_token');
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const r = await fetch(url, { method: 'DELETE', credentials: 'include', headers });
      if (!r.ok) throw new Error(await safeErr(r));
      return r.json();
    },
  },
  fmt: {
    price(n) {
      if (n === null || n === undefined || isNaN(n)) return '—';
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
    },
  },
};

async function safeErr(r) {
  try {
    const j = await r.json();
    return j.error || j.message || `Erreur ${r.status}`;
  } catch {
    return `Erreur ${r.status}`;
  }
}

/* ---------- Page transition with "jump" ---------- */
function jumpTo(url) {
  const btn = event && event.currentTarget;
  if (btn && btn.classList) {
    btn.classList.remove('jumping');
    void btn.offsetWidth;
    btn.classList.add('jumping');
  }
  const overlay = document.getElementById('pageTransition');
  setTimeout(() => {
    if (overlay) overlay.classList.add('enter');
  }, 380);
  setTimeout(() => {
    window.location.href = url;
  }, 780);
}
window.jumpTo = jumpTo;

/* Intercept internal navigation to add the animated overlay */
function initNavIntercept() {
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    if (a.target === '_blank') return;
    e.preventDefault();
    const overlay = document.getElementById('pageTransition');
    if (overlay) overlay.classList.add('enter');
    setTimeout(() => { window.location.href = href; }, 520);
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---------- Header scroll effect ---------- */
function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
}

/* ---------- Footer year ---------- */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Product card renderer ---------- */
function productCard(p) {
  const outOfStock = (p.stock ?? 0) <= 0;
  const hasDiscount = p.old_price && p.old_price > p.price;
  const imgSrc = p.image_url || defaultProductImage(p.category_slug);
  return `
    <article class="product-card" onclick="openProduct(${p.id})">
      <div class="product-media">
        ${p.featured ? '<span class="product-badge">Coup de cœur</span>' : hasDiscount ? '<span class="product-badge">Promo</span>' : ''}
        <img src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='${defaultProductImage(p.category_slug)}'" />
      </div>
      <div class="product-body">
        ${p.brand ? `<span class="product-brand">${escapeHtml(p.brand)}</span>` : ''}
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <span class="product-cat">${escapeHtml(p.category_name || '')}</span>
        <div class="product-foot">
          <div class="product-price">
            <span class="price-now">${NT.fmt.price(p.price)}</span>
            ${hasDiscount ? `<span class="price-old">${NT.fmt.price(p.old_price)}</span>` : ''}
          </div>
          <span class="${outOfStock ? 'product-out' : 'product-in'}">${outOfStock ? 'Rupture' : 'En stock'}</span>
        </div>
      </div>
    </article>
  `;
}

function defaultProductImage(slug) {
  const map = {
    'ordinateurs': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    'telephones': 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80',
    'tablettes': 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=600&q=80',
    'ecouteurs': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    'accessoires': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  };
  return map[slug] || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ---------- Product quick-view modal ---------- */
async function openProduct(id) {
  try {
    const p = await NT.api.get('/api/products/' + id);
    let modal = document.getElementById('ntProductModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ntProductModal';
      modal.className = 'product-modal';
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProduct();
      });
    }
    const outOfStock = (p.stock ?? 0) <= 0;
    const hasDiscount = p.old_price && p.old_price > p.price;
    modal.innerHTML = `
      <div class="product-modal-card">
        <button class="pm-close" onclick="closeProduct()" aria-label="Fermer">✕</button>
        <div class="pm-media">
          <img src="${p.image_url || defaultProductImage(p.category_slug)}" alt="${escapeHtml(p.name)}" onerror="this.src='${defaultProductImage(p.category_slug)}'" />
        </div>
        <div class="pm-body">
          ${p.brand ? `<span class="product-brand">${escapeHtml(p.brand)}</span>` : ''}
          <h2 class="section-title" style="text-align:left;font-size:26px;">${escapeHtml(p.name)}</h2>
          <span class="product-cat">${escapeHtml(p.category_name || '')}</span>
          <p style="color:var(--muted);margin:10px 0;">${escapeHtml(p.description || '')}</p>
          <div class="product-price" style="flex-direction:row;align-items:baseline;gap:14px;margin:6px 0 14px;">
            <span class="price-now" style="font-size:26px;">${NT.fmt.price(p.price)}</span>
            ${hasDiscount ? `<span class="price-old">${NT.fmt.price(p.old_price)}</span>` : ''}
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span class="${outOfStock ? 'product-out' : 'product-in'}">${outOfStock ? 'Rupture de stock' : `En stock (${p.stock})`}</span>
          </div>
          <div style="margin-top:auto;padding-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-jump" onclick="alert('Commande envoyée ! Nous vous contactons.')" ${outOfStock ? 'disabled' : ''}><span>Commander</span></button>
            <button class="btn btn-ghost" onclick="closeProduct()"><span>Retour</span></button>
          </div>
        </div>
      </div>
    `;
    requestAnimationFrame(() => modal.classList.add('open'));
  } catch (e) {
    alert('Impossible de charger le produit : ' + e.message);
  }
}
function closeProduct() {
  const modal = document.getElementById('ntProductModal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 400);
  }
}
window.openProduct = openProduct;
window.closeProduct = closeProduct;

/* ---------- Auto-jump animation for all .btn-jump ---------- */
function initButtonJump() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-jump');
    if (!btn) return;
    btn.classList.remove('jumping');
    void btn.offsetWidth;
    btn.classList.add('jumping');
    setTimeout(() => btn.classList.remove('jumping'), 700);
  });
}

/* ---------- Init on load ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
  initHeader();
  initYear();
  initReveal();
  initNavIntercept();
  initButtonJump();
});

/* Hide overlay if we came back via bfcache */
window.addEventListener('pageshow', () => {
  const overlay = document.getElementById('pageTransition');
  if (overlay) overlay.classList.remove('enter');
});
