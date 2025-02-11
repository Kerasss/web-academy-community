// routes/boardRoute.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const router = express.Router();
const Board = require('../models/Board');
const Comment = require('../models/Comment'); // 댓글 모델
const BoardRecommendation = require('../models/BoardRecommendation');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Multer 설정 (다중 사진 첨부 허용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const { school, category, page = 1, limit = 10 } = req.query;
    // 조건 객체를 초기화하고, 각 필터 값이 'all'이 아닐 경우에만 조건에 추가
    const where = {};
    if (school && school !== 'all') {
      where.school = school;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    const boards = await Board.findAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    });
    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'files', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });
  
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }
      const author = decoded.studentName || decoded.userid;
  
      // 수정: category 필드를 추가합니다.
      const { title, content, school, category, isAnonymous } = req.body;
      const now = new Date();
      now.setHours(now.getHours() + 9); // KST 적용
      const date = now.toISOString().split('T')[0];
  
      // 이미지 처리
      let images = [];
      if (req.files && req.files['images'] && req.files['images'].length > 0) {
        images = req.files['images'].map(file => '/uploads/' + file.filename);
      }
      const imagesJSON = JSON.stringify(images);
  
      // 첨부파일 처리
      let attachments = [];
      if (req.files && req.files['files'] && req.files['files'].length > 0) {
        attachments = req.files['files'].map(file => '/uploads/' + file.filename);
      }
      const attachmentsJSON = JSON.stringify(attachments);
  
      const newBoard = await Board.create({
        title,
        content,
        author,        // 여기에 쉼표 주의
        school,
        category,      // 새로 추가된 필드
        date,
        viewCount: 0,
        images: imagesJSON,
        attachments: attachmentsJSON,
        isAnonymous: isAnonymous === 'true'
      });
      res.status(201).json(newBoard);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create board' });
    }
  }
);



