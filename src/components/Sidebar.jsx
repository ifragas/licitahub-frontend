import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Building2, FileText, Users, BarChart3, LogOut } from 'lucide-react';

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="w-20 hover:w-64 bg-slate-900 border-r border-slate-800 flex flex-col items-start py-6 fixed inset-y-0 left-0 z-40 justify-between shadow-xl transition-all duration-300 ease-in-out group overflow-hidden print:hidden">
      <div className="flex flex-col space-y-6 w-full">
        {/* Logótipo / Cabeçalho */}
        <div className="flex items-center gap-3 px-5 w-full">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
            <Building2 size={24} />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h2 className="font-bold text-white text-base leading-tight">LicitaHub</h2>
            <p className="text-xs text-slate-400">Gestão e Controle</p>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex flex-col space-y-2 w-full px-3">
          {/* NOVO ITEM: Licitações / Home */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Licitações"
          >
            <div className="shrink-0 flex items-center justify-center">
              <Home size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Licitações
            </span>
          </NavLink>

          <NavLink
            to="/schedules"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Agendamentos"
          >
            <div className="shrink-0 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Agendamentos
            </span>
          </NavLink>

          <NavLink
            to="/companies"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Empresas"
          >
            <div className="shrink-0 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Empresas
            </span>
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Documentos"
          >
            <div className="shrink-0 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Documentos
            </span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Utilizadores"
          >
            <div className="shrink-0 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Utilizadores
            </span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-xl transition-all w-full ${
                isActive 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title="Relatórios"
          >
            <div className="shrink-0 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm">
              Relatórios
            </span>
          </NavLink>
        </nav>
      </div>

      {/* Botão de Terminar Sessão */}
      <div className="w-full px-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full p-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all cursor-pointer"
          title="Terminar Sessão"
        >
          <div className="shrink-0 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
            Terminar Sessão
          </span>
        </button>
      </div>
    </aside>
  );
}