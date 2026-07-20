/* Catalogue page */
(async function initCatalogue() {
  const params = new URLSearchParams(window.location.search);
  let currentSlug = params.get('cat') || 'all';
  let currentQ = params.get('q') || '';
  const searchInput = document.getElementById('searchInput');
  if (currentQ && searchInput) searchInput.value = currentQ;

  let allProducts = [];
  let categories = [];

  try {
    [categories, allProducts] = await Promise.all([
      NT.api.get('/api/categories'),
      NT.api.get('/api/products?limit=500'),
    ]);
  } catch (e) {
    document.getElementById('productsGrid').innerHTML =
      '<div class="empty">Erreur de chargement : ' + escapeHtml(e.message) + '</div>';
    return;
  }

  const chips = document.getElementById('filterChips');
  chips.innerHTML =
    `<div class="filter-chip ${currentSlug === 'all' ? 'active' : ''}" data-slug="all">
       <span>Toutes</span>
       <span class="count">${allProducts.length}</span>
     </div>` +
    categories
      .map(
        (c) => `
      <div class="filter-chip ${c.slug === currentSlug ? 'active' : ''}" data-slug="${c.slug}">
        <span>${c.icon || ''} ${escapeHtml(c.name)}</span>
        <span class="count">${c.product_count || 0}</span>
      </div>`
      )
      .join('');

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    chips.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentSlug = chip.dataset.slug;
    updateUrl();
    render();
  });

  if (searchInput) {
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        currentQ = searchInput.value.trim();
        updateUrl();
        render();
      }, 200);
    });
  }

  function updateUrl() {
    const q = new URLSearchParams();
    if (currentSlug && currentSlug !== 'all') q.set('cat', currentSlug);
    if (currentQ) q.set('q', currentQ);
    const url = window.location.pathname + (q.toString() ? '?' + q.toString() : '');
    window.history.replaceState(null, '', url);
  }

  function render() {
    let list = allProducts.slice();
    if (currentSlug && currentSlug !== 'all') {
      list = list.filter((p) => p.category_slug === currentSlug);
    }
    if (currentQ) {
      const q = currentQ.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }
    const grid = document.getElementById('productsGrid');
    const count = document.getElementById('resultCount');
    if (count) count.textContent = list.length + ' produit' + (list.length > 1 ? 's' : '');
    if (!list.length) {
      grid.innerHTML = '<div class="empty">Aucun produit ne correspond à votre recherche.</div>';
    } else {
      grid.innerHTML = list.map(productCard).join('');
    }
  }

  render();
})();
