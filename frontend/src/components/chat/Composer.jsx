import { useState, useRef, useCallback, useEffect } from 'react';
import { sound } from '../../services/sound';

const MAX_LENGTH = 2000;
const SEND_COOLDOWN_MS = 250;

const EMOJI_PALETTE = [
  '👋', '😂', '❤️', '🔥', '👍', '🙏',
  '🎉', '✨', '🚀', '💯', '😊', '😍',
  '😎', '🙌', '🤝', '💡', '👀', '⚡',
];

export default function Composer({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const lastSentAt = useRef(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        !e.target.closest('#emoji-toggle-btn')
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (now - lastSentAt.current < SEND_COOLDOWN_MS) return;
    lastSentAt.current = now;

    sound.playSent();
    onSend(trimmed);
    setText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    if (e.target.value.length <= MAX_LENGTH) {
      setText(e.target.value);
      onTyping?.();
    }
  };

  const handleAddEmoji = (emoji) => {
    sound.playReaction();
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative bg-panel border-t border-line flex-shrink-0">
      {/* Floating Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full right-14 mb-2 p-3 bg-panel border border-line rounded-2xl shadow-xl z-30 animate-pop-in flex flex-col gap-2 max-w-[280px]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-line">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Emojis
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-muted hover:text-text text-xs p-0.5 rounded"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="w-8 h-8 rounded-lg grid place-items-center text-lg hover:bg-hover active:scale-90 transition-transform"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Telegram Composer Row */}
      <div className="comp w-full">
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={() => sound.playTap()}
          className="icon text-muted hover:text-text"
          title="Attach"
          aria-label="Attach"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          aria-label="Message"
          autoComplete="off"
          maxLength={MAX_LENGTH}
        />

        {/* Telegram Smiley Face Button */}
        <button
          id="emoji-toggle-btn"
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          className={`icon text-muted hover:text-text ${
            showEmojiPicker ? 'text-accent' : ''
          }`}
          title="Emoji"
          aria-label="Toggle emoji picker"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
          </svg>
        </button>

        {/* Telegram Paper Airplane Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
          className="send hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
