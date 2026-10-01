import React, { useState } from 'react';
import {
  Target,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { Category, Currency, TargetType } from '../types';
import { calculateTargetProgress } from '../engine/budgetEngine';

interface CategoryInspectorProps {
  category: Category;
  onClose: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

export const CategoryInspector: React.FC<CategoryInspectorProps> = ({
  category,
  onClose,
  onEditCategory,
  onDeleteCategory,
}) => {
  const {
    currentMonth,
    categoryBalances,
    targets,
    saveTarget,
    deleteTarget,
    autoAssignTarget,
  } = useBudget();

  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const target = targets.find((t) => t.categoryId === category.id);
  const balance = categoryBalances[category.id] || {
    assignedCents: 0,
    activityCents: 0,
    availableCents: 0,
    isOverspent: false,
  };

  const progress = calculateTargetProgress(target, balance);

  // Estados del formulario de edición de meta
  const [targetAmountInput, setTargetAmountInput] = useState(
    target ? String(Currency.fromCents(target.targetAmountCents)) : '100'
  );
  const [targetTypeInput, setTargetTypeInput] = useState<TargetType>(
    target?.targetType || 'MONTHLY_NEEDED'
  );
  const [dueDayInput, setDueDayInput] = useState<number>(target?.dueDayOfMonth || 31);

  const handleSaveTargetForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amountFloat = parseFloat(targetAmountInput) || 0;
    if (amountFloat <= 0) return;

    saveTarget({
      id: target?.id,
      categoryId: category.id,
      targetAmountCents: Currency.toCents(amountFloat),
      targetType: targetTypeInput,
      dueDayOfMonth: dueDayInput,
    });
    setIsEditingTarget(false);
  };

  const handleDeleteTargetClick = () => {
    if (target) {
      deleteTarget(category.id);
      setIsEditingTarget(false);
    }
  };

  // Cálculo SVG del anillo radial
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress.percentage) / 100;

  return (
    <div className="w-80 lg:w-96 bg-white border-l border-slate-200 p-5 flex flex-col h-full overflow-y-auto space-y-6">
      {/* 1. Cabecera del Inspector: Nombre y Acciones Rápidas */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-xl font-black text-slate-900 tracking-tight truncate pr-2" title={category.name}>
          {category.name}
        </h3>
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() => onEditCategory(category)}
            title="Editar nombre o grupo de categoría"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteCategory(category)}
            title="Eliminar categoría"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar panel de detalles"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sección Principal: Meta de Ahorro / Target */}
      <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Meta de Ahorro
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {target ? (
          <>
            {/* Descripción pedagógica de la meta */}
            <div>
              <p className="text-sm font-bold text-slate-800">
                Apartar {Currency.format(target.targetAmountCents)} cada mes
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {target.dueDayOfMonth
                  ? `Antes del día ${target.dueDayOfMonth} del mes`
                  : 'Antes de fin de mes'}
              </p>
            </div>

            {/* Medidor Radial (Anillo de Progreso) */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
                  {/* Círculo de fondo */}
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    className="stroke-slate-200 fill-none"
                    strokeWidth="7"
                  />
                  {/* Círculo de progreso dinámico */}
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    className={`transition-all duration-500 ease-out fill-none ${
                      progress.status === 'FUNDED'
                        ? 'stroke-emerald-500'
                        : progress.status === 'OVERSPENT'
                        ? 'stroke-red-500'
                        : 'stroke-amber-400'
                    }`}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900 tracking-tight">
                    {progress.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Acción Rápida (Fiel a Screenshot 5: Botón Amarillo Pastel) */}
            {progress.status === 'UNDERFUNDED' && (
              <button
                type="button"
                onClick={() => autoAssignTarget(category.id, currentMonth)}
                className="w-full py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5"
              >
                <span>Asignar {Currency.format(progress.neededCents)} para cumplir tu meta</span>
              </button>
            )}

            {progress.status === 'FUNDED' && (
              <div className="w-full py-2.5 px-4 bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Meta mensual cumplida al 100%</span>
              </div>
            )}

            {progress.status === 'OVERSPENT' && (
              <div className="w-full py-2.5 px-4 bg-red-100/80 text-red-800 border border-red-300 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 shadow-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Sobregasto: reasigna dinero a este sobre</span>
              </div>
            )}

            {/* Desglose de Números */}
            <div className="space-y-2 text-xs pt-3 border-t border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Monto a asignar este mes</span>
                <span className="font-mono font-bold text-slate-800">
                  {Currency.format(progress.targetAmountCents)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Asignado hasta ahora</span>
                <span className="font-mono font-bold text-slate-800">
                  {Currency.format(progress.assignedCents)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200/80">
                <span>Faltante</span>
                <span className="font-mono font-bold text-slate-900">
                  {Currency.format(progress.neededCents)}
                </span>
              </div>
            </div>

            {/* Botón Editar Meta */}
            <button
              type="button"
              onClick={() => setIsEditingTarget(!isEditingTarget)}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-xs"
            >
              {isEditingTarget ? 'Ocultar Edición' : 'Editar Meta'}
            </button>
          </>
        ) : (
          /* Estado sin meta definida */
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-500">
              Esta categoría no tiene una meta de ahorro mensual establecida.
            </p>
            <button
              type="button"
              onClick={() => setIsEditingTarget(true)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              + Crear Meta para esta Categoría
            </button>
          </div>
        )}

        {/* 3. Formulario Inline para Crear o Modificar Meta */}
        {isEditingTarget && (
          <form
            onSubmit={handleSaveTargetForm}
            className="pt-4 border-t border-slate-200 space-y-3 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Monto Mensual de la Meta ($):
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={targetAmountInput}
                  onChange={(e) => setTargetAmountInput(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Meta:</label>
              <select
                value={targetTypeInput}
                onChange={(e) => setTargetTypeInput(e.target.value as TargetType)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="MONTHLY_NEEDED">Apartar cada mes (Needed for Spending)</option>
                <option value="TARGET_BALANCE">Alcanzar saldo objetivo (Target Balance)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Día Límite del Mes (1 al 31):
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDayInput}
                  onChange={(e) => setDueDayInput(parseInt(e.target.value) || 31)}
                  className="pl-8 pr-3 py-1.5 w-full border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors"
              >
                Guardar Meta
              </button>
              {target && (
                <button
                  type="button"
                  onClick={handleDeleteTargetClick}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 4. Tarjeta Pedagógica de Información YNAB */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 space-y-2">
        <div className="flex items-center space-x-1.5 font-bold">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Regla 1: Asignar un trabajo a cada dólar</span>
        </div>
        <p className="text-[11px] text-blue-800/90 leading-relaxed">
          Las metas te orientan sobre cuánto dinero debes asignar cada mes a cada sobre para
          no tener imprevistos al llegar las facturas.
        </p>
      </div>
    </div>
  );
};
