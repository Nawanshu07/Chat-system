import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsTransitioning(true);
  };

  if (isTransitioning) {
    return (
      <div className="min-h-full w-full bg-bg flex flex-col items-center justify-center p-6 select-none animate-page-enter">
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-4 rounded-full bg-accent/25 blur-2xl animate-pulse" />
          <img
            src="/icon.png"
            alt="Chatly"
            className="w-20 h-20 object-contain relative z-10 animate-pulse-glow"
          />
        </div>

        {/* Minimal indeterminate progress line */}
        <div className="w-48 h-1 bg-line/60 rounded-full overflow-hidden relative mb-3">
          <div className="h-full bg-accent rounded-full animate-progress" />
        </div>

        <p className="text-xs text-muted font-medium tracking-wide">
          Connecting to your chats…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/icon.png"
            alt="Chatly"
            className="w-16 h-16 mx-auto mb-2 object-contain select-none"
          />
          <h1 className="text-2xl font-bold text-text tracking-tight">Chatly</h1>
        </div>

        {/* Card */}
        <div className="bg-panel border border-line rounded-2xl p-6 shadow-sm">
          {tab === 'login' ? (
            <LoginForm
              onSwitch={() => setTab('register')}
              onSuccess={handleLoginSuccess}
            />
          ) : (
            <RegisterForm
              onSwitch={() => setTab('login')}
              onSuccess={handleLoginSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
