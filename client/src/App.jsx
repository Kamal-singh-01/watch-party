import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Room from './pages/Room.jsx';

// Redirects to /login if not signed in, and remembers where the user wanted to go
// (so a shared room link works after logging in).
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/room/:code" element={<ProtectedRoute><Room /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
