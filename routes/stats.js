const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const customerCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const revenueRow = db.prepare("SELECT COALESCE(SUM(total),0) as t FROM orders WHERE status != 'annulee'").get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'en_attente'").get().c;
  res.json({
    productCount,
    orderCount,
    customerCount,
    revenue: revenueRow.t,
    pendingOrders,
  });
});

module.exports = router;
