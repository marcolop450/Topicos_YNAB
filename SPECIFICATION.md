# ESPECIFICACIÓN TÉCNICA Y DE NEGOCIO (SDD - SPEC-DRIVEN DEVELOPMENT)
## PROYECTO: CLON DE YNAB (YOU NEED A BUDGET)
### Cátedra: Tópicos Proyecto 2

---

## 1. Visión y Filosofía del Sistema

El sistema implementa el método de **Presupuesto en Base Cero (*Zero-Based Budgeting*)** y el **sistema de sobres virtuales**:
1. **No se presupuesta dinero que no se tiene:** Solo se distribuyen los fondos reales existentes en las cuentas.
2. **Ecuación Fundamental de Conservación:**
   $$\text{Total en Cuentas (Efectivo/Líquido)} = \text{Listo para Asignar (Ready to Assign)} + \sum \text{Disponible en Categorías}$$
3. **Todo dinero tiene un destino:** Cada ingreso no asignado directamente a una categoría entra a un fondo central (*Ready to Assign*) para ser distribuido intencionalmente entre las categorías (sobres).

---

## 2. Modelo de Dominio y Entidades

```mermaid
erDiagram
    ACCOUNT ||--o{ TRANSACTION : contains
    PAYEE ||--o{ TRANSACTION : receives_or_sends
    CATEGORY_GROUP ||--o{ CATEGORY : contains
    CATEGORY ||--o{ TRANSACTION : classified_in
    TRANSACTION ||--o{ TRANSACTION_SPLIT : splits_into
    CATEGORY ||--o{ TRANSACTION_SPLIT : allocated_to
    CATEGORY ||--o{ MONTHLY_BUDGET : tracks

    ACCOUNT {
        uuid id PK
        string name
        enum type "CHECKING | SAVINGS | CREDIT_CARD | CASH"
        decimal starting_balance
        boolean is_active
    }

    CATEGORY_GROUP {
        uuid id PK
        string name
        int sort_order
    }

    CATEGORY {
        uuid id PK
        uuid group_id FK
        string name
        int sort_order
        boolean is_hidden
    }

    PAYEE {
        uuid id PK
        string name
        boolean is_system
    }

    TRANSACTION {
        uuid id PK
        uuid account_id FK
        uuid payee_id FK
        uuid category_id FK "Null if Split or Transfer"
        timestamp datetime
        decimal amount "Negative=Expense, Positive=Income"
        string memo
        enum type "STANDARD | SPLIT | TRANSFER"
        uuid transfer_transaction_id FK "Self reference if transfer"
    }

    TRANSACTION_SPLIT {
        uuid id PK
        uuid transaction_id FK
        uuid category_id FK
        decimal amount
        string memo
    }

    MONTHLY_BUDGET {
        uuid id PK
        string month "YYYY-MM"
        uuid category_id FK
        decimal assigned
    }
```

---

## 3. Lógica de Negocio y Reglas de Transacciones

### 3.1. Tipos de Transacción

#### A. Gasto Estándar (*Expense*)
* **Monto:** Negativo (se deduce de la cuenta).
* **Beneficiario (*Payee*):** Entidad o comercio receptor (ej. "PedidosYa"). Si no existe, se crea dinámicamente al escribirlo.
* **Categoría:** Obligatoria. Se deduce del saldo `Disponible` de esa categoría.

#### B. Ingreso (*Income*) - Dos Vías
1. **Vía Estándar -> "Listo para Asignar" (*Ready to Assign - RTA*):**
   * El dinero ingresa a la cuenta y alimenta el pool global del presupuesto.
   * `RTA = RTA + Monto`.
   * El usuario luego asigna manualmente este dinero a los sobres en la vista de presupuesto.
2. **Vía Directa -> Categoría Específica:**
   * Utilizado para reembolsos, devoluciones o reposición directa de un gasto previo.
   * El dinero entra a la cuenta y se suma directamente al `Disponible` de la categoría seleccionada sin pasar por *Ready to Assign*.

#### C. Transferencias entre Cuentas (*Account Transfers*)
* **Comportamiento:**
  * Crea dos transacciones vinculadas (o una transacción con cuenta origen y cuenta destino).
  * Cuenta Origen: Débito ($-Monto$).
  * Cuenta Destino: Crédito ($+Monto$).
