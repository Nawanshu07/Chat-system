import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';

// Simple but solid email regex — validates format before hitting the server
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginForm({ onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      const serverMessage = err.response?.data?.error;
      setError(serverMessage || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          maxLength={254} // RFC 5321 email max length
          className="bg-[#1a1a1a] border border-line text-[#ededed] rounded-xl px-4 py-3 text-sm
            placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
            transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-xs font-semibold text-muted uppercase tracking-wider">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          maxLength={128} // reasonable upper bound
          className="bg-[#1a1a1a] border border-line text-[#ededed] rounded-xl px-4 py-3 text-sm
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
        className="bg-accent text-accent-text font-bold py-3 rounded-xl
          hover:bg-accent-hover active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150 mt-1"
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
  );
}
