require('dotenv').config();
const db = require('./db');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CATEGORIES = [
  { name: 'Ordinateurs', icon: '💻', description: 'Portables et fixes pour tous les usages : bureautique, gaming, création.' },
  { name: 'Téléphones', icon: '📱', description: 'Smartphones dernière génération, tous budgets.' },
  { name: 'Tablettes', icon: '📲', description: 'Tablettes tactiles pour le travail, l\'école ou les loisirs.' },
  { name: 'Écouteurs', icon: '🎧', description: 'Écouteurs et casques audio, filaires et sans fil.' },
  { name: 'Accessoires', icon: '🔌', description: 'Chargeurs, câbles, coques et accessoires indispensables.' },
];

const PRODUCTS = [
  { cat: 'Ordinateurs', name: 'MacBook Pro 14"', brand: 'Apple', price: 2199000, old_price: 2399000, stock: 8, featured: 1,
    description: 'Puce M3 Pro, 18 Go RAM, 512 Go SSD, écran Liquid Retina XDR. Idéal pour les créatifs.',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Ordinateurs', name: 'Dell XPS 15', brand: 'Dell', price: 1499000, stock: 12, featured: 1,
    description: 'Intel Core i7, 16 Go, 1 To SSD, écran OLED 3.5K. Puissance et élégance.',
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Ordinateurs', name: 'HP Pavilion 15', brand: 'HP', price: 649000, stock: 25,
    description: 'Ryzen 5, 8 Go RAM, 512 Go SSD. Ordinateur polyvalent pour le quotidien.',
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Ordinateurs', name: 'Lenovo ThinkPad X1', brand: 'Lenovo', price: 1299000, stock: 6,
    description: 'Ultrabook professionnel léger et robuste. Autonomie exceptionnelle.',
    image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80' },

  { cat: 'Téléphones', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 899000, old_price: 979000, stock: 15, featured: 1,
    description: 'Puce A17 Pro, appareil photo 48 Mpx, titanium. Le meilleur d\'Apple.',
    image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Téléphones', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 799000, stock: 20, featured: 1,
    description: 'Écran 6.8" AMOLED, S-Pen intégré, zoom 100x, IA embarquée.',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Téléphones', name: 'Google Pixel 8', brand: 'Google', price: 499000, stock: 18,
    description: 'Photo IA, Android pur, mises à jour garanties 7 ans.',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Téléphones', name: 'Xiaomi Redmi Note 13', brand: 'Xiaomi', price: 149000, stock: 40,
    description: 'Écran 120Hz, batterie 5000 mAh, excellent rapport qualité/prix.',
    image_url: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80' },

  { cat: 'Tablettes', name: 'iPad Air M2', brand: 'Apple', price: 649000, stock: 10, featured: 1,
    description: 'Puissante, fine, compatible Apple Pencil Pro. Pour créer partout.',
    image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Tablettes', name: 'Samsung Galaxy Tab S9', brand: 'Samsung', price: 549000, old_price: 599000, stock: 14,
    description: 'Écran Dynamic AMOLED 2X, S-Pen inclus, certifiée IP68.',
    image_url: 'https://images.unsplash.com/photo-1585790050230-5ab7cff30fe6?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Tablettes', name: 'Lenovo Tab M10', brand: 'Lenovo', price: 129000, stock: 30,
    description: 'Tablette familiale abordable, idéale pour le streaming et l\'école.',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80' },

  { cat: 'Écouteurs', name: 'AirPods Pro 2', brand: 'Apple', price: 149000, stock: 35, featured: 1,
    description: 'Réduction active de bruit, audio spatial, boîtier MagSafe.',
    image_url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Écouteurs', name: 'Sony WH-1000XM5', brand: 'Sony', price: 229000, old_price: 259000, stock: 12, featured: 1,
    description: 'Casque sans fil premium, réduction de bruit inégalée, 30h d\'autonomie.',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Écouteurs', name: 'JBL Tune 510BT', brand: 'JBL', price: 39000, stock: 50,
    description: 'Casque Bluetooth confortable, son puissant JBL, autonomie 40h.',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Écouteurs', name: 'Samsung Galaxy Buds2', brand: 'Samsung', price: 79000, stock: 22,
    description: 'Écouteurs intra-auriculaires, ANC, son immersif 360°.',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80' },

  { cat: 'Accessoires', name: 'Chargeur USB-C 65W', brand: 'Anker', price: 25000, stock: 60,
    description: 'Chargeur rapide GaN compact, compatible ordinateurs et téléphones.',
    image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80' },
  { cat: 'Accessoires', name: 'Souris sans fil MX Master 3', brand: 'Logitech', price: 79000, stock: 18,
    description: 'Souris ergonomique premium, scroll ultra-rapide, multi-appareils.',
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80' },
];

function ensureCategory(cat) {
  const existing = db.prepare('SELECT * FROM categories WHERE name = ?').get(cat.name);
  if (existing) return existing;
  const info = db
    .prepare('INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)')
    .run(cat.name, slugify(cat.name), cat.icon, cat.description);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
}

function ensureProduct(cat, p) {
  const existing = db
    .prepare('SELECT id FROM products WHERE name = ? AND category_id = ?')
    .get(p.name, cat.id);
  if (existing) return;
  db.prepare(
    `INSERT INTO products
      (category_id, name, brand, description, price, old_price, stock, image_url, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cat.id,
    p.name,
    p.brand || '',
    p.description || '',
    p.price || 0,
    p.old_price || null,
    p.stock || 0,
    p.image_url || '',
    p.featured ? 1 : 0
  );
}

const catMap = new Map();
for (const c of CATEGORIES) catMap.set(c.name, ensureCategory(c));

for (const p of PRODUCTS) {
  const cat = catMap.get(p.cat);
  if (cat) ensureProduct(cat, p);
}

const total = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
const catTotal = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
console.log(`Seed terminé — ${catTotal} catégories, ${total} produits.`);
