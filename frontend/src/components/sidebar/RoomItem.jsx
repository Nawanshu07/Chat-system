import { useMessageStore } from '../../store/messageStore';
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
  const typingMap = useMessageStore((s) => s.typingUsers[room.id]);
  const typingNames = typingMap ? Object.values(typingMap) : [];
  const isSomeoneTyping = typingNames.length > 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left
        transition-all duration-150 relative select-none group
        ${
          isActive
            ? 'bg-[#0f2d21] border-l-[3px] border-[#4ade80]'
            : 'bg-transparent border-l-[3px] border-transparent hover:bg-[#181818]'
        }
      `}
    >
      {/* Avatar + online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar letter={room.avatar} size="md" color={room.avatarColor} />
        {room.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-surface animate-pulse-dot" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate transition-colors ${isActive ? 'font-bold text-[#f0fbf5]' : 'font-semibold text-[#ededed] group-hover:text-white'}`}>
            {room.name}
          </span>
          <span className="text-[11px] text-muted flex-shrink-0">
            {formatTimestamp(room.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          {isSomeoneTyping ? (
            <p className="text-xs text-[#4ade80] font-medium italic truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-ping inline-block" />
              <span>{typingNames[0]} is typing...</span>
            </p>
          ) : (
            <p className="text-xs text-muted truncate">{room.lastMessage || 'No messages yet'}</p>
          )}

          {room.unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-accent text-accent-text text-[10px] font-extrabold rounded-full flex items-center justify-center px-1.5 shadow-sm">
              {room.unread > 99 ? '99+' : room.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
