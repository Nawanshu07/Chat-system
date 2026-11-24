import express from 'express';
import { createHash } from 'node:crypto';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { notifyUser } from '../socket/handler.js';

const router = express.Router();
const roomDetails = {
  members: { select: { user: { select: { id: true, username: true } } } },
  messages: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
};

function describeRoom(room, userId) {
  const partner = room.members.find(({ user }) => user.id !== userId);
  const latest = room.messages[0];
  return {
    id: room.id,
    name: room.isDM ? partner?.user.username || 'Direct chat' : room.name || 'Group chat',
    isDM: room.isDM,
    lastMessage: latest?.content || '',
    lastMessageTime: latest?.createdAt || room.createdAt,
  };
}

export async function notifyConversation(roomId, message) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomDetails });
  for (const { user } of room.members) {
    if (message) notifyUser(user.id, 'new_message', { message });
    notifyUser(user.id, 'conversation_updated', { room: describeRoom(room, user.id) });
  }
}

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: roomDetails,
    });
    const result = rooms.map(room => describeRoom(room, req.user.id));
    result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    res.json({ rooms: result });
  } catch (error) { next(error); }
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;
    if (req.body.isDM === false || typeof participantId !== 'string' || participantId === userId) {
      return res.status(400).json({ error: 'Choose another person to start a direct chat.' });
    }
    const partner = await prisma.user.findUnique({ where: { id: participantId }, select: { id: true } });
    if (!partner) return res.status(404).json({ error: 'Person not found.' });

    const pair = [userId, participantId].sort();
    const existing = await prisma.room.findFirst({
      where: { isDM: true, AND: pair.map(id => ({ members: { some: { userId: id } } })) },
      include: roomDetails,
    });
    if (existing) return res.json({ room: describeRoom(existing, userId) });

    // Both people may start the same chat at once. Give their new room one stable ID.
    const id = 'dm-' + createHash('sha256').update(JSON.stringify(pair)).digest('hex');
    let room;
    try {
      room = await prisma.room.create({
        data: { id, isDM: true, members: { create: pair.map(userId => ({ userId })) } },
        include: roomDetails,
      });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      room = await prisma.room.findUniqueOrThrow({ where: { id }, include: roomDetails });
    }
    for (const memberId of pair) {
      notifyUser(memberId, 'conversation_updated', { room: describeRoom(room, memberId) });
    }
    res.status(201).json({ room: describeRoom(room, userId) });
  } catch (error) { next(error); }
});

export default router;
