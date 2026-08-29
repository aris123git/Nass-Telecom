const express = require('express');
const multer = require('multer');
const { requireAdmin } = require('../auth');
const {
  buildCatalog,
  saveBackupToDisk,
  restoreCatalog,
  counts,
} = require('../backup');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/status', requireAdmin, (_req, res) => {
  res.json({ ...counts(), hasDiskBackup: require('fs').existsSync(require('../backup').BACKUP_FILE) });
});

router.get('/export', requireAdmin, (_req, res) => {
  const catalog = buildCatalog();
  saveBackupToDisk(catalog);
  const filename = `nass-telecom-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(catalog, null, 2));
});

router.post('/save', requireAdmin, (_req, res) => {
  const result = saveBackupToDisk();
  res.json({ ok: true, ...result, ...counts() });
});

router.post('/import', requireAdmin, upload.single('backup'), (req, res) => {
  try {
    let catalog;
    if (req.file) {
      catalog = JSON.parse(req.file.buffer.toString('utf8'));
    } else if (req.body && req.body.catalog) {
      catalog = typeof req.body.catalog === 'string' ? JSON.parse(req.body.catalog) : req.body.catalog;
    } else {
      return res.status(400).json({ error: 'Fichier backup JSON requis' });
    }
    const result = restoreCatalog(catalog, { clear: true });
    saveBackupToDisk(catalog);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[backup import]', e);
    res.status(400).json({ error: e.message || 'Import impossible' });
  }
});

module.exports = router;
