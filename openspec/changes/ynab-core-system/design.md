# Design

## Context

El sistema debe operar de manera reactiva e intuitiva simulando la experiencia de YNAB. Se requiere modelar una aplicación web orientada al usuario final con alta precisión en cálculos financieros, soporte de transacciones complejas (splits, transferencias) y componentes de formulario especializados (calculadora en tiempo real y selectores jerárquicos con creación al vuelo). Ver `proposal.md` y las especificaciones en `specs/` para el detalle de requerimientos normativos.

## Goals / Non-Goals

**Goals:**
* Implementar una arquitectura desacoplada donde el motor contable/presupuestario (*Core Engine*) sea una biblioteca pura en TypeScript con cobertura de pruebas unitarias al 100% de casos borde.
* Ofrecer una interfaz de usuario fluida con diseño visual moderno (estilo SaaS YNAB), utilizando React, Tailwind CSS y componentes de alta usabilidad.
* Soportar persistencia en el navegador (`LocalStorage` / `IndexedDB`) con capacidad de exportación/importación en JSON para facilitar las demostraciones y evaluación por parte del docente.
* Garantizar reactividad completa: cualquier modificación o borrado de transacciones pasadas actualiza instantáneamente el saldo de las cuentas y el disponible de las categorías.

**Non-Goals:**
* Conciliación bancaria bloqueante con bancos reales vía OAuth/Open Banking (fuera del alcance académico especificado por la cátedra).
* Autenticación multi-tenant o servidor en la nube en esta primera fase (el foco está en la lógica de negocio y UX).

## Decisions

### 1. Motor de Cálculo de Estado Derivado (*Derived State / In-Memory Ledger*)
* **Decisión:** Los saldos de cuentas, el disponible de cada sobre y el monto de *Ready to Assign* se calculan como funciones puras y derivadas a partir de la lista de transacciones y las asignaciones mensuales.
* **Alternativa considerada:** Mantener campos de balance acumulados en cada entidad.
* **Justificación:** Al no haber conciliación y permitirse la edición y borrado dinámico en cualquier momento, el modelo de estado derivado elimina por diseño cualquier inconsistencia o desincronización de saldos ante modificaciones históricas.

### 2. Evaluador de Calculadora con Tokenizador Seguro
* **Decisión:** Implementar un evaluador de expresiones aritméticas seguro basado en un parser simple de precedencia de operadores (*Shunting-yard* o tokenizador de descenso recursivo) para `+`, `-`, `*`, `/`, `()` y decimales.
* **Alternativa considerada:** `eval()` o `new Function()`.
* **Justificación:** Previene vulnerabilidades de inyección de código y permite devolver mensajes de error amigables sin arrojar excepciones no controladas.

### 3. Modelo de Transacción Unificada con Soporte Polimórfico (Split y Transfer)
* **Decisión:** Una única entidad `Transaction` que almacena transacciones simples, transferencias (con `transferAccountId` y transacción espejo) o divisiones (con colección `splits: TransactionSplit[]`).
* **Justificación:** Simplifica el renderizado de la tabla de registros y garantiza que las consultas de libro contable sean uniformes.

### 4. Stack Frontend: React + TypeScript + Vite + Tailwind CSS
* **Decisión:** SPA rápida y ligera con TypeScript estricto.
* **Justificación:** Permite iteraciones ultra-rápidas, tipado estricto para evitar errores en montos numéricos (manejados en centavos enteros o números de coma fija de 2 decimales para evitar imprecisiones de coma flotante de IEEE 754), y fácil despliegue.

## Risks / Trade-offs

* **[Riesgo de precisión de coma flotante en JavaScript]** $\rightarrow$ **Mitigación:** Todos los cálculos internos se realizan en centavos enteros (`Math.round(amount * 100)`) y se formatean a moneda en la capa de presentación.
* **[Riesgo de rendimiento al recalcular con miles de transacciones]** $\rightarrow$ **Mitigación:** Memorización de cálculos por mes con hooks reactivos (`useMemo`). Para el volumen de datos de simulación del curso (< 10,000 transacciones), la evaluación derivada es instantánea (< 5ms).
* **[Inconsistencia en edición de Split Transaction]** $\rightarrow$ **Mitigación:** El formulario bloquea el botón de guardado con validación estricta de `restante === 0` y resalta la diferencia faltante o sobrante en tiempo real.
