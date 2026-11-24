import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { request, socketUrl } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ChatWindow from '../components/chat/ChatWindow';
import PeopleSearch from '../components/sidebar/PeopleSearch';

function updateRoom(list, room) {
  return [room, ...list.filter(item => item.id !== room.id)]
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
}

export default function ChatPage() {
  const { token, user } = useAuthStore();
  const [socket] = useState(() => io(socketUrl, { auth: { token }, autoConnect: false }));
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let revision = 0;
    let updates = [];
    async function load() {
      const current = ++revision;
      updates = [];
      try {
        const data = await request('/rooms');
        if (current !== revision) return;
        setRooms(updates.reduce(updateRoom, data.rooms));
        setError('');
      } catch (err) {
        if (current === revision) setError(err.message);
      } finally {
        if (current === revision) { setLoading(false); updates = null; }
      }
    }
    function receive({ room }) {
      updates?.push(room);
      setRooms(list => updateRoom(list, room));
    }
    function connected() { setOffline(false); load(); }
    function disconnected() { setOffline(true); }
    socket.on('conversation_updated', receive);
    socket.on('connect', connected);
    socket.on('disconnect', disconnected);
    socket.on('connect_error', disconnected);
    load();
    socket.connect();
    return () => {
      revision++;
      socket.off('conversation_updated', receive);
      socket.off('connect', connected);
      socket.off('disconnect', disconnected);
      socket.off('connect_error', disconnected);
      socket.disconnect();
    };
  }, [socket, retry]);

  function open(room) {
    setRooms(list => updateRoom(list, room));
    setActive(room.id);
    setSearching(false);
  }
  const room = rooms.find(item => item.id === active);

  return <main className={'workspace' + (room ? ' room-open' : '')}>
    <aside className="sidebar" aria-label="Conversations">
      <div className="section-heading"><h1>{searching ? 'New chat' : 'Chats'}</h1>
        <button className={searching ? 'plain' : 'primary compact'} onClick={() => setSearching(!searching)}>
          {searching ? 'Cancel' : 'New chat'}
        </button>
      </div>
      {searching ? <PeopleSearch onOpen={open} /> : <>
        {error && <p role="alert" className="notice">{error} <button className="link" onClick={() => setRetry(retry + 1)}>Retry</button></p>}
        {!rooms.length && !error && <p className="notice">{loading ? 'Loading chats…' : 'Your chats will appear here.'}</p>}
        <div className="room-list">{rooms.map(item => <button key={item.id} onClick={() => open(item)}
          aria-current={active === item.id ? 'true' : undefined} className={'room-row' + (active === item.id ? ' selected' : '')}>

          <span className="row-text"><strong>{item.name}</strong><small>{item.lastMessage || 'No messages yet'}</small></span>
        </button>)}</div>
      </>}
      {offline && <p className="notice" role="status">Reconnecting to live updates…</p>}
    </aside>
    {room ? <ChatWindow key={room.id} room={room} user={user} socket={socket} onBack={() => setActive(null)} /> :
      <section className="empty-chat">
        <h2>Open a conversation</h2><p>Choose a chat or start a new one.</p></section>}
  </main>;
}
