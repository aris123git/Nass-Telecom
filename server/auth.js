const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nass-telecom-dev-secret';
const TOKEN_TTL = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function extractToken(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.nt_token) return req.cookies.nt_token;
  return null;
}

function requireAdmin(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentification requise' });
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

module.exports = { signToken, requireAdmin, extractToken, JWT_SECRET };
