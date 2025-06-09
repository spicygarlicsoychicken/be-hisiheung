const express = require('express');
const router = express.Router();
const pool = require('../db');

// 전체 도전 불러오기
router.get('/challenges', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM challenges');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 내 도전리스트(진행중)로 담기
router.post('/progress', async (req, res) => {
  const { user_id, challenge_id } = req.body;

  try {
    // 이미 담은 도전인지 중복 체크 (선택)
    const exists = await pool.query(
      'SELECT * FROM user_challenge_progress WHERE user_id = $1 AND challenge_id = $2',
      [user_id, challenge_id]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: '이미 내 도전리스트에 담긴 미션입니다.' });
    }

    // 새 도전 시작 (status=0: 진행중, started_at: 현재 시각)
    const result = await pool.query(
      `INSERT INTO user_challenge_progress (user_id, challenge_id, status, started_at)
       VALUES ($1, $2, 0, NOW())
       RETURNING *`,
      [user_id, challenge_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 내 도전리스트 전체 조회 (진행중/완료 구분 없이 전부)
router.get('/progress/:user_id', async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const result = await pool.query(
      `SELECT ucp.*, c.title, c.description, c.difficulty
       FROM user_challenge_progress ucp
       JOIN challenges c ON ucp.challenge_id = c.id
       WHERE ucp.user_id = $1
       ORDER BY ucp.started_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;