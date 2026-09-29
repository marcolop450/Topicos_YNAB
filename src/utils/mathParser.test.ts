import { describe, it, expect } from 'vitest';
import { evaluateMathExpression } from './mathParser';

describe('MathParser - Evaluador seguro de calculadora para inputs de monto', () => {
  it('debe evaluar correctamente la multiplicación requerida por el docente (90*6 = 540)', () => {
    const res = evaluateMathExpression('90*6');
    expect(res.success).toBe(true);
    expect(res.value).toBe(540);
  });

  it('debe soportar la letra "x" como operador de multiplicación (ej. 90x6 = 540)', () => {
    const res = evaluateMathExpression('90x6');
    expect(res.success).toBe(true);
    expect(res.value).toBe(540);
  });

  it('debe evaluar operaciones combinadas respetando la precedencia de operadores', () => {
    // 10 + 5 * 2 = 20 (no 30)
    const res = evaluateMathExpression('10 + 5 * 2');
    expect(res.success).toBe(true);
    expect(res.value).toBe(20);
  });

  it('debe respetar paréntesis agrupadores', () => {
    // (10 + 5) * 2 = 30
    const res = evaluateMathExpression('(10 + 5) * 2');
    expect(res.success).toBe(true);
    expect(res.value).toBe(30);
  });

  it('debe manejar decimales con coma o con punto', () => {
    const res1 = evaluateMathExpression('15.50 + 4.50');
    expect(res1.success).toBe(true);
    expect(res1.value).toBe(20);

    const res2 = evaluateMathExpression('12,30 + 7,70');
    expect(res2.success).toBe(true);
    expect(res2.value).toBe(20);
  });

  it('debe detectar división por cero de forma segura sin romper la aplicación', () => {
    const res = evaluateMathExpression('100 / 0');
    expect(res.success).toBe(false);
    expect(res.error).toContain('División por cero no permitida');
  });

  it('debe capturar errores de sintaxis incompletos o malformados', () => {
    const res1 = evaluateMathExpression('90*');
    expect(res1.success).toBe(false);

    const res3 = evaluateMathExpression('100 // 5');
    expect(res3.success).toBe(false);

    const res4 = evaluateMathExpression('((10+5)');
    expect(res4.success).toBe(false);
    expect(res4.error).toContain('Paréntesis');
  });

  it('debe manejar un número simple sin operaciones', () => {
    const res = evaluateMathExpression('350.75');
    expect(res.success).toBe(true);
    expect(res.value).toBe(350.75);
  });
});
