# YNAB Clone - Presupuesto en Base Cero (Zero-Based Budgeting)
> **Proyecto:** Réplica de YNAB desarrollada bajo la metodología **Spec-Driven Development (SDD)** con IA y **OpenSpec**.  
> **Cátedra:** Tópicos Proyecto 2

---

## 📌 Descripción General

Este proyecto es una réplica funcional de la lógica contable y de experiencia de usuario de **YNAB (You Need A Budget)**. El sistema funciona bajo el **método de sobres virtuales y presupuesto en base cero**, donde cada peso/dólar debe tener un trabajo asignado antes de ser gastado.

Cumple con la ecuación fundamental de conservación:
$$\text{Total en Cuentas} = \text{Listo para Asignar (Ready to Assign)} + \sum \text{Disponible en Categorías}$$

---

## 🚀 Características Principales y Criterios Evaluados

1. **Beneficiario (*Payee*):** Diferenciación clara entre destino en gastos y origen en ingresos, con creación y autocompletado al vuelo.
2. **Ingreso en Dos Vías:**
   - **Vía Estándar:** Ingresa al fondo global *"Listo para Asignar" (Ready to Assign)* para posterior presupuestación.
   - **Vía Directa:** Ingresa directamente a reponer o compensar un sobre/categoría específico (reembolsos o devoluciones).
3. **Transferencias entre Cuentas:** Movimiento de fondos entre cuentas *on-budget* sin alterar sobres de categorías. Validación que impide transferencias a la misma cuenta.
4. **Edición y Eliminación Dinámica:** Sin conciliación bloqueante; cualquier modificación o borrado de transacciones pasadas recalcula los saldos de cuentas y categorías de forma inmediata y reactiva.
5. **Input Numérico Tipo Calculadora:** Evaluación interactiva en tiempo real de operaciones aritméticas (`+`, `-`, `*`, `/`, `()`, decimales) como `90*6` $\rightarrow$ `$540.00` al presionar Enter o perder el foco.
6. **Transacciones Divididas (*Split Transactions*):** Capacidad de partir un solo movimiento en múltiples categorías con validación en tiempo real que exige balance cero restante para guardar.
7. **Creación In-Line de Categorías y Grupos:** Crear nuevas categorías y grupos padre directamente desde el formulario de transacción sin perder los datos ya introducidos.
8. **Detección de Sobregasto (*Overspending*):** Categorías con disponible negativo se resaltan en rojo con avisos de rebalanceo.
9. **Herramientas de Demostración:** Botones en la barra superior para **Reiniciar datos demo iniciales**, **Exportar JSON** e **Importar JSON**.

---

## 🛠️ Metodología SDD y OpenSpec

El proyecto fue desarrollado utilizando el estándar **OpenSpec** (`@fission-ai/openspec`):
* `openspec/specs/`: Especificaciones formales del comportamiento normativo (Requerimientos SHALL/MUST y escenarios WHEN/THEN).
* `openspec/changes/ynab-core-system/`: Artefactos del cambio aprobado:
  * `proposal.md`
  * `specs/**/*.md`
  * `design.md`
  * `tasks.md`

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
* Node.js v18+ (probado en v24.14.1)
* npm v9+

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/marcolop450/Topicos_YNAB.git
cd Topicos_YNAB

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```
La aplicación estará disponible en `http://localhost:3000/`.

---

## 🧪 Pruebas Unitarias Automatizadas

El proyecto cuenta con una suite completa de pruebas unitarias con **Vitest** cubriendo los 7 casos borde críticos:
```bash
npm test
```
Resultados: **17 tests pasando al 100%**.
