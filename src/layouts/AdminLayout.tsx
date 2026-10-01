import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Activity,
  MessageSquare,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Barra de Navegación de Administrador (Diseño Claro y Luminoso) */}
      <header className="bg-white text-slate-800 shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo y Distintivo Admin */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">Consola de Administración</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Superusuario
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Supervisión Global y Mesa de Ayuda
              </p>
            </div>
          </div>

          {/* Enlaces de Navegación */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              <span>KPIs y Métricas</span>
            </NavLink>

            <NavLink
              to="/admin/audit"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`
              }
            >
              <Users className="w-4 h-4" />
              <span>Usuarios y Auditoría</span>
            </NavLink>

            <NavLink
              to="/admin/support"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`
              }
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mesa de Ayuda</span>
            </NavLink>
          </nav>

          {/* Acciones y Retorno a Presupuesto */}
          <div className="flex items-center space-x-3">

            <button
              onClick={() => navigate('/app/budget')}
              className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              title="Ver la vista de cliente"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vista Cliente</span>
            </button>

            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-slate-900 block">{user?.fullName || 'Administrador'}</span>
              <span className="text-[10px] text-slate-500 block">{user?.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal de Admin */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
