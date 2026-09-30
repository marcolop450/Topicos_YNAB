# Spec Delta

## Purpose

Gestiona cuentas financieras, registro dinámico de transacciones, transferencias entre cuentas y beneficiarios (Payees).

## ADDED Requirements

### Requirement: Account Balance Tracking and Dynamic Ledger
The system SHALL maintain real-time account balances derived from initial balance and all historical transactions.

#### Scenario: Transaction creation updates balance
- **WHEN** user adds an expense of $45.00 in "Checking Account"
- **THEN** "Checking Account" balance decreases by $45.00 immediately

#### Scenario: Dynamic modification of historical transaction
- **WHEN** user changes an older transaction amount from $45.00 to $60.00
- **THEN** account balance decreases by an additional $15.00 and the category activity recalculates reactively

#### Scenario: Transaction deletion
- **WHEN** user deletes a transaction of $60.00
- **THEN** account balance increases by $60.00 and category available balance is restored immediately

### Requirement: Account Transfers
The system SHALL support transfers between accounts without assigning a budget category for on-budget accounts.

#### Scenario: Transfer between two on-budget accounts
- **WHEN** user transfers $200.00 from "Checking" to "Savings"
- **THEN** "Checking" decreases by $200.00, "Savings" increases by $200.00, and budget envelope balances remain unaffected

#### Scenario: Transfer to the same account blocked
- **WHEN** user selects identical source and destination accounts
- **THEN** system disables submission and displays a validation error message

### Requirement: Payee Management
The system SHALL track payees for transactions and support on-the-fly creation of new payees.

#### Scenario: New payee entered
- **WHEN** user types "Supermercado Central" in Payee field and it does not exist
- **THEN** system displays an option to create "Supermercado Central" and saves it for future autocomplete
