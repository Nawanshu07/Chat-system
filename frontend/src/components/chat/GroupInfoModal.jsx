import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { usersApi } from '../../services/api';
import Avatar from '../shared/Avatar';

export default function GroupInfoModal({ room, onClose }) {
  const { user } = useAuthStore();
  const { addMembersToGroup, leaveGroup, updateGroup } = useRoomStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(room?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle mobile hardware/gesture back
  useEffect(() => {
    window.history.pushState({ modalOpen: 'group-info' }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  const handleClose = () => {
    if (window.history.state?.modalOpen === 'group-info') {
      window.history.back();
    } else {
      onClose();
    }
  };

  const members = room?.members || [];
  const currentMemberIds = new Set(members.map((m) => m.id));

  // Search users who are not yet members
  useEffect(() => {
    if (!isAddingMembers) return;

    let active = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await usersApi.search(memberSearchQuery);
        if (active) {
          const nonMembers = (res.users || []).filter((u) => !currentMemberIds.has(u.id));
          setAvailableUsers(nonMembers);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, memberSearchQuery ? 200 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAddingMembers, memberSearchQuery]);

  const handleSaveName = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === room.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    setErrorMessage('');
    try {
      await updateGroup(room.id, { name: trimmed });
      setIsEditingName(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to update group name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setIsSubmittingAdd(true);
    setErrorMessage('');
    try {
      await addMembersToGroup(room.id, selectedToAdd);
      setIsAddingMembers(false);
      setSelectedToAdd([]);
      setMemberSearchQuery('');
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to add members');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleLeaveGroup = async () => {
    setIsLeaving(true);
    setErrorMessage('');
    try {
      await leaveGroup(room.id);
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to leave group');
      setIsLeaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-panel border border-line rounded-2xl w-full max-w-lg p-5 flex flex-col shadow-2xl animate-pop-in max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-accent-soft text-accent">
              Group Info
            </span>
            <h2 className="text-base font-bold text-text truncate max-w-[260px]">
              {room.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-text w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 flex flex-col gap-5 pr-1">
          {/* Group Identity Card */}
          <div className="flex items-center gap-4 bg-bg p-4 rounded-xl border border-line/60">
            <Avatar
              name={room.name}
              letter={room.avatar}
              size="lg"
              isGroup={true}
              color={room.avatarColor}
            />

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    maxLength={60}
                    autoFocus
                    className="flex-1 h-9 rounded-lg border border-line bg-panel text-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName || !newGroupName.trim()}
                    className="h-9 px-3 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                  >
                    {isSavingName ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewGroupName(room.name);
                    }}
                    className="h-9 px-2 rounded-lg text-muted hover:text-text text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-text truncate">
                      {room.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {members.length} {members.length === 1 ? 'member' : 'members'} · Created{' '}
                      {new Date(room.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-muted hover:text-text hover:bg-hover rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    title="Rename group"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Members Section Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Members ({members.length})
            </span>
            <button
              onClick={() => setIsAddingMembers(!isAddingMembers)}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              {isAddingMembers ? 'Cancel' : '+ Add Members'}
            </button>
          </div>

          {/* Add Members Drawer */}
          {isAddingMembers && (
            <div className="p-3 bg-bg rounded-xl border border-line flex flex-col gap-2.5 animate-spring-up">
              <input
                type="text"
                placeholder="Search registered users to add..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-9 rounded-lg border border-line bg-panel text-text px-3 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />

              {/* Selected User Chips */}
              {selectedToAdd.length > 0 && (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {selectedToAdd.map((uid) => {
                    const u = availableUsers.find((x) => x.id === uid);
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-soft text-accent text-xs font-medium rounded-full"
                      >
                        <span>{u?.username || 'User'}</span>
                        <button
                          onClick={() => handleToggleSelectUser(uid)}
                          className="hover:opacity-75 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* User list to add */}
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1">
                {loadingUsers ? (
                  <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Loading users...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="py-3 text-center text-xs text-muted">
                    {memberSearchQuery ? 'No matching users found.' : 'All registered users are already in this group.'}
                  </div>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedToAdd.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleToggleSelectUser(u.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors text-xs ${
                          isSelected ? 'bg-accent-soft/60' : 'hover:bg-hover'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-accent rounded cursor-pointer"
                        />
                        <Avatar name={u.username} letter={u.avatar || u.username} size="sm" color={u.avatarColor} />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-text truncate block">{u.username}</span>
                          <span className="text-[10px] text-muted truncate block">{u.email}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedToAdd.length > 0 && (
                <button
                  onClick={handleAddSelectedMembers}
                  disabled={isSubmittingAdd}
                  className="w-full h-9 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingAdd ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Add ${selectedToAdd.length} ${selectedToAdd.length === 1 ? 'Member' : 'Members'} to Group`
                  )}
                </button>
              )}
            </div>
          )}

          {/* Existing Member List */}
          <div className="flex flex-col gap-1">
            {members.map((m) => {
              const isCurrentUser = m.id === user?.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-hover/60 transition-colors"
                >
                  <Avatar
                    name={m.username}
                    letter={m.avatar || m.username}
                    size="md"
                    isOnline={m.isOnline}
                    color={m.avatarColor}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-text truncate">
                        {m.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-line/80 text-muted">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted truncate block">
                      {m.isOnline ? (
                        <span className="text-online font-medium">Online</span>
                      ) : (
                        'Offline'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Danger Zone: Leave Group */}
          <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2">
            {confirmLeave ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-red-400">
                  Are you sure you want to leave &quot;{room.name}&quot;? You will no longer receive messages.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLeaveGroup}
                    disabled={isLeaving}
                    className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLeaving ? 'Leaving...' : 'Yes, Leave Group'}
                  </button>
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="h-8 px-3 rounded-lg bg-panel hover:bg-hover text-text text-xs font-medium border border-line"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="w-full h-10 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Group</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
