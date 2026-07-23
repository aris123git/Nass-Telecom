/* Admin app — login + CRUD categories & products */

const state = {
  user: null,
  tab: 'overview',
  categories: [],
  products: [],
  editingProduct: null,
  editingCategory: null,
  filterQ: '',
};

function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => (el.hidden = true), 400);
  }, 2800);
}

/* ---------- Auth ---------- */
async function checkAuth() {
  try {
    const res = await NT.api.get('/api/auth/me');
    state.user = res.user;
    showDashboard();
    return true;
  } catch (e) {
    showLogin();
    return false;
  }
}
function showLogin() {
  const login = document.getElementById('loginView');
  const dash = document.getElementById('dashboardView');
  login.hidden = false;
  dash.hidden = true;
  // S'assurer qu'aucune modale ne bloque la saisie
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.hidden = true;
    modal.style.pointerEvents = 'none';
  }
  setTimeout(() => {
    const u = document.getElementById('fUsername');
    if (u) {
      try {
        u.focus({ preventScroll: false });
        u.select?.();
      } catch (e) {
        try { u.focus(); } catch (_) {}
      }
    }
  }, 80);
}
function showDashboard() {
  document.getElementById('loginView').hidden = true;
  document.getElementById('dashboardView').hidden = false;
  const nameEl = document.getElementById('adminName');
  if (nameEl && state.user) nameEl.textContent = state.user.username;
  loadAll();
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const res = await NT.api.post('/api/auth/login', { username, password });
    if (res.token) localStorage.setItem('nt_token', res.token);
    state.user = res.user;
    showDashboard();
    toast('Bienvenue, ' + res.user.username, 'success');
  } catch (err) {
    errEl.textContent = err.message || 'Erreur de connexion';
  }
}

async function handleLogout() {
  try {
    await NT.api.post('/api/auth/logout', {});
  } catch {}
  localStorage.removeItem('nt_token');
  state.user = null;
  showLogin();
}

/* ---------- Tabs ---------- */
function switchTab(name) {
  state.tab = name;
  document.querySelectorAll('.side-link').forEach((el) =>
    el.classList.toggle('active', el.dataset.tab === name)
  );
  document.querySelectorAll('.tab-panel').forEach((el) => (el.hidden = el.id !== 'tab-' + name));
  const titles = {
    overview: ['Vue d\'ensemble', 'Statistiques de votre boutique.'],
    products: ['Produits', 'Gérez tous vos produits, prix et stock.'],
    categories: ['Catégories', 'Créez et modifiez vos catégories.'],
  };
  const [t, s] = titles[name] || ['', ''];
  document.getElementById('tabTitle').textContent = t;
  document.getElementById('tabSub').textContent = s;
}

/* ---------- Data loading ---------- */
async function loadAll() {
  try {
    const [cats, prods] = await Promise.all([
      NT.api.get('/api/categories'),
      NT.api.get('/api/products?limit=500'),
    ]);
    state.categories = cats;
    state.products = prods;
    renderOverview();
    renderProducts();
    renderCategories();
  } catch (e) {
    toast('Erreur de chargement : ' + e.message, 'error');
  }
}

function renderOverview() {
  document.getElementById('ovProducts').textContent = state.products.length;
  document.getElementById('ovCats').textContent = state.categories.length;
  const stock = state.products.reduce((s, p) => s + (p.stock || 0), 0);
  document.getElementById('ovStock').textContent = stock;
  const value = state.products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0);
  document.getElementById('ovValue').textContent = NT.fmt.price(value);

  const recent = [...state.products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);
  const list = document.getElementById('recentList');
  if (!recent.length) {
    list.innerHTML = '<div style="padding:24px;color:var(--muted);text-align:center;">Aucun produit pour l\'instant.</div>';
    return;
  }
  list.innerHTML = recent
    .map(
      (p) => `
    <div class="recent-item">
      <img src="${p.image_url || defaultProductImage(p.category_slug)}" alt="" onerror="this.src='${defaultProductImage(p.category_slug)}'" />
      <div>
        <div class="title">${escapeHtml(p.name)}</div>
        <div class="sub">${escapeHtml(p.category_name)} · Stock : ${p.stock}</div>
      </div>
      <div style="font-family:'Sora';font-weight:700;">${NT.fmt.price(p.price)}</div>
    </div>`
    )
    .join('');
}

