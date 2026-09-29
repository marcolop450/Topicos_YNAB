import { useState } from 'react';
import {
  Wallet,
  PieChart,
  Plus,
  RotateCcw,
  Download,
  Upload,
  Layers,
} from 'lucide-react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { BudgetView } from './components/BudgetView';
import { AccountsView } from './components/AccountsView';
import { TransactionModal } from './components/TransactionModal';
import { Transaction, Currency } from './types';

function MainLayout() {
  const {
    readyToAssignCents,
    accountBalances,
    resetToSampleData,
    exportDataJson,
    importDataJson,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'BUDGET' | 'ACCOUNTS'>('BUDGET');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalCashInAccounts = Object.values(accountBalances).reduce((a, b) => a + b, 0);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

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
            alert('¡Datos importados exitosamente!');
          } else {
            alert('Error al importar el archivo JSON.');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-xl text-emerald-300 tracking-wider shadow-inner">
              Y
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg">YNAB</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase tracking-widest hidden sm:inline-block">
                  SDD Replica
                </span>
              </div>
              <p className="text-[11px] text-blue-200 hidden sm:block">
                Presupuesto en Base Cero
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <nav className="flex items-center p-1 bg-black/20 rounded-xl">
            <button
              onClick={() => setActiveTab('BUDGET')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'BUDGET'
                  ? 'bg-white text-ynab-blue shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Presupuesto</span>
            </button>

            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-white text-ynab-blue shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Cuentas</span>
            </button>
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
                onClick={resetToSampleData}
                title="Reiniciar datos a demo inicial"
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
      </header>

      {/* 2. Sub-Barra Informativa Rápida */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Total en Cuentas:</span>
              <span className="font-mono font-bold text-slate-900">
                {Currency.format(totalCashInAccounts)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Listo para Asignar:</span>
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

      {/* 3. Contenedor de la Vista Activa */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'BUDGET' ? (
          <BudgetView />
        ) : (
          <AccountsView
            onOpenNewTransaction={handleOpenNewTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}
      </main>

      {/* 4. Modal Global de Transacción */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}

export default function App() {
  return (
    <BudgetProvider>
      <MainLayout />
    </BudgetProvider>
  );
}
