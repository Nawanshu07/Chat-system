import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import VerifyOtpModal from './VerifyOtpModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Username: 3-30 chars, only letters, numbers, underscores, hyphens
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

const FIELDS = [
  { id: 'reg-username', name: 'username', label: 'Username',        type: 'text',     placeholder: 'cooluser',       autoComplete: 'username',     maxLength: 30 },
  { id: 'reg-email',    name: 'email',    label: 'Email',           type: 'email',    placeholder: 'you@example.com', autoComplete: 'email',        maxLength: 254 },
  { id: 'reg-password', name: 'password', label: 'Password',        type: 'password', placeholder: '••••••••',        autoComplete: 'new-password', maxLength: 128 },
  { id: 'reg-confirm',  name: 'confirm',  label: 'Confirm Password', type: 'password', placeholder: '••••••••',        autoComplete: 'new-password', maxLength: 128 },
];

export default function RegisterForm({ onSwitch }) {
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
      return 'Username must be 3–30 chars: letters, numbers, _ or - only.';
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
        setAuth(data.user, data.token);
        navigate('/chat');
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {FIELDS.map(({ id, name, label, type, placeholder, autoComplete, maxLength }) => (
          <div key={name} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-muted uppercase tracking-wider">
              {label}
            </label>
            <input
              id={id}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={maxLength}
              className="bg-[#1a1a1a] border border-line text-[#ededed] rounded-xl px-4 py-3 text-sm
                placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                transition-colors"
            />
          </div>
        ))}
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
          {loading ? 'Sending code…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <button type="button" onClick={onSwitch} className="text-accent font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </form>

      {/* Verification OTP Modal */}
      {pendingVerifyEmail && (
        <VerifyOtpModal
          email={pendingVerifyEmail}
          onCancel={() => setPendingVerifyEmail('')}
        />
      )}
    </>
  );
}