function renderProducts() {
  const q = state.filterQ.toLowerCase();
  const list = state.products.filter(
    (p) =>
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category_name || '').toLowerCase().includes(q)
  );
  const tbody = document.getElementById('productsTbody');
  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);">Aucun produit.</td></tr>';
    return;
  }
  tbody.innerHTML = list
    .map(
      (p) => `
    <tr>
      <td>
        <div class="prod-mini">
          <img src="${p.image_url || defaultProductImage(p.category_slug)}" alt="" onerror="this.src='${defaultProductImage(p.category_slug)}'" />
          <div class="info">
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="brand">${escapeHtml(p.brand || '—')}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.category_name)}</td>
      <td>
        <strong>${NT.fmt.price(p.price)}</strong>
        ${p.old_price ? `<div style="color:var(--muted-2);text-decoration:line-through;font-size:12px;">${NT.fmt.price(p.old_price)}</div>` : ''}
      </td>
      <td>${p.stock}</td>
      <td>
        ${p.featured ? '<span class="pill feat">Vedette</span> ' : ''}
        <span class="pill ${p.stock > 0 ? 'on' : 'off'}">${p.stock > 0 ? 'En stock' : 'Rupture'}</span>
      </td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Modifier le prix" onclick="quickEditPrice(${p.id})">💲</button>
          <button class="icon-btn" title="Modifier" onclick="openProductForm(${p.id})">✏️</button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteProduct(${p.id})">🗑️</button>
        </div>
      </td>
    </tr>`
    )
    .join('');
}

function renderCategories() {
  const tbody = document.getElementById('categoriesTbody');
  if (!state.categories.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted);">Aucune catégorie.</td></tr>';
    return;
  }
  tbody.innerHTML = state.categories
    .map(
      (c) => `
    <tr>
      <td style="font-size:24px;">${c.icon || '📦'}</td>
      <td><strong>${escapeHtml(c.name)}</strong><div style="color:var(--muted-2);font-size:12px;">/${c.slug}</div></td>
      <td style="color:var(--muted);max-width:340px;">${escapeHtml(c.description || '—')}</td>
      <td>${c.product_count || 0}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Modifier" onclick="openCategoryForm(${c.id})">✏️</button>
          <button class="icon-btn danger" title="Supprimer" onclick="deleteCategory(${c.id})">🗑️</button>
        </div>
      </td>
    </tr>`
    )
    .join('');
}