* **Regla de Oro de YNAB:** Si ambas cuentas son cuentas de presupuesto (*On-Budget*), **la transferencia NO requiere categoría ni afecta a "Ready to Assign" ni a los sobres**. El dinero solo cambió de lugar físico, pero sigue teniendo el mismo trabajo asignado en los sobres.
* **Beneficiario Especial:** Se autogenera como `Transfer : [Nombre de Cuenta Destino/Origen]`.

#### D. Transacción Dividida (*Split Transaction*)
* Permite dividir un único ticket/movimiento de cuenta entre 2 o más categorías distintas.
* **Invariante Matemática Estricta:**
  $$\text{Monto Total Transacción} = \sum_{i=1}^{n} \text{Split Amount}_i$$
* La UI debe mostrar en tiempo real:
  * Monto Total.
  * Monto Asignado en Splits.
  * **Monto Restante por Asignar (*Remaining/Unassigned*)**: El botón "Guardar" debe estar bloqueado hasta que el restante sea exactamente `0.00`.

---

## 4. Usabilidad e Interacciones Complejas (Criterios Clave de Evaluación)

### 4.1. Input Numérico con Calculadora Integrada
* **Requisito:** Cualquier campo numérico (monto de transacción, monto asignado a presupuesto, sub-splits) debe aceptar expresiones aritméticas.
* **Operaciones soportadas:** Suma (`+`), Resta (`-`), Multiplicación (`*`), División (`/`), Paréntesis `()`, y Decimales (`.` o `,`).
* **Comportamiento UX:**
  1. El usuario escribe: `90*6` o `150 + 25.50 - 10`.
  2. Al pulsar `Enter`, `=`, `Tab` o perder el foco (*blur*), la expresión se evalúa de manera segura y el campo se actualiza al valor calculado con formato de moneda: `$540.00`.
  3. Si la expresión tiene un error sintáctico (ej. `90*` o división por cero `100/0`), se muestra un estado de advertencia sutil sin romper la aplicación y se evita el guardado con valor NaN.
* **Seguridad:** No usar `eval()` plano de JavaScript. Usar un parser de expresiones matemáticas seguro basado en tokens o AST (o biblioteca matemática segura).

### 4.2. Creación *In-line* (al vuelo) de Categorías y Grupos
* Desde el formulario modal de registro de transacción:
  * El usuario abre el selector de categorías.
  * Si escribe una categoría que no existe (ej. "Veterinaria"), el selector ofrece la opción:
    * `+ Crear categoría "Veterinaria"`.
  * Al hacer clic, se abre un sub-menú desplegable que permite:
    * Asignarla a un Grupo de Categorías existente (ej. "Mascotas").
    * O crear un **Nuevo Grupo de Categorías** en el mismo instante.
  * Al confirmarse, la categoría se crea en el sistema y queda inmediatamente seleccionada en la transacción sin cerrar ni reiniciar el formulario.

### 4.3. Reactividad y Recálculo Dinámico en Casos de Edición y Eliminación
* Al no existir conciliación bloqueante:
  * Si el usuario edita una transacción de hace 3 semanas cambiando el monto de `$50` a `$80`:
    * El saldo de la cuenta se ajusta en `-$30`.
    * El saldo de la categoría se ajusta en `-$30`.
  * Si se elimina una transacción:
    * Se revierte completamente su impacto en la cuenta y en la categoría correspondiente.
  * Si se edita una transferencia:
    * Ambas cuentas vinculadas deben actualizarse en sincronía inmediata. Si se borra un extremo, se borra el otro.

---

## 5. Matriz de Casos Borde Críticos (Advertencia del Docente)

