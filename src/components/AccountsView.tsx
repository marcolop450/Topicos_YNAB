import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Filter,
  Split,
  Building2,
  PiggyBank,
  Banknote,
  CreditCard,
  Tag,
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { AccountType, Currency, Transaction } from '../types';
import { getFlagById, getFlagsConfig } from '../utils/flagsConfig';

interface AccountsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const {
    accounts,
    transactions,
    categories,
    payees,
    accountBalances,
    deleteTransaction,
    createAccount,
  } = useBudget();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string>('ALL');
  const [newAccountModal, setNewAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('CHECKING');
  const [newAccBalance, setNewAccBalance] = useState('');

  // Filtrado de transacciones
  const filteredTransactions = transactions.filter((tx) => {
    const matchesAccount = selectedAccountId === null || tx.accountId === selectedAccountId;
    const payee = payees.find((p) => p.id === tx.payeeId)?.name.toLowerCase() || '';
    const memo = tx.memo?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    const matchesSearch = payee.includes(query) || memo.includes(query);
    const matchesFlag =
      selectedFlag === 'ALL'
        ? true
        : selectedFlag === 'NONE'
        ? !tx.flagColor
        : tx.flagColor === selectedFlag;
    return matchesAccount && matchesSearch && matchesFlag;
  });

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const totalAllAccounts = Object.values(accountBalances).reduce((a, b) => a + b, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'CHECKING':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'SAVINGS':
        return <PiggyBank className="w-4 h-4 text-emerald-600" />;
      case 'CASH':
        return <Banknote className="w-4 h-4 text-amber-600" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const cents = Currency.toCents(parseFloat(newAccBalance || '0'));
    createAccount(newAccName.trim(), newAccType, cents);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccountModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* 1. Barra Lateral de Cuentas */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cuentas ({accounts.length})
          </h3>
          <button
            onClick={() => setNewAccountModal(true)}
            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Agregar nueva cuenta"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Total General */}
        <button
          onClick={() => setSelectedAccountId(null)}
          className={`w-full p-3 rounded-xl text-left border transition-all ${
            selectedAccountId === null
              ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-blue-600" />
              Todas las Cuentas
            </span>
            <span className="font-mono font-bold text-sm">
              {Currency.format(totalAllAccounts)}
            </span>
          </div>
        </button>

        {/* Lista de Cuentas Individuales */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const balance = accountBalances[acc.id] || 0;

            return (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100'
                    }`}
                  >
                    {getAccountIcon(acc.type)}
                  </div>
                  <span className="truncate">{acc.name}</span>
                </div>
                <span className="font-mono font-bold ml-2 shrink-0">
                  {Currency.format(balance)}
                </span>
              </button>
            );
          })}
          {accounts.length === 0 && (
            <div className="p-3 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 space-y-2">
              <p className="font-medium">No tienes cuentas registradas.</p>
              <button
                onClick={() => setNewAccountModal(true)}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                + Crear Primera Cuenta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Panel Central: Libro de Transacciones (Register) */}
      <div className="lg:col-span-3 space-y-4">
        {/* Cabecera del Registro */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {selectedAccount ? selectedAccount.name : 'Todas las Transacciones'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saldo Actual:{' '}
              <strong className="font-mono text-slate-900 text-sm font-bold">
                {Currency.format(
                  selectedAccount ? accountBalances[selectedAccount.id] || 0 : totalAllAccounts
                )}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-56">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por comercio o nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Selector de Bandera */}
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 absolute left-2.5 text-purple-600 pointer-events-none" />
              <select
                value={selectedFlag}
                onChange={(e) => setSelectedFlag(e.target.value)}
                className="pl-7 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium text-slate-700"
              >
                <option value="ALL">Todas las banderas</option>
                <option value="NONE">Sin bandera</option>
                {getFlagsConfig().map((f) => (
                  <option key={f.id} value={f.id}>
                    ● {f.label}: {f.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shrink-0 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Añadir Transacción
            </button>
          </div>
        </div>

        {/* Tabla del Libro Contable */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center w-28">Bandera</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Beneficiario / Payee</th>
                  <th className="px-4 py-3">Categoría / Sobre</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No hay transacciones registradas que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const account = accounts.find((a) => a.id === tx.accountId);
                    const payee = payees.find((p) => p.id === tx.payeeId);
                    const isExpense = tx.amountCents < 0;

                    // Determinar etiqueta de categoría
                    let categoryLabel: React.ReactNode = null;
                    if (tx.type === 'TRANSFER') {
                      const counterpart = accounts.find((a) => a.id === tx.transferAccountId);
                      categoryLabel = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          Transferencia: {counterpart?.name || 'Cuenta'}
                        </span>
                      );
                    } else if (tx.type === 'SPLIT') {
                      categoryLabel = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                          <Split className="w-3 h-3 mr-1" />
                          Dividido ({tx.splits?.length || 0} sobres)
                        </span>
                      );
                    } else if (tx.categoryId) {
                      if (tx.categoryId === 'READY_TO_ASSIGN') {
                        categoryLabel = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                            Listo para Asignar (RTA)
                          </span>
                        );
                      } else {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        categoryLabel = (
                          <span className="text-slate-700 font-medium">
                            {cat ? cat.name : 'Sin categoría'}
                          </span>
                        );
                      }
                    }

                    const flag = getFlagById(tx.flagColor);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {flag ? (
                            <span
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${flag.badgeClass}`}
                              title={flag.name}
                            >
                              <span className={`w-2 h-2 rounded-full ${flag.dotClass}`} />
                              <span className="max-w-[100px] truncate">{flag.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {account?.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {payee?.name || 'Varios'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{categoryLabel}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {tx.memo || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={`inline-flex items-center ${
                              isExpense ? 'text-slate-900' : 'text-emerald-600'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowDownRight className="w-3 h-3 mr-0.5 text-slate-400" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-500" />
                            )}
                            {Currency.format(Math.abs(tx.amountCents))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title="Editar transacción"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              title="Eliminar transacción (Recálculo dinámico)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Crear Nueva Cuenta */}
      {newAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-slate-800 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Nueva Cuenta Financiera
            </h4>
            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Cuenta:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Banco Galicia, Tarjeta Visa, Efectivo..."
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Cuenta:
                </label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="CHECKING">Cuenta Corriente / Débito</option>
                  <option value="SAVINGS">Caja de Ahorro</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Saldo Inicial ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * Este saldo alimentará automáticamente tu fondo "Listo para Asignar".
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setNewAccountModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
