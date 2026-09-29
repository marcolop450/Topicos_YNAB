import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Account,
  CategoryGroup,
  Category,
  Payee,
  Transaction,
  BudgetAssignment,
  CategoryBalance,
  AccountType,
} from '../types';
import {
  calculateAccountBalances,
  calculateCategoryActivity,
  createTransferPair,
  countCategoryUsage,
  reassignCategoryInTransactions,
  reassignCategoryAssignments,
  calculateMonthlyChain,
} from '../engine/budgetEngine';
import {
  initialAccounts,
  initialGroups,
  initialCategories,
  initialPayees,
  initialTransactions,
  initialAssignments,
} from '../data/seedData';

interface BudgetContextType {
  accounts: Account[];
  groups: CategoryGroup[];
  categories: Category[];
  payees: Payee[];
  transactions: Transaction[];
  assignments: BudgetAssignment[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;

  // Cálculos reactivos derivados
  accountBalances: Record<string, number>;
  categoryActivity: Record<string, number>;
  readyToAssignCents: number;
  categoryBalances: Record<string, CategoryBalance>;
  previousAvailableBalances: Record<string, number>;
  priorOverspendingCents: number;

  // Acciones
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updated: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  assignBudget: (categoryId: string, month: string, cents: number) => void;
  createAccount: (name: string, type: AccountType, initialBalanceCents: number) => Account;
  createCategory: (name: string, groupId: string) => Category;
  updateCategory: (id: string, updated: Partial<Pick<Category, 'name' | 'groupId' | 'isHidden'>>) => void;
  toggleHideCategory: (id: string) => void;
  getCategoryTransactionCount: (categoryId: string) => number;
  deleteCategory: (id: string, reassignToCategoryId?: string) => { success: boolean; error?: string };
  createGroup: (name: string) => CategoryGroup;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => { success: boolean; error?: string };
  createPayee: (name: string) => Payee;
  resetToSampleData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'ynab_accounts_v1',
  GROUPS: 'ynab_groups_v1',
  CATEGORIES: 'ynab_categories_v1',
  PAYEES: 'ynab_payees_v1',
  TRANSACTIONS: 'ynab_transactions_v1',
  ASSIGNMENTS: 'ynab_assignments_v1',
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cargar estado inicial desde LocalStorage o desde datos semilla
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [groups, setGroups] = useState<CategoryGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return saved ? JSON.parse(saved) : initialGroups;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [payees, setPayees] = useState<Payee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYEES);
    return saved ? JSON.parse(saved) : initialPayees;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [assignments, setAssignments] = useState<BudgetAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [currentMonth, setCurrentMonth] = useState<string>('2026-09');

