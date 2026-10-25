import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import VerifyOtpModal from './VerifyOtpModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export default function RegisterForm({ onSwitch, onSuccess }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    const username = form.username.trim();
    const email    = form.email.trim();
    const password = form.password;
    const confirm  = form.confirm;

    if (!username || !email || !password || !confirm)
      return 'Please fill in all fields.';
    if (!USERNAME_REGEX.test(username))
      return 'Username must be 3–30 chars (letters, numbers, _ or -).';
    if (!EMAIL_REGEX.test(email))
      return 'Please enter a valid email address.';
    if (password.length < 8)
      return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password) && !/[0-9]/.test(password))
      return 'Password must include a number or uppercase letter.';
    if (password !== confirm)
      return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const username = form.username.trim();
      const email    = form.email.trim().toLowerCase();
      const data = await authApi.register(username, email, form.password);

      if (data.requiresVerification) {
        setPendingVerifyEmail(data.email || email);
      } else if (data.token) {
        if (onSuccess) {
          onSuccess(data);
          setTimeout(() => {
            setAuth(data.user, data.token);
          }, 900);
        } else {
          setAuth(data.user, data.token);
          navigate('/chat');
        }
      }
    } catch (err) {
      const serverMessage = err.response?.data?.error;
      setError(serverMessage || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <input
          id="reg-username"
          name="username"
          type="text"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Username"
          maxLength={30}
          className="w-full h-11 bg-bg border border-line text-text rounded-xl px-4 text-sm
            placeholder:text-muted focus:outline-none focus:border-accent
            transition-colors"
        />

        <input
          id="reg-email"
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

        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password (min 8 characters)"
          maxLength={128}
          className="w-full h-11 bg-bg border border-line text-text rounded-xl px-4 text-sm
            placeholder:text-muted focus:outline-none focus:border-accent
            transition-colors"
        />

        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          placeholder="Confirm password"
          maxLength={128}
          className="w-full h-11 bg-bg border border-line text-text rounded-xl px-4 text-sm
            placeholder:text-muted focus:outline-none focus:border-accent
            transition-colors"
        />

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
          {loading ? 'Sending code…' : 'Create Account'}
        </button>

        <div className="text-center text-xs text-muted pt-2">
          Already have an account?{' '}
          <button type="button" onClick={onSwitch} className="text-accent font-medium hover:underline">
            Sign In
          </button>
        </div>
      </form>

      {/* Verification OTP Modal */}
      {pendingVerifyEmail && (
        <VerifyOtpModal
          email={pendingVerifyEmail}
          onSuccess={onSuccess}
          onCancel={() => {
            setPendingVerifyEmail('');
          }}
        />
      )}
    </>
  );
}
