import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password1', 10);

  // Create Users
  const mina = await prisma.user.create({
    data: {
      username: 'mina',
      email: 'mina@example.com',
      password: hashedPassword,
      avatar: 'M',
      avatarColor: 'bg-[#2e5fa3]',
      isOnline: true,
    },
  });

  const alex = await prisma.user.create({
    data: {
      username: 'alex',
      email: 'alex@example.com',
      password: hashedPassword,
      avatar: 'A',
      avatarColor: 'bg-[#7b3fa0]',
      isOnline: false,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      username: 'sarah',
      email: 'sarah@example.com',
      password: hashedPassword,
      avatar: 'S',
      avatarColor: 'bg-[#a0522d]',
      isOnline: true,
    },
  });

  const demo = await prisma.user.create({
    data: {
      username: 'demo_user',
      email: 'demo@example.com',
      password: hashedPassword,
      avatar: 'U',
      avatarColor: 'bg-[#1e4d3b]',
      isOnline: true,
    },
  });

  // Create Room 1: Demo & Mina
  const room1 = await prisma.room.create({
    data: {
      isDM: true,
      members: {
        create: [{ userId: demo.id }, { userId: mina.id }],
      },
      messages: {
        create: [
          {
            content: 'Hi there, how can I help?',
            senderId: mina.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            content: 'Hey! Just wanted to check in on the project status.',
            senderId: demo.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 20),
          },
          {
            content: "It's going well! We're almost done with the backend REST API.",
            senderId: mina.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 10),
          },
          {
            content: "That's great news 🎉 Can't wait to see it live.",
            senderId: demo.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 2),
          },
        ],
      },
    },
  });

  // Create Room 2: Demo & Alex
  const room2 = await prisma.room.create({
    data: {
      isDM: true,
      members: {
        create: [{ userId: demo.id }, { userId: alex.id }],
      },
      messages: {
        create: [
          {
            content: 'Hey Alex, are you free tomorrow?',
            senderId: demo.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
          {
            content: 'See you tomorrow at 10 AM!',
            senderId: alex.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
          },
        ],
      },
    },
  });

  // Create Room 3: Demo & Sarah
  const room3 = await prisma.room.create({
    data: {
      isDM: true,
      members: {
        create: [{ userId: demo.id }, { userId: sarah.id }],
      },
      messages: {
        create: [
          {
            content: 'Pushed the latest design mockups to the repo.',
            senderId: demo.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
          },
          {
            content: 'The project looks great 🔥 Love the dark green theme!',
            senderId: sarah.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 50),
          },
        ],
      },
    },
  });

  // Create Room 4: Group Chat (Mina, Alex, Sarah, Demo)
  const room4 = await prisma.room.create({
    data: {
      name: 'Dev Team',
      isDM: false,
      members: {
        create: [
          { userId: demo.id },
          { userId: mina.id },
          { userId: alex.id },
          { userId: sarah.id },
        ],
      },
      messages: {
        create: [
          {
            content: 'Alex: pushed the new build',
            senderId: alex.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          },
          {
            content: 'Sarah: Reviewed and merged ✅',
            senderId: sarah.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log({
    users: [mina.email, alex.email, sarah.email, demo.email],
    rooms: [room1.id, room2.id, room3.id, room4.id],
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
