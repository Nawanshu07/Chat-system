import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chat-jwt-key-2026-development';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
