import React, { useState } from 'react';
import { X, Users, Plus, Search, Building2, User } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';

interface PayeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayeesModal: React.FC<PayeesModalProps> = ({ isOpen, onClose }) => {
  const { payees, createPayee, transactions } = useBudget();
  const [searchTerm, setSearchTerm] = useState('');
  const [newPayeeName, setNewPayeeName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const filteredPayees = payees.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayeeName.trim()) return;
    createPayee(newPayeeName.trim());
    setSuccessMsg(`Beneficiario "${newPayeeName.trim()}" añadido exitosamente`);
    setNewPayeeName('');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const getTransactionCount = (payeeId: string) => {
    return transactions.filter((t) => t.payeeId === payeeId).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900">Gestión de Beneficiarios</h3>
              <p className="text-xs text-slate-500">Personas, comercios y entidades registradas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Formulario rápido para añadir */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del nuevo beneficiario..."
              value={newPayeeName}
              onChange={(e) => setNewPayeeName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="flex items-center space-x-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </form>

          {successMsg && (
            <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              {successMsg}
            </p>
          )}

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar beneficiario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50/50"
            />
          </div>

          {/* Lista de beneficiarios */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
            {filteredPayees.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {searchTerm ? 'No se encontraron beneficiarios con esa búsqueda' : 'No hay beneficiarios registrados aún.'}
              </div>
            ) : (
              filteredPayees.map((payee) => {
                const count = getTransactionCount(payee.id);
                return (
                  <div
                    key={payee.id}
                    className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      {payee.isSystem ? (
                        <Building2 className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-semibold text-slate-800">{payee.name}</span>
                      {payee.isSystem && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                          Sistema
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {count} transacción{count === 1 ? '' : 'es'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
