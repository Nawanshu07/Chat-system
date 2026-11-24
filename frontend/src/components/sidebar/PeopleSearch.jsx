import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';

export default function PeopleSearch({ onOpen }) {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const data = await request('/users?search=' + encodeURIComponent(query.trim()), { signal: controller.signal });
        setPeople(data.users);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function start(participantId) {
    setStarting(true);
    try {
      const { room } = await request('/rooms', { body: { participantId, isDM: true } });
      onOpen(room);
    } catch (err) { setError(err.message); }
    finally { setStarting(false); }
  }

  return <div className="people">
    <label>Find a person<input autoFocus type="search" placeholder="Search by username" value={query} onChange={e => setQuery(e.target.value)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    {loading ? <p>Looking for people…</p> : people.length ? people.map(person =>
      <button className="person" disabled={starting} key={person.id} onClick={() => start(person.id)}>@{person.username}</button>
    ) : !error && <p>No people found.</p>}
  </div>;
}
