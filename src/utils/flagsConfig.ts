import { FlagColor } from '../types';

export interface FlagItem {
  id: FlagColor;
  label: string; // Nombre del color en español
  name: string; // Significado contable personalizado
  colorHex: string;
  dotClass: string;
  badgeClass: string;
  borderClass: string;
}

export const DEFAULT_FLAGS: FlagItem[] = [
  {
    id: 'red',
    label: 'Rojo',
    name: 'Gasto Urgente / Prioritario',
    colorHex: '#ef4444',
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    borderClass: 'border-red-400',
  },
  {
    id: 'orange',
    label: 'Naranja',
    name: 'Deducible de Impuestos',
    colorHex: '#f97316',
    dotClass: 'bg-orange-500',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    borderClass: 'border-orange-400',
  },
  {
    id: 'yellow',
    label: 'Amarillo',
    name: 'Pendiente de Factura / Revisión',
    colorHex: '#f59e0b',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    borderClass: 'border-amber-400',
  },
  {
    id: 'green',
    label: 'Verde',
    name: 'Gasto Reembolsable',
    colorHex: '#10b981',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderClass: 'border-emerald-400',
  },
  {
    id: 'blue',
    label: 'Azul',
    name: 'Gasto Personal / Discrecional',
    colorHex: '#3b82f6',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    borderClass: 'border-blue-400',
  },
  {
    id: 'purple',
    label: 'Morado',
    name: 'Suscripción / Cargo Recurrente',
    colorHex: '#8b5cf6',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    borderClass: 'border-purple-400',
  },
];

const STORAGE_KEY = 'ynab_flags_config_v2';

export function getFlagsConfig(): FlagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_FLAGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_FLAGS;
    }
    // Combinar con los defaults para asegurar que siempre haya nombre y estilos válidos
    return DEFAULT_FLAGS.map((defaultFlag) => {
      const found = parsed.find((p: any) => p.id === defaultFlag.id);
      return {
        ...defaultFlag,
        name: found && found.name && found.name.trim() ? found.name.trim() : defaultFlag.name,
      };
    });
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function saveFlagsConfig(flags: FlagItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    // Disparar evento para que otros componentes sincronizados actualicen su vista
    window.dispatchEvent(new Event('ynab_flags_updated'));
  } catch (e) {
    console.warn('Error saving flags config:', e);
  }
}

export function resetFlagsConfig(): FlagItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('ynab_flags_updated'));
  } catch (e) {
    console.warn('Error resetting flags config:', e);
  }
  return DEFAULT_FLAGS;
}

export function getFlagById(id?: string | null): FlagItem | undefined {
  if (!id) return undefined;
  const current = getFlagsConfig();
  return current.find((f) => f.id === id);
}
