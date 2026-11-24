import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { notifyConversation } from './rooms.js';

const router = express.Router();
const sender = { select: { username: true } };

function describeMessage({ id, roomId, senderId, sender, content, createdAt }) {
  return { id, roomId, senderId, senderName: sender.username, content, createdAt };
}

router.use('/:id/messages', authenticateToken, async (req, res, next) => {
  try {
    const member = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.user.id, roomId: req.params.id } },
    });
    if (!member) return res.status(403).json({ error: 'You are not a member of this chat.' });
    next();
  } catch (error) { next(error); }
});

router.get('/:id/messages', async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(req.query.before ? { cursor: { id: req.query.before }, skip: 1 } : {}),
      include: { sender },
    });
    res.json({ messages: messages.reverse().map(describeMessage) });
  } catch (error) { next(error); }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 2000) {
      return res.status(400).json({ error: 'Write a message between 1 and 2,000 characters.' });
    }
    const saved = await prisma.message.create({
      data: { roomId, senderId: req.user.id, content },
      include: { sender },
    });
    const message = describeMessage(saved);
    await notifyConversation(roomId, message).catch(console.error);
    res.status(201).json({ message });
  } catch (error) { next(error); }
});

export default router;
