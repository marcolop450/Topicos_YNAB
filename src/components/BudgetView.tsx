import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FolderPlus,
  Plus,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
} from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { Currency, Category } from '../types';
import { AmountCalculatorInput } from './AmountCalculatorInput';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import { EditCategoryModal } from './EditCategoryModal';

export const BudgetView: React.FC = () => {
  const {
    groups,
    categories,
    currentMonth,
    setCurrentMonth,
    readyToAssignCents,
    categoryBalances,
    previousAvailableBalances,
    priorOverspendingCents,
    assignBudget,
    createCategory,
    createGroup,
    toggleHideCategory,
    accountBalances,
  } = useBudget();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newGroupModal, setNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingCategoryToGroup, setAddingCategoryToGroup] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [showHiddenCategories, setShowHiddenCategories] = useState(false);

  // Navegación de meses
  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newY}-${newM}`);
  };

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const name = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup(newGroupName.trim());
    setNewGroupName('');
    setNewGroupModal(false);
  };

  const handleCreateCategory = (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategory(newCategoryName.trim(), groupId);
    setNewCategoryName('');
    setAddingCategoryToGroup(null);
  };

  const totalCashInAccounts = Object.values(accountBalances).reduce((a, b) => a + b, 0);

  // Comprobar si hay sobregasto en alguna categoría
  const overspentCategories = Object.values(categoryBalances).filter((c) => c.isOverspent);

  // Categorías actualmente ocultas
  const hiddenCategories = categories.filter((c) => c.isHidden);

  return (
    <div className="space-y-6">
      {/* 1. Header con Navegador de Meses y Banner de "Listo para Asignar" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navegador de Meses */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              title="Mes Anterior"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-slate-800 tracking-tight">
              {formatMonthName(currentMonth)}
            </span>
            <button
              onClick={() => changeMonth(1)}
              title="Mes Siguiente"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-xs">
            <span className="text-slate-500">
              Efectivo Total en Cuentas:{' '}
              <strong className="text-slate-800 font-mono font-bold">
                {Currency.format(totalCashInAccounts)}
              </strong>
            </span>
          </div>
        </div>

        {/* Banner Central de Ready to Assign (YNAB Signature) */}
        <div
          className={`p-6 transition-colors ${
            readyToAssignCents >= 0
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
          }`}
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-center sm:text-left">
              <div
                className={`p-3 rounded-2xl shadow-inner ${
                  readyToAssignCents >= 0 ? 'bg-emerald-500/40' : 'bg-red-500/40'
                }`}
              >
                {readyToAssignCents >= 0 ? (
                  <Sparkles className="w-8 h-8 text-white" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-200 animate-bounce" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight font-mono">
                  {Currency.format(readyToAssignCents)}
                </h2>
                <p className="text-sm font-medium opacity-90 mt-0.5">
                  {readyToAssignCents >= 0
                    ? 'Listo para Asignar (Ready to Assign) a tus sobres'
                    : '¡Has asignado más dinero del que posees! Debes reducir asignaciones.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              {priorOverspendingCents > 0 && (
                <div
                  title="Sobregastos del mes anterior descontados de la bolsa global según la regla oficial de YNAB"
                  className="px-3.5 py-2 rounded-xl bg-amber-500/30 border border-amber-300/40 text-xs font-semibold flex items-center text-amber-100"
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-300 shrink-0" />
                  <span>
                    Deducción mes anterior: -{Currency.format(priorOverspendingCents)}
                  </span>
                </div>
              )}

              {overspentCategories.length > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-black/20 border border-white/20 text-xs font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-300" />
                  <span>
                    {overspentCategories.length} {overspentCategories.length === 1 ? 'sobre con sobregasto' : 'sobres con sobregasto'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Botón de Nuevo Grupo */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Sobres y Categorías de Presupuesto</h3>
        <button
          onClick={() => setNewGroupModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <FolderPlus className="w-4 h-4 mr-1.5 text-blue-600" />
          + Nuevo Grupo de Categorías
        </button>
      </div>

      {/* 3. Tabla Principal de Categorías por Grupo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cabecera de Columnas */}
        <div className="grid grid-cols-12 px-6 py-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5 sm:col-span-6">Categoría</div>
          <div className="col-span-3 sm:col-span-2 text-right">Asignado</div>
          <div className="col-span-2 text-right hidden sm:block">Gastado/Actividad</div>
          <div className="col-span-4 sm:col-span-2 text-right">Disponible</div>
        </div>

        {/* Grupos en Acordeón */}
        <div className="divide-y divide-slate-100">
          {groups.map((group) => {
            const groupCategories = categories.filter((c) => c.groupId === group.id && !c.isHidden);
            const isCollapsed = collapsedGroups[group.id];

            // Totales acumulados del grupo
            const totalGroupAssigned = groupCategories.reduce(
              (sum, c) => sum + (categoryBalances[c.id]?.assignedCents || 0),
              0
            );
            const totalGroupActivity = groupCategories.reduce(
              (sum, c) => sum + (categoryBalances[c.id]?.activityCents || 0),
              0
            );
            const totalGroupAvailable = groupCategories.reduce(
              (sum, c) => sum + (categoryBalances[c.id]?.availableCents || 0),
              0
            );

            return (
              <div key={group.id} className="divide-y divide-slate-50">
                {/* Renglón Cabecera del Grupo */}
                <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50 hover:bg-slate-100/60 items-center text-xs font-bold text-slate-700 transition-colors">
                  <div className="col-span-5 sm:col-span-6 flex items-center space-x-2">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="p-1 hover:bg-slate-200/80 rounded transition-colors text-slate-400"
                    >
                      {isCollapsed ? (
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-slate-800 font-bold">{group.name}</span>
                    <button
                      onClick={() => setAddingCategoryToGroup(group.id)}
                      title="Agregar categoría a este grupo"
                      className="text-blue-600 hover:text-blue-800 p-0.5 rounded ml-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-600">
                    {Currency.format(totalGroupAssigned)}
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-500 hidden sm:block">
                    {Currency.format(totalGroupActivity)}
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right font-mono font-bold text-slate-800">
                    {Currency.format(totalGroupAvailable)}
                  </div>
                </div>

                {/* Sub-formulario para agregar categoría inline al grupo */}
                {addingCategoryToGroup === group.id && (
                  <form
                    onSubmit={(e) => handleCreateCategory(e, group.id)}
                    className="grid grid-cols-12 px-6 py-2 bg-blue-50/50 items-center gap-2"
                  >
                    <div className="col-span-8 sm:col-span-6 flex items-center space-x-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nombre de la nueva categoría..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-blue-300 rounded-md outline-none bg-white"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-6 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setAddingCategoryToGroup(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md shadow-xs"
                      >
                        Crear
                      </button>
                    </div>
                  </form>
                )}

                {/* Categorías del Grupo */}
                {!isCollapsed &&
                  groupCategories.map((category) => {
                    const balance = categoryBalances[category.id] || {
                      assignedCents: 0,
                      activityCents: 0,
                      availableCents: 0,
                      isOverspent: false,
                    };

                    return (
                      <div
                        key={category.id}
                        className="grid grid-cols-12 px-6 py-2 items-center hover:bg-slate-50/70 transition-colors text-xs"
                      >
                        {/* Nombre de Categoría y Acciones */}
                        <div className="col-span-5 sm:col-span-6 pl-6 flex items-center justify-between pr-2 group">
                          <span className="font-medium text-slate-800 truncate" title={category.name}>
                            {category.name}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(category)}
                              title="Editar categoría"
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleHideCategory(category.id)}
                              title="Ocultar categoría"
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(category)}
                              title="Eliminar categoría (Caso CB-03)"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Asignado (Con Calculadora Interactiva Inline) */}
                        <div className="col-span-3 sm:col-span-2 text-right">
                          <AmountCalculatorInput
                            valueCents={balance.assignedCents}
                            onChangeCents={(cents) =>
                              assignBudget(category.id, currentMonth, Math.abs(cents))
                            }
                            isExpense={false}
                            className="text-right text-xs py-1"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Gastado / Actividad */}
                        <div className="col-span-2 text-right font-mono hidden sm:block">
                          <span
                            className={
                              balance.activityCents < 0
                                ? 'text-slate-600'
                                : balance.activityCents > 0
                                ? 'text-emerald-600 font-semibold'
                                : 'text-slate-300'
                            }
                          >
                            {Currency.format(balance.activityCents)}
                          </span>
                        </div>

                        {/* Saldo Disponible con Tooltip de Desglose Matemático */}
                        <div className="col-span-4 sm:col-span-2 flex justify-end">
                          <span
                            title={`Desglose contable:\n• Saldo mes anterior: ${Currency.format(
                              previousAvailableBalances[category.id] || 0
                            )}\n• Asignado este mes: ${Currency.format(
                              balance.assignedCents
                            )}\n• Gastado este mes: ${Currency.format(
                              balance.activityCents
                            )}\n= Saldo disponible: ${Currency.format(balance.availableCents)}`}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono font-bold text-xs cursor-help transition-transform hover:scale-105 ${
                              balance.availableCents < 0
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : balance.availableCents > 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {balance.availableCents < 0 && (
                              <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />
                            )}
                            {Currency.format(balance.availableCents)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Sección de Categorías Ocultas (si existen) */}
      {hiddenCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHiddenCategories(!showHiddenCategories)}
            className="w-full px-6 py-3.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span>Categorías Ocultas ({hiddenCategories.length})</span>
            </div>
            {showHiddenCategories ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showHiddenCategories && (
            <div className="divide-y divide-slate-100 border-t border-slate-200">
              {hiddenCategories.map((category) => {
                const balance = categoryBalances[category.id] || {
                  assignedCents: 0,
                  activityCents: 0,
                  availableCents: 0,
                  isOverspent: false,
                };
                const groupName =
                  groups.find((g) => g.id === category.groupId)?.name || 'Sin grupo';

                return (
                  <div
                    key={category.id}
                    className="grid grid-cols-12 px-6 py-2.5 items-center hover:bg-slate-50/70 transition-colors text-xs"
                  >
                    <div className="col-span-5 sm:col-span-6 flex items-center space-x-1.5 truncate pl-6">
                      <span className="text-slate-400 text-[11px] truncate">{groupName} /</span>
                      <span className="font-semibold text-slate-700 truncate">
                        {category.name}
                      </span>
                    </div>

                    <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-500">
                      {Currency.format(balance.assignedCents)}
                    </div>

                    <div className="col-span-2 text-right font-mono text-slate-400 hidden sm:block">
                      {Currency.format(balance.activityCents)}
                    </div>

                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end space-x-2">
                      <span
                        title={`Desglose contable:\n• Saldo mes anterior: ${Currency.format(
                          previousAvailableBalances[category.id] || 0
                        )}\n• Asignado este mes: ${Currency.format(
                          balance.assignedCents
                        )}\n• Gastado este mes: ${Currency.format(
                          balance.activityCents
                        )}\n= Saldo disponible: ${Currency.format(balance.availableCents)}`}
                        className="font-mono font-medium text-slate-600 cursor-help"
                      >
                        {Currency.format(balance.availableCents)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleHideCategory(category.id)}
                        title="Restaurar / Mostrar categoría"
                        className="px-2 py-0.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors inline-flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Mostrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        title="Eliminar categoría"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear Nuevo Grupo */}
      {newGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <FolderPlus className="w-4 h-4 mr-2 text-blue-600" />
              Nuevo Grupo de Categorías
            </h4>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre del Grupo:
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="ej. Suscripciones, Educación..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewGroupModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación Segura CB-03 */}
      <DeleteCategoryModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        category={deletingCategory}
      />

      {/* Modal de Edición de Categoría */}
      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
      />
    </div>
  );
};
