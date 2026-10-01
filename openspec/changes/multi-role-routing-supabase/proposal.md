# Proposal

## Why

La aplicación actual cuenta con un motor contable robusto en memoria y componentes aislados de presupuesto, pero operaba en una sola ruta monolítica y carecía de autenticación real, separación de roles y la experiencia completa de YNAB (*You Need A Budget*).

Para convertir el sistema en una plataforma web completa, profesional y **100% gratuita** para los usuarios (sin suscripciones, sin pasarelas de pago ni bloqueos por periodos de prueba), es necesario:
1. Desacoplar la experiencia en rutas especializadas (`/`, `/login`, `/register`, `/onboarding`, `/app/budget`, `/app/accounts`, `/app/bank-simulator`, `/admin`).
2. Introducir dos roles formales mediante Supabase (`client` y `admin`) con aislamiento de datos (RLS) y consola administrativa global.
3. Adoptar una **paleta visual luminosa, clara y moderna** (tonos blancos, azul marino YNAB, esmeralda y pizarra suave), eliminando fondos oscuros para una lectura financiera óptima.
4. Proveer registro e inicio de sesión libres y gratuitos con cuentas personales ilimitadas.
5. Integrar un flujo de bienvenida guiado (*Onboarding Wizard* de 3 pasos) y un Inspector Lateral de Categorías con Metas de Ahorro (*Targets*).
6. Proveer un Simulador Bancario interactivo ("Poner dinero en la mesa") para inyectar sueldos y simular gastos sin depender de APIs bancarias externas.
7. Habilitar un canal de soporte mediante un widget flotante de chat que conecta al cliente con el panel de administración.

## What Changes

* **Enrutamiento Completo Multi-Página (`react-router-dom`):**
  * Landing page pública (`/` o `/landing`) con diseño visual idéntico al estándar YNAB (Hero, 4 reglas, mockup móvil flotante, precios y testimonios).
  * Autenticación (`/login`, `/register`) con Supabase Auth y redirección inteligente según rol.
  * Flujo de bienvenida guiado (`/onboarding`) para nuevos clientes en 3 pasos interactivos.
  * Área de cliente protegida (`/app`): Presupuesto con Inspector de Metas (`/app/budget`), Cuentas y Libro contable (`/app/accounts`) y Simulador Bancario (`/app/bank-simulator`).
  * Consola de administración (`/admin`) para visualización de KPIs globales, auditoría de usuarios y mesa de ayuda de soporte.
* **Autenticación, Perfiles y Roles (Supabase PostgreSQL + RLS):**
  * Esquema de perfiles (`profiles`) con asignación de roles (`client` vs `admin`).
  * Contador de periodo de prueba (*Trial countdown* de 34 días) y menú desplegable del plan del usuario con acceso rápido a ajustes y cierre de sesión.
* **Inspector de Categorías y Metas de Ahorro (*Targets*):**
  * Panel lateral derecho en la vista de presupuesto para configurar metas mensuales (*"Set Aside Another $X.XX Each Month"*).
  * Cálculo reactivo del porcentaje de financiamiento con barras de progreso y colores de estado (amarillo para subfinanciado, verde para meta alcanzada, rojo para sobregiro).
* **Simulador Bancario ("Dinero en la Mesa"):**
  * Panel interactivo para conectar cuentas bancarias simuladas, emitir depósitos de nómina y transacciones automáticas que alimentan la vista de cuentas y *Ready to Assign*.
* **Widget Flotante de Soporte y Chat de Ayuda:**
  * Widget emergente en la esquina inferior derecha para clientes con preguntas frecuentes y mensajería directa en tiempo real con el administrador.
  * Bandeja de entrada de tickets y respuestas para el rol administrador.

## Capabilities

### New Capabilities
- `routing`: Arquitectura de navegación multi-ruta con `react-router-dom`, layouts protegidos y guardias de seguridad por rol (`client` vs `admin`).
- `auth-roles`: Autenticación con Supabase Auth, modelo de datos de perfiles con roles, contador de días de prueba y menú contextual de usuario.
- `landing-page`: Página de inicio comercial de alta fidelidad estética con Hero, 4 reglas de YNAB, mockup flotante y llamadas a la acción.
- `onboarding-wizard`: Flujo de incorporación en 3 pasos interactivos (*"Ready to get good at money?"*) para guiar al usuario desde la configuración inicial hasta su primer dólar asignado.
- `category-targets`: Inspector lateral de categorías con gestión de metas de ahorro mensuales, cálculo de avance porcentual e indicadores visuales de estado.
- `bank-simulator`: Módulo de simulación de movimientos bancarios para inyección controlada de fondos e importación de transacciones sin APIs bancarias externas.
- `support-chat`: Sistema de atención al cliente con widget flotante para usuarios y panel de resolución de mensajes para administradores.
- `admin-console`: Panel de control para el administrador con métricas globales, registro de auditoría de actividad y supervisión de la plataforma.

### Modified Capabilities
- `budget-engine`: Extensión del motor financiero para evaluar el cumplimiento de metas (*targets*), soportar sincronización con Supabase y persistir el estado mensual por usuario.
- `accounts-transactions`: Vinculación de transacciones con el simulador de banco, conciliación de estados y soporte multi-tenant por ID de usuario.

## Impact

* **Frontend:** Refactorización total de la arquitectura de la aplicación en rutas independientes, componentes visuales de alto impacto (landing, onboarding, widget de chat, inspector de metas, simulador bancario) y estilos SaaS profesionales con Tailwind CSS y Lucide Icons.
* **Backend y Base de Datos (Supabase):** Configuración de tablas (`profiles`, `categories`, `category_groups`, `accounts`, `transactions`, `targets`, `support_messages`) con Row Level Security (RLS) para aislamiento estricto por usuario y permisos globales para administradores.
* **Metodología y Verificación:** Ejecución disciplinada por fases con pruebas automatizadas (Vitest) y auditorías internas de integridad técnica y contable al finalizar cada fase.
