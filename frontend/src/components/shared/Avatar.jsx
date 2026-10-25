export const AVATAR_COLORS = [
  '#2A6F6B',
  '#B5543A',
  '#5B5FC7',
  '#C08A1E',
  '#8A4F9E',
  '#3B7DB5',
];

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Avatar({ name, letter, size = 'md', isOnline = false, isGroup = false, color }) {
  const isGroupAvatar = isGroup || letter === '👥';
  const initials = isGroupAvatar ? null : (letter || getInitials(name));
  const bgColor = (typeof color === 'string' && color.startsWith('#'))
    ? color
    : getAvatarColor(name || letter || 'Chatly');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    header: 'w-[42px] h-[42px] text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      className={`
        ${sizeClasses[size] || sizeClasses.md}
        ${!bgColor && color ? color : ''}
        rounded-full flex-none grid place-items-center font-bold text-white relative select-none shadow-sm
      `}
    >
      {isGroupAvatar ? (
        <svg viewBox="0 0 24 24" className="w-[52%] h-[52%] fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ) : (
        <span>{initials}</span>
      )}

      {/* Online indicator */}
      {isOnline && (
        <span
          className="absolute right-0 bottom-0.5 w-3 h-3 rounded-full bg-online border-2 border-panel shadow-sm"
          title="Online"
        />
      )}
    </div>
  );
}
