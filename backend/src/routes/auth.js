import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { JWT_SECRET } from '../config.js';
import { sendOtpEmail } from '../services/email.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const AVATAR_COLORS = [
  'bg-[#2e5fa3]', // blue
  'bg-[#7b3fa0]', // purple
  'bg-[#a0522d]', // sienna
  'bg-[#1e4d3b]', // green
];

// Helper to generate 6-digit numeric OTP code
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register — Start registration and send verification OTP
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const trimmedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters: letters, numbers, hyphens, or underscores',
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must include at least one number or uppercase letter' });
    }

    // Check existing accounts
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail && existingEmail.isEmailVerified) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingUsername && existingUsername.email !== normalizedEmail && existingUsername.isEmailVerified) {
      return res.status(409).json({ error: 'This username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const colorIndex = Math.abs(
      trimmedUsername.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];
    const avatar = trimmedUsername.charAt(0).toUpperCase();

    // Create or update unverified user
    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        username: trimmedUsername,
        password: hashedPassword,
        avatar,
        avatarColor,
        isEmailVerified: false,
      },
      create: {
        username: trimmedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        avatar,
        avatarColor,
        isEmailVerified: false,
      },
    });

    // Delete existing verify OTPs for this email
    await prisma.otp.deleteMany({
      where: { email: normalizedEmail, type: 'VERIFY_EMAIL' },
    });

    // Generate new OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code,
        type: 'VERIFY_EMAIL',
        expiresAt,
      },
    });

    // Send OTP email (gracefully falls back if email not configured)
    const emailResult = await sendOtpEmail(normalizedEmail, code, 'VERIFY_EMAIL');

    return res.status(200).json({
      message: emailResult.delivered
        ? 'Verification code sent to your email'
        : 'Verification code generated! Please enter code to continue.',
      email: normalizedEmail,
      requiresVerification: true,
      previewCode: !emailResult.delivered ? code : undefined,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error while creating account' });
  }
});

// POST /api/auth/verify-email — Verify 6-digit OTP to activate account
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedOtp = String(otp).trim();

    const record = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        type: 'VERIFY_EMAIL',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.code !== trimmedOtp) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Activate user
    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { isEmailVerified: true },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        avatarColor: true,
        createdAt: true,
      },
    });

    // Clean up OTP
    await prisma.otp.deleteMany({
      where: { email: normalizedEmail, type: 'VERIFY_EMAIL' },
    });

    const token = generateToken(user);

    return res.json({
      message: 'Email verified successfully!',
      user,
      token,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/auth/resend-otp — Resend a fresh OTP code
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type = 'VERIFY_EMAIL' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Rate-limit: Check if an OTP was requested in the last 45 seconds
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        type,
        createdAt: { gt: new Date(Date.now() - 45 * 1000) },
      },
    });

    if (recentOtp) {
      return res.status(429).json({
        error: 'Please wait at least 45 seconds before requesting another code',
      });
    }

    // Generate new OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete previous OTPs of this type
    await prisma.otp.deleteMany({
      where: { email: normalizedEmail, type },
    });

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code,
        type,
        expiresAt,
      },
    });

    const emailResult = await sendOtpEmail(normalizedEmail, code, type);

    return res.json({
      message: emailResult.delivered
        ? 'A fresh verification code has been sent to your email'
        : 'A fresh verification code has been generated',
      previewCode: !emailResult.delivered ? code : undefined,
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ error: 'Failed to resend code' });
  }
});

// POST /api/auth/forgot-password — Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let previewCode = undefined;

    // If user exists, create reset OTP and send email
    if (user) {
      await prisma.otp.deleteMany({
        where: { email: normalizedEmail, type: 'RESET_PASSWORD' },
      });

      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otp.create({
        data: {
          email: normalizedEmail,
          code,
          type: 'RESET_PASSWORD',
          expiresAt,
        },
      });

      const emailResult = await sendOtpEmail(normalizedEmail, code, 'RESET_PASSWORD');
      if (!emailResult.delivered) {
        previewCode = code;
      }
    }

    // Return consistent friendly message regardless to prevent email enumeration
    return res.json({
      message: 'If an account exists with this email, a 6-digit reset code has been sent.',
      email: normalizedEmail,
      previewCode,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password — Reset password with 6-digit OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedOtp = String(otp).trim();

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!/[A-Z]/.test(newPassword) && !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must include at least one number or uppercase letter' });
    }

    const record = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        type: 'RESET_PASSWORD',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.code !== trimmedOtp) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        isEmailVerified: true, // Resetting via email verifies ownership
      },
    });

    await prisma.otp.deleteMany({
      where: { email: normalizedEmail, type: 'RESET_PASSWORD' },
    });

    return res.json({
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/login — Sign in (checks email verification)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email has been verified
    if (!user.isEmailVerified) {
      // Send a fresh OTP automatically
      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otp.deleteMany({
        where: { email: normalizedEmail, type: 'VERIFY_EMAIL' },
      });

      await prisma.otp.create({
        data: {
          email: normalizedEmail,
          code,
          type: 'VERIFY_EMAIL',
          expiresAt,
        },
      });

      await sendOtpEmail(normalizedEmail, code, 'VERIFY_EMAIL');

      return res.status(403).json({
        error: 'Please verify your email address to continue.',
        requiresVerification: true,
        email: normalizedEmail,
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
    };

    const token = generateToken(safeUser);

    return res.json({
      message: 'Logged in successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

export default router;
