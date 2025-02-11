require('dotenv').config(); // .env 파일 로드
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Body-parser (Express 내장)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));

// 라우트 파일 연결
const noticeRouter = require('./routes/noticeRoute');
const authRouter = require('./routes/authRoute');
const boardRouter = require('./routes/boardRoute'); // 새로 추가한 게시판 라우트

app.use('/api/notices', noticeRouter);
app.use('/api', authRouter);
app.use('/api/boards', boardRouter); // 게시판 관련 API

// 각 HTML 페이지 라우팅
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/board', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'board.html'));
});
app.get('/notice', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notice.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});
app.get('/board/detail/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'boardDetail.html'));
});

// 데이터베이스 연결 및 서버 실행 (운영환경에서는 migration을 별도로 관리)
const sequelize = require('./config/db');
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