// 게시글 상세 조회 (조회수 1 증가 및 댓글 포함)
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    board.viewCount += 1;
    await board.save();

    // 댓글 조회: 부모 댓글과 각 댓글의 답글 포함
    const comments = await Comment.findAll({
      where: { boardId: board.id, parentCommentId: null },
      order: [['id', 'ASC']]
    });

    // 각 댓글에 대해 답글을 추가
    for (const comment of comments) {
      const replies = await Comment.findAll({
        where: { parentCommentId: comment.id },
        order: [['id', 'ASC']]
      });
      comment.dataValues.replies = replies;
    }
    res.json({ board, comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// 댓글 조회 엔드포인트 (boardDetail.js에서 사용)
router.get('/:boardId/comments', async (req, res) => {
  try {
    const { boardId } = req.params;
    const comments = await Comment.findAll({
      where: { boardId, parentCommentId: null },
      order: [['id', 'ASC']]
    });
    for (const comment of comments) {
      const replies = await Comment.findAll({
        where: { parentCommentId: comment.id },
        order: [['id', 'ASC']]
      });
      comment.dataValues.replies = replies;
    }
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 게시글 삭제 (작성자만 삭제 가능)
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    const author = decoded.studentName || decoded.userid;

    const board = await Board.findByPk(req.params.id);
    if (!board) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    if ((board.author !== author) && author!=='장민균' && author!=='김흥환') return res.status(403).json({ error: '작성자만 삭제할 수 있습니다.' });
    await board.destroy();
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'files', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      // 인증 및 토큰 검증 추가
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }
      const author = decoded.studentName || decoded.userid;
      
      // 게시글 조회 및 권한 확인
      const board = await Board.findByPk(req.params.id);
      if (!board) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      if ((board.author !== author) && author !== '장민균' && author !== '김흥환')
        return res.status(403).json({ error: '작성자만 수정할 수 있습니다.' });

      const { title, content, school, category, isAnonymous } = req.body; // category 추가
      const now = new Date();
      now.setHours(now.getHours() + 9);
      const date = now.toISOString().split('T')[0];

      let images = [];
      if (req.files && req.files['images'] && req.files['images'].length > 0) {
        images = req.files['images'].map(file => '/uploads/' + file.filename);
      }
      const imagesJSON = images.length > 0 ? JSON.stringify(images) : board.images;

      let attachments = [];
      if (req.files && req.files['files'] && req.files['files'].length > 0) {
        attachments = req.files['files'].map(file => '/uploads/' + file.filename);
      }
      const attachmentsJSON = attachments.length > 0 ? JSON.stringify(attachments) : board.attachments;

      board.title = title;
      board.content = content;
      board.school = school;
      board.category = category;  // 추가
      board.date = date;
      board.images = imagesJSON;
      board.attachments = attachmentsJSON;
      board.isAnonymous = isAnonymous === 'true';

      await board.save();
      res.json(board);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update board' });
    }
  }
);

// 댓글 작성 – multer 미들웨어를 적용하여 파일 업로드 지원 (사진: 단일, 파일: 다중)
router.post('/:boardId/comments',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'files', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { boardId } = req.params;
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }
      const author = decoded.studentName || decoded.userid;
      
      // 한국 시간 적용
      let now = new Date();
      now.setHours(now.getHours() + 9);
      const date = now.toISOString().split('T')[0];
      
      // 댓글 내용
      const { content, parentCommentId } = req.body;
      
      // 사진 처리 (단일 이미지)
      let photo = null;
      if (req.files && req.files['photo'] && req.files['photo'].length > 0) {
        photo = '/uploads/' + req.files['photo'][0].filename;
      }
      
      // 파일 첨부 처리 (다중)
      let attachments = [];
      if (req.files && req.files['files'] && req.files['files'].length > 0) {
        attachments = req.files['files'].map(file => '/uploads/' + file.filename);
      }
      const attachmentsJSON = JSON.stringify(attachments);
      
      const newComment = await Comment.create({
        boardId,
        parentCommentId: parentCommentId || null,
        content,
        author,
        date,
        photo,
        attachments: attachmentsJSON
      });
      res.status(201).json(newComment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// 댓글 답글 작성 – POST /api/boards/:boardId/comments/:commentId/reply
router.post('/:boardId/comments/:commentId/reply', async (req, res) => {
  try {
    const { boardId, commentId } = req.params;
    const { content } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    const author = decoded.studentName || decoded.userid;
    
    // 한국 시간 적용: 현재 시간에 9시간 추가
    let now = new Date();
    now.setHours(now.getHours() + 9);
    const date = now.toISOString().split('T')[0];

    const newReply = await Comment.create({
      boardId,
      parentCommentId: commentId,  // 답글의 부모 댓글 ID 설정
      content,
      author,
      date: date
    });
    res.status(201).json(newReply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

router.post('/:id/recommend', async (req, res) => {
  try {
    const boardId = req.params.id;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '토큰이 없습니다.' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    // 사용자 식별: 예) decoded.userid 또는 decoded.studentName (필요에 따라 수정)
    const userId = decoded.studentName || decoded.userid;
    
    // 오늘 날짜 (YYYY-MM-DD)
    let now = new Date();
    now.setHours(now.getHours() + 9); // KST 적용
    const today = now.toISOString().split('T')[0];
    
    // 해당 사용자, 해당 게시글, 오늘 날짜로 추천 기록이 있는지 확인
    const existing = await BoardRecommendation.findOne({
      where: {
        boardId: boardId,
        userId: userId,
        date: today
      }
    });
    if (existing) {
      return res.status(400).json({ error: '추천은 1일 1회씩만 가능합니다.' });
    }
    
    // 추천 기록 생성
    await BoardRecommendation.create({
      boardId: boardId,
      userId: userId,
      date: today
    });
    
    // Board 모델의 추천 수 증가
    const board = await Board.findByPk(boardId);
    board.recommendCount += 1;
    await board.save();
    
    res.json({ recommendCount: board.recommendCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

  

module.exports = router;
