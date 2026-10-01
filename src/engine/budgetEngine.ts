import {
  Account,
  Category,
  Transaction,
  BudgetAssignment,
  CategoryBalance,
  READY_TO_ASSIGN_CATEGORY_ID,
  TransactionSplit,
  CategoryTarget,
  TargetProgress,
  TargetStatus,
} from '../types';

/**
 * Calcula los saldos actuales de cada cuenta a partir de su saldo inicial y las transacciones.
 * Al ser un cálculo derivado, modificar o borrar cualquier transacción recalcula el saldo instantáneamente.
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const account of accounts) {
    balances[account.id] = account.initialBalanceCents;
  }

  for (const tx of transactions) {
    if (balances[tx.accountId] !== undefined) {
      balances[tx.accountId] += tx.amountCents;
    }
  }

  return balances;
}

/**
 * Calcula la actividad (gastos e ingresos directos) por categoría en un mes dado.
 * Maneja transacciones STANDARD, SPLIT y TRANSFERENCIAS.
 */
export function calculateCategoryActivity(
  transactions: Transaction[],
  month: string // 'YYYY-MM'
): Record<string, number> {
  const activity: Record<string, number> = {};

  const monthlyTransactions = transactions.filter((tx) => tx.date.startsWith(month));

  for (const tx of monthlyTransactions) {
    // Si es transferencia entre cuentas on-budget, NO afecta categorías
    if (tx.type === 'TRANSFER') {
      continue;
    }

    if (tx.type === 'SPLIT' && tx.splits && tx.splits.length > 0) {
      for (const split of tx.splits) {
        if (split.categoryId && split.categoryId !== READY_TO_ASSIGN_CATEGORY_ID) {
          activity[split.categoryId] = (activity[split.categoryId] || 0) + split.amountCents;
        }
      }
    } else if (tx.categoryId && tx.categoryId !== READY_TO_ASSIGN_CATEGORY_ID) {
      // Transacción estándar asignada a una categoría específica
      // Si amountCents < 0: gasto. Si amountCents > 0: ingreso directo/reembolso.
      activity[tx.categoryId] = (activity[tx.categoryId] || 0) + tx.amountCents;
    }
  }

  return activity;
}

/**
 * Calcula el monto disponible en "Listo para Asignar" (Ready to Assign) para un mes.
 * Ecuación:
 * RTA = Saldo inicial en cuentas + Ingresos clasificados a RTA - Total asignado a categorías
 */
export function calculateReadyToAssign(
  accounts: Account[],
  transactions: Transaction[],
  assignments: BudgetAssignment[],
  currentMonth: string
): number {
  // 1. Fondos iniciales de cuentas líquidas
  let totalInflowsToRTA = accounts.reduce((sum, acc) => sum + acc.initialBalanceCents, 0);

  // 2. Transacciones con destino explícito a Ready to Assign (hasta el mes actual inclusive)
  for (const tx of transactions) {
    if (tx.categoryId === READY_TO_ASSIGN_CATEGORY_ID && tx.date.slice(0, 7) <= currentMonth) {
      totalInflowsToRTA += tx.amountCents;
    }
  }

  // 3. Total asignado a categorías en todos los meses hasta el mes actual
  let totalAssigned = 0;
  for (const assignment of assignments) {
    if (assignment.month <= currentMonth) {
      totalAssigned += assignment.assignedCents;
    }
  }

  return totalInflowsToRTA - totalAssigned;
}

/**
 * Calcula los saldos disponibles y actividad de cada categoría para la vista de presupuesto.
 */
export function calculateCategoryBalances(
  categories: Category[],
  assignments: BudgetAssignment[],
  activity: Record<string, number>,
  month: string,
  previousAvailable: Record<string, number> = {}
): Record<string, CategoryBalance> {
  const balances: Record<string, CategoryBalance> = {};

  const monthlyAssignments = assignments.filter((a) => a.month === month);
  const assignmentMap: Record<string, number> = {};
  for (const a of monthlyAssignments) {
    assignmentMap[a.categoryId] = a.assignedCents;
  }

  for (const category of categories) {
    const assignedCents = assignmentMap[category.id] || 0;
    const activityCents = activity[category.id] || 0;
    const prevAvailable = previousAvailable[category.id] || 0;

    // Disponible = Saldo anterior + Asignado este mes + Actividad este mes (gastos en negativo / reembolsos en positivo)
    const availableCents = prevAvailable + assignedCents + activityCents;

    balances[category.id] = {
      categoryId: category.id,
      assignedCents,
      activityCents,
      availableCents,
      isOverspent: availableCents < 0,
    };
  }

  return balances;
}

export interface CumulativeMonthBudget {
  categoryBalances: Record<string, CategoryBalance>;
  previousAvailable: Record<string, number>;
  readyToAssignCents: number;
  priorOverspendingCents: number;
}

