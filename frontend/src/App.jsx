import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/chat" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-full">
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
