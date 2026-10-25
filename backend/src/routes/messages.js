import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getIO } from '../socket/handler.js';
import { formatRoomForUser } from './rooms.js';

const router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;

// GET /api/rooms/:id/messages — Fetch message history for a room
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before; // Optional ISO date cursor or message ID

    // Verify room membership
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const where = { roomId };
    if (before) {
      // If before is an ISO date or message ID
      const cursorMessage = await prisma.message.findUnique({ where: { id: before } });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      } else {
        const parsedDate = new Date(before);
        if (!isNaN(parsedDate.getTime())) {
          where.createdAt = { lt: parsedDate };
        }
      }
    }

    const messages = await prisma.message.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' }, // latest first for pagination
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            avatarColor: true,
          },
        },
      },
    });

    // Return in chronological order (oldest to newest) for Chat UI
    const chronologicalMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderName: msg.sender.username,
      senderAvatar: msg.sender.avatar,
      createdAt: msg.createdAt,
    }));

    return res.json({ messages: chronologicalMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/rooms/:id/messages — Send a message via REST
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: roomId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters`,
      });
    }

    // Verify room membership
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const message = await prisma.message.create({
      data: {
        content: trimmedContent,
        roomId,
        senderId: currentUserId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            avatarColor: true,
          },
        },
      },
    });

    const formattedMessage = {
      id: message.id,
      content: message.content,
      roomId: message.roomId,
      senderId: message.senderId,
      senderName: message.sender.username,
      senderAvatar: message.sender.avatar,
      createdAt: message.createdAt,
    };

    // Real-time Socket.IO Broadcast
    const io = getIO();
    if (io) {
      // 1. Emit to room
      io.to(`room:${roomId}`).emit('new_message', { message: formattedMessage });

      // 2. Emit conversation_updated to all room members
      prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatar: true,
                  avatarColor: true,
                  isOnline: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }).then((fullRoom) => {
        if (fullRoom) {
          for (const member of fullRoom.members) {
            io.to(`user:${member.userId}`).emit('new_message', { message: formattedMessage });

            const formatted = formatRoomForUser(fullRoom, member.userId);
            io.to(`user:${member.userId}`).emit('conversation_updated', {
              room: formatted,
              message: formattedMessage,
            });
          }
        }
      }).catch(console.error);
    }

    return res.status(201).json({
      message: formattedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
