import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { request } from './services/api';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import AppName from './components/AppName';

export default function App() {
  const { user, token, logout } = useAuthStore();
  const signedIn = Boolean(user && token);
  useEffect(() => { request('/health').catch(() => {}); }, []);

  return <BrowserRouter>
    <header className="topbar">
      <div className="bar-inner">
        <span className="brand"><img src="/smalltalk.svg" alt="" /><AppName /></span>
        {signedIn && <div className="account"><span>@{user.username}</span>
          <button className="plain" onClick={logout}>Sign out</button></div>}
      </div>
    </header>
    <Routes>
      <Route path="/" element={signedIn ? <Navigate to="/chat" replace /> : <AuthPage />} />
      <Route path="/chat" element={signedIn ? <ChatPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>;
}
