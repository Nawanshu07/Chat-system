export default function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, 2).join(' & ')} are typing`;

  return (
    <div className="flex items-center gap-2 px-5 py-1.5 animate-fade-in">
      {/* Bouncing dots */}
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted animate-dot-bounce"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
