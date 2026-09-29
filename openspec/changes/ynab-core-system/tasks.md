# Tasks

## 1. Setup y Scaffolding

- [x] 1.1 Inicializar la aplicación base con React, Vite, TypeScript y Tailwind CSS, y verificar que el servidor de desarrollo inicie correctamente.
- [x] 1.2 Configurar el entorno de pruebas unitarias con Vitest y verificar la ejecución de un test de sanidad básico.

## 2. Motor de Dominio y Cálculo Financiero

- [x] 2.1 Definir los tipos de datos de dominio (`Account`, `CategoryGroup`, `Category`, `Transaction`, `TransactionSplit`, `BudgetMonth`) con precisión en centavos enteros para evitar errores de coma flotante.
- [x] 2.2 Implementar el motor contable en memoria (`budgetEngine.ts`) con funciones puras para calcular saldos de cuentas, "Listo para Asignar" (*Ready to Assign*) y saldo disponible por categoría.
- [x] 2.3 Implementar la lógica de ingresos en dos vías (Ready to Assign vs Directo a sobre) y transferencias entre cuentas de presupuesto.
- [x] 2.4 Escribir suite de pruebas unitarias exhaustivas con Vitest cubriendo los casos borde de sobregasto, ediciones retroactivas y transferencias, y verificar que pasen al 100%.

## 3. Componentes de Interacción Compleja

- [x] 3.1 Implementar el parser aritmético seguro para evaluación de expresiones matemáticas (`+`, `-`, `*`, `/`, paréntesis y decimales) con manejo robusto de división por cero y errores sintácticos.
- [x] 3.2 Construir el componente UI `AmountCalculatorInput` que evalúa expresiones al pulsar Enter o perder el foco y muestra formato de moneda y estados de error.
- [x] 3.3 Construir el componente `CategorySelect` con dropdown jerárquico y modal interactivo para creación in-line de categorías y grupos padre.
- [x] 3.4 Construir el gestor de transacciones divididas `SplitTransactionForm` con cálculo en tiempo real de monto restante y validación estricta de balance cero.

## 4. Vistas y Experiencia de Usuario

- [x] 4.1 Construir la vista de Presupuesto (*Budget View*) con el banner reactivo de *Ready to Assign* (verde si es positivo, rojo si hay sobreasignación), selector de mes y tabla de sobres.
- [x] 4.2 Construir la vista de Cuentas y Registro (*Account Register*) con barra lateral de cuentas, saldos actuales y tabla de transacciones con soporte de edición y borrado directo.
- [x] 4.3 Construir el modal de creación y edición de transacciones integrando Gasto, Ingreso (2 vías), Transferencia y Split.
- [x] 4.4 Implementar persistencia reactiva en LocalStorage con precarga de datos semilla de ejemplo realistas y función de exportar/importar JSON.

## 5. Verificación Integral del Sistema

- [x] 5.1 Ejecutar suite completa de tests automatizados y verificar visualmente en el navegador todos los escenarios de los casos borde especificados.
