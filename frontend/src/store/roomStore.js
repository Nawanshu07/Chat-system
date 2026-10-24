import { create } from 'zustand';
import { roomsApi } from '../services/api';

export const useRoomStore = create((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  activeRoomId: null,

  setActiveRoom: (id) => set({ activeRoomId: id }),

  getActiveRoom: () => {
    const { rooms, activeRoomId } = get();
    return rooms.find((r) => r.id === activeRoomId) || null;
  },

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await roomsApi.getRooms();
      const rooms = data.rooms || [];
      set({ rooms, loading: false });

      // If activeRoomId is not set or not in list, auto-select first room
      const currentActive = get().activeRoomId;
      if (!currentActive && rooms.length > 0) {
        set({ activeRoomId: rooms[0].id });
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      set({ error: err.message, loading: false });
    }
  },

  markRead: (id) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, unread: 0 } : r)),
    })),

  // Update last message preview when a message is sent or received
  updateLastMessage: (roomId, content) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId
          ? { ...r, lastMessage: content, lastMessageTime: 'Now' }
          : r
      ),
    })),

  // Real-time conversation update: bumps or inserts room at top, updates preview, adds unread badge
  handleConversationUpdated: ({ room, message }) =>
    set((s) => {
      const activeId = s.activeRoomId;
      const isViewing = activeId === room.id;
      const existingIndex = s.rooms.findIndex((r) => r.id === room.id);

      let updatedRoom;
      if (existingIndex >= 0) {
        const existing = s.rooms[existingIndex];
        updatedRoom = {
          ...existing,
          ...room,
          lastMessage: message ? message.content : room.lastMessage,
          lastMessageTime: message ? message.createdAt : room.lastMessageTime,
          unread: isViewing ? 0 : (existing.unread || 0) + 1,
        };
        const rest = s.rooms.filter((r) => r.id !== room.id);
        return { rooms: [updatedRoom, ...rest] };
      } else {
        // Brand new conversation from someone who just started chatting with us!
        updatedRoom = {
          ...room,
          lastMessage: message ? message.content : room.lastMessage,
          lastMessageTime: message ? message.createdAt : room.lastMessageTime,
          unread: isViewing ? 0 : 1,
        };
        return { rooms: [updatedRoom, ...s.rooms] };
      }
    }),

  // Update user online status across rooms
  setUserOnline: (userId, isOnline) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.isDM) {
          const isPartner = r.members?.some((m) => m.id === userId);
          if (isPartner) {
            return { ...r, isOnline };
          }
        }
        return r;
      }),
    })),

  setOnlineUsers: (onlineUserIds) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.isDM) {
          const isPartnerOnline = r.members?.some((m) => onlineUserIds.includes(m.id));
          return { ...r, isOnline: !!isPartnerOnline };
        }
        return r;
      }),
    })),

  createOrOpenDM: async (participantId) => {
    try {
      const data = await roomsApi.createDM(participantId);
      const room = data.room;
      const currentRooms = get().rooms;
      const exists = currentRooms.some((r) => r.id === room.id);

      if (!exists) {
        set({ rooms: [room, ...currentRooms] });
      }
      set({ activeRoomId: room.id });
      return room;
    } catch (err) {
      console.error('Failed to create/open DM:', err);
      throw err;
    }
  },

  setRooms: (rooms) => set({ rooms }),
}));
