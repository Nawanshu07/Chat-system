import assert from 'node:assert/strict';

// Run after seeding a local SQLite database and starting the backend.
const base = (process.env.TEST_ORIGIN || 'http://localhost:5000') + '/api';
const login = await fetch(base + '/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@example.com', password: 'Password1' }),
});
assert.equal(login.status, 200);
const { token } = await login.json();
const headers = { Authorization: 'Bearer ' + token };
const lookup = await fetch(base + '/users?search=mina', { headers });
assert.equal(lookup.status, 200);
const { users } = await lookup.json();
assert.ok(users.some(user => user.username === 'mina'));
const rooms = await fetch(base + '/rooms', { headers });
assert.equal(rooms.status, 200);
assert.ok(Array.isArray((await rooms.json()).rooms));
console.log('Verified sign-in, user search and the conversation list.');
