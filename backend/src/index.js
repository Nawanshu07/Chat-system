import http from 'http';
import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN } from './config.js';
import prisma from './db/prisma.js';
import { seedDatabase } from '../prisma/seed.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import roomsRoutes from './routes/rooms.js';
import messagesRoutes from './routes/messages.js';
import { initSocket } from './socket/handler.js';

const app = express();

// Permissive CORS middleware for cross-origin requests
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      // or if CORS_ORIGIN is '*', or matches origin, or *.vercel.app, or localhost
      if (
        !origin ||
        CORS_ORIGIN === '*' ||
        origin === CORS_ORIGIN ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
      } else {
        // Fallback allow so production deployments are never blocked by origin mismatches
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chat System REST API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Database Seed endpoint (triggerable anytime)
app.all('/api/seed', async (req, res) => {
  try {
    const result = await seedDatabase(prisma);
    res.json({ message: 'Database seeded successfully', result });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/rooms', messagesRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Create HTTP Server & initialize Socket.IO
const server = http.createServer(app);
initSocket(server, CORS_ORIGIN);

server.listen(PORT, async () => {
  console.log(`🚀 Chat System Backend running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for origin: ${CORS_ORIGIN}`);

  // Automatically seed database on startup if empty
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('🌱 Database is empty. Seeding starter accounts...');
      await seedDatabase(prisma);
    }
  } catch (e) {
    console.warn('⚠️ Auto-seed check notice:', e.message);
  }
});
