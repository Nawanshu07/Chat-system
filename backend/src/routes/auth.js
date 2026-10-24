import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const AVATAR_COLORS = [
  'bg-[#2e5fa3]', // blue
  'bg-[#7b3fa0]', // purple
  'bg-[#a0522d]', // sienna
  'bg-[#1e4d3b]', // green
];

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate presence
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const trimmedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Format validations
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters and contain only letters, numbers, hyphens, or underscores',
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

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: trimmedUsername },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === normalizedEmail) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      return res.status(409).json({ error: 'This username is already taken' });
    }

    // Hash password (10 salt rounds for quick responsive auth)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Pick avatar color based on username hash
    const colorIndex = Math.abs(
      trimmedUsername.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];
    const avatar = trimmedUsername.charAt(0).toUpperCase();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        avatar,
        avatarColor,
        isOnline: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        avatarColor: true,
        createdAt: true,
      },
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error while creating account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
