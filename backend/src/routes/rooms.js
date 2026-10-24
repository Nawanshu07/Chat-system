import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastNewRoom } from '../socket/handler.js';

const router = express.Router();

// Helper to format room for client
export function formatRoomForUser(room, currentUserId) {
  const otherMembers = room.members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => m.user);

  let displayName = room.name;
  let displayAvatar = room.name ? room.name.charAt(0).toUpperCase() : 'G';
  let displayColor = 'bg-[#1e4d3b]';
  let isOnline = false;

  if (room.isDM) {
    const partner = otherMembers[0] || room.members[0]?.user;
    if (partner) {
      displayName = partner.username;
      displayAvatar = partner.avatar || partner.username.charAt(0).toUpperCase();
      displayColor = partner.avatarColor || 'bg-[#2e5fa3]';
      isOnline = partner.isOnline;
    } else {
      displayName = 'Direct Message';
    }
  }

  const lastMsg = room.messages && room.messages.length > 0 ? room.messages[0] : null;

  return {
    id: room.id,
    name: displayName,
    isDM: room.isDM,
    avatar: displayAvatar,
    avatarColor: displayColor,
    isOnline,
    lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
    lastMessageTime: lastMsg ? lastMsg.createdAt : room.createdAt,
    lastMessageSenderId: lastMsg ? lastMsg.senderId : null,
    members: room.members.map((m) => m.user),
    createdAt: room.createdAt,
  };
}

// GET /api/rooms — List all rooms user is a member of
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: currentUserId,
          },
        },
      },
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
      orderBy: { createdAt: 'desc' },
    });

    const formattedRooms = rooms.map((room) => formatRoomForUser(room, currentUserId));

    // Sort by latest message time descending
    formattedRooms.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return res.json({ rooms: formattedRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/rooms — Create a room (DM or Group)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { isDM = true, participantId, name, memberIds = [] } = req.body;

    if (isDM) {
      if (!participantId) {
        return res.status(400).json({ error: 'participantId is required to start a direct message' });
      }

      if (participantId === currentUserId) {
        return res.status(400).json({ error: 'Cannot create a DM with yourself' });
      }

      // Check if participant exists
      const participant = await prisma.user.findUnique({
        where: { id: participantId },
      });
      if (!participant) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if a DM between these two already exists
      const existingRoom = await prisma.room.findFirst({
        where: {
          isDM: true,
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: participantId } } },
          ],
        },
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
      });

      if (existingRoom) {
        return res.json({ room: formatRoomForUser(existingRoom, currentUserId) });
      }

      // Create new DM room
      const newRoom = await prisma.room.create({
        data: {
          isDM: true,
          members: {
            create: [{ userId: currentUserId }, { userId: participantId }],
          },
        },
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
            take: 1,
          },
        },
      });

      broadcastNewRoom(newRoom);
      return res.status(201).json({ room: formatRoomForUser(newRoom, currentUserId) });
    } else {
      // Group Chat
      const groupName = name?.trim() || 'New Group';
      const allMemberIds = Array.from(new Set([currentUserId, ...memberIds]));

      const newRoom = await prisma.room.create({
        data: {
          name: groupName,
          isDM: false,
          members: {
            create: allMemberIds.map((userId) => ({ userId })),
          },
        },
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
            take: 1,
          },
        },
      });

      broadcastNewRoom(newRoom);
      return res.status(201).json({ room: formatRoomForUser(newRoom, currentUserId) });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:id — Get details of a single room
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
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
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isMember = room.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    return res.json({ room: formatRoomForUser(room, currentUserId) });
  } catch (error) {
    console.error('Error fetching room:', error);
    return res.status(500).json({ error: 'Failed to fetch room' });
  }
});

export default router;
