import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

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
            <LoginForm onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitch={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
