# Proposal

## Why

El desarrollo de software de gestión financiera personal suele fracasar en fases tempranas debido a modelos de datos ambiguos y cálculos de balance inconsistentes cuando se trabaja con IA sin una especificación rigurosa. Este proyecto implementa una réplica fiel de la lógica y experiencia de usuario de YNAB (*You Need A Budget*), adoptando el método de presupuesto en base cero mediante sobres virtuales y resolviendo casos de interacción compleja como inputs tipo calculadora, transacciones divididas y recálculo reactivo continuo.

## What Changes

* **Motor de Presupuesto en Base Cero (*Zero-Based Budgeting*):** Conservación estricta de fondos ($\text{Cuentas} = \text{Listo para Asignar} + \sum \text{Categorías}$).
* **Manejo de Ingresos en Dos Vías:**
  * Ingreso estándar al fondo global *Ready to Assign* (Listo para asignar).
  * Ingreso directo a un sobre/categoría específico (reembolsos o reposiciones).
* **Transferencias entre Cuentas de Presupuesto:** Movimiento de fondos entre cuentas sin deducción de categorías presupuestarias.
* **Transacciones Divididas (*Split Transactions*):** Registro de pagos multidestino con validación en tiempo real de balance restante cero.
* **Input Numérico con Calculadora Integrada:** Soporte para evaluación aritmética (`90*6` $\rightarrow$ `540.00`) al confirmar el campo.
* **Creación In-Line de Categorías y Grupos:** Capacidad de crear categorías y grupos padre directamente desde el formulario de registro.
* **Recálculo Reactivo Dinámico:** Modificación o eliminación de cualquier transacción histórica sin conciliación bloqueante, con actualización reactiva e inmediata de saldos.

## Capabilities

### New Capabilities
- `budget-engine`: Lógica de sobres virtuales, asignaciones mensuales, cálculo de "Listo para Asignar" (*Ready to Assign*) y detección de sobregasto.
- `accounts-transactions`: Cuentas financieras, libro contable de transacciones, transferencias entre cuentas y beneficiarios (*Payees*).
- `split-transactions`: Lógica y validación de partición de una transacción en múltiples líneas de categoría.
- `calculator-input`: Componente y parser seguro de expresiones matemáticas en inputs monetarios.
- `inline-categories`: Selector jerárquico de categorías con flujo de creación al vuelo de categorías y grupos padre.

### Modified Capabilities
<!-- No existing capabilities to modify in initial change -->

## Impact

* **Frontend:** Creación de la interfaz completa con soporte para vista de presupuesto mensual, inspector de categoría, registro de cuentas y modales interactivos.
* **Lógica de Dominio:** Motor de cálculo en memoria desacoplado con suite de pruebas unitarias automatizadas para verificar casos borde matemáticos.
* **Persistencia:** Almacenamiento local reactivo para preservar transacciones, cuentas y categorías.
