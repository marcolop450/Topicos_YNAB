import { describe, it, expect } from 'vitest';

describe('Sanity Check - Environment Setup', () => {
  it('should correctly run tests with Vitest', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify basic financial addition consistency in cents', () => {
    // 90 * 6 = 540 (ejemplo clave solicitado por el docente)
    const amount = 90 * 6;
    expect(amount).toBe(540);
  });
});
