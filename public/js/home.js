/* Home page — categories + featured products */
(async function initHome() {
  try {
    const [cats, allProducts] = await Promise.all([
      NT.api.get('/api/categories'),
      NT.api.get('/api/products?limit=500'),
    ]);
    const featured = allProducts.filter((p) => p.featured).slice(0, 8);

    const p = document.getElementById('statProducts');
    const c = document.getElementById('statCats');
    if (p) p.textContent = allProducts.length + '+';
    if (c) c.textContent = cats.length + '+';

    const grid = document.getElementById('catsGrid');
    if (grid) {
      grid.innerHTML = cats
        .map((cat) => {
          const icon = cat.icon_image
            ? `<img src="${escapeHtml(cat.icon_image)}" alt="" loading="lazy" />`
            : cat.icon
              ? `<span class="cat-emoji">${cat.icon}</span>`
              : categoryIcon(cat.slug);
          return `
        <div class="cat-card reveal" onclick="jumpTo('/catalogue.html?cat=${encodeURIComponent(cat.slug)}')">
          <div class="cat-icon">${icon}</div>
          <div class="cat-name">${escapeHtml(cat.name)}</div>
          <div class="cat-count">${cat.product_count || 0} produit${(cat.product_count || 0) > 1 ? 's' : ''}</div>
        </div>`;
        })
        .join('');
    }

    const featEl = document.getElementById('featuredGrid');
    if (featEl) {
      if (!featured.length) {
        featEl.innerHTML = '<div class="empty">Aucun produit en vedette pour l\'instant.</div>';
      } else {
        featEl.innerHTML = featured.map(productCard).join('');
      }
    }

    initReveal();
  } catch (e) {
    console.error('Home load error:', e);
  }
})();
