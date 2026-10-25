import express from 'express';
import prisma from '../db/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastNewRoom, getIO } from '../socket/handler.js';

const router = express.Router();

// Helper to format room for client
export function formatRoomForUser(room, currentUserId) {
  const allUserMembers = (room.members || []).map((m) => m.user || m);
  const otherMembers = allUserMembers.filter((u) => u.id !== currentUserId);

  let displayName = room.name;
  let displayAvatar = room.name ? room.name.charAt(0).toUpperCase() : '👥';
  let displayColor = 'bg-[#1e4d3b]';
  let isOnline = false;

  if (room.isDM) {
    const partner = otherMembers[0] || allUserMembers[0];
    if (partner) {
      displayName = partner.username;
      displayAvatar = partner.avatar || partner.username.charAt(0).toUpperCase();
      displayColor = partner.avatarColor || 'bg-[#2e5fa3]';
      isOnline = !!partner.isOnline;
    } else {
      displayName = 'Direct Message';
    }
  } else {
    // For group chat: compute if any other member is online
    isOnline = otherMembers.some((u) => u.isOnline);
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
    lastMessageSenderName: lastMsg?.sender?.username || null,
    members: allUserMembers,
    memberCount: allUserMembers.length,
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
          include: {
            sender: {
              select: { username: true },
            },
          },
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
            include: {
              sender: {
                select: { username: true },
              },
            },
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
            include: {
              sender: {
                select: { username: true },
              },
            },
          },
        },
      });

      broadcastNewRoom(newRoom);
      return res.status(201).json({ room: formatRoomForUser(newRoom, currentUserId) });
    } else {
      // Group Chat
      const groupName = name?.trim();
      if (!groupName) {
        return res.status(400).json({ error: 'Group name is required' });
      }
      if (groupName.length > 60) {
        return res.status(400).json({ error: 'Group name cannot exceed 60 characters' });
      }

      const allMemberIds = Array.from(new Set([currentUserId, ...(memberIds || [])]));
      if (allMemberIds.length < 2) {
        return res.status(400).json({ error: 'Please select at least one member to create a group' });
      }

      const creator = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { username: true },
      });

      const newRoom = await prisma.room.create({
        data: {
          name: groupName,
          isDM: false,
          members: {
            create: allMemberIds.map((userId) => ({ userId })),
          },
          messages: {
            create: {
              content: `${creator?.username || 'Admin'} created the group "${groupName}"`,
              senderId: currentUserId,
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
            take: 1,
            include: {
              sender: {
                select: { username: true },
              },
            },
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
          include: {
            sender: {
              select: { username: true },
            },
          },
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

// POST /api/rooms/:id/members — Add members to existing group
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'memberIds array is required' });
    }

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
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isDM) {
      return res.status(400).json({ error: 'Cannot add members to a Direct Message' });
    }

    const isMember = room.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const existingMemberIds = new Set(room.members.map((m) => m.userId));
    const newMemberIds = Array.from(new Set(memberIds)).filter((uid) => !existingMemberIds.has(uid));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ error: 'Selected users are already members of this group' });
    }

    // Verify all new members exist
    const newUsers = await prisma.user.findMany({
      where: { id: { in: newMemberIds } },
      select: { id: true, username: true },
    });

    if (newUsers.length === 0) {
      return res.status(404).json({ error: 'No valid users to add' });
    }

    // Add members to DB
    await prisma.roomMember.createMany({
      data: newUsers.map((u) => ({ userId: u.id, roomId: id })),
    });

    // Create system notification message
    const actor = room.members.find((m) => m.userId === currentUserId)?.user;
    const addedNames = newUsers.map((u) => u.username).join(', ');
    const systemMsg = await prisma.message.create({
      data: {
        roomId: id,
        senderId: currentUserId,
        content: `${actor?.username || 'A member'} added ${addedNames} to the group`,
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

    // Refetch full room
    const updatedRoom = await prisma.room.findUnique({
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
          include: {
            sender: {
              select: { username: true },
            },
          },
        },
      },
    });

    const formattedMessage = {
      id: systemMsg.id,
      content: systemMsg.content,
      roomId: systemMsg.roomId,
      senderId: systemMsg.senderId,
      senderName: systemMsg.sender.username,
      senderAvatar: systemMsg.sender.avatar,
      senderColor: systemMsg.sender.avatarColor,
      createdAt: systemMsg.createdAt,
    };

    broadcastNewRoom(updatedRoom);
    const io = getIO();
    if (io) {
      io.to(`room:${id}`).emit('new_message', { message: formattedMessage });
    }

    return res.json({ room: formatRoomForUser(updatedRoom, currentUserId) });
  } catch (error) {
    console.error('Error adding members:', error);
    return res.status(500).json({ error: 'Failed to add members' });
  }
});

