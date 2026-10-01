import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Wallet,
  PieChart,
  Plus,
  RotateCcw,
  Download,
  Upload,
  Layers,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { TransactionModal } from '../components/TransactionModal';
import { UserPlanDropdown } from '../components/UserPlanDropdown';
import { SupportWidget } from '../components/SupportWidget';
import { Transaction, Currency } from '../types';

export function AppLayout() {
  const {
    readyToAssignCents,
    accountBalances,
    resetToSampleData,
    exportDataJson,
    importDataJson,
  } = useBudget();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalCashInAccounts = Object.values(accountBalances).reduce((a, b) => a + b, 0);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const [importStatus, setImportStatus] = useState<{
    title: string;
    message: string;
    isError?: boolean;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ynab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = importDataJson(content);
          if (success) {
            setImportStatus({
              title: 'Datos Importados',
              message: 'Se han cargado correctamente todas las cuentas, categorías y asignaciones del archivo seleccionado.',
              isError: false,
            });
          } else {
            setImportStatus({
              title: 'Error de Importación',
              message: 'El archivo seleccionado no contiene un formato JSON válido de presupuesto.',
              isError: true,
            });
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      {/* 1. Barra Superior Principal (Estilo YNAB) */}
      <header className="bg-ynab-blue text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo y Menú de Plan */}
          <div className="flex items-center space-x-3">
            <div
              onClick={() => navigate('/app/budget')}
              className="cursor-pointer w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-xl text-emerald-300 tracking-wider shadow-inner hover:bg-white/20 transition-colors"
            >
              Y
            </div>
            
            {/* Dropdown del Plan del Usuario (Fiel a Screenshot 3) */}
            <UserPlanDropdown />
          </div>

          {/* Navegación por Rutas */}
          <nav className="hidden md:flex items-center p-1 bg-black/20 rounded-xl">
            <NavLink
              to="/app/budget"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-ynab-blue shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`
              }
            >
              <PieChart className="w-4 h-4" />
              <span>Presupuesto</span>
            </NavLink>

            <NavLink
              to="/app/accounts"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-ynab-blue shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`
              }
            >
              <Wallet className="w-4 h-4" />
              <span>Cuentas</span>
            </NavLink>

            <NavLink
              to="/app/bank-simulator"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-ynab-blue shadow-sm'
                    : 'text-emerald-300 hover:text-white'
                }`
              }
            >
              <Building2 className="w-4 h-4" />
              <span>Simulador Banco</span>
            </NavLink>

            {/* Navegación Principal YNAB */}
          </nav>

          {/* Acciones Rápidas */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenNewTransaction}
              className="inline-flex items-center px-3 sm:px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Nueva Transacción</span>
              <span className="sm:hidden">Añadir</span>
            </button>

            {/* Menú de Opciones / Respaldo */}
            <div className="flex items-center space-x-1 border-l border-white/20 pl-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Limpiar datos y restablecer a cero"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                title="Exportar datos en JSON"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleImport}
                title="Importar datos desde JSON"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navegación móvil inferior */}
        <div className="md:hidden flex items-center justify-around border-t border-blue-900/60 bg-blue-950/40 px-2 py-1.5">
          <NavLink
            to="/app/budget"
            className={({ isActive }) =>
              `text-xs font-bold px-3 py-1 rounded-md ${
                isActive ? 'bg-white/20 text-white' : 'text-blue-200'
              }`
            }
          >
            Presupuesto
          </NavLink>
          <NavLink
            to="/app/accounts"
            className={({ isActive }) =>
              `text-xs font-bold px-3 py-1 rounded-md ${
                isActive ? 'bg-white/20 text-white' : 'text-blue-200'
              }`
            }
          >
            Cuentas
          </NavLink>
          <NavLink
            to="/app/bank-simulator"
            className={({ isActive }) =>
              `text-xs font-bold px-3 py-1 rounded-md ${
                isActive ? 'bg-white/20 text-white' : 'text-emerald-300'
              }`
            }
          >
            Simulador
          </NavLink>
        </div>
      </header>

      {/* 2. Sub-Barra Informativa Rápida */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Total en Cuentas:</span>
              <span className="font-mono font-bold text-slate-900">
                {Currency.format(totalCashInAccounts)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Listo para Asignar:</span>
              <span
                className={`font-mono font-bold ${
                  readyToAssignCents >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {Currency.format(readyToAssignCents)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-500">
            <span className="inline-flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Regla #1: Dale a cada dólar un trabajo
            </span>
          </div>
        </div>
      </section>

      {/* 3. Contenedor de la Vista Activa por Ruta */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet context={{ onOpenNewTransaction: handleOpenNewTransaction }} />
      </main>

      {/* 4. Modal Global de Transacción */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTransaction={editingTransaction}
      />

      {/* 5. Modal de Estado de Importación */}
      {importStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                importStatus.isError
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {importStatus.isError ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900">
                {importStatus.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {importStatus.message}
              </p>
            </div>
            <button
              onClick={() => setImportStatus(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmación de Reinicio a Cero */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-slate-900">
                  ¿Restablecer Presupuesto a Cero?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción reiniciará todas las cuentas y categorías a un estado totalmente vacío.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Se eliminarán las transacciones, cuentas y sobres activos almacenados en este navegador, dejando el presupuesto completamente limpio.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                  setImportStatus({
                    title: 'Presupuesto Limpio',
                    message: 'Se han eliminado todas las cuentas y categorías. El sistema está 100% en cero.',
                    isError: false,
                  });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Sí, Limpiar a Cero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Widget Flotante de Soporte (Fiel a Screenshot 4) */}
      <SupportWidget />
    </div>
  );
}
