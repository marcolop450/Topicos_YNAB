import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalances,
  calculateCategoryActivity,
  calculateReadyToAssign,
  calculateCategoryBalances,
  validateSplitTransaction,
  validateTransfer,
  createTransferPair,
  countCategoryUsage,
  reassignCategoryInTransactions,
  reassignCategoryAssignments,
} from './budgetEngine';
import {
  Account,
  Category,
  Transaction,
  BudgetAssignment,
  READY_TO_ASSIGN_CATEGORY_ID,
  TransactionSplit,
  Currency,
} from '../types';

describe('Budget Engine - Lógica de Dominio y Casos Borde YNAB', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-checking',
      name: 'Banco Principal',
      type: 'CHECKING',
      initialBalanceCents: Currency.toCents(1000), // $1000.00
      isActive: true,
    },
    {
      id: 'acc-savings',
      name: 'Ahorros',
      type: 'SAVINGS',
      initialBalanceCents: Currency.toCents(500), // $500.00
      isActive: true,
    },
  ];

  const mockCategories: Category[] = [
    { id: 'cat-groceries', groupId: 'grp-needs', name: 'Comida/Supermercado', sortOrder: 1 },
    { id: 'cat-rent', groupId: 'grp-needs', name: 'Alquiler', sortOrder: 2 },
    { id: 'cat-dining', groupId: 'grp-fun', name: 'Salidas/Restaurantes', sortOrder: 3 },
  ];

  it('Caso 1: Seguimiento dinámico de saldos y recálculo reactivo ante edición y borrado', () => {
    let transactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-checking',
        date: '2026-09-01',
        amountCents: Currency.toCents(-50), // Gasto de $50
        payeeId: 'payee-store',
        categoryId: 'cat-groceries',
        type: 'STANDARD',
      },
    ];

    // Saldo inicial $1000 - $50 = $950
    let balances = calculateAccountBalances(mockAccounts, transactions);
    expect(balances['acc-checking']).toBe(Currency.toCents(950));

    // Edición dinámica de la transacción (cambia a -$80)
    transactions = [
      {
        ...transactions[0],
        amountCents: Currency.toCents(-80),
      },
    ];
    balances = calculateAccountBalances(mockAccounts, transactions);
    expect(balances['acc-checking']).toBe(Currency.toCents(920));

    // Eliminación dinámica de la transacción
    transactions = [];
    balances = calculateAccountBalances(mockAccounts, transactions);
    expect(balances['acc-checking']).toBe(Currency.toCents(1000));
  });

  it('Caso 2: Ingreso por Dos Vías (A "Ready to Assign" vs Directo a Categoría)', () => {
    const currentMonth = '2026-09';
    const accounts: Account[] = [
      { id: 'acc-1', name: 'Banco', type: 'CHECKING', initialBalanceCents: 0, isActive: true },
    ];

    // Vía 1: Ingreso estándar que va a Ready to Assign
    const txSalary: Transaction = {
      id: 'tx-salary',
      accountId: 'acc-1',
      date: '2026-09-01',
      amountCents: Currency.toCents(2000), // $2000.00
      payeeId: 'payee-employer',
      categoryId: READY_TO_ASSIGN_CATEGORY_ID,
      type: 'STANDARD',
    };

    // Vía 2: Ingreso directo a un sobre (Reembolso de compra de supermercado de $50)
    const txRefund: Transaction = {
      id: 'tx-refund',
      accountId: 'acc-1',
      date: '2026-09-05',
      amountCents: Currency.toCents(50), // +$50.00
      payeeId: 'payee-store',
      categoryId: 'cat-groceries',
      type: 'STANDARD',
    };

    const transactions = [txSalary, txRefund];
    const assignments: BudgetAssignment[] = [
      { month: currentMonth, categoryId: 'cat-groceries', assignedCents: Currency.toCents(300) },
    ];

    // Ready to Assign debe tener los $2000 iniciales menos los $300 asignados = $1700
    // El reembolso de $50 NO debe sumar a Ready to Assign porque fue directo al sobre
    const rta = calculateReadyToAssign(accounts, transactions, assignments, currentMonth);
    expect(rta).toBe(Currency.toCents(1700));

    // La actividad de 'cat-groceries' debe reflejar el ingreso directo de +$50
    const activity = calculateCategoryActivity(transactions, currentMonth);
    expect(activity['cat-groceries']).toBe(Currency.toCents(50));

    // El disponible de 'cat-groceries' debe ser Asignado ($300) + Actividad ($50) = $350
    const catBalances = calculateCategoryBalances(mockCategories, assignments, activity, currentMonth);
    expect(catBalances['cat-groceries'].availableCents).toBe(Currency.toCents(350));
  });

  it('Caso 3: Transferencias entre cuentas on-budget NO alteran categorías ni Ready to Assign', () => {
    const currentMonth = '2026-09';
    const transferAmount = Currency.toCents(300); // $300 de Checking a Savings

    const { debitTx, creditTx } = createTransferPair(
      'acc-checking',
      'acc-savings',
      transferAmount,
      '2026-09-10',
      'payee-transfer',
      'Ahorro mensual'
    );

    const transactions = [debitTx, creditTx];

    // Saldos de cuentas actualizados
    const balances = calculateAccountBalances(mockAccounts, transactions);
    expect(balances['acc-checking']).toBe(Currency.toCents(700)); // 1000 - 300
    expect(balances['acc-savings']).toBe(Currency.toCents(800)); // 500 + 300

    // Actividad en categorías debe ser CERO (ninguna categoría afectada)
    const activity = calculateCategoryActivity(transactions, currentMonth);
    expect(Object.keys(activity).length).toBe(0);

    // Ready to Assign permanece exactamente igual
    const rta = calculateReadyToAssign(mockAccounts, transactions, [], currentMonth);
    expect(rta).toBe(Currency.toCents(1500)); // 1000 + 500
  });

  it('Caso 4: Validación de transferencias a la misma cuenta', () => {
    const result = validateTransfer('acc-checking', 'acc-checking', 100);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('no pueden ser la misma');
  });

  it('Caso 5: Transacciones divididas (Split Transactions) y validación de suma estricta', () => {
    const totalCents = Currency.toCents(-100); // Ticket de supermercado de $100

    // Split balanceado: $70 Comida + $30 Limpieza
    const balancedSplits: TransactionSplit[] = [
      { id: 's1', categoryId: 'cat-groceries', amountCents: Currency.toCents(-70) },
      { id: 's2', categoryId: 'cat-rent', amountCents: Currency.toCents(-30) },
    ];

    const valBalanced = validateSplitTransaction(totalCents, balancedSplits);
    expect(valBalanced.isValid).toBe(true);
    expect(valBalanced.remainingCents).toBe(0);

    // Split desbalanceado (falta asignar $20)
    const unbalancedSplits: TransactionSplit[] = [
      { id: 's1', categoryId: 'cat-groceries', amountCents: Currency.toCents(-80) },
    ];
    const valUnbalanced = validateSplitTransaction(totalCents, unbalancedSplits);
    expect(valUnbalanced.isValid).toBe(false);
    expect(valUnbalanced.remainingCents).toBe(Currency.toCents(-20)); // Faltan $20
  });

  it('Caso 6: Sobregasto (Overspending) se calcula en negativo y activa indicador isOverspent', () => {
    const currentMonth = '2026-09';
    const assignments: BudgetAssignment[] = [
      { month: currentMonth, categoryId: 'cat-dining', assignedCents: Currency.toCents(40) }, // Solo asignó $40
    ];

    // Gasto de $90 en Salidas
    const transactions: Transaction[] = [
      {
        id: 'tx-party',
        accountId: 'acc-checking',
        date: '2026-09-12',
        amountCents: Currency.toCents(-90),
        payeeId: 'payee-bar',
        categoryId: 'cat-dining',
        type: 'STANDARD',
      },
    ];

    const activity = calculateCategoryActivity(transactions, currentMonth);
    const balances = calculateCategoryBalances(mockCategories, assignments, activity, currentMonth);

    // Disponible debe ser 40 - 90 = -50
    expect(balances['cat-dining'].availableCents).toBe(Currency.toCents(-50));
    expect(balances['cat-dining'].isOverspent).toBe(true);
  });

  it('Caso 7: Ecuación Fundamental de Conservación de YNAB', () => {
    const currentMonth = '2026-09';
    // Cuentas con $1500 iniciales
    const accounts = mockAccounts;

    // Asignaciones: $500 a Groceries, $600 a Rent = $1100 asignado
    const assignments: BudgetAssignment[] = [
      { month: currentMonth, categoryId: 'cat-groceries', assignedCents: Currency.toCents(500) },
      { month: currentMonth, categoryId: 'cat-rent', assignedCents: Currency.toCents(600) },
    ];

    // Gasto de $100 en Groceries
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-checking',
        date: '2026-09-02',
        amountCents: Currency.toCents(-100),
        payeeId: 'payee-super',
        categoryId: 'cat-groceries',
        type: 'STANDARD',
      },
    ];

    // 1. Total en cuentas
    const accountBalances = calculateAccountBalances(accounts, transactions);
    const totalCashInAccounts = Object.values(accountBalances).reduce((a, b) => a + b, 0);
    // Inicial $1500 - Gasto $100 = $1400
    expect(totalCashInAccounts).toBe(Currency.toCents(1400));

    // 2. Ready to Assign
    // Total entrada $1500 - Asignado $1100 = $400
    const rta = calculateReadyToAssign(accounts, transactions, assignments, currentMonth);
    expect(rta).toBe(Currency.toCents(400));

    // 3. Total disponible en categorías
    const activity = calculateCategoryActivity(transactions, currentMonth);
    const catBalances = calculateCategoryBalances(mockCategories, assignments, activity, currentMonth);
    const totalAvailableInCategories = Object.values(catBalances).reduce(
      (sum, c) => sum + c.availableCents,
      0
    );
    // Groceries ($500 - $100 = $400) + Rent ($600) = $1000
    expect(totalAvailableInCategories).toBe(Currency.toCents(1000));

    // Verificación de la ecuación:
    // Total en Cuentas ($1400) = Ready to Assign ($400) + Total Disponible ($1000)
    expect(totalCashInAccounts).toBe(rta + totalAvailableInCategories);
  });

  describe('Caso Borde CB-03: Integridad referencial en eliminación y reasignación de categorías', () => {
    it('debe contar con precisión las referencias de una categoría en transacciones simples y splits', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          accountId: 'acc-checking',
          date: '2026-09-01',
          amountCents: -5000,
          payeeId: 'p1',
          categoryId: 'cat-groceries',
          type: 'STANDARD',
        },
        {
          id: 'tx-2',
          accountId: 'acc-checking',
          date: '2026-09-02',
          amountCents: -8000,
          payeeId: 'p2',
          categoryId: null,
          type: 'SPLIT',
          splits: [
            { id: 's1', categoryId: 'cat-groceries', amountCents: -3000 },
            { id: 's2', categoryId: 'cat-rent', amountCents: -5000 },
          ],
        },
      ];

      // cat-groceries tiene 1 transacción simple + 1 en split = 2 referencias
      expect(countCategoryUsage('cat-groceries', transactions)).toBe(2);
      // cat-rent tiene 1 split = 1 referencia
      expect(countCategoryUsage('cat-rent', transactions)).toBe(1);
      // cat-dining tiene 0 referencias
      expect(countCategoryUsage('cat-dining', transactions)).toBe(0);
    });

    it('debe reasignar limpiamente transacciones y splits a la categoría destino sin perder registros', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          accountId: 'acc-checking',
          date: '2026-09-01',
          amountCents: -5000,
          payeeId: 'p1',
          categoryId: 'cat-groceries',
          type: 'STANDARD',
        },
        {
          id: 'tx-2',
          accountId: 'acc-checking',
          date: '2026-09-02',
          amountCents: -8000,
          payeeId: 'p2',
          categoryId: null,
          type: 'SPLIT',
          splits: [
            { id: 's1', categoryId: 'cat-groceries', amountCents: -3000 },
            { id: 's2', categoryId: 'cat-rent', amountCents: -5000 },
          ],
        },
      ];

      const reallocated = reassignCategoryInTransactions('cat-groceries', 'cat-dining', transactions);

      // Ahora cat-groceries debe tener 0 referencias
      expect(countCategoryUsage('cat-groceries', reallocated)).toBe(0);
      // cat-dining debe tener 2 referencias
      expect(countCategoryUsage('cat-dining', reallocated)).toBe(2);
      // La transacción simple ahora apunta a cat-dining
      expect(reallocated[0].categoryId).toBe('cat-dining');
      // El split correspondiente ahora apunta a cat-dining
      expect(reallocated[1].splits?.[0].categoryId).toBe('cat-dining');
    });

    it('debe consolidar asignaciones presupuestarias al reasignar una categoría para conservar la ecuación de YNAB', () => {
      const assignments: BudgetAssignment[] = [
        { month: '2026-09', categoryId: 'cat-groceries', assignedCents: 30000 }, // $300
        { month: '2026-09', categoryId: 'cat-dining', assignedCents: 10000 },    // $100
        { month: '2026-10', categoryId: 'cat-groceries', assignedCents: 25000 }, // $250
      ];

      const consolidated = reassignCategoryAssignments('cat-groceries', 'cat-dining', assignments);

      // cat-groceries ya no debe tener asignaciones
      expect(consolidated.find((a) => a.categoryId === 'cat-groceries')).toBeUndefined();

      // cat-dining en 2026-09 debe tener $300 + $100 = $400 (40000 centavos)
      const assignSep = consolidated.find((a) => a.categoryId === 'cat-dining' && a.month === '2026-09');
      expect(assignSep?.assignedCents).toBe(40000);

      // cat-dining en 2026-10 debe recibir los $250 (25000 centavos)
      const assignOct = consolidated.find((a) => a.categoryId === 'cat-dining' && a.month === '2026-10');
      expect(assignOct?.assignedCents).toBe(25000);

      // La suma total asignada permanece idéntica ($650 en total)
      const originalTotal = assignments.reduce((sum, a) => sum + a.assignedCents, 0);
      const newTotal = consolidated.reduce((sum, a) => sum + a.assignedCents, 0);
      expect(newTotal).toBe(originalTotal);
    });
  });
});
