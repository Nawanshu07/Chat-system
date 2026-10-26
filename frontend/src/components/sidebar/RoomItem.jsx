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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

export default function RoomItem({ room, isActive, onClick, myId }) {
  const isLastMsgMine = room.lastMessageSenderId === myId;

  return (
    <button
      onClick={onClick}
      className={`chat ${isActive ? 'on' : ''}`}
    >
      <Avatar
        name={room.name}
        letter={room.avatar}
        size="md"
        isOnline={room.isOnline}
        isGroup={!room.isDM}
        color={room.avatarColor}
      />

      <span className="meta">
        <span className="row">
          <span className="name flex items-center gap-1.5 min-w-0">
            <span className="truncate">{room.name}</span>
            {!room.isDM && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-line/60 text-muted flex-shrink-0">
                Group
              </span>
            )}
          </span>
          <span className="time">{formatTimestamp(room.lastMessageTime)}</span>
        </span>

        <span className="row">
          <span className="prev">
            {room.lastMessage ? (
              <>
                {isLastMsgMine
                  ? 'You: '
                  : !room.isDM && room.lastMessageSenderName
                  ? `${room.lastMessageSenderName}: `
                  : ''}
                {room.lastMessage}
              </>
            ) : (
              'No messages yet'
            )}
          </span>

          {room.unread > 0 && (
            <span className="badge">
              {room.unread > 99 ? '99+' : room.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