// POST /api/rooms/:id/leave — Leave group
router.post('/:id/leave', authenticateToken, async (req, res) => {
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
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isDM) {
      return res.status(400).json({ error: 'Cannot leave a Direct Message' });
    }

    const currentMember = room.members.find((m) => m.userId === currentUserId);
    if (!currentMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Delete membership
    await prisma.roomMember.delete({
      where: {
        userId_roomId: {
          userId: currentUserId,
          roomId: id,
        },
      },
    });

    // Create system notification message
    const systemMsg = await prisma.message.create({
      data: {
        roomId: id,
        senderId: currentUserId,
        content: `${currentMember.user.username} left the group`,
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
      id: systemMsg.id,
      content: systemMsg.content,
      roomId: systemMsg.roomId,
      senderId: systemMsg.senderId,
      senderName: systemMsg.sender.username,
      senderAvatar: systemMsg.sender.avatar,
      senderColor: systemMsg.sender.avatarColor,
      createdAt: systemMsg.createdAt,
    };

    // Broadcast update to remaining members
    const remainingRoom = await prisma.room.findUnique({
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
          include: {
            sender: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (remainingRoom) {
      broadcastNewRoom(remainingRoom);
      const io = getIO();
      if (io) {
        io.to(`room:${id}`).emit('new_message', { message: formattedMessage });
      }
    }

    return res.json({ success: true, message: 'Successfully left the group', roomId: id });
  } catch (error) {
    console.error('Error leaving group:', error);
    return res.status(500).json({ error: 'Failed to leave group' });
  }
});

// PATCH /api/rooms/:id — Rename group
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    const trimmed = name?.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Group name cannot be empty' });
    }
    if (trimmed.length > 60) {
      return res.status(400).json({ error: 'Group name cannot exceed 60 characters' });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isDM) {
      return res.status(400).json({ error: 'Cannot rename a Direct Message' });
    }

    const currentMember = room.members.find((m) => m.userId === currentUserId);
    if (!currentMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const oldName = room.name;

    const updated = await prisma.room.update({
      where: { id },
      data: { name: trimmed },
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
          include: {
            sender: {
              select: { username: true },
            },
          },
        },
      },
    });

    // Create system notification message
    const systemMsg = await prisma.message.create({
      data: {
        roomId: id,
        senderId: currentUserId,
        content: `${currentMember.user.username} changed the group name from "${oldName}" to "${trimmed}"`,
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
      id: systemMsg.id,
      content: systemMsg.content,
      roomId: systemMsg.roomId,
      senderId: systemMsg.senderId,
      senderName: systemMsg.sender.username,
      senderAvatar: systemMsg.sender.avatar,
      senderColor: systemMsg.sender.avatarColor,
      createdAt: systemMsg.createdAt,
    };

    broadcastNewRoom(updated);
    const io = getIO();
    if (io) {
      io.to(`room:${id}`).emit('new_message', { message: formattedMessage });
    }

    return res.json({ room: formatRoomForUser(updated, currentUserId) });
  } catch (error) {
    console.error('Error updating room:', error);
    return res.status(500).json({ error: 'Failed to update group' });
  }
});

export default router;
