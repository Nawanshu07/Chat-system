import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import prisma from '../db/prisma.js';
import { formatRoomForUser } from '../routes/rooms.js';

let ioInstance = null;

// Track active socket count per user: Map<userId, Set<socketId>>
const userSockets = new Map();

export function getIO() {
  return ioInstance;
}

export function initSocket(server, corsOrigin) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === corsOrigin || /^http:\/\/localhost:\d+$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed for Socket.IO'));
        }
      },
      credentials: true,
    },
  });

  ioInstance = io;

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          avatarColor: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user.id;

    // Join personal user room for direct user-level updates (new chats, unread badges)
    socket.join(`user:${userId}`);

    // Track online sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    const isFirstConnection = userSockets.get(userId).size === 0;
    userSockets.get(userId).add(socket.id);

    if (isFirstConnection) {
      // Update DB & broadcast user is online
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      }).catch(console.error);

      io.emit('user_status', { userId, isOnline: true });
    }

    // Send the current list of online user IDs to the connected client
    const onlineIds = Array.from(userSockets.entries())
      .filter(([_, sockets]) => sockets.size > 0)
      .map(([uid]) => uid);
    socket.emit('online_users', onlineIds);

    // Join room
    socket.on('join_room', async ({ roomId }) => {
      if (!roomId) return;
      try {
        const isMember = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId } },
        });
        if (isMember) {
          socket.join(`room:${roomId}`);
        }
      } catch (err) {
        console.error('Error joining room:', err);
      }
    });

    // Leave room
    socket.on('leave_room', ({ roomId }) => {
      if (roomId) {
        socket.leave(`room:${roomId}`);
      }
    });

    // Typing start
    socket.on('typing_start', ({ roomId }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_typing', {
          roomId,
          userId,
          username: user.username,
        });
      }
    });

    // Typing stop
    socket.on('typing_stop', ({ roomId }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_stop_typing', {
          roomId,
          userId,
        });
      }
    });

    // Send message via WebSocket
    socket.on('send_message', async ({ roomId, content }, callback) => {
      try {
        if (!roomId || !content || typeof content !== 'string') {
          return callback?.({ error: 'Message content and roomId are required' });
        }

        const trimmed = content.trim();
        if (trimmed.length === 0 || trimmed.length > 2000) {
          return callback?.({ error: 'Message length must be between 1 and 2000 characters' });
        }

        // Verify membership
        const membership = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId } },
        });
        if (!membership) {
          return callback?.({ error: 'You are not a member of this chat' });
        }

        // Save message to DB
        const msg = await prisma.message.create({
          data: {
            content: trimmed,
            roomId,
            senderId: userId,
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
          id: msg.id,
          content: msg.content,
          roomId: msg.roomId,
          senderId: msg.senderId,
          senderName: msg.sender.username,
          senderAvatar: msg.sender.avatar,
          createdAt: msg.createdAt,
        };

        // 1. Broadcast to everyone currently viewing the room
        io.to(`room:${roomId}`).emit('new_message', { message: formattedMessage });

        // 2. Fetch room details to notify all members' sidebars
        const room = await prisma.room.findUnique({
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
        });

        // Broadcast to every member's personal user room so their sidebar gets updated immediately!
        if (room) {
          for (const member of room.members) {
            const formattedRoom = formatRoomForUser(room, member.userId);
            io.to(`user:${member.userId}`).emit('conversation_updated', {
              room: formattedRoom,
              message: formattedMessage,
            });
          }
        }

        callback?.({ success: true, message: formattedMessage });
      } catch (err) {
        console.error('Error handling send_message in socket:', err);
        callback?.({ error: 'Failed to send message' });
      }
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          // Mark offline in DB & broadcast
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false },
          }).catch(console.error);

          io.emit('user_status', { userId, isOnline: false });
        }
      }
    });
  });

  console.log('⚡ Socket.IO server initialized successfully');
  return io;
}

// Helper to broadcast room creation to members
export function broadcastNewRoom(room) {
  if (!ioInstance || !room || !room.members) return;
  for (const member of room.members) {
    const memberId = member.userId || member.id;
    const formatted = formatRoomForUser(room, memberId);
    ioInstance.to(`user:${memberId}`).emit('conversation_updated', {
      room: formatted,
    });
  }
}
