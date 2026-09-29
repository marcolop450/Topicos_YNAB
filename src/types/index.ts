// Constante para la supercategoría global
export const READY_TO_ASSIGN_CATEGORY_ID = 'READY_TO_ASSIGN';

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  isActive: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  sortOrder: number;
  isHidden?: boolean;
}

export interface Payee {
  id: string;
  name: string;
  isSystem?: boolean;
}

export interface TransactionSplit {
  id: string;
  categoryId: string; // ID de la categoría del sub-sobre
  amountCents: number; // En centavos (negativo para gasto, positivo para reembolso)
  memo?: string;
}

export type TransactionType = 'STANDARD' | 'SPLIT' | 'TRANSFER';

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // Formato ISO 'YYYY-MM-DD'
  amountCents: number; // Negativo=Gasto/Salida, Positivo=Ingreso/Entrada
  payeeId: string;
  categoryId?: string | null; // null si es SPLIT o TRANSFER entre cuentas on-budget
  type: TransactionType;
  memo?: string;
  transferAccountId?: string | null; // Cuenta contraparte en caso de TRANSFER
  transferTransactionId?: string | null; // ID de la transacción vinculada
  splits?: TransactionSplit[]; // Desglose si type === 'SPLIT'
}

export interface BudgetAssignment {
  month: string; // Formato 'YYYY-MM'
  categoryId: string;
  assignedCents: number;
}

export interface CategoryBalance {
  categoryId: string;
  assignedCents: number;
  activityCents: number;
  availableCents: number;
  isOverspent: boolean;
}

// Utilidades para manejo de moneda sin pérdida de precisión de coma flotante
export const Currency = {
  toCents(amount: number): number {
    return Math.round(amount * 100);
  },
  fromCents(cents: number): number {
    return cents / 100;
  },
  format(cents: number): string {
    const isNegative = cents < 0;
    const abs = Math.abs(cents) / 100;
    const formatted = abs.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  },
};