| ID | Escenario / Caso Borde | Comportamiento Esperado del Sistema |
| :--- | :--- | :--- |
| **CB-01** | **Sobregasto (*Overspending*):** Un gasto supera el disponible en un sobre (ej. Disponible \$20, Gasto \$50). | La categoría queda en negativo rojo (`-$30.00`). No bloquea el gasto, pero advierte visualmente al usuario que debe "cubrir el sobregasto" moviendo fondos de otra categoría. |
| **CB-02** | **Edición del Total de un Split Existente:** El usuario abre una transacción dividida de \$100 (Split: \$60 y \$40) y cambia el total a \$120. | El sistema detecta la discrepancia: "Restante por asignar: \$20.00". Deshabilita el botón Guardar hasta que el usuario ajuste los splits o añada un nuevo split. |
| **CB-03** | **Eliminación de Categoría con Historial:** El usuario intenta eliminar una categoría que tiene transacciones asociadas. | El sistema bloquea el borrado directo o solicita: "Reasignar transacciones existentes a otra categoría" o "Ocultar categoría (*Hide Category*)", protegiendo la integridad referencial. |
| **CB-04** | **Conversión de Tipo de Transacción:** Una transacción simple se edita para convertirse en Transferencia o Split. | Limpia o reestructura los campos dependientes (si pasa a transferencia, elimina la categoría asignada; si pasa a split, expande la tabla de líneas de split). |
| **CB-05** | **División por cero o expresión inválida en calculadora:** Usuario escribe `50/0` o `12++3`. | Captura el error en tiempo real, marca el borde del input en rojo con tooltip descriptivo ("Expresión matemática inválida"), y mantiene el valor previo válido al pulsar guardar. |
| **CB-06** | **Transferencia a la misma cuenta:** Usuario selecciona Cuenta Origen = Cuenta Destino. | Validación inmediata en formulario: Deshabilita la opción de seleccionar la misma cuenta o muestra error antes de permitir el envío. |
| **CB-07** | **Listo para Asignar en Negativo (*Overallocated*):** El usuario asigna más dinero a los sobres del que ingresó a RTA. | El banner superior de *Ready to Assign* se vuelve rojo con saldo negativo (ej. `-$150.00 Necesitas asignar menos`), reflejando que se presupuestó dinero inexistente. |

---

## 6. Arquitectura de UI / Wireframes Conceptuales

### Vista 1: Pantalla Principal de Presupuesto (*Budget View*)
* **Top Bar:** Banner interactivo de **"Listo para Asignar / Ready to Assign"** (Verde si es positivo o cero, Rojo si está sobreasignado).
* **Navegador de Meses:** Permite alternar entre meses anteriores, actual y siguiente.
* **Tabla de Categorías:**
  * Estructura en acordeón por Grupo (ej. `Necesidades Inmediatas`, `Calidad de Vida`, `Ahorros`).
  * Columnas: `Categoría` | `Asignado (Editable con Calculadora)` | `Actividad / Gastado` | `Disponible (Píldora Verde/Gris/Roja)`.

### Vista 2: Registro de Cuentas (*Accounts Register*)
* Barra lateral (*Sidebar*) con lista de cuentas (Efectivo, Banco, Ahorros) y sus saldos actuales.
* Tabla central con historial de transacciones: Fecha, Beneficiario, Categoría, Memo, Salida (Outflow), Entrada (Inflow), Acciones (Editar/Borrar).
* Botón destacado `+ Añadir Transacción`.

### Vista 3: Modal de Transacción Inteligente
* Tipo: Gasto / Ingreso / Transferencia / Split.
* Campo de Cuenta (Dropdown).
* Campo de Fecha y Hora.
* Campo de Payee (Autocompletado con creación rápida).
* Campo de Categoría (Dropdown jerárquico con `+ Crear`).
* Campo de Monto (Input con calculadora).
* Panel dinámico de Splits (si está activado).

---

## 7. Diagramas de Secuencia del Sistema (SSD - System Sequence Diagrams)

Los Diagramas de Secuencia del Sistema (SSD) formalizan los eventos de entrada y salida entre los Actores del dominio y la caja negra del **Sistema (YNAB Engine & Platform)** para cada caso de uso principal evaluado en la cátedra de **Tópicos Proyecto 2**.

### SSD-01: Autenticación, Verificación de Credenciales y Redirección por Rol
Permite a clientes y administradores identificarse con su correo y contraseña, recibiendo la interfaz correspondiente según su rol en base de datos.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Cliente / Admin)
    participant S as Sistema (YNAB Platform)
    participant DB as Servicio de Autenticación / DB

    U->>S: ingresarCredenciales(email, password)
    activate S
    S->>DB: verificarUsuario(email, hashPassword)
    activate DB
    DB-->>S: perfilUsuario(id, email, nombre, rol)
    deactivate DB
    S->>S: generarSesionActiva(perfil)
    alt Rol == "client"
        S-->>U: confirmarAcceso(token, rol="client") -> Redirigir a /app/budget
    else Rol == "admin"
        S-->>U: confirmarAcceso(token, rol="admin") -> Redirigir a /admin
    end
    deactivate S
