const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { requireAdmin } = require('../auth');
const { saveBackupToDisk } = require('../backup');

const router = express.Router();

function persist() {
  try {
    saveBackupToDisk();
  } catch (e) {
    console.warn('[backup] save:', e.message);
  }
}
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safe = 'cat_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format d\'image non supporté'));
  },
});

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
      FROM categories c
      ORDER BY c.name COLLATE NOCASE
    `)
    .all();
  res.json(rows);
});

router.post('/', requireAdmin, upload.single('icon_image'), (req, res) => {
  try {
    const { name, icon, description } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Le nom est requis' });
    const baseSlug = slugify(name) || 'categorie';
    let slug = baseSlug;
    let n = 1;
    while (db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(slug)) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const iconImage = req.file ? '/uploads/' + req.file.filename : '';
    const info = db
      .prepare(
        'INSERT INTO categories (name, slug, icon, icon_image, description) VALUES (?, ?, ?, ?, ?)'
      )
      .run(name.trim(), slug, icon || '', iconImage, description || '');
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    persist();
    res.status(201).json(created);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }
    console.error('[categories POST]', e);
    res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
});

router.put('/:id', requireAdmin, upload.single('icon_image'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Catégorie introuvable' });
    const { name, icon, description, clear_icon_image } = req.body || {};
    const newName = name && name.trim() ? name.trim() : existing.name;
    let newSlug = existing.slug;
    if (name && name.trim() && name.trim() !== existing.name) {
      const baseSlug = slugify(newName) || 'categorie';
      newSlug = baseSlug;
      let n = 1;
      while (db.prepare('SELECT 1 FROM categories WHERE slug = ? AND id != ?').get(newSlug, id)) {
        n += 1;
        newSlug = `${baseSlug}-${n}`;
      }
    }
    let iconImage = existing.icon_image || '';
    if (req.file) {
      iconImage = '/uploads/' + req.file.filename;
    } else if (clear_icon_image === '1' || clear_icon_image === 'true') {
      iconImage = '';
    }
    db.prepare(
      'UPDATE categories SET name = ?, slug = ?, icon = ?, icon_image = ?, description = ? WHERE id = ?'
    ).run(
      newName,
      newSlug,
      icon !== undefined ? icon : existing.icon,
      iconImage,
      description !== undefined ? description : existing.description,
      id
    );
    persist();
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
  } catch (e) {
    console.error('[categories PUT]', e);
    res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Catégorie introuvable' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  persist();
  res.json({ ok: true });
});

module.exports = router;
