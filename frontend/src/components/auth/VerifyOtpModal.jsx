import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';

export default function VerifyOtpModal({ email, initialCode = '', onCancel, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // 45s countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authApi.verifyEmail(email, cleanOtp);
      setAuth(data.user, data.token);
      onSuccess?.(data.user);
      navigate('/chat');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired verification code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');
    setResendSuccess('');

    try {
      const res = await authApi.resendOtp(email, 'VERIFY_EMAIL');
      if (res.previewCode) setDemoCode(res.previewCode);
      setResendSuccess('A new verification code has been sent!');
      setCountdown(45);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resend code. Please try again.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-line rounded-2xl w-full max-w-md p-6 flex flex-col shadow-2xl relative">
        {/* Close Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-muted hover:text-[#ededed] p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-center text-[#ededed] mb-1">
          Verify Your Email
        </h2>
        <p className="text-sm text-center text-muted mb-6">
          We sent a 6-digit verification code to <br />
          <span className="font-semibold text-[#ededed]">{email}</span>
        </p>

        {demoCode && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-xl text-center">
            <span className="text-xs text-emerald-200/80 block mb-1">Verification code:</span>
            <span className="font-mono text-xl tracking-[6px] text-emerald-400 font-extrabold">{demoCode}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs">
            {resendSuccess}
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="otp-input" className="text-xs font-semibold text-muted uppercase tracking-wider text-center">
              6-Digit Verification Code
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="text-center font-mono text-2xl tracking-[10px] bg-[#121212] border border-line rounded-xl py-3 px-4 text-[#ededed] placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-accent text-accent-text font-bold py-3 px-4 rounded-xl hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-accent-text border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-xs text-muted">
          <span>Didn't receive the email?</span>
          <button
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="text-accent font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {countdown > 0 ? `Resend code (${countdown}s)` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
