import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    let token = useAuthStore.getState().token;
    if (!token) {
      try {
        const raw = localStorage.getItem('chat-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.state?.token;
        }
      } catch {
        // ignore parse error
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired auth session
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },
};

// Users Endpoints
export const usersApi = {
  search: async (search = '') => {
    const res = await api.get('/users', { params: { search } });
    return res.data;
  },
};

// Rooms Endpoints
export const roomsApi = {
  getRooms: async () => {
    const res = await api.get('/rooms');
    return res.data;
  },
  createDM: async (participantId) => {
    const res = await api.post('/rooms', { isDM: true, participantId });
    return res.data;
  },
  createGroup: async (name, memberIds) => {
    const res = await api.post('/rooms', { isDM: false, name, memberIds });
    return res.data;
  },
  getRoomById: async (roomId) => {
    const res = await api.get(`/rooms/${roomId}`);
    return res.data;
  },
};

// Messages Endpoints
export const messagesApi = {
  getMessages: async (roomId, limit = 50, before = null) => {
    const params = { limit };
    if (before) params.before = before;
    const res = await api.get(`/rooms/${roomId}/messages`, { params });
    return res.data;
  },
  sendMessage: async (roomId, content) => {
    const res = await api.post(`/rooms/${roomId}/messages`, { content });
    return res.data;
  },
};

export default api;
