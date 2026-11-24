import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

let io;

export function initSocket(server, origin) {
  io = new Server(server, { cors: { origin } });
  io.use((socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
      socket.userId = id;
      next();
    } catch {
      next(new Error('Please sign in again.'));
    }
  });
  io.on('connection', (socket) => socket.join('user:' + socket.userId));
}

export function notifyUser(userId, event, data) {
  io?.to('user:' + userId).emit(event, data);
}
