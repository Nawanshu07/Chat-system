// Run against a local server with two verified test accounts.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { io } from 'socket.io-client';

const base = process.env.TEST_ORIGIN || 'http://localhost:5000';
async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(base + '/api' + path, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.ok(response.ok, path + ' returned ' + response.status);
  return response.json();
}

const first = await post('/auth/login', { email: process.env.TEST_EMAIL_A || 'demo@example.com', password: process.env.TEST_PASSWORD || 'Password1' });
const second = await post('/auth/login', { email: process.env.TEST_EMAIL_B || 'mina@example.com', password: process.env.TEST_PASSWORD || 'Password1' });
const { room } = await post('/rooms', { participantId: second.user.id }, first.token);
const socket = io(base, { auth: { token: second.token }, autoConnect: false });
try {
  const connected = once(socket, 'connect', { signal: AbortSignal.timeout(8000) });
  socket.connect();
  await connected;
  const delivery = once(socket, 'new_message', { signal: AbortSignal.timeout(8000) });
  const { message } = await post('/rooms/' + room.id + '/messages', { content: 'Testing live delivery.' }, first.token);
  const [event] = await delivery;
  assert.equal(event.message.id, message.id);
  console.log('Verified live delivery between two accounts.');
} finally {
  socket.disconnect();
}
