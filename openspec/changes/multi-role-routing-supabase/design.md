# Design

## Context

La evolución de la plataforma requiere transformar el prototipo inicial en un producto SaaS de calidad profesional que replique la experiencia completa de YNAB (*You Need A Budget*). La plataforma debe soportar separación de responsabilidades para dos tipos de usuarios:
1. **Cliente (`client`):** Gestiona su presupuesto personal, cuentas, metas de ahorro, interactúa con el simulador de nóminas/gastos y puede solicitar asistencia en tiempo real mediante un widget de chat.
2. **Administrador (`admin`):** Dispone de una consola ejecutiva para monitorear el estado global de la plataforma (métricas agregadas, usuarios registrados, volumen transaccional, auditoría de eventos) y responder activamente las consultas de soporte de los clientes.

Adicionalmente, se requiere una presencia web pública completa con una Landing Page comercial fiel a YNAB, un Wizard de Incorporación (*Onboarding*) de 3 pasos y un Inspector lateral de Metas de Ahorro (*Targets*).

## Goals / Non-Goals

**Goals:**
* Implementar arquitectura de rutas robusta con `react-router-dom` dividida en:
  * Rutas públicas: `/` (Landing Page SaaS), `/login`, `/register`.
  * Rutas de cliente (con guardia de autenticación y rol `client`): `/onboarding`, `/app/budget`, `/app/accounts`, `/app/bank-simulator`.
  * Rutas de administración (con guardia de rol `admin`): `/admin`, `/admin/users`, `/admin/audit`, `/admin/support`.
* Conectar la aplicación con la base de datos Supabase existente en PostgreSQL, asegurando persistencia segura de perfiles, categorías, metas, transacciones y mensajes de chat.
* Diseñar un Inspector de Categorías lateral en `/app/budget` que permita definir metas de ahorro mensuales (*Targets*), mostrando barra de progreso y cálculo dinámico de financiamiento (verde, amarillo, rojo).
* Crear un Simulador Bancario interactivo ("Dinero en la mesa") que permita simular cobro de sueldo, transferencias de ingresos y transacciones comerciales automáticas, alimentando directamente *Ready to Assign* y las cuentas de presupuesto.
* Diseñar e implementar un widget flotante de chat de soporte para clientes y una consola de tickets/mensajes para el administrador.
* Mantener la integridad de los cálculos en centavos enteros y la cobertura de tests al 100%.

**Non-Goals:**
* Conexión con APIs bancarias reales de terceros (Plaid, Yodlee, Belvo) que requerirían credenciales financieras de producción no aplicables en este entorno. Se utiliza el Simulador Bancario diseñado a medida.
* Pasarela de pagos con cobros reales con tarjeta de crédito (Stripe/PayPal live). Se implementa el periodo de prueba de 34 días (*34 days left on trial*) y la simulación de planes.

## Decisions

### 1. Arquitectura de Rutas y Layouts Jerárquicos (`react-router-dom`)
* **Decisión:** Implementar una estructura de layouts anidados:
  * `PublicLayout`: Encabezado limpio con navegación a características, reglas de YNAB, precios y botón "Iniciar Sesión" / "Probar Gratis".
  * `AppLayout`: Barra de navegación de la aplicación para el cliente con selector de plan ("Marco's Plan"), contador del periodo de prueba ("34 days left on trial"), enlaces a Presupuesto, Cuentas y Simulador Bancario, menú de usuario desplegable y widget flotante de soporte.
  * `AdminLayout`: Barra lateral de administración con estadísticas globales, tabla de clientes, bitácora de auditoría y centro de atención al cliente.
  * `ProtectedRoute`: Componente de envoltura que valida sesión activa y rol autorizado (`client` o `admin`), redirigiendo a `/login` o a la vista correspondiente si el usuario no tiene los permisos adecuados.

### 2. Modelo de Autenticación y Roles con Supabase
* **Decisión:** Usar `supabase.auth` para autenticación (Email/Password) complementado con una tabla `profiles` vinculada a `auth.users(id)`.
  * Campos en `profiles`: `id`, `email`, `full_name`, `role` (`'client'` o `'admin'`), `trial_end_date`, `created_at`.
  * Un hook `useAuth()` centraliza el estado del usuario autenticado, su rol y estado del periodo de prueba.
  * Almacenamiento con fallback inteligente a datos locales en caso de desconexión o modo demostración offline.