/**
 * Obtiene la lista ordenada cronológicamente de meses relevantes hasta el mes objetivo.
 */
export function getChronologicalMonths(
  transactions: Transaction[],
  assignments: BudgetAssignment[],
  targetMonth: string
): string[] {
  const monthSet = new Set<string>();
  monthSet.add(targetMonth);

  for (const tx of transactions) {
    if (tx.date) {
      const m = tx.date.slice(0, 7);
      if (m <= targetMonth) {
        monthSet.add(m);
      }
    }
  }

  for (const a of assignments) {
    if (a.month && a.month <= targetMonth) {
      monthSet.add(a.month);
    }
  }

  return Array.from(monthSet).sort();
}

/**
 * Calcula en cadena cronológica los presupuestos mensuales con arrastre acumulativo (Rollover / Carryover).
 * Regla oficial YNAB:
 * - Superávit disponible en sobres (>0) se traslada íntegramente al mes siguiente dentro del sobre.
 * - Sobregastos en sobres (<0) resetean a $0 en el mes siguiente y se descuentan de Ready to Assign.
 */
export function calculateMonthlyChain(
  categories: Category[],
  accounts: Account[],
  transactions: Transaction[],
  assignments: BudgetAssignment[],
  targetMonth: string
): CumulativeMonthBudget {
  const sortedMonths = getChronologicalMonths(transactions, assignments, targetMonth);

  let currentPrevAvailable: Record<string, number> = {};
  let accumulatedPriorOverspending = 0;
  let targetCategoryBalances: Record<string, CategoryBalance> = {};
  let targetPrevAvailable: Record<string, number> = {};

  for (const m of sortedMonths) {
    const activity = calculateCategoryActivity(transactions, m);
    const balances = calculateCategoryBalances(
      categories,
      assignments,
      activity,
      m,
      currentPrevAvailable
    );

    if (m === targetMonth) {
      targetCategoryBalances = balances;
      targetPrevAvailable = { ...currentPrevAvailable };
      break;
    }

    // Preparar el saldo previo para el siguiente mes cronológico
    const nextPrevAvailable: Record<string, number> = {};
    for (const cat of categories) {
      const avail = balances[cat.id]?.availableCents || 0;
      if (avail > 0) {
        nextPrevAvailable[cat.id] = avail;
      } else if (avail < 0) {
        // Regla YNAB: Sobregasto en efectivo del mes anterior resetea el sobre a 0
        // y se absorbe deduciéndose de Ready to Assign en los meses subsiguientes
        nextPrevAvailable[cat.id] = 0;
        accumulatedPriorOverspending += Math.abs(avail);
      } else {
        nextPrevAvailable[cat.id] = 0;
      }
    }

    currentPrevAvailable = nextPrevAvailable;
  }

  const baseRTA = calculateReadyToAssign(accounts, transactions, assignments, targetMonth);
  const readyToAssignCents = baseRTA - accumulatedPriorOverspending;

  return {
    categoryBalances: targetCategoryBalances,
    previousAvailable: targetPrevAvailable,
    readyToAssignCents,
    priorOverspendingCents: accumulatedPriorOverspending,
  };
}

/**
 * Validación matemática de transacciones divididas (Split Transactions).
 * Invariante: Monto Total = Suma de los Splits.
 */
export function validateSplitTransaction(
  totalCents: number,
  splits: TransactionSplit[]
): {
  isValid: boolean;
  assignedCents: number;
  remainingCents: number;
} {
  const assignedCents = splits.reduce((sum, s) => sum + s.amountCents, 0);
  const remainingCents = totalCents - assignedCents;

  return {
    isValid: remainingCents === 0,
    assignedCents,
    remainingCents,
  };
}

/**
 * Validador de transferencias entre cuentas.
 */
export function validateTransfer(
  sourceAccountId: string,
  targetAccountId: string,
  amountCents: number
): { isValid: boolean; error?: string } {
  if (!sourceAccountId || !targetAccountId) {
    return { isValid: false, error: 'Debes seleccionar cuenta de origen y destino.' };
  }
  if (sourceAccountId === targetAccountId) {
    return { isValid: false, error: 'La cuenta de origen y destino no pueden ser la misma.' };
  }
  if (amountCents <= 0) {
    return { isValid: false, error: 'El monto de la transferencia debe ser mayor a 0.' };
  }
  return { isValid: true };
}

/**
 * Crea el par de transacciones vinculadas para una transferencia entre cuentas.
 */
