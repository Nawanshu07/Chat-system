import http from 'http';
import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN } from './config.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import roomsRoutes from './routes/rooms.js';
import messagesRoutes from './routes/messages.js';
import { initSocket } from './socket/handler.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      // or match CORS_ORIGIN, or any localhost in dev
      if (!origin || origin === CORS_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
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

server.listen(PORT, () => {
  console.log(`🚀 Chat System Backend running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for origin: ${CORS_ORIGIN}`);
});
