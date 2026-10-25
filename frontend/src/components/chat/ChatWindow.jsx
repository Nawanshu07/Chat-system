import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import { sound } from '../../services/sound';
import Avatar from '../shared/Avatar';
import OnlineDot from '../shared/OnlineDot';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Composer from './Composer';

function formatDividerDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const STARTER_PROMPTS = ['👋 Hello!', "How's it going?", 'Hey, are you there?', 'Nice to meet you!'];

export default function ChatWindow({ onBack }) {
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  const { user } = useAuthStore();
  const activeRoomId = useRoomStore((s) => s.activeRoomId);
  const rooms = useRoomStore((s) => s.rooms);
  const markRead = useRoomStore((s) => s.markRead);

  const getMessages = useMessageStore((s) => s.getMessages);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);
  const loadingRooms = useMessageStore((s) => s.loadingRooms);
  const getTypingUsers = useMessageStore((s) => s.getTypingUsers);

  const { sendRealtimeMessage, startTyping, stopTyping } = useSocket();

  const room = rooms.find((r) => r.id === activeRoomId) || null;
  const messages = room ? getMessages(room.id) : [];
  const typingNames = room ? getTypingUsers(room.id) : [];
  const isLoading = room ? !!loadingRooms[room.id] : false;

  const myId = user?.id || 'me';

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  // Fetch message history & mark read when room changes
  useEffect(() => {
    if (room?.id) {
      markRead(room.id);
      fetchMessages(room.id);
      setNewMessagesCount(0);
    }
  }, [room?.id, markRead, fetchMessages]);

  // Track scroll position
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledAway = distanceToBottom > 150;
    setIsScrolledUp(scrolledAway);
    if (!scrolledAway) {
      setNewMessagesCount(0);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setNewMessagesCount(0);
  };

  // Smart auto-scroll on new messages
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    const isNewArrival = messages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;

    if (isNewArrival) {
      const lastMsg = messages[messages.length - 1];
      const isMyMsg = lastMsg?.senderId === myId;

      if (!isScrolledUp || isMyMsg) {
        scrollToBottom(true);
      } else {
        setNewMessagesCount((c) => c + 1);
      }
    }
  }, [messages.length, isScrolledUp, myId]);

  // Group messages & calculate clustering + date dividers
  const groupedItems = useMemo(() => {
    const items = [];
    let lastDateStr = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dateStr = new Date(msg.createdAt).toDateString();

      // Insert date divider if new day
      if (dateStr !== lastDateStr) {
        items.push({ type: 'divider', date: msg.createdAt, key: `div-${dateStr}` });
        lastDateStr = dateStr;
      }

      // Check clustering with adjacent messages
      const prev = messages[i - 1];
      const next = messages[i + 1];

      const sameAsPrev =
        prev &&
        prev.senderId === msg.senderId &&
        Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt)) < 120000;

      const sameAsNext =
        next &&
        next.senderId === msg.senderId &&
        Math.abs(new Date(next.createdAt) - new Date(msg.createdAt)) < 120000;

      let position = 'single';
      if (sameAsPrev && sameAsNext) position = 'middle';
      else if (sameAsPrev && !sameAsNext) position = 'bottom';
      else if (!sameAsPrev && sameAsNext) position = 'top';

      items.push({
        type: 'message',
        message: msg,
        groupPosition: position,
        key: msg.id,
      });
    }

    return items;
  }, [messages]);

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
      scrollToBottom(true);
    } catch (err) {
      console.error('Failed to send real-time message:', err);
    }
  };

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface text-muted select-none px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-4xl mb-4 shadow-inner animate-pulse-dot">
          💬
        </div>
        <h2 className="text-xl font-bold text-[#ededed] mb-1">Your Messages</h2>
        <p className="text-sm max-w-sm text-muted">
          Select an existing conversation or start a new chat with registered users.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface min-w-0 relative">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3.5 bg-header-bg border-b border-[#173d2e] flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden text-header-sub hover:text-header-text p-1 -ml-1 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="relative">
            <Avatar letter={room.avatar} size="md" color={room.avatarColor} />
            {room.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-header-bg" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-[16px] font-bold text-header-text truncate leading-tight">
              {room.name}
            </h1>
            <p className="text-[12px] text-header-sub flex items-center gap-1.5 leading-tight mt-0.5">
              {room.isOnline ? (
                <>
                  <OnlineDot isOnline />
                  <span>Online now</span>
                </>
              ) : (
                <span className="opacity-80">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1">
          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl text-header-sub hover:text-header-text hover:bg-black/20 transition-all ${
              soundEnabled ? '' : 'opacity-50'
            }`}
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-1 select-text"
      >
        {isLoading && messages.length === 0 ? (
          <div className="m-auto flex items-center gap-2 text-muted text-sm py-12">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          /* Humanized Empty Conversation Welcome Card */
          <div className="m-auto flex flex-col items-center max-w-sm text-center py-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-[#1a4a35] flex items-center justify-center text-2xl font-bold text-accent-text mb-3 shadow-lg ring-4 ring-accent/15">
              {room.avatar || room.name?.[0]?.toUpperCase() || '💬'}
            </div>
            <h3 className="text-base font-bold text-[#ededed] mb-1">
              Start chatting with {room.name}
            </h3>
            <p className="text-xs text-muted mb-5">
              Send your first message or pick a quick starter below:
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-3.5 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#2c2c2c] hover:border-accent/40 rounded-full text-xs text-[#dcdcdc] font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          groupedItems.map((item) => {
            if (item.type === 'divider') {
              return (
                <div key={item.key} className="flex justify-center my-3 select-none">
                  <span className="px-3 py-0.5 bg-[#181818]/90 border border-[#282828] text-[11px] font-semibold text-muted rounded-full shadow-sm">
                    {formatDividerDate(item.date)}
                  </span>
                </div>
              );
            }

            return (
              <MessageBubble
                key={item.key}
                message={item.message}
                isMine={item.message.senderId === myId}
                groupPosition={item.groupPosition}
                showSender={!room.isDM}
              />
            );
          })
        )}

        {/* Typing indicator */}
        <TypingIndicator names={typingNames} />

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Floating "New Messages ↓" Pill Button */}
      {isScrolledUp && newMessagesCount > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-accent text-accent-text font-bold text-xs rounded-full shadow-xl hover:bg-accent-hover transition-all animate-pill-bounce flex items-center gap-1.5"
        >
          <span>↓ New messages</span>
          <span className="w-5 h-5 bg-white text-accent rounded-full text-[10px] flex items-center justify-center font-extrabold">
            {newMessagesCount}
          </span>
        </button>
      )}

      {/* Composer */}
      <Composer onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
