import { useState } from 'react';
import Avatar from '../shared/Avatar';
import { sound } from '../../services/sound';

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮'];

export default function MessageBubble({
  message,
  isMine,
  groupPosition = 'single', // 'single' | 'top' | 'middle' | 'bottom'
  showSender = true,
  onReaction,
}) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || {});

  // Determine dynamic bubble border radius
  const getRadiusClass = () => {
    if (isMine) {
      if (groupPosition === 'top') return 'bubble-mine-top';
      if (groupPosition === 'middle') return 'bubble-mine-middle';
      if (groupPosition === 'bottom') return 'bubble-mine-bottom';
      return 'bubble-mine-single';
    } else {
      if (groupPosition === 'top') return 'bubble-theirs-top';
      if (groupPosition === 'middle') return 'bubble-theirs-middle';
      if (groupPosition === 'bottom') return 'bubble-theirs-bottom';
      return 'bubble-theirs-single';
    }
  };

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
        isFirst ? 'mt-2.5' : 'mt-0.5'
      } animate-spring-up select-text`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Sender name for group/incoming messages (only on top message of cluster) */}
      {!isMine && showSender && isFirst && (
        <div className="flex items-center gap-1.5 mb-1 pl-1 text-[11px] font-bold text-header-sub">
          <span>{message.senderName || 'Member'}</span>
        </div>
      )}

      <div className={`flex items-end gap-1.5 max-w-[85%] md:max-w-[72%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for incoming messages (only bottom of cluster) */}
        {!isMine && (
          <div className="w-6 h-6 flex-shrink-0 mb-0.5">
            {groupPosition === 'bottom' || groupPosition === 'single' ? (
              <Avatar
                letter={message.senderAvatar || message.senderName || '?'}
                size="sm"
                color="bg-[#243d34]"
              />
            ) : (
              <div className="w-6" />
            )}
          </div>
        )}

        {/* Bubble container */}
        <div className="relative">
          {/* Floating Action Bar on Hover */}
          {showActions && (
            <div
              className={`absolute -top-9 z-20 flex items-center gap-0.5 bg-[#181818]/95 border border-[#2d2d2d] rounded-full px-1.5 py-0.5 shadow-xl backdrop-blur-md animate-pop-in ${
                isMine ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className="hover:scale-125 active:scale-95 transition-transform p-1 text-xs"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              <div className="w-[1px] h-3 bg-[#333] mx-1" />
              <button
                onClick={handleCopy}
                className="text-muted hover:text-[#ededed] p-1 text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Copy text"
              >
                {copied ? (
                  <span className="text-emerald-400 text-[10px]">Copied!</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Actual Message Bubble */}
          <div
            className={`
              relative px-4 py-2.5 text-[15px] leading-relaxed break-words bubble-shadow transition-all duration-100
              ${getRadiusClass()}
              ${
                isMine
                  ? 'bg-gradient-to-br from-[#2e7d5b] to-[#25684b] text-mine-text'
                  : 'bg-gradient-to-br from-[#1e1e1e] to-[#171717] text-theirs-text border border-[#282828]'
              }
            `}
          >
            {/* Content text */}
            <span className="whitespace-pre-wrap">{message.content}</span>

            {/* Timestamp & Delivered Double Checkmark */}
            <div
              className={`flex items-center gap-1 mt-1 text-[10.5px] select-none ${
                isMine ? 'justify-end text-[#d4fae6]/75' : 'justify-end text-muted'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>

              {/* Sent/Delivered Double Tick for My Messages */}
              {isMine && (
                <span title="Delivered" className="text-[#a5f3cb] inline-flex items-center">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    <path d="M10.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 6.646-6.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* Display Attached Reactions */}
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
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1f1f1f] border border-[#333] rounded-full text-xs shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[10px] text-muted font-bold">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
