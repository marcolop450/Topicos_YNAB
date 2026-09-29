# Capability: budget-engine

## Purpose

Define el motor de presupuesto en base cero con cálculo de Disponible por sobres y bolsa global Ready to Assign.

## Requirements

### Requirement: Zero-Based Budget Conservation
The system SHALL ensure that total cash in budget accounts equals Ready to Assign plus total available in all categories at all times.

#### Scenario: Initial deposit into Ready to Assign
- **WHEN** user records an income transaction of $1,000.00 to "Ready to Assign"
- **THEN** system increases Ready to Assign by $1,000.00 and reflects $1,000.00 in the top budget banner

#### Scenario: Assigning money to categories
- **WHEN** user assigns $300.00 to category "Groceries" and Ready to Assign was $1,000.00
- **THEN** Ready to Assign becomes $700.00 and "Groceries" available balance becomes $300.00

### Requirement: Category Overspending Indication
The system SHALL allow expenses to exceed category available balances while highlighting overspent categories in red.

#### Scenario: Expense exceeds category balance
- **WHEN** category "Dining Out" has $40.00 available and user registers an expense of $60.00
- **THEN** category available balance becomes -$20.00 and shows a prominent red alert indicating required re-budgeting

### Requirement: Direct-to-Category Inflows
The system SHALL credit income transactions assigned directly to a category straight into that category's available balance without routing through Ready to Assign.

#### Scenario: Refund or direct reimbursement
- **WHEN** user receives a refund of $50.00 categorized directly to "Electronics"
- **THEN** "Electronics" available balance increases by $50.00 and Ready to Assign remains unchanged
