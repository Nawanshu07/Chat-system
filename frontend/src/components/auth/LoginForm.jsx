import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import VerifyOtpModal from './VerifyOtpModal';

// Simple but solid email regex — validates format before hitting the server
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginForm({ onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) return 'Please fill in all fields.';
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const data = await authApi.login(email, form.password);
      setAuth(data.user, data.token);
      navigate('/chat');
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setVerifyEmail(err.response?.data?.email || form.email.trim().toLowerCase());
        return;
      }
      const serverMessage = err.response?.data?.error;
      setError(serverMessage || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs font-semibold text-muted uppercase tracking-wider">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            maxLength={254}
            className="bg-bg border border-line text-text rounded-xl px-4 py-3 text-sm
              placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
              transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-semibold text-muted uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-accent hover:underline font-semibold"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            maxLength={128}
            className="bg-bg border border-line text-text rounded-xl px-4 py-3 text-sm
              placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
              transition-colors"
          />
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-on-accent font-bold py-3 rounded-xl
            hover:opacity-95 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 mt-1 shadow-xs"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitch} className="text-accent font-semibold hover:underline">
            Register
          </button>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showForgot && (
        <ForgotPasswordModal
          initialEmail={form.email}
          onClose={() => setShowForgot(false)}
        />
      )}

      {/* Verify Email OTP Modal */}
      {verifyEmail && (
        <VerifyOtpModal
          email={verifyEmail}
          onCancel={() => setVerifyEmail('')}
        />
      )}
    </>
  );
}
