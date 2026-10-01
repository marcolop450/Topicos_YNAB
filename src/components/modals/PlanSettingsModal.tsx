import React, { useState } from 'react';
import { X, Settings, Check, DollarSign, Calendar, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBudget } from '../../context/BudgetContext';

interface PlanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanSettingsModal: React.FC<PlanSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { resetToSampleData } = useBudget();
  const [budgetTitle, setBudgetTitle] = useState(user?.planName || 'Plan Personal Gratuito');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'monday' | 'sunday'>('monday');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      user.planName = budgetTitle.trim() || 'Plan Personal Gratuito';
      localStorage.setItem('ynab_current_user_session_v2', JSON.stringify(user));
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900">Ajustes del Plan y Presupuesto</h3>
              <p className="text-xs text-slate-500">Configuración general de tu cuenta de presupuesto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de tu Presupuesto
            </label>
            <input
              type="text"
              value={budgetTitle}
              onChange={(e) => setBudgetTitle(e.target.value)}
              placeholder="Mi Presupuesto Familiar"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Símbolo de Moneda
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="$">$ (Dólar / Peso)</option>
                <option value="€">€ (Euro)</option>
                <option value="S/">S/ (Sol Peruano)</option>
                <option value="R$">R$ (Real Brasileño)</option>
                <option value="£">£ (Libra Esterlina)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Primer día de la semana
              </label>
              <select
                value={firstDayOfWeek}
                onChange={(e) => setFirstDayOfWeek(e.target.value as 'monday' | 'sunday')}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="monday">Lunes</option>
                <option value="sunday">Domingo</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between">
            <span className="font-medium">Plan Personal Gratuito y Vitalicio</span>
            <span className="font-bold text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Activo
            </span>
          </div>

          {/* Zona de Mantenimiento de Datos */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Restablecer Presupuesto a Cero</span>
              <span className="text-slate-500 text-[11px]">Limpia todas las cuentas y sobres a un estado vacío.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                resetToSampleData();
                setResetSuccess(true);
                setTimeout(() => setResetSuccess(false), 2000);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetSuccess ? '¡Limpio!' : 'Limpiar Todo'}</span>
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
