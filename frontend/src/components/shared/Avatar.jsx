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

export default function Avatar({ name, letter, size = 'md', isOnline = false, color }) {
  const initials = letter || getInitials(name);
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
      <span>{initials}</span>

      {/* Online indicator matching .av.on::after in Design.md */}
      {isOnline && (
        <span
          className="absolute right-0 bottom-0.5 w-3 h-3 rounded-full bg-online border-2 border-panel shadow-sm"
          title="Online"
        />
      )}
    </div>
  );
}