/* ---------- Products CRUD ---------- */
function openProductForm(id) {
  const editing = id ? state.products.find((p) => p.id === id) : null;
  state.editingProduct = editing;
  const catOptions = state.categories
    .map((c) => `<option value="${c.id}" ${editing && editing.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');
  const modal = document.getElementById('adminModal');
  const content = document.getElementById('adminModalContent');
  content.innerHTML = `
    <form class="admin-form" id="productForm" enctype="multipart/form-data">
      <h2>${editing ? 'Modifier' : 'Nouveau'} produit</h2>
      <label>Nom
        <input class="form-input" name="name" required value="${editing ? escapeHtml(editing.name) : ''}" />
      </label>
      <div class="row">
        <label>Catégorie
          <select class="form-select" name="category_id" required>
            <option value="">— Choisir —</option>
            ${catOptions}
          </select>
        </label>
        <label>Marque
          <input class="form-input" name="brand" value="${editing ? escapeHtml(editing.brand || '') : ''}" />
        </label>
      </div>
      <div class="row">
        <label>Prix (FCFA)
          <input class="form-input" name="price" type="number" min="0" step="1" required value="${editing ? editing.price : ''}" />
        </label>
        <label>Ancien prix (optionnel)
          <input class="form-input" name="old_price" type="number" min="0" step="1" value="${editing && editing.old_price ? editing.old_price : ''}" />
        </label>
      </div>
      <div class="row">
        <label>Stock
          <input class="form-input" name="stock" type="number" min="0" required value="${editing ? editing.stock : 0}" />
        </label>
        <label class="checkbox">
          <input type="checkbox" name="featured" ${editing && editing.featured ? 'checked' : ''} />
          Produit en vedette (page d'accueil)
        </label>
      </div>
      <label>Description
        <textarea class="form-textarea" name="description" rows="3">${editing ? escapeHtml(editing.description || '') : ''}</textarea>
      </label>
      <label>URL image (facultatif)
        <input class="form-input" name="image_url" placeholder="https://…" value="${editing ? escapeHtml(editing.image_url || '') : ''}" />
      </label>
      <label>ou téléverser une image
        <input class="form-input" name="image" type="file" accept="image/*" />
      </label>
      <div class="actions">
        <button type="button" class="btn btn-ghost" onclick="closeAdminModal()"><span>Annuler</span></button>
        <button type="submit" class="btn btn-primary btn-jump"><span>${editing ? 'Enregistrer' : 'Créer le produit'}</span></button>
      </div>
    </form>
  `;
  modal.hidden = false;
  document.getElementById('productForm').addEventListener('submit', submitProductForm);
}

async function submitProductForm(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  fd.set('featured', form.featured.checked ? '1' : '0');
  const editing = state.editingProduct;
  try {
    if (editing) {
      await NT.api.post('/api/products/' + editing.id, fd, { method: 'PUT' });
      toast('Produit modifié', 'success');
    } else {
      await NT.api.post('/api/products', fd);
      toast('Produit créé', 'success');
    }
    closeAdminModal();
    await loadAll();
  } catch (err) {
    toast(err.message || 'Erreur', 'error');
  }
}

async function deleteProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  if (!confirm(`Supprimer le produit « ${p.name} » ?`)) return;
  try {
    await NT.api.del('/api/products/' + id);
    toast('Produit supprimé', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message || 'Erreur', 'error');
  }
}

async function quickEditPrice(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const raw = prompt(`Nouveau prix pour « ${p.name} » (FCFA) :`, p.price);
  if (raw === null) return;
  const price = Number(raw);
  if (!Number.isFinite(price) || price < 0) {
    toast('Prix invalide', 'error');
    return;
  }
  try {
    await NT.api.patch('/api/products/' + id + '/price', { price });
    toast('Prix mis à jour', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message || 'Erreur', 'error');
  }
}

/* ---------- Categories CRUD ---------- */
function openCategoryForm(id) {
  const editing = id ? state.categories.find((c) => c.id === id) : null;
  state.editingCategory = editing;
  const modal = document.getElementById('adminModal');
  const content = document.getElementById('adminModalContent');
  content.innerHTML = `
    <form class="admin-form" id="categoryForm">
      <h2>${editing ? 'Modifier' : 'Nouvelle'} catégorie</h2>
      <div class="row">
        <label>Nom
          <input class="form-input" name="name" required value="${editing ? escapeHtml(editing.name) : ''}" />
        </label>
        <label>Icône (emoji)
          <input class="form-input" name="icon" placeholder="🎧" maxlength="4" value="${editing ? escapeHtml(editing.icon || '') : ''}" />
        </label>
      </div>
      <label>Description
        <textarea class="form-textarea" name="description" rows="3">${editing ? escapeHtml(editing.description || '') : ''}</textarea>
      </label>
      <div class="actions">
        <button type="button" class="btn btn-ghost" onclick="closeAdminModal()"><span>Annuler</span></button>
        <button type="submit" class="btn btn-primary btn-jump"><span>${editing ? 'Enregistrer' : 'Créer'}</span></button>
      </div>
    </form>
  `;
  modal.hidden = false;
  document.getElementById('categoryForm').addEventListener('submit', submitCategoryForm);
}

async function submitCategoryForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    icon: form.icon.value.trim(),
    description: form.description.value.trim(),
  };
  const editing = state.editingCategory;
  try {
    if (editing) {
      await NT.api.put('/api/categories/' + editing.id, data);
      toast('Catégorie modifiée', 'success');
    } else {
      await NT.api.post('/api/categories', data);
      toast('Catégorie créée', 'success');
    }
    closeAdminModal();
    await loadAll();
  } catch (err) {
    toast(err.message || 'Erreur', 'error');
  }
}

async function deleteCategory(id) {
  const c = state.categories.find((x) => x.id === id);
  if (!c) return;
  const count = c.product_count || 0;
  const msg =
    count > 0
      ? `Supprimer « ${c.name} » ? Cette action supprimera également les ${count} produit(s) associé(s).`
      : `Supprimer « ${c.name} » ?`;
  if (!confirm(msg)) return;
  try {
    await NT.api.del('/api/categories/' + id);
    toast('Catégorie supprimée', 'success');
    await loadAll();
  } catch (err) {
    toast(err.message || 'Erreur', 'error');
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').hidden = true;
  const c = document.getElementById('adminModalContent');
  if (c) c.innerHTML = '';
}

window.openProductForm = openProductForm;
window.deleteProduct = deleteProduct;
window.quickEditPrice = quickEditPrice;
window.openCategoryForm = openCategoryForm;
window.deleteCategory = deleteCategory;
window.closeAdminModal = closeAdminModal;

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.querySelectorAll('.side-link').forEach((el) =>
    el.addEventListener('click', () => switchTab(el.dataset.tab))
  );
  const search = document.getElementById('prodSearch');
  if (search) {
    let t;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.filterQ = search.value.trim();
        renderProducts();
      }, 150);
    });
  }
  checkAuth();
});
