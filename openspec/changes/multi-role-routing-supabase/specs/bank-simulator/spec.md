# Capability: bank-simulator

## Purpose

Define el módulo del Simulador Bancario para recrear la experiencia de integración de cuentas bancarias y sincronización de transacciones automáticas ("Dinero en la mesa") sin requerir pasarelas financieras externas.

## Requirements

### Requirement: Simulated Bank Account Linking
The system SHALL allow users to establish virtual connections to simulated banking institutions (e.g. "Chase Bank", "Wells Fargo", "Banco Santander") with initial balances.

#### Scenario: Connecting a simulated checking account
- **WHEN** user selects a bank institution and enters an opening balance of $2,500.00
- **THEN** system creates a corresponding budget account and registers an initial deposit into Ready to Assign

### Requirement: Interactive Event Stream Simulation
The system SHALL provide interactive controls to simulate recurring financial events and observe their immediate effect in the budget.

#### Scenario: Simulating salary / paycheck deposit
- **WHEN** user clicks "Simular Depósito de Sueldo" with an amount of $1,800.00
- **THEN** system generates an inflow transaction to Ready to Assign, adds it to the account register, and notifies user with a success banner

#### Scenario: Simulating merchant debit transaction
- **WHEN** user clicks "Simular Gasto en Comercio" with merchant name "Supermercado Central" and amount $85.50
- **THEN** system creates an outflow transaction deducting from the selected account and decreases the available balance in category "Groceries"
