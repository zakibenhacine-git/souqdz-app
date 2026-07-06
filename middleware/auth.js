const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'souqdz-secret-a-changer-en-production';

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Lit le token si présent, attache req.user, mais ne bloque jamais.
function attachUser(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// Bloque si pas connecté.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Vous devez être connecté.' });
  next();
}

// Bloque si pas admin.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { signToken, attachUser, requireAuth, requireAdmin, JWT_SECRET };
