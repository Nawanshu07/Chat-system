// Fallback color when no avatarColor is provided
const DEFAULT_COLOR = 'bg-[#2a2a2a]';

export default function Avatar({ letter, size = 'md', color }) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const bgColor = color || DEFAULT_COLOR;

  return (
    <div
      className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none`}
    >
      {letter?.charAt(0).toUpperCase()}
    </div>
  );
}
