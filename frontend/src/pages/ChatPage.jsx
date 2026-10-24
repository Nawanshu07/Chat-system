import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useSocket } from '../hooks/useSocket';

export default function ChatPage() {
  // Keep persistent WebSocket connection active on chat page
  useSocket();

  // On mobile: show sidebar or chat, not both
  const [mobileView, setMobileView] = useState('sidebar'); // 'sidebar' | 'chat'

  const handleSelectRoom = () => setMobileView('chat');
  const handleBack = () => setMobileView('sidebar');

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div
        className={`
          ${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex
          w-full md:w-[320px] flex-shrink-0
        `}
      >
        <Sidebar onSelectRoom={handleSelectRoom} />
      </div>

      {/* Chat window — always flex-1, fills remaining space */}
      <div
        className={`
          ${mobileView === 'sidebar' ? 'hidden' : 'flex'} md:flex
          flex-1 min-w-0
        `}
      >
        <ChatWindow onBack={handleBack} />
      </div>
    </div>
  );
}
