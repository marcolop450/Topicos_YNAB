import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Split, AlertCircle } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { Transaction, TransactionType, READY_TO_ASSIGN_CATEGORY_ID, Currency, TransactionSplit } from '../types';
import { AmountCalculatorInput } from './AmountCalculatorInput';
import { CategorySelect } from './CategorySelect';
import { SplitTransactionForm } from './SplitTransactionForm';
import { validateTransfer, validateSplitTransaction } from '../engine/budgetEngine';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const {
    accounts,
    categories,
    groups,
    payees,
    addTransaction,
    updateTransaction,
    createCategory,
    createGroup,
    createPayee,
  } = useBudget();

  // Estados del Formulario
  const [txType, setTxType] = useState<TransactionType>('STANDARD');
  const [isExpense, setIsExpense] = useState(true);
  const [isSplit, setIsSplit] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [transferAccountId, setTransferAccountId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payeeName, setPayeeName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number>(0);
  const [memo, setMemo] = useState('');
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [incomeDestination, setIncomeDestination] = useState<'RTA' | 'CATEGORY'>('RTA');
  const [formError, setFormError] = useState<string | null>(null);

  // Inicializar o resetear formulario
  useEffect(() => {
    if (editingTransaction) {
      setTxType(editingTransaction.type);
      setIsExpense(editingTransaction.amountCents < 0);
      setIsSplit(editingTransaction.type === 'SPLIT');
      setAccountId(editingTransaction.accountId);
      setTransferAccountId(editingTransaction.transferAccountId || '');
      setDate(editingTransaction.date);
      const payee = payees.find((p) => p.id === editingTransaction.payeeId);
      setPayeeName(payee ? payee.name : '');
      setCategoryId(editingTransaction.categoryId || null);
      setAmountCents(editingTransaction.amountCents);
      setMemo(editingTransaction.memo || '');
      setSplits(editingTransaction.splits || []);
      setIncomeDestination(
        editingTransaction.categoryId === READY_TO_ASSIGN_CATEGORY_ID ? 'RTA' : 'CATEGORY'
      );
    } else {
      // Valores por defecto para nueva transacción
      setTxType('STANDARD');
      setIsExpense(true);
      setIsSplit(false);
      setAccountId(accounts[0]?.id || '');
      setTransferAccountId(accounts[1]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setPayeeName('');
      setCategoryId(categories[0]?.id || null);
      setAmountCents(0);
      setMemo('');
      setSplits([]);
      setIncomeDestination('RTA');
    }
    setFormError(null);
  }, [editingTransaction, isOpen, accounts, categories, payees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!accountId) {
      setFormError('Debes seleccionar una cuenta.');
      return;
    }

    if (amountCents === 0) {
      setFormError('El monto no puede ser cero.');
      return;
    }

    // Asegurar o crear Payee
    let activePayeeId = '';
    if (txType === 'TRANSFER') {
      const transferAccount = accounts.find((a) => a.id === transferAccountId);
      const payeeTitle = `Transferencia a: ${transferAccount?.name || 'Cuenta'}`;
      let p = payees.find((item) => item.name === payeeTitle);
      if (!p) p = createPayee(payeeTitle);
      activePayeeId = p.id;
    } else {
      const cleanPayee = payeeName.trim() || (isExpense ? 'Gasto Varios' : 'Ingreso Varios');
      let p = payees.find((item) => item.name.toLowerCase() === cleanPayee.toLowerCase());
      if (!p) p = createPayee(cleanPayee);
      activePayeeId = p.id;
    }

    // 1. Manejo de Transferencia
    if (txType === 'TRANSFER') {
      const val = validateTransfer(accountId, transferAccountId, Math.abs(amountCents));
      if (!val.isValid) {
        setFormError(val.error || 'Transferencia inválida');
        return;
      }

      if (editingTransaction) {
        updateTransaction(editingTransaction.id, {
          accountId,
          transferAccountId,
          amountCents: -Math.abs(amountCents),
          date,
          memo,
        });
      } else {
        addTransaction({
          accountId,
          transferAccountId,
          date,
          amountCents: -Math.abs(amountCents),
          payeeId: activePayeeId,
          categoryId: null,
          type: 'TRANSFER',
          memo,
        });
      }
      onClose();
      return;
    }

    // 2. Manejo de Split Transaction
    if (isSplit) {
      const finalTotal = isExpense ? -Math.abs(amountCents) : Math.abs(amountCents);
      const splitVal = validateSplitTransaction(finalTotal, splits);
      if (!splitVal.isValid) {
        setFormError(
          `La suma de los desgloses no coincide con el total. Restante: ${Currency.format(
            splitVal.remainingCents
          )}`
        );
        return;
      }

      if (editingTransaction) {
        updateTransaction(editingTransaction.id, {
          accountId,
          date,
          amountCents: finalTotal,
          payeeId: activePayeeId,
          categoryId: null,
          type: 'SPLIT',
          splits,
          memo,
        });
      } else {
        addTransaction({
          accountId,
          date,
          amountCents: finalTotal,
          payeeId: activePayeeId,
          categoryId: null,
          type: 'SPLIT',
          splits,
          memo,
        });
      }
      onClose();
      return;
    }

    // 3. Manejo de Transacción Estándar (Gasto o Ingreso de 2 Vías)
    let finalCategoryId: string | null = categoryId;
    let finalAmount = Math.abs(amountCents);

    if (isExpense) {
      finalAmount = -finalAmount;
    } else {
      // Ingreso: Vía 1 (RTA) vs Vía 2 (Directo a sobre)
      if (incomeDestination === 'RTA') {
        finalCategoryId = READY_TO_ASSIGN_CATEGORY_ID;
      }
    }

    if (!finalCategoryId) {
      setFormError('Debes asignar una categoría.');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        accountId,
        date,
        amountCents: finalAmount,
        payeeId: activePayeeId,
        categoryId: finalCategoryId,
        type: 'STANDARD',
        splits: undefined,
        memo,
      });
    } else {
      addTransaction({
        accountId,
        date,
        amountCents: finalAmount,
        payeeId: activePayeeId,
        categoryId: finalCategoryId,
        type: 'STANDARD',
        memo,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-visible my-8">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-base font-bold text-slate-800">
            {editingTransaction ? 'Editar Transacción' : 'Registrar Transacción'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo Principal (Tabs) */}
        <div className="grid grid-cols-3 p-1.5 m-4 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTxType('STANDARD');
              setIsExpense(true);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              txType === 'STANDARD' && isExpense
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-red-600" />
            <span>Gasto (Salida)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('STANDARD');
              setIsExpense(false);
              setIsSplit(false);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              txType === 'STANDARD' && !isExpense
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            <span>Ingreso (Entrada)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('TRANSFER');
              setIsSplit(false);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              txType === 'TRANSFER'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>Transferencia</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-600" />
              {formError}
            </div>
          )}

          {/* Fila 1: Cuenta y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {txType === 'TRANSFER' ? 'Cuenta Origen (Débito)' : 'Cuenta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Fila 2: En caso de Transferencia -> Cuenta Destino */}
          {txType === 'TRANSFER' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cuenta Destino (Crédito)
              </label>
              <select
                value={transferAccountId}
                onChange={(e) => setTransferAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-blue-600 mt-1">
                * Las transferencias entre cuentas de presupuesto no afectan sobres ni Ready to Assign.
              </p>
            </div>
          ) : (
            /* En caso de Gasto/Ingreso -> Beneficiario */
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {isExpense ? 'Beneficiario / Comercio (Payee)' : 'Origen del Dinero'}
              </label>
              <input
                type="text"
                placeholder={isExpense ? 'ej. PedidosYa, Netflix, Carrefour...' : 'ej. Empresa Empleadora, Juan Pérez...'}
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
              />
            </div>
          )}

          {/* Fila 3: Monto con Calculadora Integrada */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monto (Acepta calculadora ej: 90*6)
              </label>
              {txType === 'STANDARD' && isExpense && (
                <button
                  type="button"
                  onClick={() => {
                    const nextSplit = !isSplit;
                    setIsSplit(nextSplit);
                    if (nextSplit && splits.length === 0) {
                      setSplits([
                        {
                          id: 'split-1',
                          categoryId: categoryId || categories[0]?.id || '',
                          amountCents: amountCents !== 0 ? amountCents : 0,
                          memo: '',
                        },
                      ]);
                    }
                  }}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                    isSplit
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Split className="w-3.5 h-3.5 mr-1" />
                  {isSplit ? 'Desactivar Split' : 'Dividir en múltiples sobres (Split)'}
                </button>
              )}
            </div>
            <AmountCalculatorInput
              valueCents={amountCents}
              onChangeCents={(cents) => {
                setAmountCents(cents);
                if (
                  isSplit &&
                  splits.length === 1 &&
                  (splits[0].amountCents === 0 || splits[0].amountCents === amountCents)
                ) {
                  setSplits([{ ...splits[0], amountCents: cents }]);
                }
              }}
              isExpense={isExpense}
              placeholder="0.00"
            />
          </div>

          {/* Fila 4: Categorización (Solo para gastos e ingresos no transferibles) */}
          {txType === 'STANDARD' && (
            <>
              {isExpense ? (
                /* Gasto: o Split Form o Categoría Simple */
                isSplit ? (
                  <SplitTransactionForm
                    totalAmountCents={amountCents}
                    splits={splits}
                    onChangeSplits={setSplits}
                    categories={categories}
                    groups={groups}
                    onCreateCategory={createCategory}
                    onCreateGroup={createGroup}
                    isExpense={true}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Categoría / Sobre
                    </label>
                    <CategorySelect
                      categories={categories}
                      groups={groups}
                      selectedCategoryId={categoryId}
                      onSelectCategory={setCategoryId}
                      onCreateCategory={createCategory}
                      onCreateGroup={createGroup}
                      showReadyToAssign={false}
                    />
                  </div>
                )
              ) : (
                /* Ingreso: Selector de las 2 Vías */
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-3">
                  <span className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Destino del Ingreso (Dos Vías):
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="incomeDestination"
                        value="RTA"
                        checked={incomeDestination === 'RTA'}
                        onChange={() => setIncomeDestination('RTA')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Vía Estándar: "Listo para Asignar" (Ready to Assign)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          El dinero entra al fondo global para distribuirlo luego en el presupuesto mensual.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="incomeDestination"
                        value="CATEGORY"
                        checked={incomeDestination === 'CATEGORY'}
                        onChange={() => setIncomeDestination('CATEGORY')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Vía Directa: Reponer sobre / categoría específica
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Reembolsos o devoluciones. Suma directo al sobre sin pasar por Ready to Assign.
                        </p>
                      </div>
                    </label>
                  </div>

                  {incomeDestination === 'CATEGORY' && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Sobre a Reponer Directamente:
                      </label>
                      <CategorySelect
                        categories={categories}
                        groups={groups}
                        selectedCategoryId={categoryId}
                        onSelectCategory={setCategoryId}
                        onCreateCategory={createCategory}
                        onCreateGroup={createGroup}
                        showReadyToAssign={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Fila 5: Nota / Memo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nota / Descripción Opcional
            </label>
            <input
              type="text"
              placeholder="Descripción breve de la transacción..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              {editingTransaction ? 'Actualizar Transacción' : 'Guardar Transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
