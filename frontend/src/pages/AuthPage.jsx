import React, { useState } from 'react';
import { request } from '../services/api';
import { useAuthStore } from '../store/authStore';

const titles = {
  login: 'Sign in', register: 'Create an account', verify: 'Verify your email',
  forgot: 'Forgot your password?', reset: 'Reset your password',
};
const actions = { login: 'Sign in', register: 'Create account', verify: 'Verify email', forgot: 'Send reset code', reset: 'Save password' };

export default function AuthPage() {
  const [page, setPage] = useState('login');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const needsCode = page === 'verify' || page === 'reset';

  function changePage(next) {
    setPage(next);
    setFeedback('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const paths = { login: 'login', register: 'register', verify: 'verify-email', forgot: 'forgot-password', reset: 'reset-password' };
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const result = await request('/auth/' + paths[page], { body: { ...values, email: email.trim() } });
      if (result.token) setAuth(result.user, result.token);
      else if (page === 'register') changePage('verify');
      else if (page === 'forgot') changePage('reset');
      else if (page === 'reset') {
        changePage('login');
        setFeedback('Password saved. Sign in with your new password.');
      }
    } catch (err) {
      if (err.data?.requiresVerification) changePage('verify');
      else setError(err.message);
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await request('/auth/resend-otp', { body: { email, type: 'VERIFY_EMAIL' } });
      setFeedback('A new code was sent.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <main className="auth-wrap"><section className="auth-card">
    <h1>{titles[page]}</h1>
    <p className="intro">{needsCode ? 'Enter the six-digit code sent to ' + email + '.' :
      page === 'forgot' ? 'Enter the email address you use for Smalltalk.' :
      page === 'register' ? 'Choose a username so friends can find you.' : 'Sign in to your conversations.'}</p>
    <form key={page} onSubmit={submit}>
      <fieldset disabled={busy}>
        {page === 'register' && <label>Username<input name="username" autoComplete="username" required
          pattern="[a-zA-Z0-9_\-]{3,30}" title="3 to 30 letters, numbers, hyphens, or underscores" /></label>}
        {!needsCode && <label>Email<input type="email" autoComplete="email" value={email}
          onChange={event => setEmail(event.target.value)} required /></label>}
        {needsCode && <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>}
        {['login', 'register', 'reset'].includes(page) && <label>{page === 'reset' ? 'New password' : 'Password'}
          <input type="password" name={page === 'reset' ? 'newPassword' : 'password'}
            autoComplete={page === 'login' ? 'current-password' : 'new-password'} required minLength={page === 'login' ? 1 : 8} />
          {page !== 'login' && <small>At least 8 characters with a number or uppercase letter.</small>}
        </label>}
        {page === 'login' && <button type="button" className="link forgot" onClick={() => changePage('forgot')}>Forgot password?</button>}
        {error && <p role="alert" className="error">{error}</p>}
        {feedback && <p role="status">{feedback}</p>}
        <button className="primary submit">{busy ? 'Please wait…' : actions[page]}</button>
      </fieldset>
    </form>
    <div className="auth-links">
      {page === 'verify' && <button className="link" disabled={busy} onClick={resend}>Send another code</button>}
      {page === 'login' ? <>New to Smalltalk? <button className="link" disabled={busy} onClick={() => changePage('register')}>Create an account</button></> :
        <button className="link" disabled={busy} onClick={() => changePage('login')}>Back to sign in</button>}
    </div>
  </section></main>;
}
