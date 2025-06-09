// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',         // PostgreSQL 사용자명
  host: 'localhost',        // DB 서버 주소
  database: '4team',         // 데이터베이스명
  password: '8286',      // 비밀번호
  port: 5432,               // 기본 포트
});

module.exports = pool;