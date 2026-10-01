# Tasks

## Phase 1: Arquitectura de Rutas y Autenticación con Roles (Supabase)

- [x] 1.1 Instalar `react-router-dom` y configurar la estructura de navegación en `src/routes/` y `src/App.tsx`.
- [x] 1.2 Implementar el servicio de autenticación y perfiles en `src/services/authService.ts` con soporte para roles `client` y `admin` y fallback reactivo.
- [x] 1.3 Crear el hook `useAuth` y el componente de guardia `ProtectedRoute` para proteger accesos según rol y autenticación.
- [x] 1.4 Construir las vistas `/login` y `/register` con selector de rol y diseño SaaS moderno.
- [x] 1.5 Diseñar el menú desplegable del plan del usuario con contador de prueba ("34 days left on trial") y botón de cierre de sesión.
- [x] 1.6 Escribir pruebas unitarias con Vitest para validar guardias de rutas y lógica de autenticación.

## Phase 2: Landing Page Pública Profesional (Estilo YNAB)

- [x] 2.1 Construir `LandingPage.tsx` en `/` con sección Hero de alto impacto, propuesta de valor y llamadas a la acción (*Start Free Trial* / *Live Demo*).
- [x] 2.2 Implementar la sección interactiva de las 4 Reglas de YNAB con explicaciones pedagógicas e ilustraciones.
- [x] 2.3 Construir el contenedor del mockup flotante de la aplicación con visualización de métricas financieras.
- [x] 2.4 Agregar tabla de planes, testimonios y pie de página institucional.
- [x] 2.5 Verificar enlaces de navegación fluida entre la Landing y los flujos de registro e inicio de sesión.

## Phase 3: Asistente de Incorporación Guiado (Onboarding Wizard)

- [x] 3.1 Construir la vista interactiva `OnboardingWizard.tsx` en `/onboarding` ("Welcome! Ready to get good at money?").
- [x] 3.2 Desarrollar el Paso 1: Selección guiada de prioridades financieras inmediatas y grupos de categorías.
- [x] 3.3 Desarrollar el Paso 2: Configuración de fondos iniciales / conexión simulada ("Dinero en la mesa").
- [x] 3.4 Desarrollar el Paso 3: Asignación interactiva del primer dólar hasta alcanzar *Ready to Assign = $0*.
- [x] 3.5 Conectar la finalización del onboarding para transicionar a `/app/budget` guardando el estado inicial.

## Phase 4: Inspector de Categorías y Metas de Ahorro (Targets)

- [x] 4.1 Extender los tipos del dominio con la entidad `CategoryTarget` (monto meta mensual, periodicidad, fecha límite).
- [x] 4.2 Construir el componente de panel lateral derecho `CategoryInspector.tsx` para la vista `/app/budget`.
- [x] 4.3 Implementar la lógica contable en `budgetEngine.ts` para determinar el estado de la meta: *funded*, *underfunded* o *overspent*.
- [x] 4.4 Integrar barras de progreso radial/lineal, píldoras de estado coloreadas y botón de acción rápida *"Auto-Assign: Underfunded"*.
- [x] 4.5 Escribir tests unitarios para verificar el cálculo exacto de metas en centavos y transiciones de estado.

## Phase 5: Módulo de Simulador Bancario ("Dinero en la Mesa")

- [x] 5.1 Construir la vista `BankSimulator.tsx` en `/app/bank-simulator` con interfaz gráfica de simulación bancaria.
- [x] 5.2 Implementar el generador de eventos para *"Simular Depósito de Sueldo / Nómina"* inyectando fondos a *Ready to Assign*.
- [x] 5.3 Implementar el generador de eventos para *"Simular Gastos Automáticos en Comercios"* deduciendo de categorías correspondientes.
- [x] 5.4 Construir la consola de historial de eventos en streaming y sincronizar automáticamente con el libro contable de Cuentas.
- [x] 5.5 Validar la conservación estricta de fondos entre el simulador, cuentas y presupuesto.

## Phase 6: Widget de Soporte al Cliente y Consola de Administración

- [x] 6.1 Construir el componente flotante `SupportWidget.tsx` (botón de ayuda inferior derecho y ventana emergente).
- [x] 6.2 Implementar chips de preguntas frecuentes pedagógicas y formulario de mensajes hacia Supabase.
- [x] 6.3 Construir la consola de administración en `/admin` con tarjetas de KPIs globales de la plataforma y tabla de usuarios.
- [x] 6.4 Implementar la mesa de ayuda (*Help Desk*) en el panel admin para leer y responder consultas de clientes en tiempo real.
- [x] 6.5 Implementar el registro de auditoría (*Audit Log*) para rastrear eventos críticos del sistema.

## Phase 7: Integración Total, Auditorías Internas y Pruebas

- [x] 7.1 Ejecutar suite completa de tests automatizados con Vitest asegurando 100% de éxito (34/34 tests superados).
- [x] 7.2 Realizar auditoría interna de navegación, sesiones y roles de usuario.
- [x] 7.3 Realizar auditoría interna de consistencia matemática del motor de presupuesto y metas.
- [x] 7.4 Compilar el proyecto en modo de producción (`npm run build`) verificando cero advertencias o errores.
- [x] 7.5 Sincronizar y documentar el repositorio con los cambios finales.
