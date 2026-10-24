import { useState, useRef, useCallback } from 'react';

const MAX_LENGTH = 2000; // characters cap — prevents DoS / DB bloat
const SEND_COOLDOWN_MS = 300; // prevents rapid-fire spam

export default function Composer({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const lastSentAt = useRef(0); // track last send timestamp for cooldown

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cooldown guard
    const now = Date.now();
    if (now - lastSentAt.current < SEND_COOLDOWN_MS) return;
    lastSentAt.current = now;

    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    // Enforce max length
    if (e.target.value.length <= MAX_LENGTH) {
      setText(e.target.value);
      onTyping?.();
    }
  };

  const charsLeft = MAX_LENGTH - text.length;
  const nearLimit = charsLeft <= 200;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-t border-line bg-surface flex-shrink-0">
      <div className="flex-1 min-w-0 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          autoComplete="off"
          aria-label="Message"
          maxLength={MAX_LENGTH}
          className="
            w-full bg-input-bg border border-line text-[#ededed]
            rounded-full px-5 py-3 text-[15px] font-[inherit]
            placeholder:text-muted
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
            transition-colors duration-150 pr-16
          "
        />
        {/* Character counter — only visible near limit */}
        {nearLimit && (
          <span
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none
              ${charsLeft <= 50 ? 'text-red-400' : 'text-muted'}`}
          >
            {charsLeft}
          </span>
        )}
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        aria-label="Send message"
        className="
          bg-accent text-accent-text font-bold px-6 py-3 rounded-full
          hover:bg-accent-hover active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150 flex-shrink-0
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
        "
      >
        Send
      </button>
    </div>
  );
}
