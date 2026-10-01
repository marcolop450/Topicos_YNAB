import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Layers,
  HeartHandshake,
  Compass,
  Coins,
  Check,
  Menu,
  X,
  PieChart,
  Target,
  WalletCards,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRule, setActiveRule] = useState<number>(1);

  const rulesData = [
    {
      num: 1,
      title: 'Dale un trabajo a cada dólar',
      desc: 'Asigna todo el dinero que tienes en tus manos a categorías específicas antes de gastarlo, dejando Listo para Asignar en cero.',
      icon: Layers,
      color: 'emerald',
      detail: 'Antes de que comience el mes, decide qué hará cada centavo que tienes hoy. La comida, el alquiler o tus ahorros: nada se gasta sin intención.',
    },
    {
      num: 2,
      title: 'Acepta tus gastos reales',
      desc: 'Divide los gastos anuales o imprevistos (seguros, impuestos, mantenimiento) en cuotas mensuales manejables mediante metas de ahorro.',
      icon: Compass,
      color: 'blue',
      detail: 'Las emergencias predecibles (el seguro semestral, la matrícula anual) ya no son sorpresas si apartas una porción constante cada mes.',
    },
    {
      num: 3,
      title: 'Ajusta tus velas',
      desc: 'Cuando surja un sobregasto en una categoría, simplemente transfiere fondos desde otra con saldo positivo sin culpas ni estrés.',
      icon: HeartHandshake,
      color: 'amber',
      detail: 'La vida es dinámica y tu presupuesto también debe serlo. Si gastaste más en alimentación, muévelo de salidas y mantén el equilibrio.',
    },
    {
      num: 4,
      title: 'Envejece tu dinero',
      desc: 'Vive con el dinero que ganaste el mes pasado, rompiendo de manera definitiva el ciclo de vivir de sueldo a sueldo.',
      icon: Coins,
      color: 'purple',
      detail: 'El objetivo de YNAB: que los ingresos cobrados hoy paguen las cuentas del próximo mes. Máxima tranquilidad financiera.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* 1. Barra de Navegación Pública y Totalmente Responsiva */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo y Marca */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ynab-blue to-blue-600 flex items-center justify-center font-display font-black text-2xl text-emerald-300 shadow-md group-hover:scale-105 transition-transform">
              Y
            </div>
            <div>
              <span className="text-2xl font-display font-black tracking-tight text-slate-900">YNAB</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 ml-2 px-2 py-0.5 rounded-full uppercase tracking-wider">
                100% Gratuito
              </span>
            </div>
          </Link>

          {/* Enlaces de Navegación de Escritorio */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#rules" className="hover:text-blue-600 transition-colors">
              Las 4 Reglas
            </a>
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Herramientas
            </a>
            <a href="#method" className="hover:text-blue-600 transition-colors">
              El Método
            </a>
          </nav>

          {/* Acciones de Cuenta (Escritorio) - Siempre visibles */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors px-3 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
            >
              Registrarse Gratis
            </Link>

            {isAuthenticated && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  to="/app/budget"
                  className="px-3.5 py-2 rounded-xl bg-ynab-blue text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-ynab-blue-light transition-all"
                >
                  Mi Presupuesto
                </Link>
                <button
                  onClick={logout}
                  title="Cerrar sesión activa"
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                >
                  Salir
                </button>
              </div>
            )}
          </div>

          {/* Botón de Menú Móvil */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
            <a
              href="#rules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Las 4 Reglas
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              Herramientas
            </a>
            <a
              href="#method"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-blue-600"
            >
              El Método
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider"
              >
                Registrarse Gratis
              </Link>

              {isAuthenticated && (
                <div className="flex items-center space-x-2 pt-2">
                  <Link
                    to="/app/budget"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-ynab-blue text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Mi Presupuesto
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section Luminosa y Elegante (Sin el mockup de la foto solicitada quitar) */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Presupuesto en base cero para todos • Acceso 100% Libre y Gratuito</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-slate-900 leading-[1.15]">
            Toma el control total de cada dólar con el{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              método en base cero.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Asigna todo tu dinero antes de gastarlo. Elimina la incertidumbre financiera, planifica tus metas reales y alcanza la tranquilidad económica que mereces.
          </p>

          {/* Botones Principales Claros para Registrarse o Acceder */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Crear Cuenta Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/budget"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <PieChart className="w-4 h-4 text-slate-500" />
              <span>Ver Presupuesto Directo</span>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              Acceso ilimitado para siempre
            </span>
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
              Sin tarjetas ni cobros ocultos
            </span>
          </div>
        </div>
      </section>

      {/* 3. Las 4 Reglas Fundamentales de YNAB */}
      <section id="rules" className="py-20 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Metodología Comprobada
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
              Las 4 Reglas para Transformar tus Finanzas
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              No es solo una hoja de cálculo. Es un sistema probado que cambia la manera en que te relacionas con tu dinero.
            </p>
          </div>

          {/* Cuadrícula interactiva y responsiva de Reglas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rulesData.map((r) => {
              const Icon = r.icon;
              const isSelected = activeRule === r.num;
              return (
                <div
                  key={r.num}
                  onClick={() => setActiveRule(r.num)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all space-y-3 bg-white ${
                    isSelected
                      ? 'border-2 border-blue-600 shadow-xl shadow-blue-500/10 scale-[1.02]'
                      : 'border border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                      r.num === 1
                        ? 'bg-emerald-50 text-emerald-600'
                        : r.num === 2
                        ? 'bg-blue-50 text-blue-600'
                        : r.num === 3
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      r.num === 1
                        ? 'text-emerald-700'
                        : r.num === 2
                        ? 'text-blue-700'
                        : r.num === 3
                        ? 'text-amber-700'
                        : 'text-purple-700'
                    }`}
                  >
                    Regla {r.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Detalle ampliado de la regla seleccionada */}
          {(() => {
            const currentRule = rulesData.find((r) => r.num === activeRule) || rulesData[0];
            return (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                    Enfoque Práctico • Regla #{currentRule.num}
                  </span>
                  <h4 className="text-xl font-display font-bold text-slate-900 mb-2">{currentRule.title}</h4>
                  <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{currentRule.detail}</p>
                </div>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap shadow-md flex-shrink-0"
                >
                  Comenzar Ahora
                </Link>
              </div>
            );
          })()}

          {/* Testimonio */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-3xl mx-auto space-y-4 shadow-xs">
            <p className="text-base sm:text-lg font-medium text-slate-700 italic leading-relaxed">
              "He ahorrado más en 3 meses usando el método de sobres de YNAB que en los últimos 3 años sin un sistema organizado. Eliminó totalmente el estrés de fin de mes."
            </p>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm font-display">
                ML
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Marco López</p>
                <p className="text-xs text-slate-500">Usuario de Presupuesto Personal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Características de la Plataforma */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            Libre de Costo
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900">
            Todas las Herramientas que Necesitas
          </h2>
          <p className="text-slate-600 text-sm">
            Disfruta de las funciones avanzadas para administrar tus finanzas personales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Sobres y Presupuesto en Base Cero</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crea categorías y grupos a tu gusto, asigna cada ingreso y mantén el control exacto de tus gastos disponibles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Simulador Bancario Integrado</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prueba la inyección de nóminas y pagos con un simulador interactivo para practicar el método sin compromisos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Inspector de Metas de Ahorro</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Define metas mensuales con indicadores visuales de progreso para saber exactamente cuánto necesitas ahorrar.
            </p>
          </div>
        </div>

        {/* Llamada final a la acción */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-ynab-blue to-indigo-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-display font-black">Comienza tu presupuesto hoy</h3>
            <p className="text-sm text-blue-100 mt-1">
              Registro inmediato y 100% gratuito. Sin tarjetas requeridas.
            </p>
          </div>
          <Link
            to="/register"
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-105 whitespace-nowrap"
          >
            Registrarme Gratis
          </Link>
        </div>
      </section>

      {/* 5. Sección El Método (Presupuesto en Base Cero y Sistema de Sobres) */}
      <section id="method" className="py-20 bg-slate-100/60 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Paso a Paso
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
              ¿Cómo Funciona el Método de Sobres Virtuales?
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
              El presupuesto en base cero no predice el futuro: organiza el dinero que tienes en tus manos hoy para que cada peso trabaje con un propósito claro y medible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black mb-3">
                  <WalletCards className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Paso 1
                </span>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">
                  Dinero a la Mesa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Solo se registra dinero real en tus cuentas bancarias o efectivo. Todo ingreso entra al fondo central «Listo para Asignar».
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                Sin proyectar ingresos futuros inexistentes.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Paso 2
                </span>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">
                  Asignar a Sobres
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Distribuyes los fondos en categorías (Alquiler, Comida, Servicios) hasta que la bolsa «Listo para Asignar» sea exactamente $0.00.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                Cada centavo tiene una misión definida.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mb-3">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                  Paso 3
                </span>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">
                  Gastar por Categoría
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Antes de gastar, consultas el saldo «Disponible» de la categoría, no el saldo total de la cuenta. Eso evita sorpresas a fin de mes.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                Gasto consciente y alineado a prioridades.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-3">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
                  Paso 4
                </span>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">
                  Ajustar sin Culpas
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Si surge un imprevisto y sobrepasas un sobre, mueves dinero de otra categoría con saldo favorable. El presupuesto se adapta a ti.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                Flexibilidad total sin perder el control.
              </div>
            </div>
          </div>

          {/* Recuadro de la Ecuación Fundamental de Conservación */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block">
                Ecuación Fundamental del Sistema
              </span>
              <h4 className="text-lg font-display font-black text-slate-900">
                Conservación Estricta de Fondos
              </h4>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Total en Cuentas Líquidas = Listo para Asignar + Suma de Disponible en todas las Categorías. Sin discrepancias matemáticas en ningún mes.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all inline-flex items-center space-x-2"
              >
                <span>Crear Cuenta Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pie de Página */}
      <footer className="border-t border-slate-200 py-8 bg-white text-slate-500 text-xs text-center">
        <p>© 2026 YNAB Presupuesto en Base Cero. Herramienta de gestión financiera personal 100% gratuita.</p>
      </footer>
    </div>
  );
}
