import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Settings,
  Users,
  Tag,
  Building2,
  Keyboard,
  LogOut,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PlanSettingsModal } from './modals/PlanSettingsModal';
import { PayeesModal } from './modals/PayeesModal';
import { FlagsModal } from './modals/FlagsModal';
import { KeyboardShortcutsModal } from './modals/KeyboardShortcutsModal';

export function UserPlanDropdown() {
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Estados para los modales funcionales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPayeesOpen, setIsPayeesOpen] = useState(false);
  const [isFlagsOpen, setIsFlagsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleNavigateBankSimulator = () => {
    setIsOpen(false);
    navigate('/app/bank-simulator');
  };

  const handleNavigateAdmin = () => {
    setIsOpen(false);
    navigate('/admin');
  };

  if (!user) return null;

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Botón Disparador del Plan */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm border border-white/20"
        >
          <span className="font-bold truncate max-w-[150px]">{user.planName}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Menú Flotante */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 py-2 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
            {/* Cabecera del Usuario */}
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user.fullName || user.planName}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>

              {/* Píldora de Estado */}
              <div className="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-full justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>{role === 'admin' ? 'Administrador del Sistema' : 'Cuenta Gratuita Ilimitada'}</span>
              </div>
            </div>

            {/* Opciones Principales con Modales Reales (CERO alerts) */}
            <div className="py-1 text-xs text-slate-700 font-medium">
              {role === 'admin' && (
                <button
                  onClick={handleNavigateAdmin}
                  className="w-full flex items-center px-4 py-2 hover:bg-indigo-50 text-left transition-colors text-indigo-700 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 mr-2.5 text-indigo-600" />
                  Ir a la Consola de Administración
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-slate-50 text-left transition-colors"
              >
                <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                Ajustes del Plan
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPayeesOpen(true);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-slate-50 text-left transition-colors"
              >
                <Users className="w-4 h-4 mr-2.5 text-slate-400" />
                Gestionar Beneficiarios
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsFlagsOpen(true);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-slate-50 text-left transition-colors"
              >
                <Tag className="w-4 h-4 mr-2.5 text-slate-400" />
                Editar Banderas y Etiquetas
              </button>

              <button
                onClick={handleNavigateBankSimulator}
                className="w-full flex items-center px-4 py-2 hover:bg-slate-50 text-left transition-colors text-blue-700 font-semibold"
              >
                <Building2 className="w-4 h-4 mr-2.5 text-blue-600" />
                Conexiones Bancarias (Simulador)
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsShortcutsOpen(true);
                }}
                className="w-full flex items-center px-4 py-2 hover:bg-slate-50 text-left transition-colors"
              >
                <Keyboard className="w-4 h-4 mr-2.5 text-slate-400" />
                Atajos de Teclado
              </button>
            </div>

            {/* Cierre de Sesión */}
            <div className="py-1 text-xs font-semibold">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 text-left transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales Reales y Funcionales */}
      <PlanSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <PayeesModal isOpen={isPayeesOpen} onClose={() => setIsPayeesOpen(false)} />
      <FlagsModal isOpen={isFlagsOpen} onClose={() => setIsFlagsOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </>
  );
}
