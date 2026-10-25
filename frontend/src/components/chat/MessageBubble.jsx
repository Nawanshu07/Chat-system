import { useState } from 'react';
import { sound } from '../../services/sound';

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮'];

export default function MessageBubble({
  message,
  isMine,
  groupPosition = 'single',
  showSender = false,
  isDelivered = false,
  onReaction,
}) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || {});

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleReaction = (emoji) => {
    sound.playReaction();
    setReactions((prev) => {
      const current = prev[emoji] || 0;
      const next = current ? current - 1 : 1;
      const updated = { ...prev };
      if (next <= 0) delete updated[emoji];
      else updated[emoji] = next;
      return updated;
    });
    onReaction?.(message.id, emoji);
    setShowActions(false);
  };

  const hasReactions = Object.keys(reactions).length > 0;
  const isFirst = groupPosition === 'top' || groupPosition === 'single';

  return (
    <div
      className={`group relative flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
        isFirst ? 'mt-2' : 'mt-0.5'
      } ${hasReactions ? 'mb-2.5' : ''} animate-spring-up select-text`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Sender name for group chats */}
      {!isMine && showSender && isFirst && (
        <span
          className="text-[11px] font-semibold mb-0.5 pl-1 select-none"
          style={{ color: message.senderColor || '#3B82F6' }}
        >
          {message.senderName || 'Member'}
        </span>
      )}

      <div className="relative max-w-[min(520px,78%)]">
        {/* Floating Action Bar on Hover — docked horizontally beside the bubble */}
        {showActions && (
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 z-30 flex items-center gap-1
              bg-panel border border-line rounded-full px-2 py-1 shadow-lg backdrop-blur-md
              animate-pop-in select-none
              ${
                isMine
                  ? 'right-[calc(100%+8px)] before:-right-2.5'
                  : 'left-[calc(100%+8px)] before:-left-2.5'
              }
              before:content-[''] before:absolute before:inset-y-0 before:w-3
            `}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className="hover:scale-130 active:scale-95 transition-transform p-0.5 text-xs leading-none"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-3.5 bg-line mx-0.5" />
            <button
              onClick={handleCopy}
              className="text-muted hover:text-text p-0.5 text-xs font-semibold transition-colors flex items-center justify-center"
              title="Copy text"
            >
              {copied ? (
                <span className="text-online text-[10px] font-bold">✓</span>
              ) : (
                <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Message Bubble matching Telegram */}
        <div
          className={`
            m ${isMine ? 'out' : 'in'}
            text-[14.5px] leading-[1.42] break-words transition-colors relative
            ${
              isMine
                ? 'bg-out text-out-text rounded-[16px] rounded-br-[4px]'
                : 'bg-in text-text rounded-[16px] rounded-bl-[4px] border border-line/30'
            }
          `}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <span className="whitespace-pre-wrap select-text">{message.content}</span>
            <span
              className={`inline-flex items-center gap-1 ml-auto text-[11px] font-medium leading-none select-none flex-shrink-0 ${
                isMine ? 'text-[var(--out-meta)]' : 'text-muted'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (
                <span
                  className="tracking-tighter font-semibold text-[11px]"
                  title={isDelivered ? 'Delivered' : 'Sent'}
                >
                  {isDelivered ? '✓✓' : '✓'}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Attached Reactions */}
        {hasReactions && (
          <div
            className={`flex flex-wrap gap-1 mt-1 absolute -bottom-3 ${
              isMine ? 'right-2' : 'left-2'
            } z-10`}
          >
            {Object.entries(reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-panel border border-line rounded-full text-xs shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] text-muted font-bold">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
