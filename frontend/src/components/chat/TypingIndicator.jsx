export default function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null;

  return (
    <div className="typing animate-spring-up my-1">
      <i />
      <i />
      <i />
      <span className="text-[12px] text-muted ml-2 font-medium">
        {names[0]} is typing…
      </span>
    </div>
  );
}
