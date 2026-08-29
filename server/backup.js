const fs = require('fs');
const path = require('path');
const db = require('./db');

const ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backup');
const BACKUP_FILE = path.join(BACKUP_DIR, 'catalog.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readLocalImageAsDataUrl(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return null;
  if (!urlPath.startsWith('/uploads/')) return null;
  const file = path.join(ROOT, urlPath.replace(/^\//, ''));
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).toLowerCase().replace('.', '') || 'png';
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : ext === 'svg'
            ? 'image/svg+xml'
            : 'image/png';
  const b64 = fs.readFileSync(file).toString('base64');
  return `data:${mime};base64,${b64}`;
}

function writeDataUrlToUploads(dataUrl, prefix) {
  if (!dataUrl || !String(dataUrl).startsWith('data:')) return '';
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return '';
  const mime = m[1];
  const ext =
    mime.includes('jpeg') || mime.includes('jpg')
      ? '.jpg'
      : mime.includes('webp')
        ? '.webp'
        : mime.includes('gif')
          ? '.gif'
          : mime.includes('svg')
            ? '.svg'
            : '.png';
  const name = `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
  ensureDirs();
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(m[2], 'base64'));
  return '/uploads/' + name;
}

function buildCatalog() {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id').all().map((c) => ({
    name: c.name,
    slug: c.slug,
    icon: c.icon || '',
    description: c.description || '',
    icon_image: c.icon_image || '',
    icon_image_data: readLocalImageAsDataUrl(c.icon_image),
  }));

  const products = db
    .prepare(
      `SELECT p.*, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.id`
    )
    .all()
    .map((p) => ({
      category_slug: p.category_slug,
      name: p.name,
      brand: p.brand || '',
      description: p.description || '',
      price: p.price,
      old_price: p.old_price,
      stock: p.stock,
      featured: !!p.featured,
      image_url: p.image_url || '',
      image_data: readLocalImageAsDataUrl(p.image_url),
    }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    products,
  };
}

function saveBackupToDisk(catalog) {
  ensureDirs();
  const payload = catalog || buildCatalog();
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return { file: BACKUP_FILE, categories: payload.categories.length, products: payload.products.length };
}

function loadBackupFromDisk() {
  if (!fs.existsSync(BACKUP_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  } catch (e) {
    console.warn('[backup] lecture impossible:', e.message);
    return null;
  }
}

function restoreCatalog(catalog, { clear = true } = {}) {
  if (!catalog || !Array.isArray(catalog.categories)) {
    throw new Error('Fichier de sauvegarde invalide');
  }
  ensureDirs();

  const tx = db.transaction(() => {
    if (clear) {
      db.exec('DELETE FROM products');
      db.exec('DELETE FROM categories');
    }

    const insertCat = db.prepare(
      'INSERT INTO categories (name, slug, icon, icon_image, description) VALUES (?, ?, ?, ?, ?)'
    );
    const slugToId = new Map();

    for (const c of catalog.categories) {
      let iconImage = c.icon_image || '';
      if (c.icon_image_data) {
        iconImage = writeDataUrlToUploads(c.icon_image_data, 'cat') || iconImage;
      } else if (iconImage.startsWith('/uploads/')) {
        // chemin local sans fichier : ignorer
        const abs = path.join(ROOT, iconImage.replace(/^\//, ''));
        if (!fs.existsSync(abs)) iconImage = '';
      }
      const info = insertCat.run(
        c.name,
        c.slug || String(c.name).toLowerCase().replace(/\s+/g, '-'),
        c.icon || '',
        iconImage,
        c.description || ''
      );
      slugToId.set(c.slug, info.lastInsertRowid);
    }

    const insertProd = db.prepare(
      `INSERT INTO products
        (category_id, name, brand, description, price, old_price, stock, image_url, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const p of catalog.products || []) {
      const catId = slugToId.get(p.category_slug);
      if (!catId) continue;
      let imageUrl = p.image_url || '';
      if (p.image_data) {
        imageUrl = writeDataUrlToUploads(p.image_data, 'p') || imageUrl;
      } else if (imageUrl.startsWith('/uploads/')) {
        const abs = path.join(ROOT, imageUrl.replace(/^\//, ''));
        if (!fs.existsSync(abs)) imageUrl = '';
      }
      insertProd.run(
        catId,
        p.name,
        p.brand || '',
        p.description || '',
        Number(p.price) || 0,
        p.old_price != null ? Number(p.old_price) : null,
        Number(p.stock) || 0,
        imageUrl,
        p.featured ? 1 : 0
      );
    }
  });

  tx();
  return {
    categories: catalog.categories.length,
    products: (catalog.products || []).length,
  };
}

function counts() {
  return {
    categories: db.prepare('SELECT COUNT(*) AS n FROM categories').get().n,
    products: db.prepare('SELECT COUNT(*) AS n FROM products').get().n,
  };
}

function restoreIfEmpty() {
  const c = counts();
  if (c.categories > 0 || c.products > 0) return { restored: false, ...c };
  const backup = loadBackupFromDisk();
  if (!backup) return { restored: false, ...c };
  const result = restoreCatalog(backup, { clear: true });
  console.log(
    `[backup] Catalogue restauré depuis backup/catalog.json (${result.categories} cat., ${result.products} prod.)`
  );
  return { restored: true, ...result };
}

module.exports = {
  BACKUP_FILE,
  buildCatalog,
  saveBackupToDisk,
  loadBackupFromDisk,
  restoreCatalog,
  restoreIfEmpty,
  counts,
};
