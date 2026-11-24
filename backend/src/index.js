import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN } from './config.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import rooms from './routes/rooms.js';
import messages from './routes/messages.js';
import { initSocket } from './socket/handler.js';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Smalltalk' }));
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/rooms', rooms);
app.use('/api/rooms', messages);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'The request could not be completed.' });
});

const server = http.createServer(app);
initSocket(server, CORS_ORIGIN);
server.listen(PORT, () => console.log('Smalltalk is listening on port ' + PORT));
