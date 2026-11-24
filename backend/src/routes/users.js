import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/me', (req, res) => res.json({ user: req.user }));

router.get('/', async (req, res, next) => {
  try {
    const term = String(req.query.search || '').trim().replace(/^@/, '');
    const username = { contains: term };
    if (process.env.DATABASE_URL?.startsWith('postgres')) username.mode = 'insensitive';
    const users = await prisma.user.findMany({
      where: { username, isEmailVerified: true, id: { not: req.user.id } },
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
      take: 50,
    });
    res.json({ users });
  } catch (error) { next(error); }
});

export default router;
