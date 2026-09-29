# Capability: inline-categories

## Purpose

Permite la creación inmediata de categorías y grupos padre directamente desde el formulario de registro de transacción.

## Requirements

### Requirement: Inline Category Creation
The system SHALL provide an option to create a new category directly within the category selector dropdown during transaction entry.

#### Scenario: Creating a category with existing group
- **WHEN** user types non-existent category "Gimnasio" and chooses "+ Crear categoría Gimnasio" selecting group "Salud"
- **THEN** system creates "Gimnasio" under group "Salud" and selects it in the current transaction immediately

### Requirement: Inline Category Group Creation
The system SHALL allow creating a new parent Category Group on the fly if the required group does not exist yet.

#### Scenario: Creating both parent group and category inline
- **WHEN** user selects "+ Crear Nuevo Grupo", enters "Fitness" as group name and "Crossfit" as category name
- **THEN** system saves both "Fitness" (group) and "Crossfit" (category) and applies "Crossfit" to the transaction without clearing entered form data