### 3. Inspector Lateral de Categorías y Metas (*Category Targets Engine*)
* **Decisión:** Al seleccionar una fila de categoría en la tabla de presupuesto, se despliega un panel lateral derecho (*Category Inspector*):
  * Muestra el nombre de la categoría, saldo disponible acumulado y sección de **Meta (*Target*)**.
  * Modos de meta: *Monthly Needed for Spending* (Apartar monto mensual fijo antes de fin de mes) o *Target Savings Balance*.
  * Evaluación del estado:
    * Si $\text{Asignado} \ge \text{Meta}$: Estado `funded` (Píldora verde y progreso al 100%).
    * Si $\text{Asignado} < \text{Meta}$: Estado `underfunded` (Píldora amarilla y cálculo exacto de cuánto falta).
    * Si $\text{Disponible} < 0$: Estado `overspent` (Píldora roja alertando sobregasto).

### 4. Simulador Bancario ("Poner Dinero en la Mesa")
* **Decisión:** Módulo dedicado `/app/bank-simulator` con interfaz gráfica estilo terminal bancaria:
  * Botón rápido: *"Simular Depósito de Nómina / Sueldo"* (inyecta fondos como ingreso a Ready to Assign).
  * Botón rápido: *"Simular Gasto en Supermercado / Servicios"* (genera una transacción de débito con categoría asignada).
  * Registro visual de eventos de streaming bancario con fecha, monto y estado de conciliación (*Cleared*).

### 5. Sistema de Chat y Soporte en Tiempo Real
* **Decisión:** Widget flotante en la esquina inferior derecha para clientes con selector de preguntas rápidas y caja de chat interactivo.
  * Los mensajes se registran en una tabla `support_messages` con `sender_id`, `receiver_id`, `content`, `status` (`'open'`, `'answered'`), y timestamp.
  * El administrador visualiza en `/admin` las conversaciones activas agrupadas por cliente y puede responder en tiempo real.

### 6. Diagramas de Secuencia del Sistema (SSD) y Flujos de Eventos
* **Decisión:** Formalizar los flujos de interacción del sistema mediante 8 Diagramas de Secuencia del Sistema (SSD):
  * **SSD-01:** Autenticación e inicio de sesión por rol (`client` vs `admin`) con redirección declarativa.
  * **SSD-02:** Inyección de fondos a *Ready to Assign* y asignación a sobres hasta balance cero.
  * **SSD-03:** Gasto con parser aritmético y creación *in-line* de categorías al vuelo.
  * **SSD-04:** Transacción dividida (*Split Transaction*) con invariante de suma exacta a cero.
  * **SSD-05:** Transferencia entre cuentas sin impacto en categorías (*Regla de Oro de YNAB*).
  * **SSD-06:** Configuración e inspección de metas mensuales (*Category Targets*).
  * **SSD-07:** Simulador bancario y generación de eventos de streaming.
  * **SSD-08:** Intercambio de mensajes de soporte y bitácora de auditoría administrativa.
* Todos los diagramas se encuentran detallados con sintaxis Mermaid en `SPECIFICATION.md` para la defensa formal del proyecto.

## Risks / Trade-offs

* **[Riesgo de latencia de red en base de datos durante pruebas locales]** $\rightarrow$ **Mitigación:** Capa de servicio reactiva con fallback inteligente a almacenamiento local (`localStorage`) que asegura funcionamiento ininterrumpido sin depender de conectividad externa.
* **[Riesgo de rutas rotas al refrescar en servidor local Vite]** $\rightarrow$ **Mitigación:** Configuración estándar de SPA con `historyApiFallback` habilitado en Vite y rutas relativas canónicas en `react-router-dom`.
* **[Complejidad de UI en pantallas pequeñas con el Inspector abierto]** $\rightarrow$ **Mitigación:** El panel del inspector lateral es colapsable y responsivo (cajón deslizante en móviles y columna lateral de 340px en escritorios).
