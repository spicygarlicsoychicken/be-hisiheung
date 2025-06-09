const express = require('express');
const router = express.Router();
const pool = require('../db');

// [1] 관리자 - 유저에게 오늘 퀴즈 3개 할당 (수동)
router.post('/quiz/assign', async (req, res) => {
  const { user_id, quiz_ids } = req.body;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    for (const quiz_id of quiz_ids) {
      await pool.query(
        `INSERT INTO quiz_user (quiz_id, user_id, assigned_date)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [quiz_id, user_id, today]
      );
    }
    res.json({ success: true, assigned: quiz_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [2] 유저 - 오늘 받은 퀴즈 3개 조회
router.get('/quiz/today/:user_id', async (req, res) => {
  const user_id = req.params.user_id;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await pool.query(
      `SELECT q.*
       FROM quiz_user qu
       JOIN quiz q ON qu.quiz_id = q.id
       WHERE qu.user_id = $1
         AND qu.assigned_date = $2
       ORDER BY q.id`,
      [user_id, today]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz/submit', async (req, res) => {
  const { user_id, quiz_id, submitted_answer } = req.body;

  // 1) 정답 불러오기
  const quizRes = await pool.query(
    'SELECT answer FROM quiz WHERE id = $1',
    [quiz_id]
  );
  if (quizRes.rows.length === 0)
    return res.status(404).json({ error: '퀴즈를 찾을 수 없습니다.' });

  const answer = quizRes.rows[0].answer;  // 실제 정답 (true/false)

  // 2) 비교해서 맞았는지 확인
  const isCorrect = (submitted_answer === answer);

  // 3) 결과 DB에 저장
  await pool.query(
    `UPDATE quiz_user
     SET submitted_answer = $1,
         is_correct = $2
     WHERE user_id = $3 AND quiz_id = $4`,
    [submitted_answer, isCorrect, user_id, quiz_id]
  );

  // 4) 결과 응답
  res.json({ is_correct: isCorrect });
});

module.exports = router;