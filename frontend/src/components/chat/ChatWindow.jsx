import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import { sound } from '../../services/sound';
import Avatar from '../shared/Avatar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Composer from './Composer';
import GroupInfoModal from './GroupInfoModal';

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

const STARTER_PROMPTS = ['Hello!', "How's it going?", 'Are you available today?', 'Nice to meet you!'];

export default function ChatWindow({ onBack }) {
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

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

  const onlineCount = useMemo(() => {
    if (!room?.members) return 0;
    return room.members.filter((m) => m.isOnline).length;
  }, [room?.members]);

  const myId = user?.id || 'me';

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  useEffect(() => {
    if (room?.id) {
      markRead(room.id);
      fetchMessages(room.id);
      setNewMessagesCount(0);
    }
  }, [room?.id, markRead, fetchMessages]);

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

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setNewMessagesCount(0);
  };

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

  const groupedItems = useMemo(() => {
    const items = [];
    let lastDateStr = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dateStr = new Date(msg.createdAt).toDateString();

      if (dateStr !== lastDateStr) {
        items.push({ type: 'divider', date: msg.createdAt, key: `div-${dateStr}` });
        lastDateStr = dateStr;
      }

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
      <div className="flex-1 flex flex-col items-center justify-center bg-bg text-muted select-none px-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center mb-3 animate-pop-in">
          <img src="/icon.png" alt="Chatly" className="w-16 h-16 object-contain" />
        </div>
        <p className="text-base font-semibold text-text mb-1">Select a chat to start messaging.</p>
        <p className="text-xs text-muted">Choose from the list or start a new conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg min-w-0 min-h-0 relative">
      {/* Header matching .main-h in Design.md */}
      <header className="main-h">
        {/* Back button for mobile matching .back in Design.md */}
        {onBack && (
          <button
            onClick={onBack}
            className="icon back"
            aria-label="Back to chats"
          >
            <svg viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* 42px Avatar */}
        <Avatar
          name={room.name}
          letter={room.avatar}
          size="header"
          isOnline={room.isOnline}
          isGroup={!room.isDM}
          color={room.avatarColor}
        />

        {/* Title and status matching .t, .n, .s in Design.md */}
        <div
          className={`t ${!room.isDM ? 'cursor-pointer hover:opacity-85' : ''}`}
          onClick={() => {
            if (!room.isDM) setIsGroupInfoOpen(true);
          }}
          title={!room.isDM ? 'Click to view group details' : undefined}
        >
          <div className="n flex items-center gap-1.5">
            <span className="truncate">{room.name}</span>
            {!room.isDM && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-line/80 text-muted flex-shrink-0">
                Group
              </span>
            )}
          </div>
          <div className="s">
            {typingNames.length > 0 ? (
              <span className="text-accent italic font-medium">
                {typingNames[0]} is typing…
              </span>
            ) : !room.isDM ? (
              <span>
                {room.members?.length || 0} members
                {onlineCount > 0 ? ` · ${onlineCount} online` : ''}
              </span>
            ) : room.isOnline ? (
              <span className="text-online font-medium">online</span>
            ) : (
              'last seen recently'
            )}
          </div>
        </div>

        {/* Header Action Icons matching Telegram */}
        <div className="flex items-center gap-0.5">
          {/* Search in chat */}
          <button
            className="icon"
            title="Search in chat"
            aria-label="Search in chat"
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`icon ${soundEnabled ? 'text-accent' : 'opacity-40'}`}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* More options / Info */}
          <button
            onClick={() => !room.isDM && setIsGroupInfoOpen(true)}
            className="icon"
            title={!room.isDM ? 'Group info' : 'More options'}
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 dots">
              <circle cx="12" cy="5" r="2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </header>

      {/* Message List matching Telegram */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="msgs select-text"
      >
        <div className="chat-column">
          {isLoading && messages.length === 0 ? (
            <div className="m-auto flex items-center gap-2 text-muted text-sm py-12">
              <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="m-auto flex flex-col items-center max-w-sm text-center py-12 animate-fade-in">
              <Avatar name={room.name} letter={room.avatar} size="lg" color={room.avatarColor} />
              <h3 className="text-base font-semibold text-text mt-3 mb-1">
                {room.name}
              </h3>
              <p className="text-xs text-muted mb-4">
                Send a message to start the conversation.
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 bg-panel hover:bg-hover border border-line rounded-full text-xs text-text font-medium transition-all hover:scale-105 active:scale-95 shadow-2xs"
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
                  <div key={item.key} className="day select-none">
                    {formatDividerDate(item.date)}
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
                  isDelivered={room.isDM ? !!room.isOnline : true}
                />
              );
            })
          )}

          <TypingIndicator names={typingNames} />

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* Floating "New Messages ↓" Pill Button */}
      {isScrolledUp && newMessagesCount > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-accent text-on-accent font-semibold text-xs rounded-full shadow-lg hover:opacity-95 transition-all animate-pill-bounce flex items-center gap-1.5"
        >
          <span>↓ New messages</span>
          <span className="w-4 h-4 bg-white text-accent rounded-full text-[10px] grid place-items-center font-bold">
            {newMessagesCount}
          </span>
        </button>
      )}

      {/* Composer matching .comp in Design.md */}
      <Composer onSend={handleSend} onTyping={handleTyping} />

      {/* Group Info Modal */}
      {isGroupInfoOpen && room && !room.isDM && (
        <GroupInfoModal room={room} onClose={() => setIsGroupInfoOpen(false)} />
      )}
    </div>
  );
}
