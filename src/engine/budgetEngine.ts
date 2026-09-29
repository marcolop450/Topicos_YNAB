import {
  Account,
  Category,
  Transaction,
  BudgetAssignment,
  CategoryBalance,
  READY_TO_ASSIGN_CATEGORY_ID,
  TransactionSplit,
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
  memo?: string
): { debitTx: Transaction; creditTx: Transaction } {
  const debitTxId = `tx-transfer-out-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const creditTxId = `tx-transfer-in-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const debitTx: Transaction = {
    id: debitTxId,
    accountId: sourceAccountId,
    date,
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
