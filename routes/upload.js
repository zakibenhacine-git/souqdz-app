const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage');
const uploadsDir = path.join(STORAGE_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 Mo max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return cb(new Error('Format d\'image non supporté (jpg, png, webp, gif uniquement).'));
    }
    cb(null, true);
  },
});

router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

module.exports = router;
