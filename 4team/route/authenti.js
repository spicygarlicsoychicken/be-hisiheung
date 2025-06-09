const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');

// 파일 저장 세팅
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + (req.body.user_id || 'user');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/progress/proof', upload.single('proof_img'), async (req, res) => {
  const { user_id, challenge_id } = req.body;
  const proof_img_url = req.file ? req.file.filename : null;
  try {
    const result = await pool.query(
      `UPDATE user_challenge_progress
         SET status = 0, proof_img_url = $1
         WHERE user_id = $2 AND challenge_id = $3
         RETURNING *`,
      [proof_img_url, user_id, challenge_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/progress/approve', async (req, res) => {
  const { user_id, challenge_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE user_challenge_progress
         SET status = 1, completed_at = NOW()
         WHERE user_id = $1 AND challenge_id = $2
         RETURNING *`,
      [user_id, challenge_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/progress/reject', async (req, res) => {
  const { user_id, challenge_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE user_challenge_progress
         SET status = 2
         WHERE user_id = $1 AND challenge_id = $2
         RETURNING *`,
      [user_id, challenge_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;