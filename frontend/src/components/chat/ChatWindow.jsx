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
import ContactInfoModal from './ContactInfoModal';

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
  const menuRef = useRef(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  // Modals & Menu State
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // In-Chat Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuthStore();
  const activeRoomId = useRoomStore((s) => s.activeRoomId);
  const rooms = useRoomStore((s) => s.rooms);
  const markRead = useRoomStore((s) => s.markRead);

  const getMessages = useMessageStore((s) => s.getMessages);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);
  const loadingRooms = useMessageStore((s) => s.loadingRooms);
  const getTypingUsers = useMessageStore((s) => s.getTypingUsers);
  const clearRoomMessages = useMessageStore((s) => s.clearRoomMessages);

  const { sendRealtimeMessage, startTyping, stopTyping } = useSocket();

  const room = rooms.find((r) => r.id === activeRoomId) || null;
  const rawMessages = room ? getMessages(room.id) : [];
  const typingNames = room ? getTypingUsers(room.id) : [];
  const isLoading = room ? !!loadingRooms[room.id] : false;

  // Filter messages if search query is active
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return rawMessages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [rawMessages, searchQuery]);

  const messages = rawMessages;

  const onlineCount = useMemo(() => {
    if (!room?.members) return 0;
    return room.members.filter((m) => m.isOnline).length;
  }, [room?.members]);

  const myId = user?.id || 'me';

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playTap();
  };

  // Close header menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (room?.id) {
      markRead(room.id);
      fetchMessages(room.id);
      setNewMessagesCount(0);
      setIsSearchOpen(false);
      setSearchQuery('');
      setShowMenu(false);
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
      if (isScrolledUp) {
        setNewMessagesCount((c) => c + 1);
      } else {
        scrollToBottom(true);
      }
    }
  }, [messages.length, isScrolledUp]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [room?.id]);

  const handleSend = async (content) => {
    if (!room?.id || !content.trim()) return;
    try {
      await sendRealtimeMessage(room.id, content.trim());
      scrollToBottom(true);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  const handleTyping = () => {
    if (!room?.id) return;
    startTyping(room.id);
  };

  const handleClearChat = () => {
    if (!room?.id) return;
    if (window.confirm('Clear all messages in this conversation for this session?')) {
      clearRoomMessages(room.id);
      setShowMenu(false);
      sound.playTap();
    }
  };

  const handleOpenInfo = () => {
    setShowMenu(false);
    if (!room) return;
    if (room.isDM) {
      setIsContactInfoOpen(true);
    } else {
      setIsGroupInfoOpen(true);
    }
  };

  // Group messages by day & sender
  const groupedItems = useMemo(() => {
    const items = [];
    let lastDate = null;

    messages.forEach((msg, idx) => {
      const msgDate = new Date(msg.createdAt).toDateString();

      if (msgDate !== lastDate) {
        items.push({
          type: 'divider',
          date: msg.createdAt,
          key: `div-${msg.createdAt}-${idx}`,
        });
        lastDate = msgDate;
      }

      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const isPrevSame = prev && prev.senderId === msg.senderId && new Date(prev.createdAt).toDateString() === msgDate;
      const isNextSame = next && next.senderId === msg.senderId && new Date(next.createdAt).toDateString() === msgDate;

      let groupPosition = 'single';
      if (isPrevSame && isNextSame) groupPosition = 'middle';
      else if (isPrevSame && !isNextSame) groupPosition = 'bottom';
      else if (!isPrevSame && isNextSame) groupPosition = 'top';

      const isSearchMatch = searchQuery.trim()
        ? msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
        : false;

      items.push({
        type: 'message',
        message: msg,
        groupPosition,
        isSearchMatch,
        key: msg.id || `msg-${idx}`,
      });
    });

    return items;
  }, [messages, searchQuery]);

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-bg">
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
      <header className="main-h relative select-none">
        {/* Back button for mobile */}
        {onBack && (
          <button
            onClick={onBack}
            className="icon back cursor-pointer hover:bg-hover active:scale-95 transition-transform"
            aria-label="Back to chats"
            title="Back to chats"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* 42px Avatar - clickable for Info */}
        <div onClick={handleOpenInfo} className="cursor-pointer hover:opacity-85 transition-opacity flex-shrink-0">
          <Avatar
            name={room.name}
            letter={room.avatar}
            size="header"
            isOnline={room.isOnline}
            isGroup={!room.isDM}
            color={room.avatarColor}
          />
        </div>

        {/* Title and status matching .t, .n, .s in Design.md - clickable for Info */}
        <div
          className="t cursor-pointer hover:opacity-85 transition-opacity"
          onClick={handleOpenInfo}
          title={room.isDM ? 'Click to view contact info' : 'Click to view group details'}
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
        <div className="flex items-center gap-0.5 relative" ref={menuRef}>
          {/* Search in chat toggle */}
          <button
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`icon ${isSearchOpen ? 'text-accent bg-hover' : ''}`}
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

          {/* More options / Dropdown Menu Button */}
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className={`icon ${showMenu ? 'bg-hover text-text' : ''}`}
            title="More options"
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 dots">
              <circle cx="12" cy="5" r="2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {/* Floating Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-panel border border-line rounded-xl shadow-xl z-50 py-1.5 animate-pop-in select-none">
              <button
                onClick={handleOpenInfo}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text hover:bg-hover flex items-center gap-2.5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted fill-none stroke-current" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{room.isDM ? 'View Contact Info' : 'View Group Info'}</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsSearchOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text hover:bg-hover flex items-center gap-2.5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted fill-none stroke-current" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search in Chat</span>
              </button>

              <button
                onClick={() => {
                  handleToggleSound();
                  setShowMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text hover:bg-hover flex items-center gap-2.5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted fill-none stroke-current" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>{soundEnabled ? 'Mute Notifications' : 'Unmute Notifications'}</span>
              </button>

              <div className="my-1 border-t border-line/60" />

              <button
                onClick={handleClearChat}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Clear Messages</span>
              </button>

              {onBack && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onBack();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text hover:bg-hover flex items-center gap-2.5 transition-colors sm:hidden"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted fill-none stroke-current" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Close Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* In-Chat Message Search Bar */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-panel border-b border-line animate-fade-in flex-shrink-0 z-10 select-none">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted flex-none fill-none stroke-current" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search in this chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-muted"
          />
          {searchQuery && (
            <span className="text-xs text-muted font-medium whitespace-nowrap">
              {searchMatches.length} {searchMatches.length === 1 ? 'match' : 'matches'}
            </span>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="w-7 h-7 rounded-full grid place-items-center text-muted hover:text-text hover:bg-hover text-xs transition-colors"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message List matching Telegram */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="msgs select-text"
      >
        <div className="w-full flex-1 flex flex-col justify-end">
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
                <div
                  key={item.key}
                  className={item.isSearchMatch ? 'ring-2 ring-accent/60 rounded-2xl' : ''}
                >
                  <MessageBubble
                    message={item.message}
                    isMine={item.message.senderId === myId}
                    groupPosition={item.groupPosition}
                    showSender={!room.isDM}
                    isDelivered={room.isDM ? !!room.isOnline : true}
                  />
                </div>
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

      {/* Contact Info Modal for DMs */}
      {isContactInfoOpen && room && room.isDM && (
        <ContactInfoModal room={room} onClose={() => setIsContactInfoOpen(false)} />
      )}
    </div>
  );
}
