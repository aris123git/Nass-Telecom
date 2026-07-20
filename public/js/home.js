/* Home page — categories + featured products */
(async function initHome() {
  try {
    const [cats, products] = await Promise.all([
      NT.api.get('/api/categories'),
      NT.api.get('/api/products?featured=true&limit=8'),
    ]);

    const statProducts = await NT.api.get('/api/products?limit=500');
    const p = document.getElementById('statProducts');
    const c = document.getElementById('statCats');
    if (p) p.textContent = statProducts.length + '+';
    if (c) c.textContent = cats.length + '+';

    const grid = document.getElementById('catsGrid');
    if (grid) {
      grid.innerHTML = cats
        .map(
          (cat) => `
        <div class="cat-card reveal" onclick="jumpTo('/catalogue.html?cat=${encodeURIComponent(cat.slug)}')">
          <div class="cat-icon">${cat.icon || '📦'}</div>
          <div class="cat-name">${escapeHtml(cat.name)}</div>
          <div class="cat-count">${cat.product_count || 0} produit${(cat.product_count || 0) > 1 ? 's' : ''}</div>
        </div>`
        )
        .join('');
    }

    const featured = document.getElementById('featuredGrid');
    if (featured) {
      if (!products.length) {
        featured.outerHTML = '<div class="empty">Aucun produit en vedette pour l\'instant.</div>';
      } else {
        featured.innerHTML = products.map(productCard).join('');
      }
    }

    initReveal();
  } catch (e) {
    console.error('Home load error:', e);
  }
})();
