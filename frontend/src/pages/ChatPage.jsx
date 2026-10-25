import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChatPage() {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleSelectRoom = () => setIsOpenMobile(true);
  const handleBack = () => setIsOpenMobile(false);

  return (
    <div className={`app ${isOpenMobile ? 'open' : ''}`} id="app">
      <Sidebar onSelectRoom={handleSelectRoom} />
      <section className="main" id="main">
        <ChatWindow onBack={handleBack} />
      </section>
    </div>
  );
}
