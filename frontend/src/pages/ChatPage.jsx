import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useRoomStore } from '../store/roomStore';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeRoomId = useRoomStore((s) => s.activeRoomId);
  const setActiveRoom = useRoomStore((s) => s.setActiveRoom);
  const rooms = useRoomStore((s) => s.rooms);

  const urlRoomId = searchParams.get('c');

  // Detect mobile viewport (<= 760px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 760px)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 760px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // When urlRoomId is present in URL, keep activeRoomId synced
  useEffect(() => {
    if (urlRoomId && urlRoomId !== activeRoomId) {
      setActiveRoom(urlRoomId);
    }
  }, [urlRoomId, activeRoomId, setActiveRoom]);

  // On desktop: if activeRoomId exists but URL doesn't have it, keep URL synced without extra history push
  useEffect(() => {
    if (!isMobile && activeRoomId && !urlRoomId) {
      setSearchParams({ c: activeRoomId }, { replace: true });
    }
  }, [isMobile, activeRoomId, urlRoomId, setSearchParams]);

  // Handle room selection from sidebar
  const handleSelectRoom = (room) => {
    setActiveRoom(room.id);
    // Push new history state so mobile back navigates back to /chat instead of closing browser
    setSearchParams({ c: room.id });
  };

  // Back button handler (both in-app button and mobile navigation)
  const handleBack = () => {
    if (isMobile) {
      // Return to chat list by clearing ?c=
      navigate('/chat');
    } else {
      setActiveRoom(null);
      setSearchParams({}, { replace: true });
    }
  };

  // On mobile: chat window is only open if urlRoomId is present
  // On desktop: open if activeRoomId is present
  const isOpenMobile = isMobile ? Boolean(urlRoomId) : Boolean(activeRoomId);

  return (
    <div className={`app ${isOpenMobile ? 'open' : ''} animate-page-enter`} id="app">
      <Sidebar onSelectRoom={handleSelectRoom} />
      <section className="main" id="main">
        <ChatWindow onBack={handleBack} />
      </section>
    </div>
  );
}
