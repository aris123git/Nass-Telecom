/* NASS ELECTRO+ — Application client */

const NT = window.NT = {
  WHATSAPP: '22670777755',
  SITE_NAME: 'NASS ELECTRO+',
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

/* ---------- WhatsApp order ---------- */
function whatsappOrder(product) {
  const lines = [
    `Bonjour NASS ELECTRO+,`,
    ``,
    `Je souhaite commander :`,
    `• ${product.name}${product.brand ? ' (' + product.brand + ')' : ''}`,
    `• Prix : ${NT.fmt.price(product.price)}`,
    product.category_name ? `• Catégorie : ${product.category_name}` : '',
    ``,
    `Merci de me contacter pour la livraison.`,
  ].filter(Boolean);
  const url = 'https://wa.me/' + NT.WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
  window.open(url, '_blank', 'noopener');
}
function whatsappOrderById(id) {
  const p = _ntProductCache.get(Number(id));
  if (p) whatsappOrder(p);
  else NT.api.get('/api/products/' + id).then(whatsappOrder).catch((e) => alert(e.message));
}
window.whatsappOrderById = whatsappOrderById;
function whatsappGeneric() {
  const msg = 'Bonjour NASS ELECTRO+, je souhaite quelques informations.';
  window.open('https://wa.me/' + NT.WHATSAPP + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
}
window.whatsappOrder = whatsappOrder;
window.whatsappGeneric = whatsappGeneric;

/* ---------- Page transition ---------- */
function jumpTo(url) {
  const overlay = document.getElementById('pageTransition');
  if (overlay) overlay.classList.add('enter');
  setTimeout(() => { window.location.href = url; }, 380);
}
window.jumpTo = jumpTo;

/* Intercept internal navigation to add the animated overlay */
function initNavIntercept() {
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    const overlay = document.getElementById('pageTransition');
    if (overlay) overlay.classList.add('enter');
    setTimeout(() => { window.location.href = href; }, 380);
  });
}

/* Reveal on scroll */
function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* Header scroll effect */
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

function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Product card ---------- */
function productCard(p) {
  const outOfStock = (p.stock ?? 0) <= 0;
  const hasDiscount = p.old_price && p.old_price > p.price;
  const imgSrc = p.image_url || defaultProductImage(p.category_slug);
  return `
    <article class="product-card" onclick="openProduct(${p.id})">
      <div class="product-media">
        ${p.featured ? '<span class="product-badge">Coup de cœur</span>' : hasDiscount ? '<span class="product-badge promo">Promo</span>' : ''}
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

/* ---------- Product quick view modal ---------- */
const _ntProductCache = new Map();
window._ntProductCache = _ntProductCache;
async function openProduct(id) {
  try {
    const p = await NT.api.get('/api/products/' + id);
    _ntProductCache.set(p.id, p);
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
            <span class="price-now" style="font-size:28px;">${NT.fmt.price(p.price)}</span>
            ${hasDiscount ? `<span class="price-old">${NT.fmt.price(p.old_price)}</span>` : ''}
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span class="${outOfStock ? 'product-out' : 'product-in'}">${outOfStock ? 'Rupture de stock' : `En stock (${p.stock})`}</span>
          </div>
          <div style="margin-top:auto;padding-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-whatsapp btn-jump" onclick="whatsappOrderById(${p.id})" ${outOfStock ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 3.5 17.7L2 22l4.4-1.5A11 11 0 1 0 20.5 3.5zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.6.9.9-2.5-.2-.3A8 8 0 1 1 12 20zm4.6-5.8c-.3-.1-1.5-.7-1.8-.8s-.4-.1-.6.1c-.2.3-.6.8-.8 1s-.3.2-.5.1c-.3-.1-1.1-.4-2-1.3-.8-.7-1.3-1.5-1.4-1.8s0-.4.1-.5c.1-.1.3-.3.4-.5s.2-.3.2-.5-.1-.4-.2-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.9 1.2 3.1c.1.2 2 3 4.7 4.2 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2c-.1-.1-.3-.2-.6-.3z"/></svg>
              <span>Commander sur WhatsApp</span>
            </button>
            <button class="btn btn-ghost" onclick="closeProduct()"><span>Retour</span></button>
          </div>
          <p class="muted small" style="margin-top:8px;font-size:12px;">📞 +226 70 77 77 55</p>
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

/* Auto-jump animation for all .btn-jump */
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

/* Init on load */
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
