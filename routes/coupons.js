const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function computeDiscount(coupon, subtotal) {
  if (coupon.discount_type === 'percent') {
    return Math.round((subtotal * coupon.discount_value) / 100);
  }
  return Math.min(coupon.discount_value, subtotal); // remise fixe, jamais plus que le total
}

// ---- Public : vérifier/appliquer un code promo ----
router.post('/apply', (req, res) => {
  const { code, subtotal } = req.body || {};
  if (!code || typeof subtotal !== 'number') {
    return res.status(400).json({ error: 'Code et montant requis.' });
  }
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code.trim().toUpperCase());
  if (!coupon || !coupon.active) {
    return res.status(404).json({ error: 'Code promo invalide.' });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Ce code promo a expiré.' });
  }
  if (subtotal < coupon.min_order) {
    return res.status(400).json({ error: `Montant minimum de ${coupon.min_order} DA requis pour ce code.` });
  }
  const discount = computeDiscount(coupon, subtotal);
  res.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discount,
  });
});

// ---- Admin : lister tous les codes ----
router.get('/', requireAdmin, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.json({ coupons });
});

// ---- Admin : créer un code ----
router.post('/', requireAdmin, (req, res) => {
  const { code, discount_type, discount_value, min_order, expires_at } = req.body || {};
  if (!code || !discount_value) {
    return res.status(400).json({ error: 'Code et valeur de remise requis.' });
  }
  const type = discount_type === 'fixed' ? 'fixed' : 'percent';
  try {
    const info = db.prepare(`INSERT INTO coupons (code, discount_type, discount_value, min_order, expires_at)
      VALUES (?, ?, ?, ?, ?)`)
      .run(code.trim().toUpperCase(), type, Number(discount_value), Number(min_order) || 0, expires_at || null);
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ coupon });
  } catch (e) {
    res.status(409).json({ error: 'Ce code existe déjà.' });
  }
});

// ---- Admin : activer / désactiver / modifier un code ----
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Code introuvable.' });
  const { active, discount_value, min_order, expires_at } = req.body || {};
  db.prepare(`UPDATE coupons SET active = ?, discount_value = ?, min_order = ?, expires_at = ? WHERE id = ?`)
    .run(
      active !== undefined ? (active ? 1 : 0) : existing.active,
      discount_value !== undefined ? Number(discount_value) : existing.discount_value,
      min_order !== undefined ? Number(min_order) : existing.min_order,
      expires_at !== undefined ? expires_at : existing.expires_at,
      req.params.id
    );
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  res.json({ coupon });
});

// ---- Admin : supprimer un code ----
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Code introuvable.' });
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
