const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

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

router.post('/', requireAdmin, (req, res) => {
  const { name, icon, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Le nom est requis' });
  const baseSlug = slugify(name) || 'categorie';
  let slug = baseSlug;
  let n = 1;
  while (db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  try {
    const info = db
      .prepare('INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)')
      .run(name.trim(), slug, icon || '', description || '');
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Catégorie introuvable' });
  const { name, icon, description } = req.body || {};
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
  db.prepare('UPDATE categories SET name = ?, slug = ?, icon = ?, description = ? WHERE id = ?').run(
    newName,
    newSlug,
    icon !== undefined ? icon : existing.icon,
    description !== undefined ? description : existing.description,
    id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Catégorie introuvable' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
