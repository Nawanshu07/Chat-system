import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../services/theme';
import { sound } from '../../services/sound';
import Avatar from './Avatar';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(theme.isDark());
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  // Handle mobile hardware/gesture back
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ modalOpen: 'settings' }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (window.history.state?.modalOpen === 'settings') {
      window.history.back();
    } else {
      onClose();
    }
  };

  const handleSetTheme = (newTheme) => {
    theme.applyTheme(newTheme);
    setIsDark(newTheme === 'dark');
    sound.playTap();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playTap();
  };

  const handleLogout = () => {
    sound.playTap();
    handleClose();
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in select-none"
      onClick={handleClose}
    >
      <div
        className="bg-panel border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-pop-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2 className="text-base font-bold text-text">Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full grid place-items-center text-muted hover:text-text hover:bg-hover transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-bg/50 border border-line">
            <Avatar
              name={user?.username}
              letter={user?.avatar || user?.username}
              size="lg"
              color={user?.avatarColor}
            />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-text truncate">
                {user?.username || 'You'}
              </div>
              <div className="text-xs text-muted truncate">
                {user?.email}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-online animate-pulse" />
                <span className="text-[11px] text-online font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Theme / Mode Option */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-bg rounded-xl border border-line/60">
              <button
                type="button"
                onClick={() => handleSetTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  isDark
                    ? 'bg-panel text-accent shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  !isDark
                    ? 'bg-panel text-accent shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Sound Preferences */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-bg grid place-items-center text-muted">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-text">Chat Sounds</div>
                <div className="text-xs text-muted">Audio effects for messages</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                soundEnabled ? 'bg-accent' : 'bg-line'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-line" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-red-500 hover:bg-red-500/10 border border-red-500/20 text-sm font-semibold transition-colors active:scale-98"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
