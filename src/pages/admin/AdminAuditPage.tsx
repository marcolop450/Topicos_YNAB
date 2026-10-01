import { useState } from 'react';
import { Users, Shield, Search, Filter, CheckCircle2 } from 'lucide-react';
import { authService, getAuditLogs } from '../../services/authService';
import { UserProfile, UserRole } from '../../types';

export function AdminAuditPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => authService.getAllProfiles());
  const [auditLogs] = useState(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const handleToggleRole = (userId: string, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === 'admin' ? 'client' : 'admin';
    const updated = profiles.map((p) => (p.id === userId ? { ...p, role: newRole } : p));
    setProfiles(updated);
    localStorage.setItem('ynab_mock_profiles_v1', JSON.stringify(updated));
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8">
      {/* Sección 1: Gestión de Usuarios y Roles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Usuarios Registrados en Plataforma</h2>
              <p className="text-xs text-slate-500">Gestión de roles y estado de acceso de cuentas</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            Total: {profiles.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Usuario</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-center">Rol Asignado</th>
                <th className="px-6 py-3 text-center">Estado del Plan</th>
                <th className="px-6 py-3 text-right">Acción de Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{p.fullName}</span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                    {p.email}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        p.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {p.role === 'admin' ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <Users className="w-3 h-3 mr-1" />
                      )}
                      {p.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Cuenta Gratuita Ilimitada
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleToggleRole(p.id, p.role)}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg font-bold transition-colors border border-slate-200"
                    >
                      Cambiar a {p.role === 'admin' ? 'Cliente' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Bitácora de Auditoría en Tiempo Real */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Bitácora de Auditoría (Audit Trail)</h2>
            <p className="text-xs text-slate-500">
              Registro inmutable de actividades y eventos críticos de la plataforma
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar evento o email..."
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_REGISTER">USER_REGISTER</option>
                <option value="BUDGET_ASSIGN">BUDGET_ASSIGN</option>
                <option value="USER_LOGOUT">USER_LOGOUT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Fecha y Hora</th>
                <th className="px-6 py-3 text-left">Acción</th>
                <th className="px-6 py-3 text-left">Usuario Involucrado</th>
                <th className="px-6 py-3 text-left">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-blue-600 font-semibold">
                      {log.userEmail}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
