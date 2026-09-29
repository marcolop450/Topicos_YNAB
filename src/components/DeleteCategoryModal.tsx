import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, EyeOff, X, ArrowRight, Info } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { Category } from '../types';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { categories, groups, getCategoryTransactionCount, deleteCategory, toggleHideCategory } =
    useBudget();

  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Categorías elegibles como destino (excluyendo la que se va a eliminar)
  const availableTargetCategories = categories.filter((c) => c.id !== category?.id && !c.isHidden);

  const txCount = category ? getCategoryTransactionCount(category.id) : 0;

  useEffect(() => {
    if (availableTargetCategories.length > 0) {
      setTargetCategoryId(availableTargetCategories[0].id);
    } else {
      setTargetCategoryId('');
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleConfirmDelete = () => {
    setError(null);
    if (txCount > 0 && !targetCategoryId) {
      setError('Debes seleccionar una categoría para reasignar los movimientos.');
      return;
    }

    const res = deleteCategory(category.id, txCount > 0 ? targetCategoryId : undefined);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al eliminar la categoría');
    }
  };

  const handleHideInstead = () => {
    toggleHideCategory(category.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                txCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {txCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {txCount > 0 ? 'Eliminación Segura de Categoría' : 'Confirmar Eliminación'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Categoría: "{category.name}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          {txCount > 0 ? (
            /* CASO CB-03: Tiene transacciones asociadas */
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
                <span className="font-bold block text-sm mb-1 flex items-center text-amber-800">
                  <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                  Caso Borde CB-03: Historial Contable Activo
                </span>
                Esta categoría tiene{' '}
                <strong className="font-bold underline">{txCount} transacciones / movimientos</strong>{' '}
                asociados. No es posible eliminarla directamente para evitar descuadres o transacciones
                huérfanas en tu presupuesto.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Reasignar todos los movimientos a:
                </label>
                <div className="relative">
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                  >
                    {groups.map((group) => {
                      const groupCats = availableTargetCategories.filter(
                        (c) => c.groupId === group.id
                      );
                      if (groupCats.length === 0) return null;
                      return (
                        <optgroup key={group.id} label={group.name}>
                          {groupCats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  * Todas las transacciones pasadas y asignaciones presupuestarias se transferirán
                  automáticamente a este sobre.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-2 text-blue-900">
                  <EyeOff className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs">¿Prefieres no reasignar?</span>
                    <p className="text-[11px] text-blue-700">
                      Puedes ocultarla sin alterar tu historial contable.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleHideInstead}
                  className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-lg transition-colors shadow-xs shrink-0"
                >
                  Ocultar Sobre
                </button>
              </div>
            </div>
          ) : (
            /* Sin transacciones: Borrado directo */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-slate-700">
                <Info className="w-5 h-5 text-blue-500 mr-2 shrink-0" />
                <span>
                  Esta categoría no tiene movimientos ni transacciones asociadas. Puedes eliminarla
                  de forma segura.
                </span>
              </div>
            </div>
          )}

          {/* Botones de Pie de Modal */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm inline-flex items-center"
            >
              {txCount > 0 ? (
                <>
                  <span>Reasignar y Eliminar</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              ) : (
                'Eliminar Categoría'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
