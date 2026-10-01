import { Users, DollarSign, Clock, ShieldCheck, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { authService, getAuditLogs } from '../../services/authService';
import { Currency } from '../../types';

export function AdminDashboardPage() {
  const { accountBalances } = useBudget();
  const profiles = authService.getAllProfiles();
  const auditLogs = getAuditLogs();

  const totalFunds = Object.values(accountBalances).reduce((a, b) => a + b, 0);
  const totalUsers = profiles.length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Panel de Control Ejecutivo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervisión integral de métricas, seguridad y estado general de la Plataforma YNAB
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Sistema 100% Operativo
          </span>
        </div>
      </div>

      {/* Tarjetas de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Usuarios Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Usuarios Registrados
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {profiles.filter((p) => p.role === 'client').length} Clientes / {profiles.filter((p) => p.role === 'admin').length} Admins
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Fondos Totales Presupuestados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fondos en Plataforma
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {Currency.format(totalFunds)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Dinero activo en sobres
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Cuentas Gratuitas Activas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cuentas Gratuitas Activas
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">
              Acceso libre e ilimitado para usuarios
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Estado del Servicio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Estado del Servicio
            </p>
            <h3 className="text-sm font-black text-slate-900 mt-2 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full mr-2 bg-emerald-500" />
              100% Operativo
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Servicios financieros activos
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Actividad Reciente y Resumen de Auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registro Rápido de Auditoría */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Últimos Eventos de Auditoría
            </h3>
            <span className="text-xs text-slate-400 font-medium">Tiempo real</span>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-medium">
                No hay eventos de auditoría registrados aún en la plataforma.
              </p>
            ) : (
              auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-blue-600 font-medium">{log.userEmail}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen de Capacidades YNAB Activas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
            Servicios del Ecosistema Activo
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900">Motor de Presupuesto en Base Cero</p>
                <p className="text-blue-700 mt-0.5">Conservación estricta de saldos en centavos enteros</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                Activo
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900">Inspector de Metas de Ahorro</p>
                <p className="text-emerald-700 mt-0.5">Seguimiento mensual de objetivos y auto-asignación</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                Activo
              </span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-indigo-900">Simulador Bancario Integrado</p>
                <p className="text-indigo-700 mt-0.5">Generación controlada de nóminas y transacciones comerciales</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]">
                Activo
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-900">Mesa de Soporte al Cliente</p>
                <p className="text-amber-700 mt-0.5">Widget interactivo con atención directa para usuarios</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
                Activo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
