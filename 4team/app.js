const express = require('express');
const pool = require('./db'); // db.js 연결

const challengesRouter = require('./route/challenges');
const authentiRouter =  require('./route/authenti');
const quizRouter = require('./route/quiz');

const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(challengesRouter);
app.use(authentiRouter);
app.use(quizRouter);


// 저장 폴더 및 파일명 세팅
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // uploads 폴더에 저장 (없으면 직접 폴더 만들어줘!)
  },
  filename: function (req, file, cb) {
    const userid = req.body.userid;
    const uniqueSuffix = Date.now() + '-' + userid;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1) 유저 전체 조회 (GET)
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "user"');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2) 회원가입 (POST)
app.post('/users', async (req, res) => {
  const { userid, password, nickname, profile_img_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO "user" (userid, password, nickname, profile_img_url) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`,
      [userid, password, nickname, profile_img_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { userid, password } = req.body;

  try {
    // 해당 userid로 유저 정보 조회
    const result = await pool.query(
      'SELECT * FROM "user" WHERE userid = $1',
      [userid]
    );
    
    const user = result.rows[0];

    if (!user || user.password !== password) {
      // 해당 userid가 없음
      return res.status(400).json({ error: '아이디/비밀번호가 올바르지 않습니다.' });
    }

    // 로그인 성공 - 원하는 정보만 응답
    res.json({
      id: user.id,
      userid: user.userid,
      nickname: user.nickname,
      profile_img_url: user.profile_img_url,
      // 필요하면 추가 정보
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});