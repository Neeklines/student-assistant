import { Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AgentChat from './components/chat/AgentChat';

import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Routes>

      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<AgentChat />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;