# Spec Delta

## Purpose

Proporciona evaluación interactiva de expresiones aritméticas directamente en campos de entrada monetaria.

## ADDED Requirements

### Requirement: Arithmetic Expression Evaluation in Amount Fields
The system SHALL evaluate valid mathematical expressions in number inputs and display the computed result upon confirmation.

#### Scenario: Basic multiplication expression
- **WHEN** user enters "90*6" in amount field and triggers blur or presses Enter
- **THEN** field value updates to "540.00"

#### Scenario: Multi-operator arithmetic with decimals
- **WHEN** user enters "120 + 35.50 - 15.50" and presses Enter
- **THEN** field value evaluates to "140.00"

### Requirement: Safe Error Handling for Invalid Expressions
The system SHALL catch syntax errors and division by zero without crashing, preserving prior valid input and signaling an error state.

#### Scenario: Division by zero
- **WHEN** user enters "150/0"
- **THEN** input shows a red validation border with an error indicator and prevents saving an invalid number

#### Scenario: Malformed syntax
- **WHEN** user enters "80*+" and leaves the field
- **THEN** system alerts of invalid syntax and retains the last known valid numeric value
