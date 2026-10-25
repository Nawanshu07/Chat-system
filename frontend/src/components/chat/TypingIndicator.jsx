export default function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.slice(0, 2).join(' & ')} are typing...`;

  return (
    <div className="flex items-center gap-2 px-2 py-1 animate-spring-up">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-full shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-dot-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span className="text-[11.5px] font-medium text-muted">{label}</span>
      </div>
    </div>
  );
}
