import React, { useState, useEffect } from 'react';
import { X, Tag, Check, RotateCcw, Sparkles } from 'lucide-react';
import { getFlagsConfig, saveFlagsConfig, resetFlagsConfig, FlagItem } from '../../utils/flagsConfig';

interface FlagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlagsModal: React.FC<FlagsModalProps> = ({ isOpen, onClose }) => {
  const [flags, setFlags] = useState<FlagItem[]>(() => getFlagsConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFlags(getFlagsConfig());
      setSavedSuccess(false);
      setResetNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (id: string, newName: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );
  };

  const handleReset = () => {
    const defaults = resetFlagsConfig();
    setFlags(defaults);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFlagsConfig(flags);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900">
                Banderas y Etiquetas Contables
              </h3>
              <p className="text-xs text-slate-500">
                Asigna significado a los colores para organizar y auditar tus movimientos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-xs text-purple-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Estas etiquetas aparecen como banderas en cada fila de transacción en la vista de <strong>Cuentas</strong>.
              </span>
            </div>
            {resetNotice && (
              <span className="font-bold text-[11px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full shrink-0">
                ¡Valores reestablecidos!
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center space-x-3 p-2.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white transition-colors"
              >
                {/* Indicador de Color y Nombre de Color */}
                <div
                  className={`w-28 px-2.5 py-1.5 rounded-xl border flex items-center space-x-2 ${flag.badgeClass} shrink-0`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${flag.dotClass} shadow-xs shrink-0`} />
                  <span className="font-bold text-xs">{flag.label}</span>
                </div>

                {/* Input de Nombre Personalizado */}
                <input
                  type="text"
                  value={flag.name}
                  onChange={(e) => handleNameChange(flag.id, e.target.value)}
                  placeholder={`Ej. ${flag.label} - Concepto...`}
                  className="flex-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
                />

                {/* Vista Previa de la Píldora */}
                <div className="hidden sm:block shrink-0 max-w-[140px]">
                  <span
                    className={`inline-block truncate px-2.5 py-1 rounded-lg text-[10px] font-bold border ${flag.badgeClass}`}
                    title={flag.name || 'Sin nombre'}
                  >
                    {flag.name || 'Sin etiqueta'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones del Modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Restablecer sugerencias predeterminadas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sugerencias por Defecto</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <span>Guardar Etiquetas</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