export function createTransferPair(
  sourceAccountId: string,
  targetAccountId: string,
  amountCents: number,
  date: string,
  payeeId: string,
  memo?: string,
  time?: string
): { debitTx: Transaction; creditTx: Transaction } {
  const debitTxId = `tx-transfer-out-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const creditTxId = `tx-transfer-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const debitTx: Transaction = {
    id: debitTxId,
    accountId: sourceAccountId,
    date,
    time,
    amountCents: -Math.abs(amountCents),
    payeeId,
    categoryId: null, // Transferencias on-budget no llevan categoría
    type: 'TRANSFER',
    memo: memo || 'Transferencia saliente',
    transferAccountId: targetAccountId,
    transferTransactionId: creditTxId,
  };

  const creditTx: Transaction = {
    id: creditTxId,
    accountId: targetAccountId,
    date,
    time,
    amountCents: Math.abs(amountCents),
    payeeId,
    categoryId: null,
    type: 'TRANSFER',
    memo: memo || 'Transferencia entrante',
    transferAccountId: sourceAccountId,
    transferTransactionId: debitTxId,
  };

  return { debitTx, creditTx };
}

/**
 * Cuenta el número de referencias (transacciones estándar o líneas de split) que usan una categoría.
 */
export function countCategoryUsage(categoryId: string, transactions: Transaction[]): number {
  return transactions.reduce((count, tx) => {
    let matches = 0;
    if (tx.categoryId === categoryId) {
      matches++;
    }
    if (tx.splits && tx.splits.length > 0) {
      matches += tx.splits.filter((s) => s.categoryId === categoryId).length;
    }
    return count + matches;
  }, 0);
}

/**
 * Reasigna todas las referencias de una categoría eliminada a una categoría de destino (Caso CB-03).
 */
export function reassignCategoryInTransactions(
  sourceCategoryId: string,
  targetCategoryId: string,
  transactions: Transaction[]
): Transaction[] {
  return transactions.map((tx) => {
    let modified = false;
    let newCatId = tx.categoryId;
    let newSplits = tx.splits;

    if (tx.categoryId === sourceCategoryId) {
      newCatId = targetCategoryId;
      modified = true;
    }

    if (tx.splits && tx.splits.some((s) => s.categoryId === sourceCategoryId)) {
      newSplits = tx.splits.map((s) =>
        s.categoryId === sourceCategoryId ? { ...s, categoryId: targetCategoryId } : s
      );
      modified = true;
    }

    return modified ? { ...tx, categoryId: newCatId, splits: newSplits } : tx;
  });
}

/**
 * Consolidación de asignaciones presupuestarias mensuales al reasignar una categoría (Caso CB-03).
 */
export function reassignCategoryAssignments(
  sourceCategoryId: string,
  targetCategoryId: string,
  assignments: BudgetAssignment[]
): BudgetAssignment[] {
  const sourceAssignments = assignments.filter((a) => a.categoryId === sourceCategoryId);
  if (sourceAssignments.length === 0) {
    return assignments.filter((a) => a.categoryId !== sourceCategoryId);
  }

  const updatedAssignments = assignments.filter((a) => a.categoryId !== sourceCategoryId);

  for (const sourceAssign of sourceAssignments) {
    const targetIndex = updatedAssignments.findIndex(
      (a) => a.categoryId === targetCategoryId && a.month === sourceAssign.month
    );

    if (targetIndex >= 0) {
      updatedAssignments[targetIndex] = {
        ...updatedAssignments[targetIndex],
        assignedCents:
          updatedAssignments[targetIndex].assignedCents + sourceAssign.assignedCents,
      };
    } else {
      updatedAssignments.push({
        categoryId: targetCategoryId,
        month: sourceAssign.month,
        assignedCents: sourceAssign.assignedCents,
      });
    }
  }

  return updatedAssignments;
}

/**
 * Calcula el estado y progreso de la meta de ahorro (Target) para una categoría en el mes actual.
 * Estados:
 * - OVERSPENT: si la categoría tiene sobregasto (saldo disponible < 0).
 * - NO_TARGET: si no hay meta definida o su monto es <= 0.
 * - FUNDED: si lo asignado en el mes cubre o supera el monto meta.
 * - UNDERFUNDED: si lo asignado es menor al monto meta.
 */
export function calculateTargetProgress(
  target: CategoryTarget | undefined,
  balance: CategoryBalance | undefined
): TargetProgress {
  if (!target || target.targetAmountCents <= 0) {
    return {
      status: 'NO_TARGET',
      targetAmountCents: 0,
      assignedCents: balance?.assignedCents || 0,
      neededCents: 0,
      percentage: 0,
      targetType: 'MONTHLY_NEEDED',
    };
  }

  const assignedCents = balance?.assignedCents || 0;
  const targetAmountCents = target.targetAmountCents;
  const neededCents = Math.max(0, targetAmountCents - assignedCents);
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((assignedCents / targetAmountCents) * 100))
  );

  let status: TargetStatus = 'UNDERFUNDED';
  if (balance?.isOverspent) {
    status = 'OVERSPENT';
  } else if (assignedCents >= targetAmountCents) {
    status = 'FUNDED';
  }

  return {
    status,
    targetAmountCents,
    assignedCents,
    neededCents,
    percentage,
    dueDayOfMonth: target.dueDayOfMonth,
    targetType: target.targetType,
  };
}

