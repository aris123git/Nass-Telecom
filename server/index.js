require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const backupRoutes = require('./routes/backup');
const { restoreIfEmpty, saveBackupToDisk } = require('./backup');

const app = express();
const PORT = process.env.PORT || 3000;

// Nécessaire derrière Cloudflare / reverse-proxy (cookies Secure, proto https)
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/backup', backupRoutes);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

app.get(['/admin', '/admin/'], (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html'));
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'), (err) => {
    if (err) res.status(404).send('Page introuvable');
  });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Erreur serveur' });
});

// Restaure le catalogue depuis backup/catalog.json si la base est vide
try {
  const result = restoreIfEmpty();
  if (!result.restored) {
    const { counts } = require('./backup');
    const c = counts();
    if (c.categories === 0 && c.products === 0) {
      require('./seed');
      try { saveBackupToDisk(); } catch (_) {}
    }
  }
} catch (e) {
  console.warn('[backup] restauration au démarrage:', e.message);
}

app.listen(PORT, () => {
  console.log(`\n===============================================`);
  console.log(` NASS ELECTRO+ démarré sur http://localhost:${PORT}`);
  console.log(` Boutique  : http://localhost:${PORT}/`);
  console.log(` Admin     : http://localhost:${PORT}/admin`);
  console.log(`===============================================\n`);
});
