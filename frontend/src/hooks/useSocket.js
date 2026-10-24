import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useMessageStore } from '../store/messageStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const activeRoomId = useRoomStore((s) => s.activeRoomId);

  const prevRoomRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socket.id);
      // Join currently active room if any
      const currentActive = useRoomStore.getState().activeRoomId;
      if (currentActive) {
        socket.emit('join_room', { roomId: currentActive });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket.IO connection error:', err.message);
    });

    // 1. Online presence
    socket.on('online_users', (onlineUserIds) => {
      useRoomStore.getState().setOnlineUsers(onlineUserIds);
    });

    socket.on('user_status', ({ userId, isOnline }) => {
      useRoomStore.getState().setUserOnline(userId, isOnline);
    });

    // 2. Real-time message arrival
    socket.on('new_message', ({ message }) => {
      if (!message) return;
      // Append to message store immediately
      useMessageStore.getState().addMessage(message.roomId, message);
      // Update sidebar snippet
      useRoomStore.getState().updateLastMessage(message.roomId, message.content);
    });

    // 3. Real-time conversation updates (new chats, unread badges, instant room push)
    socket.on('conversation_updated', ({ room, message }) => {
      if (!room) return;
      useRoomStore.getState().handleConversationUpdated({ room, message });
    });

    // 4. Typing indicators
    socket.on('user_typing', ({ roomId, userId, username }) => {
      useMessageStore.getState().setTyping(roomId, userId, username);
    });

    socket.on('user_stop_typing', ({ roomId, userId }) => {
      useMessageStore.getState().clearTyping(roomId, userId);
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, [token, user]);

  // Handle switching rooms
  useEffect(() => {
    if (!socketInstance || !socketInstance.connected) return;

    if (prevRoomRef.current && prevRoomRef.current !== activeRoomId) {
      socketInstance.emit('leave_room', { roomId: prevRoomRef.current });
    }

    if (activeRoomId) {
      socketInstance.emit('join_room', { roomId: activeRoomId });
      prevRoomRef.current = activeRoomId;
    }
  }, [activeRoomId]);

  const sendRealtimeMessage = (roomId, content) => {
    return new Promise((resolve, reject) => {
      if (!socketInstance || !socketInstance.connected) {
        // Fallback to REST API if socket not connected
        return useMessageStore
          .getState()
          .sendMessage(roomId, content)
          .then(resolve)
          .catch(reject);
      }

      socketInstance.emit('send_message', { roomId, content }, (res) => {
        if (res?.error) {
          reject(new Error(res.error));
        } else {
          resolve(res.message);
        }
      });
    });
  };

  const startTyping = (roomId) => {
    if (socketInstance?.connected && roomId) {
      socketInstance.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socketInstance?.connected && roomId) {
      socketInstance.emit('typing_stop', { roomId });
    }
  };

  return {
    socket: socketInstance,
    sendRealtimeMessage,
    startTyping,
    stopTyping,
  };
}