```

### SSD-02: Registro de Ingreso ("Ready to Assign") y Asignación de Presupuesto en Base Cero
Representa el flujo fundamental de YNAB: entrar dinero real a la mesa y asignarlo a sobres hasta que *Listo para Asignar* sea 0.00.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Presupuesto en Base Cero)

    C->>S: registrarTransaccionIngreso(cuentaId, monto=$1000.00, fecha, payee="Empresa", categoria="Ready to Assign")
    activate S
    S->>S: actualizarSaldoCuenta(cuentaId, +$1000.00)
    S->>S: recalcularReadyToAssign(+1000.00)
    S-->>C: notificarExito(RTA=$1000.00, Banner="Verde")
    deactivate S

    C->>S: asignarPresupuestoACategoria(categoriaId="Alquiler", mes="2026-10", montoAsignado=$600.00)
    activate S
    S->>S: verificarConsistenciaBaseCero()
    S->>S: actualizarDisponible("Alquiler", +$600.00)
    S->>S: deducirDeReadyToAssign(-$600.00)
    S-->>C: actualizarVistaPresupuesto(RTA=$400.00, DisponibleAlquiler=$600.00)
    deactivate S

    C->>S: asignarPresupuestoACategoria(categoriaId="Comida", mes="2026-10", montoAsignado=$400.00)
    activate S
    S->>S: actualizarDisponible("Comida", +$400.00)
    S->>S: deducirDeReadyToAssign(-$400.00)
    S-->>C: actualizarVistaPresupuesto(RTA=$0.00, Estado="Presupuesto Equilibrado")
    deactivate S
```

### SSD-03: Registro de Gasto Estándar con Calculadora y Creación In-line de Categoría
Ilustra la creación de categorías al vuelo y la evaluación matemática de expresiones aritméticas durante el registro del gasto.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Transacciones & Sobres)

    C->>S: abrirModalNuevaTransaccion()
    S-->>C: presentarFormulario(cuentas, grupos, categorias)

    C->>S: escribirExpresionMonto("45*3 + 15")
    activate S
    S->>S: evaluarExpresionAritmetica()
    S-->>C: mostrarMontoCalculado($150.00)
    deactivate S

    C->>S: solicitarCrearCategoriaInLine(nombre="Veterinaria", grupoId="Mascotas")
    activate S
    S->>S: persistirCategoria(id, "Veterinaria", "Mascotas")
    S-->>C: confirmarCategoriaCreada(id="cat-vet", nombre="Veterinaria")
    deactivate S

    C->>S: confirmarGasto(cuentaId, fecha, payee="Clínica Vet", categoriaId="cat-vet", monto=-$150.00)
    activate S
    S->>S: debitarCuenta(cuentaId, -$150.00)
    S->>S: deducirDisponibleCategoria("cat-vet", -$150.00)
    alt Disponible("cat-vet") < 0
        S-->>C: notificarGastoRegistrado(alerta="Sobregasto Detectado / Cubrir con otros sobres")
    else Disponible("cat-vet") >= 0
        S-->>C: notificarGastoRegistrado(estado="Disponible Cubierto")
    end
    deactivate S
```

### SSD-04: Transacción Dividida (*Split Transaction*) con Invariante a Cero
Garantiza que la suma de los sub-splits equivalga con exactitud al total gastado en el ticket.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Split Engine)

    C->>S: iniciarTransaccionDividida(cuentaId, montoTotal=$120.00, payee="Supermercado")
    activate S
    S-->>C: presentarPanelSplits(restantePorAsignar=$120.00, botonGuardar=Deshabilitado)
    deactivate S

    C->>S: agregarSubSplit(categoriaId="Comestibles", monto=$80.00)
    activate S
    S->>S: calcularDiferenciaRestante($120.00 - $80.00)
    S-->>C: actualizarPanelSplits(restante=$40.00, botonGuardar=Deshabilitado)
    deactivate S

    C->>S: agregarSubSplit(categoriaId="Higiene", monto=$40.00)
    activate S
    S->>S: calcularDiferenciaRestante($120.00 - $120.00)
    S-->>C: actualizarPanelSplits(restante=$0.00, botonGuardar=Habilitado)
    deactivate S

    C->>S: confirmarTransaccionDividida()
    activate S
    S->>S: registrarTransaccionPadre(monto=-$120.00)
    S->>S: registrarSplitsHijos([Comestibles: -$80.00, Higiene: -$40.00])
    S->>S: actualizarDisponible("Comestibles", -$80.00)
    S->>S: actualizarDisponible("Higiene", -$40.00)
    S-->>C: notificarExitoSplit(balanceCuenta, balancesCategorias)
    deactivate S
```

