import { useState, useEffect } from 'react';
import { authApi } from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordModal({ initialEmail = '', onClose, onLoginSwitch }) {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter otp & new pass, 3 = success
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(cleanEmail);
      setStep(2);
      setCountdown(45);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
      setError('Password must contain at least one uppercase letter or number.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(email.trim().toLowerCase(), cleanOtp, password);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code in Step 2
  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    try {
      await authApi.resendOtp(email.trim().toLowerCase(), 'RESET_PASSWORD');
      setCountdown(45);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-panel border border-line rounded-2xl w-full max-w-md p-6 flex flex-col shadow-2xl relative animate-pop-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text p-1.5 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-center text-text mb-1">
              Reset Your Password
            </h2>
            <p className="text-sm text-center text-muted mb-6">
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="w-full bg-bg border border-line rounded-xl px-4 py-3 text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-accent text-on-accent font-bold py-3 px-4 rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 mt-2 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-center text-[#ededed] mb-1">
              Create New Password
            </h2>
            <p className="text-sm text-center text-muted mb-6">
              Enter the 6-digit code sent to <span className="text-[#ededed] font-semibold">{email}</span> and your new password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider text-center">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="••••••"
                  className="text-center font-mono text-2xl tracking-[8px] bg-bg border border-line rounded-xl py-2.5 px-4 text-text placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min 8 chars, 1 uppercase/number"
                  className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !password}
                className="w-full bg-accent text-on-accent font-bold py-3 px-4 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 mt-1 flex items-center justify-center gap-2"
              >
                {loading ? 'Updating password...' : 'Reset Password'}
              </button>

              <div className="text-center text-xs text-muted mt-2">
                <span>Didn't get code? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="text-accent font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#ededed] mb-2">Password Reset Complete!</h2>
            <p className="text-sm text-muted mb-6">
              Your password has been securely updated. You can now log in with your new credentials.
            </p>
            <button
              onClick={() => {
                onClose();
                onLoginSwitch?.();
              }}
              className="w-full bg-accent text-accent-text font-bold py-3 px-4 rounded-xl hover:bg-accent-hover active:scale-95 transition-all"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
