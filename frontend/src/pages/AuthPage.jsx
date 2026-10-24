import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <div className="min-h-full bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
            <svg className="w-8 h-8 text-accent-text" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#ededed]">ChatApp</h1>
          <p className="text-sm text-muted mt-1">Real-time messaging, simplified.</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-bg rounded-xl p-1 mb-6">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`
                  flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
                  ${tab === t
                    ? 'bg-accent text-accent-text shadow-sm'
                    : 'text-muted hover:text-[#ededed]'}
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

        <p className="text-center text-xs text-muted mt-6">
          No video or voice. Just chat. 💬
        </p>
      </div>
    </div>
  );
}
