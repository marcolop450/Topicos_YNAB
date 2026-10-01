import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keyCombo: ['Ctrl', 'N'], desc: 'Abrir ventana para nueva transacción' },
  { keyCombo: ['Ctrl', 'B'], desc: 'Ir a la vista de Presupuesto' },
  { keyCombo: ['Ctrl', 'A'], desc: 'Ir a la vista de Cuentas' },
  { keyCombo: ['Ctrl', 'S'], desc: 'Ir al Simulador Bancario' },
  { keyCombo: ['Esc'], desc: 'Cerrar cualquier ventana modal activa' },
  { keyCombo: ['Enter'], desc: 'Confirmar cálculo matemático en campo monetario' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900">Atajos de Teclado</h3>
              <p className="text-xs text-slate-500">Agiliza tu flujo de trabajo contable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de atajos */}
        <div className="p-6 space-y-3">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
            >
              <span className="text-slate-700 font-medium">{s.desc}</span>
              <div className="flex items-center space-x-1">
                {s.keyCombo.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 text-[11px] font-mono font-bold bg-white text-slate-800 border border-slate-300 rounded-md shadow-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
