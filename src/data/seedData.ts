import {
  Account,
  CategoryGroup,
  Category,
  Payee,
  Transaction,
  BudgetAssignment,
  READY_TO_ASSIGN_CATEGORY_ID,
  Currency,
} from '../types';

export const initialGroups: CategoryGroup[] = [
  { id: 'grp-needs', name: 'Necesidades Inmediatas', sortOrder: 1 },
  { id: 'grp-lifestyle', name: 'Calidad de Vida', sortOrder: 2 },
  { id: 'grp-savings', name: 'Ahorros y Metas', sortOrder: 3 },
];

export const initialCategories: Category[] = [
  { id: 'cat-groceries', groupId: 'grp-needs', name: 'Supermercado y Alimentos', sortOrder: 1 },
  { id: 'cat-rent', groupId: 'grp-needs', name: 'Alquiler y Vivienda', sortOrder: 2 },
  { id: 'cat-utilities', groupId: 'grp-needs', name: 'Servicios (Luz/Agua/Internet)', sortOrder: 3 },
  { id: 'cat-dining', groupId: 'grp-lifestyle', name: 'Restaurantes y Salidas', sortOrder: 1 },
  { id: 'cat-fitness', groupId: 'grp-lifestyle', name: 'Gimnasio y Deportes', sortOrder: 2 },
  { id: 'cat-emergency', groupId: 'grp-savings', name: 'Fondo de Emergencia', sortOrder: 1 },
  { id: 'cat-vacations', groupId: 'grp-savings', name: 'Vacaciones', sortOrder: 2 },
];

export const initialAccounts: Account[] = [
  {
    id: 'acc-checking',
    name: 'Banco Principal (Cuenta Corriente)',
    type: 'CHECKING',
    initialBalanceCents: Currency.toCents(2500), // $2,500.00
    isActive: true,
  },
  {
    id: 'acc-savings',
    name: 'Caja de Ahorro',
    type: 'SAVINGS',
    initialBalanceCents: Currency.toCents(1200), // $1,200.00
    isActive: true,
  },
  {
    id: 'acc-cash',
    name: 'Efectivo en Billetera',
    type: 'CASH',
    initialBalanceCents: Currency.toCents(150), // $150.00
    isActive: true,
  },
];

export const initialPayees: Payee[] = [
  { id: 'payee-employer', name: 'Empresa Empleadora', isSystem: false },
  { id: 'payee-market', name: 'Supermercado Carrefour', isSystem: false },
  { id: 'payee-landlord', name: 'Inmobiliaria / Propietario', isSystem: false },
  { id: 'payee-restaurant', name: 'Restaurante La Esquina', isSystem: false },
  { id: 'payee-transfer', name: 'Transferencia entre cuentas', isSystem: true },
];

export const initialTransactions: Transaction[] = [
  // 1. Ingreso estándar a Ready to Assign
  {
    id: 'tx-init-salary',
    accountId: 'acc-checking',
    date: '2026-09-01',
    amountCents: Currency.toCents(1800), // +$1,800.00
    payeeId: 'payee-employer',
    categoryId: READY_TO_ASSIGN_CATEGORY_ID,
    type: 'STANDARD',
    memo: 'Nómina / Sueldo del mes',
  },
  // 2. Gasto simple en Alquiler
  {
    id: 'tx-rent-paid',
    accountId: 'acc-checking',
    date: '2026-09-02',
    amountCents: Currency.toCents(-800), // -$800.00
    payeeId: 'payee-landlord',
    categoryId: 'cat-rent',
    type: 'STANDARD',
    memo: 'Pago alquiler mensual',
  },
  // 3. Transacción Dividida (Split Transaction): Supermercado con Comida y Limpieza
  {
    id: 'tx-split-market',
    accountId: 'acc-checking',
    date: '2026-09-05',
    amountCents: Currency.toCents(-140), // -$140.00 en total
    payeeId: 'payee-market',
    categoryId: null,
    type: 'SPLIT',
    memo: 'Compra mensual con varios rubros',
    splits: [
      {
        id: 'split-1',
        categoryId: 'cat-groceries',
        amountCents: Currency.toCents(-100), // $100 Comida
        memo: 'Alimentos y carnes',
      },
      {
        id: 'split-2',
        categoryId: 'cat-utilities',
        amountCents: Currency.toCents(-40), // $40 Artículos del hogar
        memo: 'Limpieza y mantenimiento',
      },
    ],
  },
  // 4. Ingreso directo a un sobre (Reembolso de cena compartida)
  {
    id: 'tx-dinner-refund',
    accountId: 'acc-checking',
    date: '2026-09-10',
    amountCents: Currency.toCents(35), // +$35.00
    payeeId: 'payee-restaurant',
    categoryId: 'cat-dining',
    type: 'STANDARD',
    memo: 'Amigo me transfirió su parte de la cena',
  },
];

export const initialAssignments: BudgetAssignment[] = [
  { month: '2026-09', categoryId: 'cat-rent', assignedCents: Currency.toCents(800) },
  { month: '2026-09', categoryId: 'cat-groceries', assignedCents: Currency.toCents(400) },
  { month: '2026-09', categoryId: 'cat-utilities', assignedCents: Currency.toCents(150) },
  { month: '2026-09', categoryId: 'cat-dining', assignedCents: Currency.toCents(120) },
  { month: '2026-09', categoryId: 'cat-fitness', assignedCents: Currency.toCents(60) },
  { month: '2026-09', categoryId: 'cat-emergency', assignedCents: Currency.toCents(500) },
];
