const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];

// ---- Créer une commande (checkout à la livraison, compte optionnel) ----
router.post('/', (req, res) => {
  const { items, customer_name, phone, wilaya, address } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide.' });
  }
  if (!customer_name || !phone || !wilaya || !address) {
    return res.status(400).json({ error: 'Merci de renseigner nom, téléphone, wilaya et adresse.' });
  }

  // Recalcule les prix côté serveur à partir de la base (jamais confiance au client)
  let total = 0;
  const resolvedItems = [];
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
    if (!product) continue;
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    total += product.price * qty;
    resolvedItems.push({ product_id: product.id, title: product.title, price: product.price, quantity: qty });
  }
  if (resolvedItems.length === 0) {
    return res.status(400).json({ error: 'Aucun article valide dans le panier.' });
  }

  const userId = req.user ? req.user.id : null;
  const info = db.prepare(`INSERT INTO orders (user_id, customer_name, phone, wilaya, address, total, status)
    VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`)
    .run(userId, customer_name, phone, wilaya, address, total);

  const orderId = info.lastInsertRowid;
  const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?)');
  for (const it of resolvedItems) itemStmt.run(orderId, it.product_id, it.title, it.price, it.quantity);

  res.status(201).json({ order: { id: Number(orderId), total, status: 'en_attente' } });
});

// ---- Mes commandes (client connecté) ----
router.get('/mine', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: withItems });
});

// ---- Admin : toutes les commandes ----
router.get('/', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const withItems = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: withItems });
});

// ---- Admin : changer le statut d'une commande ----
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Commande introuvable.' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
