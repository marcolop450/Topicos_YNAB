import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  CheckCircle2,
  History,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { Currency, READY_TO_ASSIGN_CATEGORY_ID } from '../types';

export function BankSimulatorPage() {
  const { accounts, categories, addTransaction, readyToAssignCents, accountBalances } = useBudget();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [salaryAmount, setSalaryAmount] = useState('2500');
  const [expenseAmount, setExpenseAmount] = useState('65.50');
  const [merchantName, setMerchantName] = useState('Supermercado Central');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [logs, setLogs] = useState<Array<{ id: string; text: string; time: string; type: 'INFLOW' | 'OUTFLOW' }>>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const primaryAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleSimulateSalary = () => {
    if (!primaryAccount) return;
    const cents = Currency.toCents(parseFloat(salaryAmount) || 0);
    if (cents <= 0) return;

    addTransaction({
      accountId: primaryAccount.id,
      date: new Date().toISOString().split('T')[0],
      amountCents: cents,
      payeeId: 'payee-empresa',
      categoryId: READY_TO_ASSIGN_CATEGORY_ID, // Entrada a Ready to Assign
      type: 'STANDARD',
      memo: 'Simulación: Depósito de nómina / sueldo mensual',
    });

    const newLog = {
      id: `sim-${Date.now()}`,
      text: `Nómina depositada: +${Currency.format(cents)} en ${primaryAccount.name} → Inyectado en Ready to Assign`,
      time: new Date().toLocaleTimeString(),
      type: 'INFLOW' as const,
    };
    setLogs((prev) => [newLog, ...prev]);
    setSuccessNotice(`¡Sueldo de ${Currency.format(cents)} depositado con éxito! Se añadió a Listo para Asignar.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleSimulateExpense = () => {
    if (!primaryAccount) return;
    const cents = Currency.toCents(parseFloat(expenseAmount) || 0);
    if (cents <= 0) return;

    const cat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

    addTransaction({
      accountId: primaryAccount.id,
      date: new Date().toISOString().split('T')[0],
      amountCents: -cents, // Salida
      payeeId: `payee-${Date.now()}`,
      categoryId: cat?.id || null,
      type: 'STANDARD',
      memo: `Simulación: Pago en ${merchantName}`,
    });

    const newLog = {
      id: `sim-${Date.now()}`,
      text: `Gasto automático: -${Currency.format(cents)} en "${merchantName}" (Categoría: ${cat?.name || 'Sin Categoría'})`,
      time: new Date().toLocaleTimeString(),
      type: 'OUTFLOW' as const,
    };
    setLogs((prev) => [newLog, ...prev]);
    setSuccessNotice(`¡Gasto de ${Currency.format(cents)} registrado en "${cat?.name || 'Categoría'}"!`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Simulador Bancario ("Dinero en la Mesa")
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
              Sandbox Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Simula la inyección real de fondos y gastos automáticos con streaming de eventos contables
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Listo para Asignar actual:</span>
            <span className={`font-mono font-bold text-sm ${readyToAssignCents >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Currency.format(readyToAssignCents)}
            </span>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">No tienes cuentas financieras registradas.</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Para inyectar depósitos de nómina o simular gastos con la terminal bancaria, primero debes crear al menos una cuenta.
              </p>
            </div>
          </div>
          <Link
            to="/app/accounts"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors shrink-0 text-center"
          >
            Crear Cuenta Ahora
          </Link>
        </div>
      )}

      {/* Selector de Cuenta Activa de Simulación */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Seleccionar Cuenta Bancaria Virtual de Destino
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accounts.length === 0 ? (
            <p className="col-span-3 text-xs text-slate-400 py-3 text-center">
              Sin cuentas disponibles para operar el simulador.
            </p>
          ) : (
            accounts.map((acc) => {
            const isSelected = (selectedAccountId || accounts[0]?.id) === acc.id;
            const bal = accountBalances[acc.id] ?? acc.initialBalanceCents;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccountId(acc.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{acc.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{acc.type}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {Currency.format(bal)}
                </span>
              </button>
            );
          }))}
        </div>
      </div>

      {/* Disparadores de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disparador 1: Depósito de Nómina / Sueldo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Simular Depósito de Sueldo / Nómina</h3>
              <p className="text-xs text-slate-500">Inyecta dinero en la mesa ("Listo para Asignar")</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Monto del Depósito ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateSalary}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ejecutar Depósito Inmediato</span>
            </button>
          </div>
        </div>

        {/* Disparador 2: Gasto en Comercio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Simular Gasto en Comercio</h3>
              <p className="text-xs text-slate-500">Genera una transacción de salida y descuenta del sobre</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Comercio / Beneficiario
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="px-3 py-2 w-full text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Monto ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Categoría / Sobre de Impacto
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3 py-2 w-full text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSimulateExpense}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Simular Pago con Tarjeta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Consola de Streaming de Eventos (Diseño Claro) */}
      <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-emerald-800">
              Registro de Streaming de Eventos Bancarios
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {logs.length} eventos simulados en esta sesión
          </span>
        </div>

        <div className="mt-3 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-slate-400 italic py-3 text-center">
              No se han emitido transacciones aún. Presiona los botones superiores para simular movimientos bancarios.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-400 text-[10px] whitespace-nowrap">{log.time}</span>
                <span className={log.type === 'INFLOW' ? 'text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]' : 'text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]'}>
                  [{log.type}]
                </span>
                <span className="text-slate-700">{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
