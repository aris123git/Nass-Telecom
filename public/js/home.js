/* Home page — categories + example products per category + featured */
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

    const demoBanner = document.getElementById('demoBanner');
    if (demoBanner && allProducts.length) {
      demoBanner.hidden = false;
    }

    const grid = document.getElementById('catsGrid');
    if (grid) {
      grid.innerHTML = cats
        .map((cat) => {
          const samples = allProducts
            .filter((prod) => prod.category_slug === cat.slug)
            .slice(0, 4);
          const samplesHtml = samples.length
            ? `<div class="cat-products-row">${samples
                .map(
                  (prod) => `
              <article class="cat-mini" onclick="event.stopPropagation(); openProduct(${prod.id})">
                <img src="${prod.image_url || defaultProductImage(prod.category_slug)}" alt="${escapeHtml(prod.name)}" loading="lazy" onerror="this.src='${defaultProductImage(prod.category_slug)}'" />
                <div class="cat-mini-name">${escapeHtml(prod.name)}</div>
                <div class="cat-mini-price">${NT.fmt.price(prod.price)}</div>
              </article>`
                )
                .join('')}</div>`
            : `<div class="cat-empty">Aucun produit d'exemple dans cette catégorie.</div>`;

          return `
          <div class="cat-block reveal">
            <div class="cat-card" onclick="jumpTo('/catalogue.html?cat=${encodeURIComponent(cat.slug)}')">
              <div class="cat-icon">${categoryIcon(cat.slug)}</div>
              <div class="cat-name">${escapeHtml(cat.name)}</div>
              <div class="cat-count">${cat.product_count || samples.length || 0} produit${(cat.product_count || samples.length || 0) > 1 ? 's' : ''}</div>
            </div>
            ${samplesHtml}
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
