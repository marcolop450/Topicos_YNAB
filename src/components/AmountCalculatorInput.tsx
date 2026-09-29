import React, { useState, useEffect, useRef } from 'react';
import { Calculator, AlertCircle, Check } from 'lucide-react';
import { evaluateMathExpression } from '../utils/mathParser';
import { Currency } from '../types';

interface AmountCalculatorInputProps {
  valueCents: number;
  onChangeCents: (cents: number) => void;
  placeholder?: string;
  className?: string;
  isExpense?: boolean;
  disabled?: boolean;
}

export const AmountCalculatorInput: React.FC<AmountCalculatorInputProps> = ({
  valueCents,
  onChangeCents,
  placeholder = '0.00',
  className = '',
  isExpense = true,
  disabled = false,
}) => {
  // Inicializar con el valor en dólares/pesos decimales
  const [text, setText] = useState<string>(() => {
    return valueCents !== 0 ? Math.abs(Currency.fromCents(valueCents)).toFixed(2) : '';
  });
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar si el prop externo cambia y no estamos editando activamente
  useEffect(() => {
    if (!isFocused) {
      setText(valueCents !== 0 ? Math.abs(Currency.fromCents(valueCents)).toFixed(2) : '');
      setError(null);
    }
  }, [valueCents, isFocused]);

  // Detección de operadores aritméticos para mostrar el modo calculadora
  const isExpression = /[+*\-/xX(]/.test(text);

  // Evaluación en tiempo real para previsualización
  const preview = React.useMemo(() => {
    if (!isExpression || !text.trim()) return null;
    const res = evaluateMathExpression(text);
    return res.success && res.value !== undefined ? res.value : null;
  }, [text, isExpression]);

  const commitValue = () => {
    if (!text.trim()) {
      onChangeCents(0);
      setError(null);
      return;
    }

    const result = evaluateMathExpression(text);
    if (result.success && result.value !== undefined) {
      const positiveValue = Math.abs(result.value);
      const newCents = Currency.toCents(isExpense ? -positiveValue : positiveValue);
      onChangeCents(newCents);
      setText(positiveValue.toFixed(2));
      setError(null);
    } else {
      setError(result.error || 'Expresión inválida');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      // Revertir a valor previo
      setText(valueCents !== 0 ? Math.abs(Currency.fromCents(valueCents)).toFixed(2) : '');
      setError(null);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 font-semibold select-none text-sm">
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            commitValue();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-7 pr-10 py-2 bg-white text-slate-900 font-mono text-base font-semibold border rounded-lg transition-all outline-none ${
            error
              ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
              : isFocused
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
        />

        {/* Indicador de Calculadora o Estado */}
        <div className="absolute right-2.5 flex items-center space-x-1">
          {preview !== null && !error && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitValue();
              }}
              title="Aplicar resultado calculado"
              className="flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition-colors"
            >
              <Check className="w-3 h-3 mr-0.5" />
              ={preview.toFixed(2)}
            </button>
          )}

          {error ? (
            <span title={error} className="text-red-500">
              <AlertCircle className="w-4 h-4" />
            </span>
          ) : isExpression ? (
            <span
              title="Modo Calculadora activo (Presiona Enter o Tab para resolver)"
              className="text-blue-500 animate-pulse"
            >
              <Calculator className="w-4 h-4" />
            </span>
          ) : (
            <span className="text-slate-300">
              <Calculator className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Error Sintáctico si existe */}
      {error && (
        <p className="text-xs text-red-600 mt-1 font-medium flex items-center">
          <AlertCircle className="w-3 h-3 mr-1 inline shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
