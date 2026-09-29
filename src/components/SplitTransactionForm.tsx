import React from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Category, CategoryGroup, TransactionSplit, Currency } from '../types';
import { CategorySelect } from './CategorySelect';
import { AmountCalculatorInput } from './AmountCalculatorInput';
import { validateSplitTransaction } from '../engine/budgetEngine';

interface SplitTransactionFormProps {
  totalAmountCents: number;
  splits: TransactionSplit[];
  onChangeSplits: (splits: TransactionSplit[]) => void;
  categories: Category[];
  groups: CategoryGroup[];
  onCreateCategory: (name: string, groupId: string) => Category;
  onCreateGroup: (name: string) => CategoryGroup;
  isExpense?: boolean;
}

export const SplitTransactionForm: React.FC<SplitTransactionFormProps> = ({
  totalAmountCents,
  splits,
  onChangeSplits,
  categories,
  groups,
  onCreateCategory,
  onCreateGroup,
  isExpense = true,
}) => {
  const { isValid, assignedCents, remainingCents } = validateSplitTransaction(
    totalAmountCents,
    splits
  );

  const handleAddSplit = () => {
    // Característica UX estrella de YNAB: Auto-completar el split con el remanente exacto
    const defaultAmountCents = remainingCents !== 0 ? remainingCents : 0;

    // Buscar una categoría que no esté ya seleccionada en las líneas actuales para evitar duplicados por defecto
    const unusedCategory = categories.find((c) => !splits.some((s) => s.categoryId === c.id));
    const defaultCatId = unusedCategory ? unusedCategory.id : (categories[1]?.id || categories[0]?.id || '');

    const newSplit: TransactionSplit = {
      id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      categoryId: defaultCatId,
      amountCents: defaultAmountCents,
      memo: '',
    };
    onChangeSplits([...splits, newSplit]);
  };

  const handleAutoFillRemaining = (targetIndex?: number) => {
    if (remainingCents === 0) return;
    const idx = targetIndex !== undefined ? targetIndex : splits.length - 1;
    if (idx >= 0 && idx < splits.length) {
      const currentAmount = splits[idx].amountCents || 0;
      handleUpdateSplit(idx, { amountCents: currentAmount + remainingCents });
    }
  };

  const handleUpdateSplit = (index: number, updated: Partial<TransactionSplit>) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], ...updated };
    onChangeSplits(newSplits);
  };

  const handleRemoveSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    onChangeSplits(newSplits);
  };

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
          Desglose de Categorías (Split Transaction)
        </h4>
        <button
          type="button"
          onClick={handleAddSplit}
          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Agregar Línea
        </button>
      </div>

      {/* Lista de Líneas de Split */}
      <div className="space-y-2.5">
        {splits.map((split, index) => (
          <div
            key={split.id}
            style={{ zIndex: splits.length - index + 1 }}
            className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs"
          >
            <div className="flex-1 min-w-[180px]">
              <CategorySelect
                categories={categories}
                groups={groups}
                selectedCategoryId={split.categoryId}
                onSelectCategory={(catId) =>
                  handleUpdateSplit(index, { categoryId: catId || '' })
                }
                onCreateCategory={onCreateCategory}
                onCreateGroup={onCreateGroup}
              />
            </div>

            <div className="w-full sm:w-36">
              <AmountCalculatorInput
                valueCents={split.amountCents}
                onChangeCents={(cents) => handleUpdateSplit(index, { amountCents: cents })}
                isExpense={isExpense}
                placeholder="0.00"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <input
                type="text"
                placeholder="Nota / Memo opcional"
                value={split.memo || ''}
                onChange={(e) => handleUpdateSplit(index, { memo: e.target.value })}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            {splits.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveSplit(index)}
                title="Eliminar línea de split"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Barra de Balance y Validación en Tiempo Real */}
      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-slate-500">Monto Total: </span>
            <span className="font-mono font-bold text-slate-800">
              {Currency.format(Math.abs(totalAmountCents))}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Asignado: </span>
            <span className="font-mono font-bold text-slate-800">
              {Currency.format(Math.abs(assignedCents))}
            </span>
          </div>
        </div>

        {/* Indicador de Restante */}
        <div className="flex items-center">
          {isValid ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Completamente Balanceado ($0.00 restante)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleAutoFillRemaining()}
              title="Haz clic para auto-completar el restante en la última línea"
              className="inline-flex items-center px-2.5 py-1 rounded-full font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Restante por asignar: {Currency.format(Math.abs(remainingCents))}
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                Auto-completar
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
