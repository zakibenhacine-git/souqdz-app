const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// STORAGE_DIR : dossier où sont conservées les données qui doivent survivre aux redémarrages
// (base de données + photos uploadées). En local, c'est simplement ./storage.
// Sur Render, on montera le disque permanent exactement sur ce chemin.
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, 'storage');
const dataDir = path.join(STORAGE_DIR, 'db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'souqdz.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL,
  old_price INTEGER,
  category TEXT NOT NULL,
  image_seed TEXT NOT NULL,
  badge TEXT DEFAULT '',
  stock INTEGER DEFAULT 100,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  address TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);
`);

// ---- Seed admin account ----
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@souqdz.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('Administrateur', 'admin@souqdz.com', hash, 'admin');
  console.log('-> Compte admin cree : admin@souqdz.com / admin123');
}

// ---- Seed products ----
const countRow = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (countRow.c === 0) {
  const seed = [
    ['Nour Studio', 'Robe fluide manches longues', "Robe legere en viscose, coupe fluide, ideale pour l'ete.", 5200, 7400, 'femme', 'souqdz-p1', 'promo', 24],
    ['Atlas Wear', 'Chemise lin coupe droite', 'Chemise 100% lin, respirante, coupe droite intemporelle.', 3800, null, 'homme', 'souqdz-p2', 'new', 40],
    ['Kabylia Shoes', 'Sneakers en toile beige', 'Sneakers confortables en toile, semelle souple.', 6200, 8000, 'chaussures', 'souqdz-p3', 'promo', 15],
    ['Petit Souk', 'Ensemble deux pieces enfant', 'Ensemble haut + pantalon en coton doux, 2-8 ans.', 2400, null, 'enfant', 'souqdz-p4', 'new', 30],
    ['Argan Dore', "Coffret soin visage huile d'argan", 'Coffret 3 pieces : huile, serum, creme a l\'argan pur.', 2900, 3600, 'beaute', 'souqdz-p5', 'promo', 50],
    ['Nour Studio', 'Kimono brode motifs berberes', "Kimono leger avec broderies inspirees de l'artisanat berbere.", 4600, null, 'femme', 'souqdz-p6', 'new', 18],
    ['Sahara Denim', 'Jean droit delave', 'Jean coupe droite, denim delave, taille normale.', 4100, 5300, 'homme', 'souqdz-p7', 'promo', 35],
    ['Kabylia Shoes', 'Babouches cuir artisanales', 'Babouches en cuir veritable, faites main.', 3500, null, 'chaussures', 'souqdz-p8', 'new', 22],
    ['Casbah Line', 'Foulard soie imprime', 'Foulard en soie avec motifs traditionnels imprimes.', 1800, 2400, 'femme', 'souqdz-b1', 'promo', 60],
    ['Atlas Wear', 'Veste legere matelassee', 'Veste mi-saison matelassee, coupe ajustee.', 7200, null, 'homme', 'souqdz-b2', 'new', 20],
    ['Riad Home', 'Set de coussins tisses', 'Lot de 2 coussins decoratifs tisses a la main.', 3200, 4100, 'maison', 'souqdz-b3', 'promo', 45],
    ['Ambre & Musc', "Parfum d'ambiance oud", "Diffuseur de parfum d'interieur, senteur oud & ambre.", 2600, null, 'beaute', 'souqdz-b4', 'new', 38],
  ];
  const stmt = db.prepare(`INSERT INTO products (brand, title, description, price, old_price, category, image_seed, badge, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of seed) stmt.run(...p);
  console.log('-> Produits de demonstration inseres (' + seed.length + ')');
}

module.exports = db;
