require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);

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

app.listen(PORT, () => {
  console.log(`\n===============================================`);
  console.log(` Nass-Telecom démarré sur http://localhost:${PORT}`);
  console.log(` Boutique  : http://localhost:${PORT}/`);
  console.log(` Admin     : http://localhost:${PORT}/admin`);
  console.log(`===============================================\n`);
});
