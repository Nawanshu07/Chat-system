import { create } from 'zustand';
import { messagesApi } from '../services/api';

export const useMessageStore = create((set, get) => ({
  messages: {}, // { [roomId]: Message[] }
  loadingRooms: {}, // { [roomId]: boolean }
  typingUsers: {}, // { [roomId]: { [userId]: username } }

  getMessages: (roomId) => get().messages[roomId] || [],

  fetchMessages: async (roomId) => {
    if (!roomId) return;
    set((s) => ({
      loadingRooms: { ...s.loadingRooms, [roomId]: true },
    }));

    try {
      const data = await messagesApi.getMessages(roomId);
      set((s) => ({
        messages: { ...s.messages, [roomId]: data.messages || [] },
        loadingRooms: { ...s.loadingRooms, [roomId]: false },
      }));
    } catch (err) {
      console.error(`Failed to fetch messages for room ${roomId}:`, err);
      set((s) => ({
        loadingRooms: { ...s.loadingRooms, [roomId]: false },
      }));
    }
  },

  sendMessage: async (roomId, content) => {
    if (!roomId || !content) return;
    try {
      const data = await messagesApi.sendMessage(roomId, content);
      const newMsg = data.message;
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: [...(s.messages[roomId] || []), newMsg],
        },
      }));
      return newMsg;
    } catch (err) {
      console.error(`Failed to send message to room ${roomId}:`, err);
      throw err;
    }
  },

  addMessage: (roomId, message) =>
    set((s) => {
      const roomMsgs = s.messages[roomId] || [];
      if (roomMsgs.some((m) => m.id === message.id)) {
        return s;
      }
      return {
        messages: {
          ...s.messages,
          [roomId]: [...roomMsgs, message],
        },
      };
    }),

  setMessages: (roomId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [roomId]: messages },
    })),

  setTyping: (roomId, userId, username) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [roomId]: { ...(s.typingUsers[roomId] || {}), [userId]: username },
      },
    })),

  clearTyping: (roomId, userId) =>
    set((s) => {
      const room = { ...(s.typingUsers[roomId] || {}) };
      delete room[userId];
      return { typingUsers: { ...s.typingUsers, [roomId]: room } };
    }),

  getTypingUsers: (roomId) => {
    const room = get().typingUsers[roomId] || {};
    return Object.values(room);
  },
}));
