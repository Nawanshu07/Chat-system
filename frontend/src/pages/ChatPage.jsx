import { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChatPage() {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleSelectRoom = () => setIsOpenMobile(true);

  // Sync mobile chat screen with browser history for smooth back gestures
  useEffect(() => {
    if (isOpenMobile) {
      window.history.pushState({ chatOpen: true }, '');
      const handlePopState = () => {
        setIsOpenMobile(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpenMobile]);

  const handleBack = () => {
    setIsOpenMobile(false);
    if (window.history.state?.chatOpen) {
      window.history.back();
    }
  };

  return (
    <div className={`app ${isOpenMobile ? 'open' : ''} animate-page-enter`} id="app">
      <Sidebar onSelectRoom={handleSelectRoom} />
      <section className="main" id="main">
        <ChatWindow onBack={handleBack} />
      </section>
    </div>
  );
}
