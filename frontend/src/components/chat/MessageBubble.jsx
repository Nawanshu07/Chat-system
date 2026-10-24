function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div
        className={`
          max-w-[78%] px-4 py-2.5 text-[15px] leading-relaxed break-words
          ${isMine
            ? 'bg-mine text-mine-text bubble-mine'
            : 'bg-theirs text-theirs-text bubble-theirs'}
        `}
      >
        {message.content}
        <span className="block text-[11px] opacity-60 mt-1 text-right">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
