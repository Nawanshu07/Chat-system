import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../shared/Avatar';
import OnlineDot from '../shared/OnlineDot';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Composer from './Composer';

export default function ChatWindow({ onBack }) {
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const { user } = useAuthStore();
  const activeRoomId = useRoomStore((s) => s.activeRoomId);
  const rooms = useRoomStore((s) => s.rooms);
  const markRead = useRoomStore((s) => s.markRead);

  const getMessages = useMessageStore((s) => s.getMessages);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);
  const loadingRooms = useMessageStore((s) => s.loadingRooms);
  const getTypingUsers = useMessageStore((s) => s.getTypingUsers);

  const { sendRealtimeMessage, startTyping, stopTyping } = useSocket();

  // Derive room reactively via selector
  const room = rooms.find((r) => r.id === activeRoomId) || null;
  const messages = room ? getMessages(room.id) : [];
  const typingNames = room ? getTypingUsers(room.id) : [];
  const isLoading = room ? !!loadingRooms[room.id] : false;

  const myId = user?.id || 'me';

  // Fetch message history & mark read when room changes
  useEffect(() => {
    if (room?.id) {
      markRead(room.id);
      fetchMessages(room.id);
    }
  }, [room?.id, markRead, fetchMessages]);

  // Auto-scroll on new messages / typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingNames.length]);

  const handleTyping = () => {
    if (!room) return;
    startTyping(room.id);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping(room.id);
    }, 2000);
  };

  const handleSend = async (content) => {
    if (!room) return;
    clearTimeout(typingTimerRef.current);
    stopTyping(room.id);

    try {
      await sendRealtimeMessage(room.id, content);
    } catch (err) {
      console.error('Failed to send real-time message:', err);
    }
  };

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface text-muted select-none">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-lg font-semibold text-[#ededed]">Select a conversation</p>
        <p className="text-sm mt-1">Choose from the list to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface min-w-0">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 bg-header-bg border-b border-[#173d2e] flex-shrink-0">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden text-header-sub hover:text-header-text transition-colors mr-1"
            aria-label="Back to conversation list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Avatar letter={room.avatar} size="md" color={room.avatarColor} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-header-text truncate leading-tight">
            {room.name}
          </h1>
          <p className="text-[13px] text-header-sub flex items-center gap-1.5 leading-tight mt-0.5">
            {room.isOnline ? (
              <>
                <OnlineDot isOnline />
                Online
              </>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label={`Messages with ${room.name}`}
        className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2.5"
      >
        {isLoading && messages.length === 0 ? (
          <div className="m-auto flex items-center gap-2 text-muted text-sm">
            <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <p className="m-auto text-muted text-sm text-center">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === myId}
            />
          ))
        )}
        <TypingIndicator names={typingNames} />
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Composer */}
      <Composer onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
