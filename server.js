const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

require('./db'); // initialise + seed la base au démarrage

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');
const couponRoutes = require('./routes/coupons');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, 'storage');

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/coupons', couponRoutes);

// Photos uploadées par l'admin (stockées dans le dossier permanent)
app.use('/uploads', express.static(path.join(STORAGE_DIR, 'uploads')));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`\n✅ SOUQDZ.COM tourne sur http://localhost:${PORT}`);
  console.log(`   Espace admin : http://localhost:${PORT}/admin/login.html`);
  console.log(`   Identifiants admin : admin@souqdz.com / admin123\n`);
});
