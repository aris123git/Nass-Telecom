const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = 'p_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format d\'image non supporté'));
  },
});

function parseBool(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  return 0;
}

function serializeProduct(p) {
  if (!p) return p;
  return { ...p, featured: !!p.featured };
}

router.get('/', (req, res) => {
  const { category, featured, q, limit } = req.query;
  const clauses = [];
  const params = [];
  if (category) {
    clauses.push('(c.slug = ? OR c.id = ?)');
    params.push(category, Number(category) || -1);
  }
  if (featured === 'true' || featured === '1') {
    clauses.push('p.featured = 1');
  }
  if (q) {
    clauses.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const lim = Math.min(Number(limit) || 200, 500);
  const rows = db
    .prepare(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ${lim}
    `)
    .all(...params);
  res.json(rows.map(serializeProduct));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db
    .prepare(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `)
    .get(id);
  if (!row) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(serializeProduct(row));
});

router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const {
      category_id,
      name,
      brand,
      description,
      price,
      old_price,
      stock,
      featured,
      image_url,
    } = req.body || {};
    if (!category_id || !name || !name.trim()) {
      return res.status(400).json({ error: 'Catégorie et nom requis' });
    }
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(category_id));
    if (!cat) return res.status(400).json({ error: 'Catégorie invalide' });

    let finalImage = image_url || '';
    if (req.file) finalImage = '/uploads/' + req.file.filename;

    const info = db
      .prepare(
        `INSERT INTO products
        (category_id, name, brand, description, price, old_price, stock, image_url, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        Number(category_id),
        name.trim(),
        brand || '',
        description || '',
        Number(price) || 0,
        old_price ? Number(old_price) : null,
        Number(stock) || 0,
        finalImage,
        parseBool(featured)
      );
    const created = db
      .prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug
                FROM products p JOIN categories c ON c.id = p.category_id
                WHERE p.id = ?`)
      .get(info.lastInsertRowid);
    res.status(201).json(serializeProduct(created));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
});

router.put('/:id', requireAdmin, upload.single('image'), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });
  const {
    category_id,
    name,
    brand,
    description,
    price,
    old_price,
    stock,
    featured,
    image_url,
  } = req.body || {};

  let finalImage = existing.image_url;
  if (image_url !== undefined) finalImage = image_url;
  if (req.file) finalImage = '/uploads/' + req.file.filename;

  db.prepare(
    `UPDATE products SET
      category_id = ?,
      name = ?,
      brand = ?,
      description = ?,
      price = ?,
      old_price = ?,
      stock = ?,
      image_url = ?,
      featured = ?
     WHERE id = ?`
  ).run(
    category_id ? Number(category_id) : existing.category_id,
    name && name.trim() ? name.trim() : existing.name,
    brand !== undefined ? brand : existing.brand,
    description !== undefined ? description : existing.description,
    price !== undefined && price !== '' ? Number(price) : existing.price,
    old_price !== undefined ? (old_price === '' || old_price === null ? null : Number(old_price)) : existing.old_price,
    stock !== undefined && stock !== '' ? Number(stock) : existing.stock,
    finalImage,
    featured !== undefined ? parseBool(featured) : existing.featured,
    id
  );
  const updated = db
    .prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug
              FROM products p JOIN categories c ON c.id = p.category_id
              WHERE p.id = ?`)
    .get(id);
  res.json(serializeProduct(updated));
});

router.patch('/:id/price', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });
  const { price, old_price } = req.body || {};
  if (price === undefined) return res.status(400).json({ error: 'Prix requis' });
  db.prepare('UPDATE products SET price = ?, old_price = ? WHERE id = ?').run(
    Number(price),
    old_price === undefined || old_price === '' || old_price === null ? existing.old_price : Number(old_price),
    id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(serializeProduct(updated));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Produit introuvable' });
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
