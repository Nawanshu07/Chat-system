import 'dotenv/config';

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Set JWT_SECRET in the backend environment.');

const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
// Vite picks the next free port when its default port is already in use.
export const CORS_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ? /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  : origin;