### SSD-05: Transferencia entre Cuentas Vinculadas (Regla de Oro de YNAB)
Ilustra el movimiento de fondos entre dos cuentas de presupuesto sin afectar categorías ni *Ready to Assign*.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Cuentas y Transferencias)

    C->>S: registrarTransferencia(origenId="Cuenta Corriente", destinoId="Caja Ahorro", monto=$250.00, fecha)
    activate S
    S->>S: debitarCuenta(origenId, -$250.00)
    S->>S: acreditarCuenta(destinoId, +$250.00)
    S->>S: verificarCategoriasPreservadas()
    Note over S: Ready to Assign no cambia.<br/>Los sobres no cambian.<br/>El dinero solo se reubicó físicamente.
    S-->>C: notificarTransferenciaExitosa(saldosActualizados)
    deactivate S
```

### SSD-06: Configuración e Inspección de Metas de Ahorro (*Category Targets*)
Permite establecer objetivos mensuales con financiamiento guiado.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Inspector de Metas)

    C->>S: seleccionarCategoriaParaInspeccion(categoriaId="Seguro Auto")
    activate S
    S-->>C: desplegarPanelLateral(saldoDisponible, metaActual=null)
    deactivate S

    C->>S: configurarMeta(tipo="monthly_spending", metaCents=$150.00)
    activate S
    S->>S: evaluarFinanciamiento(asignadoMesActual=$50.00, meta=$150.00)
    S-->>C: mostrarEstadoMeta(progreso=33%, estado="underfunded", falta=$100.00)
    deactivate S

    C->>S: presionarAutoAsignarFaltante(categoriaId="Seguro Auto")
    activate S
    S->>S: transferirDesdeRTAhaciaCategoria("Seguro Auto", $100.00)
    S->>S: actualizarEstadoMeta(progreso=100%, estado="funded", píldora="Verde")
    S-->>C: actualizarVistaPresupuesto(RTA, Disponible="Seguro Auto")
    deactivate S
```

### SSD-07: Simulador Bancario Interactivo ("Dinero en la Mesa")
Permite inyectar depósitos de nómina y gastos automáticos simulados.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant S as Sistema (Simulador Bancario)

    C->>S: simularDepositoNomina(cuentaId, monto=$2500.00, concepto="Cobro de Sueldo")
    activate S
    S->>S: generarTransaccionBancariaConciliada(inflow=+$2500.00)
    S->>S: alimentarReadyToAssign(+$2500.00)
    S->>S: registrarEventoStreaming("Depósito Conciliado / Sueldo Ingresado")
    S-->>C: actualizarConsolaStreaming(nuevoSaldoCuenta, RTA)
    deactivate S
```

### SSD-08: Centro de Soporte al Cliente y Auditoría Administrativa
Permite la comunicación cliente-administrador y la fiscalización del sistema.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    actor A as Administrador
    participant S as Sistema (Soporte & Auditoría)

    C->>S: enviarConsultaSoporte(texto="¿Cómo transfiero fondos entre sobres?")
    activate S
    S->>S: almacenarMensaje(ticketId, clienteId, estado="abierto")
    S->>S: registrarBitacoraAuditoria(evento="Soporte: Consulta abierta", clienteId)
    S-->>C: confirmarEnvio("Tu consulta está siendo revisada")
    deactivate S

    A->>S: consultarPanelAdministracion()
    activate S
    S-->>A: desplegarKPIsGlobales(usuariosTotales, ticketsPendientes, auditoria)
    deactivate S

    A->>S: responderTicketSoporte(ticketId, respuesta="Usa el botón Mover Dinero...")
    activate S
    S->>S: actualizarEstadoTicket(ticketId, estado="respondido")
    S->>S: registrarBitacoraAuditoria(evento="Soporte: Ticket respondido", adminId)
    S-->>A: notificarTicketCerrado()
    S-->>C: notificarRespuestaRecibida(respuesta)
    deactivate S
```
