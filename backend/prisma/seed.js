import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();
try {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error('Use the sample accounts with a local SQLite database.');
  }
  const password = await bcrypt.hash('Password1', 10);
  for (const username of ['demo', 'mina']) {
    await prisma.user.upsert({
      where: { email: username + '@example.com' },
      update: {},
      create: { username, email: username + '@example.com', password, isEmailVerified: true },
    });
  }
  console.log('Local sample accounts are ready.');
} finally {
  await prisma.$disconnect();
}
