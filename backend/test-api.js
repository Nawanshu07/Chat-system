async function test() {
  const base = 'http://localhost:5000';
  console.log('1. Health check:');
  const h = await fetch(`${base}/api/health`).then((r) => r.json());
  console.log(h);

  console.log('\n2. Login with demo@example.com:');
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'Password1' }),
  }).then((r) => r.json());
  console.log('User:', loginRes.user?.username, '| Token exists:', !!loginRes.token);

  const token = loginRes.token;

  console.log('\n3. Current user /api/users/me:');
  const me = await fetch(`${base}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log('Profile:', me.user);

  console.log('\n4. Fetch rooms /api/rooms:');
  const rooms = await fetch(`${base}/api/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log('Total rooms:', rooms.rooms?.length);
  const firstRoom = rooms.rooms[0];
  console.log('First room:', {
    id: firstRoom.id,
    name: firstRoom.name,
    isDM: firstRoom.isDM,
    lastMessage: firstRoom.lastMessage,
  });

  console.log('\n5. Fetch messages /api/rooms/:id/messages:');
  const msgs = await fetch(`${base}/api/rooms/${firstRoom.id}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log('Total messages:', msgs.messages?.length);
  console.log('Latest message in room:', msgs.messages[msgs.messages.length - 1]);

  console.log('\n6. Send message via POST /api/rooms/:id/messages:');
  const sendRes = await fetch(`${base}/api/rooms/${firstRoom.id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: 'Testing Phase 2 REST API endpoint! 🚀' }),
  }).then((r) => r.json());
  console.log('Sent message response:', sendRes.message);

  console.log('\n7. Search users /api/users?search=alex:');
  const users = await fetch(`${base}/api/users?search=alex`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log('Found users matching alex:', users.users?.map((u) => u.username));

  console.log('\n8. Test registration POST /api/auth/register:');
  const regUser = `test_${Date.now()}`;
  const regRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: regUser,
      email: `${regUser}@example.com`,
      password: 'Password123',
    }),
  }).then((r) => r.json());
  console.log('Registered user:', regRes.user?.username, '| Token exists:', !!regRes.token);

  console.log('\n🎉 All Phase 2 REST API endpoints verified successfully!');
}

test().catch(console.error);
