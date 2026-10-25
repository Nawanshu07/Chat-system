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

  // Modal State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [modalTab, setModalTab] = useState('dm'); // 'dm' | 'group'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Group Creation State
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');

  const { user, logout } = useAuthStore();
  const { rooms, loading, activeRoomId, setActiveRoom, fetchRooms, createOrOpenDM, createGroup } =
    useRoomStore();

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

    // Instant load when opening modal, fast 150ms debounce when typing
    if (!userSearchQuery) {
      searchUsers();
      return () => {
        active = false;
      };
    }

    const timer = setTimeout(searchUsers, 150);
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

  const handleToggleSelectGroupMember = (userId) => {
    setSelectedGroupMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroupChat = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      setGroupError('Please enter a group name');
      return;
    }
    if (selectedGroupMemberIds.length === 0) {
      setGroupError('Please select at least 1 member to create a group');
      return;
    }

    setIsCreatingGroup(true);
    setGroupError('');
    try {
      const room = await createGroup(trimmed, selectedGroupMemberIds);
      setIsNewChatOpen(false);
      setGroupName('');
      setSelectedGroupMemberIds([]);
      setUserSearchQuery('');
      onSelectRoom?.(room);
    } catch (err) {
      setGroupError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <>
      <aside className="side w-full md:w-[340px] flex-shrink-0 h-full relative select-none">
        <div className="side-h">
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="Chatly" className="w-7 h-7 object-contain flex-none" />
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
                <svg viewBox="0 0 24 24">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              ) : (
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

            {/* New Group Button */}
            <button
              onClick={() => {
                setModalTab('group');
                setIsNewChatOpen(true);
              }}
              className="icon"
              title="New group"
              aria-label="New group"
            >
              <svg viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>

            {/* New Chat Button matching Design.md */}
            <button
              onClick={() => {
                setModalTab('dm');
                setIsNewChatOpen(true);
              }}
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
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => {
                    setModalTab('dm');
                    setUserSearchQuery(search);
                    setIsNewChatOpen(true);
                  }}
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  + Start a chat
                </button>
                <span className="text-muted text-xs">·</span>
                <button
                  onClick={() => {
                    setModalTab('group');
                    setIsNewChatOpen(true);
                  }}
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  + Create a group
                </button>
              </div>
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

      {/* New Conversation & Create Group Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-panel border border-line rounded-2xl w-full max-w-md p-4 sm:p-5 flex flex-col shadow-2xl animate-pop-in max-h-[85vh]">
            {/* Modal Header with Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-line flex-shrink-0">
              <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-line/60">
                <button
                  onClick={() => {
                    setModalTab('dm');
                    setGroupError('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'dm'
                      ? 'bg-panel text-text shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Direct Message
                </button>
                <button
                  onClick={() => {
                    setModalTab('group');
                    setGroupError('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'group'
                      ? 'bg-panel text-text shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Create Group
                </button>
              </div>

              <button
                onClick={() => {
                  setIsNewChatOpen(false);
                  setUserSearchQuery('');
                  setGroupName('');
                  setSelectedGroupMemberIds([]);
                  setGroupError('');
                }}
                className="text-muted hover:text-text w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* DIRECT MESSAGE TAB */}
            {modalTab === 'dm' && (
              <>
                <div className="my-3 relative flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full h-11 rounded-[22px] border-0 bg-bg text-text px-4 pr-9 text-base placeholder:text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs p-1"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 pr-1">
                  {loadingUsers ? (
                    <div className="py-8 text-center text-sm text-muted flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Searching registered users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="py-8 px-4 text-center text-muted">
                      <p className="text-sm font-medium text-text mb-1">
                        {userSearchQuery
                          ? `No user found matching "${userSearchQuery}"`
                          : 'No other registered users found yet'}
                      </p>
                      <p className="text-xs">
                        {userSearchQuery
                          ? 'Try searching by their exact username or email address.'
                          : 'Once another user registers, they will appear here.'}
                      </p>
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleStartDM(u)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-hover active:bg-hover/80 text-left transition-colors min-h-[52px]"
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
                        <span className="text-xs font-semibold text-accent px-3 py-1.5 bg-accent-soft rounded-lg flex-shrink-0">
                          Chat
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {/* CREATE GROUP TAB */}
            {modalTab === 'group' && (
              <div className="flex flex-col flex-1 min-h-0 pt-3">
                {groupError && (
                  <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                    {groupError}
                  </div>
                )}

                {/* Group Name Input */}
                <div className="flex items-center gap-2.5 mb-3">
                  <Avatar
                    name={groupName || 'New Group'}
                    letter={groupName ? groupName.charAt(0).toUpperCase() : null}
                    size="md"
                    isGroup={true}
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Group name (e.g. Design Team, Family)..."
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        if (groupError) setGroupError('');
                      }}
                      maxLength={60}
                      autoFocus
                      className="w-full h-11 rounded-xl border border-line bg-bg text-text px-3.5 text-sm placeholder:text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Member Search */}
                <div className="mb-2 relative flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search users to add to group..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-xl border border-line/60 bg-bg text-text px-3 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Selected Member Chips */}
                {selectedGroupMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-20 overflow-y-auto pr-1">
                    {selectedGroupMemberIds.map((uid) => {
                      const u = availableUsers.find((x) => x.id === uid);
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-soft text-accent text-xs font-semibold rounded-full"
                        >
                          <span>{u?.username || 'User'}</span>
                          <button
                            onClick={() => handleToggleSelectGroupMember(uid)}
                            className="hover:opacity-75 font-bold"
                            aria-label={`Remove ${u?.username}`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* User Checkbox Selection List */}
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 pr-1 border border-line/50 rounded-xl p-1 bg-bg/50">
                  {loadingUsers ? (
                    <div className="py-6 text-center text-xs text-muted flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted">
                      No other registered users found.
                    </div>
                  ) : (
                    availableUsers.map((u) => {
                      const isSelected = selectedGroupMemberIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleSelectGroupMember(u.id)}
                          className={`flex items-center gap-3 p-2 rounded-xl text-left transition-colors min-h-[46px] ${
                            isSelected ? 'bg-accent-soft/70' : 'hover:bg-hover'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-accent w-4 h-4 rounded cursor-pointer pointer-events-none"
                          />
                          <Avatar name={u.username} letter={u.avatar || u.username} size="sm" color={u.avatarColor} />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs text-text truncate block">
                              {u.username}
                            </span>
                            <span className="text-[11px] text-muted truncate block">
                              {u.email}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Create Group CTA */}
                <button
                  onClick={handleCreateGroupChat}
                  disabled={isCreatingGroup || !groupName.trim() || selectedGroupMemberIds.length === 0}
                  className="mt-3 w-full h-11 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isCreatingGroup ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Create Group (${selectedGroupMemberIds.length} ${
                      selectedGroupMemberIds.length === 1 ? 'member' : 'members'
                    })`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
