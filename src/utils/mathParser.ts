export interface MathEvaluationResult {
  success: boolean;
  value?: number;
  error?: string;
}

type TokenType = 'NUMBER' | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: number | string;
}

/**
 * Tokenizador de expresiones matemáticas
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  // Normalizar comas a puntos para decimales
  const sanitized = input.replace(/,/g, '.').trim();

  while (i < sanitized.length) {
    const char = sanitized[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '+') {
      tokens.push({ type: 'PLUS', value: '+' });
      i++;
    } else if (char === '-') {
      tokens.push({ type: 'MINUS', value: '-' });
      i++;
    } else if (char === '*' || char === 'x' || char === 'X') {
      tokens.push({ type: 'MULTIPLY', value: '*' });
      i++;
    } else if (char === '/') {
      tokens.push({ type: 'DIVIDE', value: '/' });
      i++;
    } else if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
    } else if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
    } else if (/[\d.]/.test(char)) {
      let numStr = '';
      let decimalCount = 0;
      while (i < sanitized.length && /[\d.]/.test(sanitized[i])) {
        if (sanitized[i] === '.') {
          decimalCount++;
          if (decimalCount > 1) {
            throw new Error('Número con múltiples puntos decimales');
          }
        }
        numStr += sanitized[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
    } else {
      throw new Error(`Carácter no reconocido: "${char}"`);
    }
  }

  return tokens;
}

/**
 * Parser de descenso recursivo para evaluar expresiones de forma 100% segura (sin eval)
 * Gramática:
 *   Expr   = Term (('+' | '-') Term)*
 *   Term   = Factor (('*' | '/') Factor)*
 *   Factor = ('+' | '-')? (NUMBER | '(' Expr ')')
 */
class MathParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.current];
  }

  private consume(): Token {
    return this.tokens[this.current++];
  }

  public parse(): number {
    if (this.tokens.length === 0) {
      throw new Error('Expresión vacía');
    }
    const result = this.parseExpression();
    if (this.current < this.tokens.length) {
      throw new Error('Sintaxis inválida en la expresión');
    }
    return result;
  }

  private parseExpression(): number {
    let result = this.parseTerm();

    while (this.peek()?.type === 'PLUS' || this.peek()?.type === 'MINUS') {
      const op = this.consume().type;
      const right = this.parseTerm();
      if (op === 'PLUS') {
        result += right;
      } else {
        result -= right;
      }
    }

    return result;
  }

  private parseTerm(): number {
    let result = this.parseFactor();

    while (this.peek()?.type === 'MULTIPLY' || this.peek()?.type === 'DIVIDE') {
      const op = this.consume().type;
      const right = this.parseFactor();
      if (op === 'MULTIPLY') {
        result *= right;
      } else {
        if (right === 0) {
          throw new Error('División por cero no permitida');
        }
        result /= right;
      }
    }

    return result;
  }

  private parseFactor(): number {
    // Manejo de signos unarios (+ o -)
    if (this.peek()?.type === 'PLUS') {
      this.consume();
      return this.parseFactor();
    }
    if (this.peek()?.type === 'MINUS') {
      this.consume();
      return -this.parseFactor();
    }

    const token = this.peek();

    if (!token) {
      throw new Error('Se esperaba un número o paréntesis');
    }

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value as number;
    }

    if (token.type === 'LPAREN') {
      this.consume(); // Consumir '('
      const result = this.parseExpression();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error('Paréntesis de cierre faltante');
      }
      this.consume(); // Consumir ')'
      return result;
    }

    throw new Error('Sintaxis inesperada');
  }
}

/**
 * Función pública para evaluar de forma segura cualquier string de cálculo
 */
export function evaluateMathExpression(input: string): MathEvaluationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: true, value: 0 };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new MathParser(tokens);
    const value = parser.parse();

    if (isNaN(value) || !isFinite(value)) {
      return { success: false, error: 'El resultado no es un número válido' };
    }

    // Redondear a 2 decimales para precisión financiera
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return { success: true, value: rounded };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Expresión matemática inválida',
    };
  }
}
