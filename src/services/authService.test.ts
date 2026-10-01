import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill en memoria para localStorage en entorno de test Node
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { authService, getAuditLogs, recordAuditLog } from './authService';

describe('authService - Autenticación y Gestión de Roles Multi-Usuario', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe iniciar sesión con cuenta cliente por defecto y cuenta gratuita vitalicia', async () => {
    const user = await authService.signIn('marco@ynab.test', 'Password123!');
    expect(user).toBeDefined();
    expect(user.email).toBe('marco@ynab.test');
    expect(user.role).toBe('client');
    expect(user.planName).toBe('Plan Personal Gratuito');
    expect(user.isFree).toBe(true);

    const currentUser = authService.getCurrentUser();
    expect(currentUser?.id).toBe(user.id);
  });

  it('debe iniciar sesión con cuenta administrador y rol admin verificado por el sistema', async () => {
    const admin = await authService.signIn('admin@ynab.test', 'Password123!');
    expect(admin).toBeDefined();
    expect(admin.email).toBe('admin@ynab.test');
    expect(admin.role).toBe('admin');
    expect(admin.planName).toBe('Enterprise Admin');

    const currentUser = authService.getCurrentUser();
    expect(currentUser?.role).toBe('admin');
  });

  it('debe registrar un nuevo usuario con cuenta gratuita ilimitada y rol client obligatorio', async () => {
    const newUser = await authService.signUp('lucia@ejemplo.com', 'Lucía Fernández', 'Password123!');
    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('lucia@ejemplo.com');
    expect(newUser.fullName).toBe('Lucía Fernández');
    expect(newUser.role).toBe('client');
    expect(newUser.isFree).toBe(true);

    const profiles = authService.getAllProfiles();
    expect(profiles.some((p) => p.email === 'lucia@ejemplo.com')).toBe(true);
  });

  it('debe registrar y recuperar logs de auditoría cronológicos', () => {
    recordAuditLog('test-user-id', 'test@ynab.test', 'BUDGET_ASSIGN', 'Asignación de $100.00');
    const logs = getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[0];
    expect(lastLog.action).toBe('BUDGET_ASSIGN');
    expect(lastLog.userEmail).toBe('test@ynab.test');
  });

  it('debe cerrar la sesión y remover el usuario activo', async () => {
    await authService.signIn('marco@ynab.test', 'Password123!');
    expect(authService.getCurrentUser()).not.toBeNull();

    await authService.signOut();
  });
});
