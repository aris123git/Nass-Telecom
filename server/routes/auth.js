const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAdmin } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
  const ok = bcrypt.compareSync(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = signToken(user);
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('nt_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.post('/logout', (req, res) => {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('nt_token', { path: '/', sameSite: 'lax', secure });
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