  // Guardar en LocalStorage ante cada cambio
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYEES, JSON.stringify(payees));
  }, [payees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  // Cálculos reactivos derivados en memoria
  const accountBalances = useMemo(
    () => calculateAccountBalances(accounts, transactions),
    [accounts, transactions]
  );

  const categoryActivity = useMemo(
    () => calculateCategoryActivity(transactions, currentMonth),
    [transactions, currentMonth]
  );

  // Cálculo encadenado acumulativo multimensual (Rollover / Carryover)
  const monthlyChainData = useMemo(
    () => calculateMonthlyChain(categories, accounts, transactions, assignments, currentMonth),
    [categories, accounts, transactions, assignments, currentMonth]
  );

  const readyToAssignCents = monthlyChainData.readyToAssignCents;
  const categoryBalances = monthlyChainData.categoryBalances;
  const previousAvailableBalances = monthlyChainData.previousAvailable;
  const priorOverspendingCents = monthlyChainData.priorOverspendingCents;

  // Acciones
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    if (txData.type === 'TRANSFER' && txData.transferAccountId) {
      // Crear par de transacciones vinculadas (débito y crédito)
      const payee = payees.find((p) => p.id === txData.payeeId) || { id: 'transfer-payee' };
      const { debitTx, creditTx } = createTransferPair(
        txData.accountId,
        txData.transferAccountId,
        Math.abs(txData.amountCents),
        txData.date,
        payee.id,
        txData.memo
      );
      setTransactions((prev) => [debitTx, creditTx, ...prev]);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          return { ...tx, ...updated };
        }
        // Si es una transferencia vinculada, sincronizar monto o fecha en su contraparte
        if (tx.transferTransactionId === id && updated.amountCents !== undefined) {
          return {
            ...tx,
            amountCents: -updated.amountCents,
            date: updated.date || tx.date,
          };
        }
        return tx;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find((tx) => tx.id === id);
    if (!txToDelete) return;

    // Si tiene contraparte vinculada (transferencia), eliminar ambas
    const linkedId = txToDelete.transferTransactionId;
    setTransactions((prev) =>
      prev.filter((tx) => tx.id !== id && (!linkedId || tx.id !== linkedId))
    );
  };

  const assignBudget = (categoryId: string, month: string, cents: number) => {
    setAssignments((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.categoryId === categoryId && a.month === month
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], assignedCents: cents };
        return copy;
      }
      return [...prev, { categoryId, month, assignedCents: cents }];
    });
  };

  const createAccount = (name: string, type: AccountType, initialBalanceCents: number) => {
    const newAccount: Account = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      type,
      initialBalanceCents,
      isActive: true,
    };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  };

  const createCategory = (name: string, groupId: string) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      name,
      sortOrder: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (
    id: string,
    updated: Partial<Pick<Category, 'name' | 'groupId' | 'isHidden'>>
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const toggleHideCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isHidden: !c.isHidden } : c))
    );
  };

  const getCategoryTransactionCount = (categoryId: string): number => {
    return countCategoryUsage(categoryId, transactions);
  };

  const deleteCategory = (
    id: string,
    reassignToCategoryId?: string
  ): { success: boolean; error?: string } => {
    const txCount = countCategoryUsage(id, transactions);

    // Caso CB-03: Si tiene movimientos y no se indicó categoría destino, bloquear borrado
    if (txCount > 0 && !reassignToCategoryId) {
      return {
        success: false,
        error: `La categoría tiene ${txCount} transacciones asociadas. Debes reasignarlas o elegir ocultar la categoría.`,
      };
    }

    if (reassignToCategoryId === id) {
      return {
        success: false,
        error: 'La categoría de reasignación no puede ser la misma categoría a eliminar.',
      };
    }

    // 1. Reasignar transacciones y consolidar asignaciones si se especificó categoría destino
    if (reassignToCategoryId) {
      setTransactions((prev) =>
        reassignCategoryInTransactions(id, reassignToCategoryId, prev)
      );
      setAssignments((prev) =>
        reassignCategoryAssignments(id, reassignToCategoryId, prev)
      );
    } else {
      // Sin transacciones ni reasignación: limpiar asignaciones de la categoría
      setAssignments((prev) => prev.filter((a) => a.categoryId !== id));
    }

    // 2. Eliminar la categoría de la lista
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  const createGroup = (name: string) => {
    const newGroup: CategoryGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      sortOrder: groups.length + 1,
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const updateGroup = (id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const deleteGroup = (id: string): { success: boolean; error?: string } => {
    const catsInGroup = categories.filter((c) => c.groupId === id);
    if (catsInGroup.length > 0) {
      return {
        success: false,
        error: `El grupo contiene ${catsInGroup.length} categorías. Elimina o mueve las categorías antes de borrar el grupo.`,
      };
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    return { success: true };
  };

  const createPayee = (name: string) => {
    const newPayee: Payee = {
      id: `payee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      isSystem: false,
    };
    setPayees((prev) => [...prev, newPayee]);
    return newPayee;
  };

  const resetToSampleData = () => {
    setAccounts(initialAccounts);
    setGroups(initialGroups);
    setCategories(initialCategories);
    setPayees(initialPayees);
    setTransactions(initialTransactions);
    setAssignments(initialAssignments);
    setCurrentMonth('2026-09');
  };

  const exportDataJson = () => {
    return JSON.stringify(
      {
        accounts,
        groups,
        categories,
        payees,
        transactions,
        assignments,
        currentMonth,
      },
      null,
      2
    );
  };

  const importDataJson = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.accounts && data.categories && data.transactions) {
        setAccounts(data.accounts);
        if (data.groups) setGroups(data.groups);
        setCategories(data.categories);
        if (data.payees) setPayees(data.payees);
        setTransactions(data.transactions);
        if (data.assignments) setAssignments(data.assignments);
        if (data.currentMonth) setCurrentMonth(data.currentMonth);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        accounts,
        groups,
        categories,
        payees,
        transactions,
        assignments,
        currentMonth,
        setCurrentMonth,
        accountBalances,
        categoryActivity,
        readyToAssignCents,
        categoryBalances,
        previousAvailableBalances,
        priorOverspendingCents,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        assignBudget,
        createAccount,
        createCategory,
        updateCategory,
        toggleHideCategory,
        getCategoryTransactionCount,
        deleteCategory,
        createGroup,
        updateGroup,
        deleteGroup,
        createPayee,
        resetToSampleData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
