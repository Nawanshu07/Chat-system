import React, { useEffect, useRef, useState } from 'react';
import { request } from '../../services/api';

function mergeMessages(current, incoming) {
  const messages = new Map(current.map(message => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export default function ChatWindow({ room, user, socket, onBack }) {
  const path = '/rooms/' + room.id + '/messages';
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [older, setOlder] = useState(false);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const log = useRef(null);
  const atBottom = useRef(true);
  const anchor = useRef(null);

  useEffect(() => {
    let revision = 0;
    let pending = null;
    async function load() {
      const current = ++revision;
      pending = [];
      try {
        const data = await request(path);
        if (current !== revision) return;
        setMessages(mergeMessages(data.messages, pending));
        setOlder(data.messages.length === 50);
        setError('');
      } catch (err) {
        if (current === revision) setError(err.message);
      } finally {
        if (current === revision) { pending = null; setLoading(false); }
      }
    }
    function receive({ message }) {
      if (message.roomId !== room.id) return;
      pending?.push(message);
      setMessages(items => mergeMessages(items, [message]));
    }
    socket.on('new_message', receive);
    socket.on('connect', load);
    load();
    return () => { revision++; socket.off('new_message', receive); socket.off('connect', load); };
  }, [room.id, path, socket, retry]);

  useEffect(() => {
    const el = log.current;
    if (anchor.current !== null) {
      el.scrollTop += el.scrollHeight - anchor.current;
      anchor.current = null;
    } else if (atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    setPaging(true);
    try {
      const data = await request(path + '?before=' + encodeURIComponent(messages[0].id));
      anchor.current = log.current.scrollHeight;
      setMessages(items => mergeMessages(items, data.messages));
      setOlder(data.messages.length === 50);
      setError('');
    } catch (err) { setError(err.message); }
    finally { setPaging(false); }
  }

  async function send(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const { message } = await request(path, { body: { content } });
      atBottom.current = true;
      setMessages(items => mergeMessages(items, [message]));
      setDraft('');
      setError('');
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  return <section className="conversation" aria-label={'Chat with ' + room.name}>
    <header className="thread-heading">
      <button className="plain back" onClick={onBack}>Chats</button>
      <h2>{room.name}</h2>
    </header>
    <div className="history" ref={log} onScroll={e => {
      const el = e.currentTarget;
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    }}>
      {older && <button className="link older" disabled={paging} onClick={loadOlder}>{paging ? 'Loading…' : 'Earlier messages'}</button>}
      {!messages.length && !error && <p className="thread-note">{loading ? 'Loading messages…' : 'Send the first message.'}</p>}
      <ol aria-label="Messages">{messages.map(message => {
        const mine = message.senderId === user.id;
        const date = new Date(message.createdAt);
        return <li className={mine ? 'mine' : ''} key={message.id}>
          <div className="message-meta"><strong>{mine ? 'You' : message.senderName}</strong>
            <time dateTime={message.createdAt}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time>
          </div>
          <p className="bubble">{message.content}</p>
        </li>;
      })}</ol>
    </div>
    {error && <p role="alert" className="notice error">{error} <button className="link" onClick={() => setRetry(retry + 1)}>Reload chat</button></p>}
    <form className="composer" onSubmit={send}>
      <input aria-label="Message" placeholder="Write a message…" value={draft} readOnly={sending}
        onChange={e => setDraft(e.target.value)} maxLength={2000} autoComplete="off" />
      <button className="primary" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send'}</button>
    </form>
  </section>;
}
