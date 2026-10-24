import Avatar from '../shared/Avatar';

function formatTimestamp(timeStr) {
  if (!timeStr) return '';
  if (timeStr === 'Now' || timeStr === 'Yesterday') return timeStr;

  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function RoomItem({ room, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left
        transition-colors duration-100 relative
        ${isActive
          ? 'bg-sidebar-active border-l-2 border-accent'
          : 'bg-transparent border-l-2 border-transparent hover:bg-sidebar-hover'}
      `}
    >
      {/* Avatar + online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar letter={room.avatar} size="md" color={room.avatarColor} />
        {room.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-surface" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#ededed] truncate">{room.name}</span>
          <span className="text-[11px] text-muted flex-shrink-0">
            {formatTimestamp(room.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted truncate">{room.lastMessage}</p>
          {room.unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-accent text-accent-text text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {room.unread > 99 ? '99+' : room.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
