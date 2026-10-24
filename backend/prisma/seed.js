import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase(client = prisma) {
  console.log('🌱 Seeding database...');

  const userCount = await client.user.count();
  if (userCount > 0) {
    console.log(`ℹ️ Database already has ${userCount} users. Ensuring demo users exist...`);
  }

  const hashedPassword = await bcrypt.hash('Password1', 10);

  // Upsert Mina
  const mina = await client.user.upsert({
    where: { email: 'mina@example.com' },
    update: {},
    create: {
      username: 'mina',
      email: 'mina@example.com',
      password: hashedPassword,
      avatar: 'M',
      avatarColor: 'bg-[#2e5fa3]',
      isOnline: true,
    },
  });

  // Upsert Alex
  const alex = await client.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
      username: 'alex',
      email: 'alex@example.com',
      password: hashedPassword,
      avatar: 'A',
      avatarColor: 'bg-[#7b3fa0]',
      isOnline: false,
    },
  });

  // Upsert Sarah
  const sarah = await client.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      username: 'sarah',
      email: 'sarah@example.com',
      password: hashedPassword,
      avatar: 'S',
      avatarColor: 'bg-[#a0522d]',
      isOnline: true,
    },
  });

  // Upsert Demo
  const demo = await client.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      username: 'demo_user',
      email: 'demo@example.com',
      password: hashedPassword,
      avatar: 'U',
      avatarColor: 'bg-[#1e4d3b]',
      isOnline: true,
    },
  });

  // Check if rooms exist for demo user
  const demoRoomCount = await client.roomMember.count({
    where: { userId: demo.id },
  });

  if (demoRoomCount === 0) {
    // Create Room 1: Demo & Mina
    await client.room.create({
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
    await client.room.create({
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
    await client.room.create({
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
    await client.room.create({
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
  }

  console.log('✅ Seed completed successfully!');
  return { users: [mina.email, alex.email, sarah.email, demo.email] };
}

// If executed directly from CLI: node prisma/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
