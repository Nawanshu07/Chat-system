import { io } from 'socket.io-client';

async function testSocket() {
  const base = 'http://localhost:5000';

  console.log('Logging in demo and mina...');
  const demoLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'Password1' }),
  }).then((r) => r.json());

  const minaLogin = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mina@example.com', password: 'Password1' }),
  }).then((r) => r.json());

  console.log('Demo token:', !!demoLogin.token, '| Mina token:', !!minaLogin.token);

  // Connect Mina Socket
  const minaSocket = io(base, {
    auth: { token: minaLogin.token },
    transports: ['websocket'],
  });

  // Connect Demo Socket
  const demoSocket = io(base, {
    auth: { token: demoLogin.token },
    transports: ['websocket'],
  });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    minaSocket.on('connect', () => {
      console.log('Mina connected to Socket.IO!');
      check();
    });
    demoSocket.on('connect', () => {
      console.log('Demo connected to Socket.IO!');
      check();
    });
  });

  // Fetch DM room between Demo and Mina
  const roomsRes = await fetch(`${base}/api/rooms`, {
    headers: { Authorization: `Bearer ${demoLogin.token}` },
  }).then((r) => r.json());

  const dmRoom = roomsRes.rooms.find((r) => r.name.toLowerCase() === 'mina');
  console.log('Found DM room:', dmRoom.id);

  // Mina joins the room
  minaSocket.emit('join_room', { roomId: dmRoom.id });

  // Listen on Mina for real-time message and conversation_updated
  const messagePromise = new Promise((resolve) => {
    minaSocket.on('new_message', (data) => {
      console.log('⚡ Mina received real-time new_message:', data.message.content);
      resolve(data);
    });
  });

  const conversationPromise = new Promise((resolve) => {
    minaSocket.on('conversation_updated', (data) => {
      console.log('🔔 Mina received conversation_updated for room:', data.room.name, '| Last msg:', data.room.lastMessage);
      resolve(data);
    });
  });

  // Demo sends a message in the room
  console.log('Demo sending message via socket...');
  demoSocket.emit(
    'send_message',
    {
      roomId: dmRoom.id,
      content: 'Real-time test message via Socket.IO! 🚀',
    },
    (ack) => {
      console.log('Demo send ack received:', ack.success);
    }
  );

  await Promise.all([messagePromise, conversationPromise]);

  console.log('\n🎉 Real-time instant delivery & sidebar push VERIFIED successfully!');
  minaSocket.disconnect();
  demoSocket.disconnect();
}

testSocket().catch((err) => {
  console.error('Socket test error:', err);
  process.exit(1);
});
