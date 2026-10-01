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
  calculateMonthlyChain,
  calculateTargetProgress,
} from './budgetEngine';
import {
  Account,
  Category,
  Transaction,
  BudgetAssignment,
  READY_TO_ASSIGN_CATEGORY_ID,
  TransactionSplit,
  Currency,
  CategoryTarget,
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

  describe('Rollover acumulativo entre meses (Cumulative Carryover)', () => {
    it('debe trasladar el saldo positivo disponible (superávit) al mes siguiente', () => {
      const accounts: Account[] = [
        { id: 'acc-1', name: 'Banco', type: 'CHECKING', initialBalanceCents: 100000, isActive: true }, // $1,000.00
      ];
      const categories: Category[] = [
        { id: 'cat-food', groupId: 'g1', name: 'Comida', sortOrder: 1 },
      ];
      // Mes 1: 2026-09 -> Asigna $400, gasta $100. Saldo restante: $300 (30000 centavos)
      const assignments: BudgetAssignment[] = [
        { month: '2026-09', categoryId: 'cat-food', assignedCents: 40000 },
      ];
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          accountId: 'acc-1',
          date: '2026-09-05',
          amountCents: -10000,
          payeeId: 'p1',
          categoryId: 'cat-food',
          type: 'STANDARD',
        },
      ];

      // Verificación en Septiembre (Mes 1)
      const sepBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-09');
      expect(sepBudget.categoryBalances['cat-food'].availableCents).toBe(30000); // $300
      expect(sepBudget.previousAvailable['cat-food'] || 0).toBe(0);

      // Verificación en Octubre (Mes 2) sin asignaciones ni gastos nuevos
      const octBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-10');
      // Debe arrastrar los $300 como previousAvailable
      expect(octBudget.previousAvailable['cat-food']).toBe(30000);
      // El disponible en Octubre debe ser $300
      expect(octBudget.categoryBalances['cat-food'].availableCents).toBe(30000);
      expect(octBudget.categoryBalances['cat-food'].assignedCents).toBe(0);
      expect(octBudget.categoryBalances['cat-food'].activityCents).toBe(0);
    });

    it('debe acumular correctamente si en el mes siguiente se asigna o gasta dinero nuevo', () => {
      const accounts: Account[] = [
        { id: 'acc-1', name: 'Banco', type: 'CHECKING', initialBalanceCents: 150000, isActive: true }, // $1,500.00
      ];
      const categories: Category[] = [
        { id: 'cat-food', groupId: 'g1', name: 'Comida', sortOrder: 1 },
      ];
      // Mes 1 (2026-09): Asigna $400, Gasta $100 -> Sobran $300
      // Mes 2 (2026-10): Asigna $200 más, Gasta $150 -> Disponible = $300 + $200 - $150 = $350
      const assignments: BudgetAssignment[] = [
        { month: '2026-09', categoryId: 'cat-food', assignedCents: 40000 },
        { month: '2026-10', categoryId: 'cat-food', assignedCents: 20000 },
      ];
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          accountId: 'acc-1',
          date: '2026-09-05',
          amountCents: -10000,
          payeeId: 'p1',
          categoryId: 'cat-food',
          type: 'STANDARD',
        },
        {
          id: 'tx-2',
          accountId: 'acc-1',
          date: '2026-10-02',
          amountCents: -15000,
          payeeId: 'p1',
          categoryId: 'cat-food',
          type: 'STANDARD',
        },
      ];

      const octBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-10');
      expect(octBudget.previousAvailable['cat-food']).toBe(30000); // Saldo anterior: $300
      expect(octBudget.categoryBalances['cat-food'].assignedCents).toBe(20000); // Asignado: $200
      expect(octBudget.categoryBalances['cat-food'].activityCents).toBe(-15000); // Gastado: -$150
      expect(octBudget.categoryBalances['cat-food'].availableCents).toBe(35000); // Disponible total: $350
    });

    it('debe aplicar la regla de YNAB para sobregasto en efectivo: resetea sobre a $0 en mes siguiente y descuenta de RTA', () => {
      const accounts: Account[] = [
        { id: 'acc-1', name: 'Banco', type: 'CHECKING', initialBalanceCents: 100000, isActive: true }, // $1,000.00
      ];
      const categories: Category[] = [
        { id: 'cat-food', groupId: 'g1', name: 'Comida', sortOrder: 1 },
      ];
      // Mes 1 (2026-09): Asigna $50, pero gasta $120 -> Sobregasto de -$70
      const assignments: BudgetAssignment[] = [
        { month: '2026-09', categoryId: 'cat-food', assignedCents: 5000 },
      ];
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          accountId: 'acc-1',
          date: '2026-09-10',
          amountCents: -12000,
          payeeId: 'p1',
          categoryId: 'cat-food',
          type: 'STANDARD',
        },
      ];

      // En Septiembre: Disponible es -$70 y marca isOverspent: true
      const sepBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-09');
      expect(sepBudget.categoryBalances['cat-food'].availableCents).toBe(-7000);
      expect(sepBudget.categoryBalances['cat-food'].isOverspent).toBe(true);

      // En Octubre (Mes 2):
      // 1. El sobre resetea a $0 (previousAvailable = 0, available = 0)
      // 2. El sobregasto de -$70 se deduce de Ready to Assign (priorOverspendingCents = 7000)
      const octBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-10');
      expect(octBudget.previousAvailable['cat-food']).toBe(0);
      expect(octBudget.categoryBalances['cat-food'].availableCents).toBe(0);
      expect(octBudget.priorOverspendingCents).toBe(7000);

      // En Octubre, Ready to Assign = Saldo inicial ($1,000) - Asignado sep ($50) - Sobregasto ($70) = $880
      expect(octBudget.readyToAssignCents).toBe(88000);

      // Verificación de conservación en Octubre:
      // Saldo en cuenta = $1,000 - $120 gastado = $880
      // Total sobres ($0) + RTA ($880) = $880. ¡Ecuación perfecta!
      const balances = calculateAccountBalances(accounts, transactions);
      const totalCash = Object.values(balances).reduce((a, b) => a + b, 0);
      const totalAvailable = Object.values(octBudget.categoryBalances).reduce((a, b) => a + b.availableCents, 0);
      expect(totalCash).toBe(octBudget.readyToAssignCents + totalAvailable);
    });

    it('debe conservar la ecuación fundamental a lo largo de 3 meses consecutivos', () => {
      const accounts: Account[] = [
        { id: 'acc-1', name: 'Banco', type: 'CHECKING', initialBalanceCents: 200000, isActive: true }, // $2,000.00
      ];
      const categories: Category[] = [
        { id: 'cat-rent', groupId: 'g1', name: 'Alquiler', sortOrder: 1 },
        { id: 'cat-food', groupId: 'g1', name: 'Comida', sortOrder: 2 },
      ];
      const assignments: BudgetAssignment[] = [
        { month: '2026-08', categoryId: 'cat-rent', assignedCents: 50000 },
        { month: '2026-08', categoryId: 'cat-food', assignedCents: 20000 },
        { month: '2026-09', categoryId: 'cat-rent', assignedCents: 50000 },
        { month: '2026-09', categoryId: 'cat-food', assignedCents: 15000 },
        { month: '2026-10', categoryId: 'cat-food', assignedCents: 25000 },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-1', accountId: 'acc-1', date: '2026-08-10', amountCents: -50000, payeeId: 'p', categoryId: 'cat-rent', type: 'STANDARD' },
        { id: 'tx-2', accountId: 'acc-1', date: '2026-08-20', amountCents: -10000, payeeId: 'p', categoryId: 'cat-food', type: 'STANDARD' },
        { id: 'tx-3', accountId: 'acc-1', date: '2026-09-05', amountCents: -50000, payeeId: 'p', categoryId: 'cat-rent', type: 'STANDARD' },
        { id: 'tx-4', accountId: 'acc-1', date: '2026-09-15', amountCents: -12000, payeeId: 'p', categoryId: 'cat-food', type: 'STANDARD' },
      ];

      for (const m of ['2026-08', '2026-09', '2026-10']) {
        const mBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, m);
        const accBalances = calculateAccountBalances(accounts, transactions.filter(t => t.date.slice(0, 7) <= m));
        const totalCash = Object.values(accBalances).reduce((a, b) => a + b, 0);
        const totalAvailable = Object.values(mBudget.categoryBalances).reduce((a, b) => a + b.availableCents, 0);

        expect(totalCash).toBe(mBudget.readyToAssignCents + totalAvailable);
      }
    });
  });

  describe('Category Targets (Metas de Ahorro)', () => {
    it('debe manejar correctamente cuando no existe meta definida', () => {
      const result = calculateTargetProgress(undefined, {
        categoryId: 'cat-1',
        assignedCents: 5000,
        activityCents: 0,
        availableCents: 5000,
        isOverspent: false,
      });

      expect(result.status).toBe('NO_TARGET');
      expect(result.neededCents).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('debe calcular estado UNDERFUNDED cuando lo asignado es menor que la meta', () => {
      const target: CategoryTarget = {
        id: 't-1',
        categoryId: 'cat-1',
        targetAmountCents: 10000, // $100.00
        targetType: 'MONTHLY_NEEDED',
        dueDayOfMonth: 31,
      };

      const result = calculateTargetProgress(target, {
        categoryId: 'cat-1',
        assignedCents: 4000, // $40.00 asignado
        activityCents: 0,
        availableCents: 4000,
        isOverspent: false,
      });

      expect(result.status).toBe('UNDERFUNDED');
      expect(result.neededCents).toBe(6000); // Faltan $60.00
      expect(result.percentage).toBe(40); // 40%
      expect(result.dueDayOfMonth).toBe(31);
    });

    it('debe calcular estado FUNDED cuando lo asignado es igual o mayor a la meta', () => {
      const target: CategoryTarget = {
        id: 't-2',
        categoryId: 'cat-2',
        targetAmountCents: 8000, // $80.00
        targetType: 'MONTHLY_NEEDED',
      };

      const resultExact = calculateTargetProgress(target, {
        categoryId: 'cat-2',
        assignedCents: 8000, // $80.00
        activityCents: -2000,
        availableCents: 6000,
        isOverspent: false,
      });
      expect(resultExact.status).toBe('FUNDED');
      expect(resultExact.neededCents).toBe(0);
      expect(resultExact.percentage).toBe(100);

      // Superavit asignado
      const resultSurplus = calculateTargetProgress(target, {
        categoryId: 'cat-2',
        assignedCents: 10000, // $100.00
        activityCents: 0,
        availableCents: 10000,
        isOverspent: false,
      });
      expect(resultSurplus.status).toBe('FUNDED');
      expect(resultSurplus.neededCents).toBe(0);
      expect(resultSurplus.percentage).toBe(100);
    });

    it('debe marcar OVERSPENT si la categoría tiene saldo negativo aunque esté asignada', () => {
      const target: CategoryTarget = {
        id: 't-3',
        categoryId: 'cat-3',
        targetAmountCents: 5000,
        targetType: 'MONTHLY_NEEDED',
      };

      const result = calculateTargetProgress(target, {
        categoryId: 'cat-3',
        assignedCents: 5000,
        activityCents: -7000,
        availableCents: -2000,
        isOverspent: true,
      });

      expect(result.status).toBe('OVERSPENT');
    });
  });

  describe('Simulador Bancario y Conservación de Fondos', () => {
    it('debe conservar la ecuación fundamental tras simular inyección de nómina y gastos automáticos', () => {
      const accounts: Account[] = [
        { id: 'acc-sim', name: 'Cuenta Simulador', type: 'CHECKING', initialBalanceCents: 100000, isActive: true }, // $1,000.00
      ];
      const categories: Category[] = [
        { id: 'cat-food', groupId: 'g1', name: 'Alimentos', sortOrder: 1 },
      ];
      const assignments: BudgetAssignment[] = [
        { month: '2026-09', categoryId: 'cat-food', assignedCents: 30000 }, // Asignar $300 a comida
      ];

      // 1. Simular depósito de sueldo de $2,000 inyectando a Ready to Assign
      const salaryTx: Transaction = {
        id: 'tx-sim-salary',
        accountId: 'acc-sim',
        date: '2026-09-02',
        amountCents: 200000,
        payeeId: 'p-empresa',
        categoryId: READY_TO_ASSIGN_CATEGORY_ID,
        type: 'STANDARD',
      };

      // 2. Simular gasto en comercio de $75 en categoría Alimentos
      const expenseTx: Transaction = {
        id: 'tx-sim-expense',
        accountId: 'acc-sim',
        date: '2026-09-03',
        amountCents: -7500,
        payeeId: 'p-mercado',
        categoryId: 'cat-food',
        type: 'STANDARD',
      };

      const transactions = [salaryTx, expenseTx];
      const monthBudget = calculateMonthlyChain(categories, accounts, transactions, assignments, '2026-09');
      const accBalances = calculateAccountBalances(accounts, transactions);

      const totalCashInAccounts = Object.values(accBalances).reduce((a, b) => a + b, 0);
      const totalAvailableInCategories = Object.values(monthBudget.categoryBalances).reduce(
        (a, b) => a + b.availableCents,
        0
      );

      // Total cuentas = $1,000 + $2,000 - $75 = $2,925.00
      expect(totalCashInAccounts).toBe(292500);

      // Comida disponible = $300 - $75 = $225.00
      expect(monthBudget.categoryBalances['cat-food'].availableCents).toBe(22500);

      // Listo para Asignar = $1,000 + $2,000 - $300 = $2,700.00
      expect(monthBudget.readyToAssignCents).toBe(270000);

      // Conservación estricta: Total Cuentas === RTA + Total Disponible en Sobres
      expect(totalCashInAccounts).toBe(monthBudget.readyToAssignCents + totalAvailableInCategories);
    });
  });
});
