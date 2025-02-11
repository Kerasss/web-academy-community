// routes/authRoute.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User'); // User 모델

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: 'Gmail', // 사용 중인 이메일 서비스
    auth: {
      user: process.env.EMAIL_USER, // 이메일 주소
      pass: process.env.EMAIL_PASS  // 앱 비밀번호
    }
});

// [회원가입] POST /api/register
router.post('/register', async (req, res) => {
  try {
    const {
      userid,
      userPw,
      studentName,
      schoolName,
      grade,
      parentPhone,
      studentPhone,
      email
    } = req.body;

    // 필수 필드 확인
    if (!userid || !userPw || !studentName || !parentPhone || !studentPhone || !email) {
      return res.status(400).json({ error: '필수 항목을 모두 입력하세요.' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '유효한 이메일 주소를 입력하세요.' });
    }

    // 아이디 중복 체크
    const existingUserId = await User.findOne({ where: { userid } });
    if (existingUserId) {
      return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
    }

    // 이메일 중복 체크
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    // DB에 등록 (비밀번호는 모델의 beforeCreate 훅에서 해싱됨)
    const newUser = await User.create({
      userid,
      password: userPw, // plain password, will be hashed by model hook
      studentName,
      schoolName,
      grade,
      parentPhone,
      studentPhone,
      email
    });
    return res.status(201).json({ success: true, userId: newUser.id });
  } catch (err) {
    console.error(err);
    // Sequelize 고유 제약 조건 오류 처리
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    res.status(500).json({ error: '회원가입 실패' });
  }
});

// [로그인] POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { userid, userPw } = req.body;

    // 필수 필드 확인
    if (!userid || !userPw) {
      return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
    }

    // DB에서 아이디 찾기
    const user = await User.findOne({ where: { userid } });
    if (!user) {
      return res.status(400).json({ error: '아이디가 존재하지 않습니다.' });
    }

    // 비밀번호 검증 (모델의 comparePassword 메소드 사용)
    const match = await user.comparePassword(userPw);
    if (!match) {
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 발급
    const token = jwt.sign(
      { userId: user.id, userid: user.userid, studentName: user.studentName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ success: true, message: '로그인 성공', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '로그인 실패' });
  }
});

// [사용자 정보 조회] GET /api/user
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ error: '토큰이 없습니다.' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }

      const user = await User.findByPk(decoded.userId, {
        attributes: ['userid', 'studentName', 'schoolName', 'grade', 'parentPhone', 'studentPhone', 'email']
      });

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      return res.json({ user });
    });
  } catch (error) {
    console.error('사용자 정보 가져오기 에러:', error);
    return res.status(500).json({ error: '사용자 정보 가져오기 실패' });
  }
});

// [사용자 정보 수정] PUT /api/user
router.put('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ error: '토큰이 없습니다.' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const { studentName, schoolName, grade, parentPhone, studentPhone, email, currentPassword, newPassword } = req.body;

      // 필수 필드 확인
      if (!studentName || !parentPhone || !studentPhone || !email) {
        return res.status(400).json({ error: '학생 이름, 부모님 전화번호, 학생 전화번호, 이메일은 필수 항목입니다.' });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: '유효한 이메일 주소를 입력하세요.' });
      }

      // 이메일 중복 체크 (다른 사용자에게 동일 이메일이 있는지 확인)
      if (email !== user.email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
        }
      }

      // 비밀번호 변경 요청이 있는 경우
      if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ error: '비밀번호 변경을 위해 현재 비밀번호와 새로운 비밀번호를 모두 입력하세요.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 새로운 비밀번호 설정 (모델의 beforeUpdate 훅에서 해싱됨)
        user.password = newPassword;
      }

      // 업데이트할 필드 설정
      user.studentName = studentName;
      user.schoolName = schoolName;
      user.grade = grade;
      user.parentPhone = parentPhone;
      user.studentPhone = studentPhone;
      user.email = email;

      await user.save();

      return res.json({ message: '사용자 정보가 성공적으로 수정되었습니다.' });
    });
  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    // Sequelize 고유 제약 조건 오류 처리
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    return res.status(500).json({ error: '사용자 정보 수정 실패' });
  }
});

// [아이디 찾기] POST /api/find-id
router.post('/find-id', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ error: '이메일을 입력하세요.' });
    }

    const user = await User.findOne({ where: { email } });
    if (user) {
      res.json({ userid: user.userid });
    } else {
      res.status(404).json({ error: '등록된 이메일이 없습니다.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [비밀번호 재설정 요청] POST /api/find-password
router.post('/find-password', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ error: '이메일을 입력하세요.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '등록된 이메일이 없습니다.' });
    }

    // 비밀번호 재설정 토큰 생성
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1시간 후 만료
    await user.save();

    // 비밀번호 재설정 이메일 전송
    const resetURL = `http://${req.headers.host}/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: '비밀번호 재설정 요청',
      text: `안녕하세요 ${user.studentName}님,\n\n비밀번호를 재설정하려면 다음 링크를 클릭하세요:\n\n${resetURL}\n\n이 링크는 1시간 동안 유효합니다.\n\n감사합니다.`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('이메일 전송 오류:', err);
        return res.status(500).json({ error: '이메일 전송 실패' });
      }
      res.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });
    });

  } catch (err) {
    console.error('비밀번호 재설정 요청 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [비밀번호 재설정] POST /api/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword) {
      return res.status(400).json({ error: '새 비밀번호를 입력하세요.' });
    }

    const user = await User.findOne({ 
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: '비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.' });
    }

    // 새로운 비밀번호 설정 (모델의 beforeUpdate 훅에서 해싱됨)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // 비밀번호 재설정 완료 이메일 전송
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: '비밀번호가 재설정되었습니다.',
      text: `안녕하세요 ${user.studentName}님,\n\n비밀번호가 성공적으로 재설정되었습니다.\n\n감사합니다.`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('이메일 전송 오류:', err);
        return res.status(500).json({ error: '이메일 전송 실패' });
      }
      res.json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
    });

  } catch (err) {
    console.error('비밀번호 재설정 처리 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
