import prisma from '../src/db/prisma.js';

export async function cleanupDemoUsers() {
  console.log('🧹 Cleaning up demo/example users...');

  const exampleEmails = [
    'mina@example.com',
    'alex@example.com',
    'sarah@example.com',
    'demo@example.com',
  ];

  // Find demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: exampleEmails } },
        { email: { endsWith: '@example.com' } },
      ],
    },
    select: { id: true, email: true },
  });

  const demoUserIds = demoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    // Delete messages sent by or in rooms with demo users
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: demoUserIds } },
          { room: { members: { some: { userId: { in: demoUserIds } } } } },
        ],
      },
    });

    // Delete room members
    await prisma.roomMember.deleteMany({
      where: {
        userId: { in: demoUserIds },
      },
    });

    // Delete empty rooms
    const emptyRooms = await prisma.room.findMany({
      where: {
        members: { none: {} },
      },
      select: { id: true },
    });

    if (emptyRooms.length > 0) {
      await prisma.room.deleteMany({
        where: { id: { in: emptyRooms.map((r) => r.id) } },
      });
    }

    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });

    console.log(`✅ Removed ${demoUsers.length} demo users:`, demoUsers.map((u) => u.email));
  } else {
    console.log('ℹ️ No demo users found to remove.');
  }

  return { removed: demoUsers.map((u) => u.email) };
}

if (process.argv[1]?.endsWith('clean-demo.js')) {
  cleanupDemoUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
