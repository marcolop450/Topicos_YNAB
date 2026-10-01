import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Wallet,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { Currency, READY_TO_ASSIGN_CATEGORY_ID } from '../types';

export function OnboardingPage() {
  const { user } = useAuth();
  const { accounts, categories, groups, addTransaction, assignBudget, currentMonth, createCategory } =
    useBudget();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'Vivienda y Alquiler',
    'Comestibles y Supermercado',
    'Fondo de Emergencia',
  ]);
  const [startingCash, setStartingCash] = useState('1500');

  // Asignaciones por cada prioridad seleccionada en centavos
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const totalStartingCents = useMemo(() => {
    return Currency.toCents(parseFloat(startingCash) || 0);
  }, [startingCash]);

  // Al pasar al paso 3, repartir equitativamente los fondos iniciales si no se han editado
  const handleGoToStep3 = () => {
    if (Object.keys(allocations).length === 0 && selectedPriorities.length > 0) {
      const share = Math.floor(totalStartingCents / selectedPriorities.length);
      const newAlloc: Record<string, number> = {};
      let remaining = totalStartingCents;

      selectedPriorities.forEach((p, idx) => {
        if (idx === selectedPriorities.length - 1) {
          newAlloc[p] = remaining;
        } else {
          newAlloc[p] = share;
          remaining -= share;
        }
      });
      setAllocations(newAlloc);
    }
    setStep(3);
  };

  const totalAllocatedCents = useMemo(() => {
    return Object.values(allocations).reduce((a, b) => a + b, 0);
  }, [allocations]);

  const remainingReadyToAssignCents = totalStartingCents - totalAllocatedCents;

  const handleAllocationChange = (priority: string, valStr: string) => {
    const cents = Currency.toCents(parseFloat(valStr) || 0);
    setAllocations((prev) => ({
      ...prev,
      [priority]: Math.max(0, cents),
    }));
  };

  const handleAutoAssignEvenly = () => {
    if (selectedPriorities.length === 0) return;
    const share = Math.floor(totalStartingCents / selectedPriorities.length);
    const newAlloc: Record<string, number> = {};
    let rem = totalStartingCents;

    selectedPriorities.forEach((p, idx) => {
      if (idx === selectedPriorities.length - 1) {
        newAlloc[p] = rem;
      } else {
        newAlloc[p] = share;
        rem -= share;
      }
    });
    setAllocations(newAlloc);
  };

  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleFinish = () => {
    // 1. Inyectar fondos iniciales como transacción en cuenta primaria
    if (totalStartingCents > 0 && accounts[0]) {
      addTransaction({
        accountId: accounts[0].id,
        date: new Date().toISOString().split('T')[0],
        amountCents: totalStartingCents,
        payeeId: 'payee-initial',
        categoryId: READY_TO_ASSIGN_CATEGORY_ID,
        type: 'STANDARD',
        memo: 'Fondos iniciales de bienvenida (Onboarding)',
      });
    }

    // 2. Para cada prioridad seleccionada, buscar o crear la categoría y asignar el monto
    const defaultGroup = groups[0];
    selectedPriorities.forEach((priorityName) => {
      let targetCat = categories.find(
        (c) => c.name.toLowerCase() === priorityName.toLowerCase()
      );
      if (!targetCat && defaultGroup) {
        targetCat = createCategory(priorityName, defaultGroup.id);
      }
      if (targetCat) {
        const assignedCents = allocations[priorityName] ?? 0;
        if (assignedCents > 0) {
          assignBudget(targetCat.id, currentMonth, assignedCents);
        }
      }
    });

    navigate('/app/budget');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        {/* Barra de Progreso de 3 Pasos */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === num
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : step > num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > num ? <Check className="w-4 h-4" /> : num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === num ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {num === 1 ? 'Prioridades' : num === 2 ? 'Fondos' : 'Asignar a Cero'}
              </span>
            </div>
          ))}
        </div>

        {/* Paso 1: Selección de Prioridades (Fiel a Screenshot 2) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 mb-2">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Paso 1 de 3: Bienvenida
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                ¡Bienvenido, {user?.fullName || 'Marco'}! ¿Listo para dominar tu dinero?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Para comenzar, selecciona qué gastos y metas financieras son indispensables para ti este mes:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Vivienda y Alquiler',
                'Comestibles y Supermercado',
                'Servicios (Luz, Agua, Gas)',
                'Fondo de Emergencia',
                'Transporte y Gasolina',
                'Salidas y Restaurantes',
                'Mascotas y Veterinaria',
                'Ahorro para Vacaciones',
              ].map((priority) => {
                const isSelected = selectedPriorities.includes(priority);
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => togglePriority(priority)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{priority}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continuar al Paso 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Paso 2: Fondos Iniciales ("Poner dinero en la mesa") */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 mb-2">
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Paso 2 de 3: Dinero en la Mesa
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                ¿Con cuánto dinero en efectivo comienzas hoy?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                En YNAB solo presupuestamos el dinero real que posees en este momento (Regla #1).
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monto Inicial en Cuenta Corriente ($)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-lg font-bold font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Este monto se acreditará automáticamente en <strong>Listo para Asignar</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleGoToStep3}
                className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <span>Continuar al Paso 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Asignar primer dólar a cero (Regla 1 en acción) */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Paso 3 de 3: Regla #1 (Dale a cada dólar un trabajo)
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Asigna tus fondos hasta llegar a cero
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Distribuye tu dinero en tus sobres elegidos. Cuando "Listo para Asignar" marque $0.00, habrás cumplido la regla dorada de YNAB.
              </p>
            </div>

            {/* Banner de Listo para Asignar */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                remainingReadyToAssignCents === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : remainingReadyToAssignCents > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                  Listo para Asignar Restante:
                </span>
                <span className="text-xl font-mono font-black">
                  {Currency.format(remainingReadyToAssignCents)}
                </span>
              </div>

              {remainingReadyToAssignCents === 0 ? (
                <span className="inline-flex items-center text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  ¡Presupuesto Perfecto!
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleAutoAssignEvenly}
                  className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl shadow-sm border border-slate-200 text-slate-700"
                >
                  Asignar Equitativo
                </button>
              )}
            </div>

            {/* Lista de Sobres a Repartir */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {selectedPriorities.map((priority) => {
                const assigned = allocations[priority] ?? 0;
                return (
                  <div
                    key={priority}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-slate-800">{priority}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={Currency.fromCents(assigned)}
                        onChange={(e) => handleAllocationChange(priority, e.target.value)}
                        className="w-24 px-2 py-1 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Finalizar y Ver Presupuesto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
