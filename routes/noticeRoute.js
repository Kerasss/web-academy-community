// routes/noticeRoute.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Notice = require('../models/Notice'); // DB 모델

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// (1) Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 업로드 폴더 (예: 'uploads/')
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 파일명: 타임스탬프 + 원본
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// (2) 공지 목록 가져오기 (인증 불필요, 공개)
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.findAll({ order: [['id', 'DESC']] });
    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// (3) 새 공지 작성 (사진 + 여러 파일 업로드) - 인증 필요
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },   // 단일 이미지
    { name: 'files', maxCount: 10 }, // 여러 일반 파일
  ]),
  async (req, res) => {
    try {
      // JWT 검증
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: '인증 헤더가 없습니다.' });
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      if (!token) {
        return res.status(401).json({ error: '토큰이 없습니다.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }

      const studentName = decoded.studentName;
      if (!studentName) {
        return res.status(403).json({ error: '학생 이름 정보가 토큰에 포함되어 있지 않습니다.' });
      }

      // 디버깅 로그 추가
      console.log(`공지 작성자: ${studentName}`);

      const { title, content } = req.body;
      const now = new Date();
      now.setHours(now.getHours() + 9); // UTC+9
      const formattedDate = now.toISOString().split('T')[0];

      // (a) 이미지
      let imagePath = null;
      if (req.files['image'] && req.files['image'].length > 0) {
        imagePath = '/uploads/' + req.files['image'][0].filename;
      }

      // (b) 여러 파일
      let attachments = [];
      if (req.files['files'] && req.files['files'].length > 0) {
        attachments = req.files['files'].map((file) => '/uploads/' + file.filename);
      }

      // JSON으로 직렬화해 DB에 저장 (notices 테이블의 "attachments" 컬럼)
      const attachmentsJSON = JSON.stringify(attachments);
      
      if (studentName !== '김흥환' && studentName !== '장민균') {
        return res.status(403).json({ error: '운영자만 공지사항을 등록할 수 있습니다.' });
      }

      // DB 레코드 생성
      const newNotice = await Notice.create({
        title,
        content,
        author: studentName, // 클라이언트에서 받지 않고 JWT에서 추출
        date: formattedDate,
        imagePath,        // 기존 이미지 칼럼
        attachments: attachmentsJSON, // 새 필드 (마이그레이션 및 모델 수정)
      });

      res.status(201).json(newNotice);
    } catch (error) {
      console.error(error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ error: error.errors.map(e => e.message) });
      }
      res.status(500).json({ error: 'Failed to create notice' });
    }
  }
);

// (4) 특정 공지 상세 조회 (인증 불필요, 공개)
router.get('/:id', async (req, res) => {
  const noticeId = req.params.id;
  try {
    const notice = await Notice.findOne({ where: { id: noticeId } });
    if (!notice) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the notice' });
  }
});

// (5) 공지 삭제 - 인증 필요, 작성자만 삭제 가능
router.delete('/:id', async (req, res) => {
  try {
    // JWT 검증
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ error: '토큰이 없습니다.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }

    const studentName = decoded.studentName;
    if (!studentName) {
      return res.status(403).json({ error: '학생 이름 정보가 토큰에 포함되어 있지 않습니다.' });
    }

    const { id } = req.params;
    const notice = await Notice.findOne({ where: { id } });
    if (!notice) {
      return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
    }
    // 운영자 검증 (작성자만 삭제 가능하도록)
    if (studentName !== '김흥환' && studentName !== '장민균') {
      return res.status(403).json({ error: '운영자만 공지사항을 삭제할 수 있습니다.' });
    }

    await notice.destroy();
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '공지 삭제 실패' });
  }
});

module.exports = router;
