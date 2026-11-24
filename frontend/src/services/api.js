import { useAuthStore } from '../store/authStore';

const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const socketUrl = import.meta.env.VITE_SOCKET_URL || new URL(base, window.location.origin).origin;

export async function request(path, { body, signal } = {}) {
  const { token, logout } = useAuthStore.getState();
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(base + path, {
      method: body ? 'POST' : 'GET', headers, body: JSON.stringify(body), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not reach Smalltalk. Please try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && useAuthStore.getState().token === token) logout();
    throw Object.assign(new Error(data.error || 'The request failed. Please try again.'), { data });
  }
  return data;
}
