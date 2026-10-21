import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Licitacoes from './pages/Licitacoes';
import Login from './pages/Login';
import Register from './pages/Register';
import Schedules from './pages/Schedules';
import Companies from './pages/Companies';
import Documents from './pages/Documents';
import Users from './pages/Users';
import Reports from './pages/Reports';

function LayoutContent() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {!isAuthRoute && <Sidebar />}
      <main className={`flex-1 ${!isAuthRoute ? 'pl-20' : ''} transition-all duration-300`}>
        <Routes>
          <Route path="/" element={<Licitacoes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutContent />
    </Router>
  );
}