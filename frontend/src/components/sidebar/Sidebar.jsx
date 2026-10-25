import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { usersApi } from '../../services/api';
import { sound } from '../../services/sound';
import Avatar from '../shared/Avatar';
import SearchBar from './SearchBar';
import RoomItem from './RoomItem';

export default function Sidebar({ onSelectRoom }) {
  const [search, setSearch] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  const { user, logout } = useAuthStore();
  const { rooms, loading, activeRoomId, setActiveRoom, fetchRooms, createOrOpenDM } = useRoomStore();

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  // Load rooms from backend on mount
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

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <aside className="w-full md:w-[320px] flex-shrink-0 flex flex-col bg-surface border-r border-line h-full relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <Avatar
              letter={user?.avatar || user?.username || 'U'}
              size="sm"
              color={user?.avatarColor || 'bg-accent'}
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#ededed] truncate max-w-[130px]">
                {user?.username || 'You'}
              </span>
              <span className="text-[11px] text-muted truncate max-w-[130px]">
                {user?.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Sound toggle button */}
            <button
              onClick={handleToggleSound}
              title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                soundEnabled
                  ? 'text-muted hover:text-[#4ade80] hover:bg-sidebar-hover'
                  : 'text-muted/40 hover:text-muted hover:bg-sidebar-hover'
              }`}
            >
              {soundEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* New chat button */}
            <button
              onClick={() => setIsNewChatOpen(true)}
              title="Start a new chat"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-sidebar-hover hover:text-[#ededed] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-sidebar-hover hover:text-[#ededed] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="pt-3 pb-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Chats label */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Chats
          </span>
          {loading && (
            <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="text-center px-4 mt-8 flex flex-col items-center gap-2">
              <p className="text-muted text-sm">
                {search ? 'No conversations matching search' : 'No conversations yet'}
              </p>
              <button
                onClick={() => {
                  setUserSearchQuery(search);
                  setIsNewChatOpen(true);
                }}
                className="text-xs text-accent hover:underline font-semibold"
              >
                + Find someone to chat with
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onClick={() => handleSelect(room)}
              />
            ))
          )}
        </div>
      </aside>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-line rounded-2xl w-full max-w-md p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h2 className="text-base font-bold text-[#ededed]">New Conversation</h2>
              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setUserSearchQuery('');
                }}
                className="text-muted hover:text-[#ededed] p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Search registered users by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#121212] border border-line rounded-lg px-3.5 py-2 text-sm text-[#ededed] placeholder-muted focus:outline-none focus:border-accent"
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
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sidebar-hover text-left transition-colors"
                  >
                    <Avatar letter={u.avatar || u.username} size="md" color={u.avatarColor} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#ededed] truncate">
                        {u.username}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {u.email}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent px-2 py-1 bg-accent/10 rounded-md">
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
