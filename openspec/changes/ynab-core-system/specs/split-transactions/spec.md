# Spec Delta

## Purpose

Permite dividir un único movimiento financiero en múltiples categorías manteniendo la integridad del monto total.

## ADDED Requirements

### Requirement: Split Transaction Distribution
The system SHALL require that the sum of all individual split lines matches the transaction total amount exactly before allowing save.

#### Scenario: Balanced split transaction
- **WHEN** user inputs a total expense of $100.00 and assigns $70.00 to "Groceries" and $30.00 to "Household"
- **THEN** unassigned remaining amount displays $0.00 and the Save button is enabled

#### Scenario: Unbalanced split transaction
- **WHEN** user inputs a total expense of $100.00 and assigns only $70.00 to "Groceries"
- **THEN** unassigned remaining amount displays $30.00 in warning color and the Save button remains disabled

### Requirement: Split Transaction Modification
The system SHALL recalculate the unassigned remaining balance dynamically if the user modifies the parent transaction total amount.

#### Scenario: Total amount increased on existing split
- **WHEN** an existing split transaction of $100.00 has its total edited to $120.00
- **THEN** system re-opens split allocation showing $20.00 remaining unassigned and prevents save until resolved
