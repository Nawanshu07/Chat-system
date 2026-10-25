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

  // Close emoji picker on outside click
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

    // Play subtle audio pop & haptic
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

  const charsLeft = MAX_LENGTH - text.length;
  const nearLimit = charsLeft <= 200;

  return (
    <div className="relative flex flex-col border-t border-line bg-surface flex-shrink-0">
      {/* Floating Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-4 mb-2 p-3 bg-[#181818]/95 border border-[#2d2d2d] rounded-2xl shadow-2xl backdrop-blur-xl z-30 animate-pop-in flex flex-col gap-2 max-w-[280px]"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[#282828]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Quick Emojis
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-muted hover:text-[#ededed] text-xs p-0.5 rounded"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[#252525] active:scale-90 transition-transform"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Row */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        {/* Emoji Toggle Button */}
        <button
          id="emoji-toggle-btn"
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
            showEmojiPicker
              ? 'bg-accent/20 text-accent scale-105'
              : 'text-muted hover:text-[#ededed] hover:bg-[#1a1a1a]'
          }`}
          title="Pick an emoji"
          aria-label="Toggle emoji picker"
        >
          😀
        </button>

        {/* Text Input Container */}
        <div className="flex-1 min-w-0 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            autoComplete="off"
            aria-label="Message"
            maxLength={MAX_LENGTH}
            className="
              w-full bg-[#141414] border border-[#262626] text-[#ededed]
              rounded-full px-5 py-2.5 text-[15px] font-[inherit]
              placeholder:text-muted
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
              transition-all duration-150 pr-14
            "
          />

          {/* Near character limit indicator */}
          {nearLimit && (
            <span
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none ${
                charsLeft <= 50 ? 'text-red-400 font-bold' : 'text-muted'
              }`}
            >
              {charsLeft}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
          className="
            w-10 h-10 rounded-full bg-accent text-accent-text flex items-center justify-center
            hover:bg-accent-hover hover:scale-105 active:scale-95
            disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed
            transition-all duration-150 flex-shrink-0 shadow-lg shadow-accent/20
          "
        >
          <svg className="w-5 h-5 -rotate-45 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
