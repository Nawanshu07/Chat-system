import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <div className="min-h-full bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo / brand matching Chatly */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-accent rounded-2xl grid place-items-center mx-auto mb-3 shadow-md shadow-accent/20">
            <svg className="w-7 h-7 text-on-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Chatly</h1>
          <p className="text-sm text-muted mt-0.5">Modern web messenger</p>
        </div>

        {/* Card */}
        <div className="bg-panel border border-line rounded-2xl p-6 shadow-xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-bg rounded-xl p-1 mb-5">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`
                  flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
                  ${tab === t
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted hover:text-text'}
                `}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          {tab === 'login'
            ? <LoginForm onSwitch={() => setTab('register')} />
            : <RegisterForm onSwitch={() => setTab('login')} />
          }
        </div>
      </div>
    </div>
  );
}
