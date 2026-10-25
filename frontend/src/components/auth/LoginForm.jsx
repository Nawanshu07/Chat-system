import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import VerifyOtpModal from './VerifyOtpModal';

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
    if (!email || !password) return 'Please enter your email and password.';
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
      setError(serverMessage || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email address"
          maxLength={254}
          className="w-full h-11 bg-bg border border-line text-text rounded-xl px-4 text-sm
            placeholder:text-muted focus:outline-none focus:border-accent
            transition-colors"
        />

        <div className="flex flex-col gap-1">
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            maxLength={128}
            className="w-full h-11 bg-bg border border-line text-text rounded-xl px-4 text-sm
              placeholder:text-muted focus:outline-none focus:border-accent
              transition-colors"
          />
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-muted hover:text-text transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-accent text-on-accent font-semibold text-sm rounded-xl
            hover:opacity-95 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150 mt-1"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="text-center text-xs text-muted pt-2">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitch} className="text-accent font-medium hover:underline">
            Register
          </button>
        </div>
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
