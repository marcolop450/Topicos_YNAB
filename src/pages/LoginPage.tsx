import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertCircle, Info, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email, password);
      // Redirección directa al presupuesto del usuario
      navigate('/app/budget');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center space-x-2 group">
          <div className="w-11 h-11 rounded-2xl bg-ynab-blue flex items-center justify-center font-display font-black text-2xl text-emerald-300 shadow-md group-hover:scale-105 transition-transform">
            Y
          </div>
          <span className="text-2xl font-display font-black tracking-tight text-slate-900">YNAB</span>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          Inicia sesión en tu cuenta
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          ¿No tienes una cuenta aún?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 underline transition-colors">
            Regístrate gratis aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200">
          {error && (
            <div className="mb-4 flex items-center p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-extrabold text-white bg-ynab-blue hover:bg-ynab-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{isLoading ? 'Iniciando sesión...' : 'Ingresar a Mi Presupuesto'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Tarjeta de Usuarios de Prueba */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center text-slate-800 font-bold">
                <Info className="w-4 h-4 mr-1.5 text-blue-600" />
                <span>Usuarios Configurados:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('marco@ynab.test')}
                  className="flex items-center space-x-2 p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl text-left transition-colors shadow-xs"
                >
                  <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[11px] text-slate-800 truncate">Cliente</p>
                    <p className="text-[10px] text-slate-500 truncate">marco@ynab.test</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('admin@ynab.test')}
                  className="flex items-center space-x-2 p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-left transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[11px] text-slate-800 truncate">Admin</p>
                    <p className="text-[10px] text-slate-500 truncate">admin@ynab.test</p>
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Contraseña: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">Password123!</code>
              </p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
              ← Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
