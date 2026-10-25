import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { usersApi } from '../../services/api';
import { sound } from '../../services/sound';
import { theme } from '../../services/theme';
import Avatar from '../shared/Avatar';
import SearchBar from './SearchBar';
import RoomItem from './RoomItem';

export default function Sidebar({ onSelectRoom }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [isDark, setIsDark] = useState(theme.isDark());
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { user, logout } = useAuthStore();
  const { rooms, loading, activeRoomId, setActiveRoom, fetchRooms, createOrOpenDM } = useRoomStore();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Search users for new chat modal
  useEffect(() => {
    if (!isNewChatOpen) return;

    let active = true;
    const searchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await usersApi.search(userSearchQuery);
        if (active) setAvailableUsers(res.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(searchUsers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isNewChatOpen, userSearchQuery]);

  const handleToggleTheme = () => {
    const next = theme.toggle();
    setIsDark(next === 'dark');
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'unread') return r.unread > 0;
    return true;
  });

  const handleSelect = (room) => {
    setActiveRoom(room.id);
    onSelectRoom?.(room);
  };

  const handleStartDM = async (participant) => {
    try {
      const room = await createOrOpenDM(participant.id);
      setIsNewChatOpen(false);
      setUserSearchQuery('');
      onSelectRoom?.(room);
    } catch (err) {
      console.error('Failed to start DM:', err);
    }
  };

  return (
    <>
      <aside className="side w-full md:w-[340px] flex-shrink-0 h-full relative select-none">
        <div className="side-h">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="Chatly" className="w-7 h-7 rounded-lg shadow-xs flex-none" />
            <h1>Chats</h1>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Theme Switcher Button */}
            <button
              onClick={handleToggleTheme}
              className="icon"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Switch theme"
            >
              {isDark ? (
                // Moon icon
                <svg viewBox="0 0 24 24">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              ) : (
                // Sun icon
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              className={`icon ${soundEnabled ? 'text-accent' : 'opacity-40'}`}
              title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? (
                <svg viewBox="0 0 24 24">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            {/* New Chat Button matching Design.md */}
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="icon"
              title="New chat"
              aria-label="New chat"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="icon hover:text-red-500"
              title="Log out"
              aria-label="Log out"
            >
              <svg viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input matching .search in Design.md */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Tabs matching .tabs in Design.md */}
        <div className="tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`tab ${activeTab === 'all' ? 'on' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`tab ${activeTab === 'unread' ? 'on' : ''}`}
          >
            Unread
          </button>
        </div>

        {/* Chat List matching .list in Design.md */}
        <div className="list">
          {loading && rooms.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Loading chats...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center px-4 py-12 flex flex-col items-center gap-2 text-muted text-sm">
              <p>
                {search
                  ? 'No chats found.'
                  : activeTab === 'unread'
                  ? 'No unread messages.'
                  : 'No conversations yet.'}
              </p>
              <button
                onClick={() => {
                  setUserSearchQuery(search);
                  setIsNewChatOpen(true);
                }}
                className="text-xs text-accent hover:underline font-semibold mt-1"
              >
                + Start a new chat
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onClick={() => handleSelect(room)}
                myId={user?.id}
              />
            ))
          )}
        </div>

        {/* Current User Profile Footer */}
        <div className="px-4 py-2.5 border-t border-line flex items-center gap-2.5 bg-panel">
          <Avatar
            name={user?.username}
            letter={user?.avatar || user?.username}
            size="sm"
            color={user?.avatarColor}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text truncate">
              {user?.username || 'You'}
            </div>
            <div className="text-xs text-muted truncate">
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-panel border border-line rounded-2xl w-full max-w-md p-5 flex flex-col shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h2 className="text-base font-bold text-text">New Conversation</h2>
              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setUserSearchQuery('');
                }}
                className="text-muted hover:text-text p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Search registered users by username or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 rounded-[20px] border-0 bg-bg text-text px-4 text-sm font-inherit placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1">
              {loadingUsers ? (
                <div className="py-6 text-center text-sm text-muted flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Searching users...
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No registered users found
                </p>
              ) : (
                availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartDM(u)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-hover text-left transition-colors"
                  >
                    <Avatar name={u.username} letter={u.avatar || u.username} size="md" color={u.avatarColor} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-text truncate">
                        {u.username}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {u.email}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent px-2.5 py-1 bg-accent-soft rounded-lg">
                      Chat
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
