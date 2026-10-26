import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import { useAuthStore } from '../../store/authStore';
import { sound } from '../../services/sound';

export default function ContactInfoModal({ room, onClose }) {
  const { user } = useAuthStore();
  const [soundMuted, setSoundMuted] = useState(!sound.isEnabled());

  // Handle hardware / gesture back navigation on mobile
  useEffect(() => {
    window.history.pushState({ modalOpen: 'contact-info' }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  const handleClose = () => {
    if (window.history.state?.modalOpen === 'contact-info') {
      window.history.back();
    } else {
      onClose();
    }
  };

  const partner = room.members?.find((m) => m.id !== user?.id) || {
    username: room.name,
    email: 'User',
    isOnline: room.isOnline,
    avatarColor: room.avatarColor,
  };

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in select-none"
      onClick={handleClose}
    >
      <div
        className="bg-panel border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-pop-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-accent-soft text-accent">
              User Info
            </span>
            <h2 className="text-base font-bold text-text truncate max-w-[200px]">
              {partner.username || room.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full grid place-items-center text-muted hover:text-text hover:bg-hover transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-5 flex flex-col items-center text-center border-b border-line bg-bg/40">
          <Avatar
            name={partner.username || room.name}
            letter={partner.avatar || room.avatar}
            size="lg"
            color={partner.avatarColor || room.avatarColor}
            isOnline={partner.isOnline ?? room.isOnline}
          />
          <h3 className="text-lg font-bold text-text mt-3">
            {partner.username || room.name}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {partner.email || 'Direct Conversation'}
          </p>
          <div className="mt-2.5">
            {(partner.isOnline ?? room.isOnline) ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-online/15 text-online">
                <span className="w-1.5 h-1.5 rounded-full bg-online animate-pulse" />
                Online
              </span>
            ) : (
              <span className="text-xs text-muted font-medium">
                last seen recently
              </span>
            )}
          </div>
        </div>

        {/* Options List */}
        <div className="p-4 flex flex-col gap-2">
          {/* Notifications / Mute */}
          <button
            onClick={toggleMute}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-panel border border-line grid place-items-center text-muted">
                {soundMuted ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-text">Notifications</div>
                <div className="text-xs text-muted">
                  {soundMuted ? 'Muted' : 'Enabled'}
                </div>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${soundMuted ? 'bg-line text-muted' : 'bg-accent-soft text-accent'}`}>
              {soundMuted ? 'Off' : 'On'}
            </span>
          </button>

          {/* Direct Message Status */}
          <div className="p-3 rounded-xl bg-bg/50 border border-line/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-panel border border-line grid place-items-center text-accent">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-text">End-to-End Chat</div>
              <div className="text-xs text-muted">Direct messaging channel</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-accent hover:bg-accent/90 text-on-accent text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
