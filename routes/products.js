const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- Public : liste des produits (avec filtre catégorie / recherche) ----
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (title LIKE ? OR brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ products: rows });
});

// ---- Public : détail d'un produit ----
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ product: row });
});

// ---- Admin : créer un produit ----
router.post('/', requireAdmin, (req, res) => {
  const { brand, title, description, price, old_price, category, image_seed, badge, stock } = req.body || {};
  if (!brand || !title || !price || !category || !image_seed) {
    return res.status(400).json({ error: 'Champs requis manquants (marque, titre, prix, catégorie, image).' });
  }
  const info = db.prepare(`INSERT INTO products (brand, title, description, price, old_price, category, image_seed, badge, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(brand, title, description || '', price, old_price || null, category, image_seed, badge || '', stock ?? 100);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product });
});

// ---- Admin : modifier un produit ----
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produit introuvable.' });
  const { brand, title, description, price, old_price, category, image_seed, badge, stock } = req.body || {};
  db.prepare(`UPDATE products SET brand=?, title=?, description=?, price=?, old_price=?, category=?, image_seed=?, badge=?, stock=? WHERE id=?`)
    .run(
      brand ?? existing.brand,
      title ?? existing.title,
      description ?? existing.description,
      price ?? existing.price,
      old_price === undefined ? existing.old_price : old_price,
      category ?? existing.category,
      image_seed ?? existing.image_seed,
      badge ?? existing.badge,
      stock ?? existing.stock,
      req.params.id
    );
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
});

// ---- Admin : supprimer un produit ----
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produit introuvable.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
