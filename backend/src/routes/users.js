import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/me — Current user profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/users — List registered users to chat with (excludes self, supports search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user.id;

    const where = {
      id: { not: currentUserId },
    };

    const isPostgres = (process.env.DATABASE_URL || '').startsWith('postgres');

    if (search && typeof search === 'string') {
      const raw = search.trim();
      const cleanQ = raw.startsWith('@') ? raw.slice(1).trim() : raw;
      if (cleanQ.length > 0) {
        const makeContains = (field) =>
          isPostgres
            ? { [field]: { contains: cleanQ, mode: 'insensitive' } }
            : { [field]: { contains: cleanQ } };

        where.OR = [
          makeContains('username'),
          makeContains('email'),
        ];
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        avatarColor: true,
        isOnline: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { username: 'asc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
