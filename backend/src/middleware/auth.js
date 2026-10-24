import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import prisma from '../db/prisma.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user to ensure account is active and has up-to-date data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        avatarColor: true,
        isOnline: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
