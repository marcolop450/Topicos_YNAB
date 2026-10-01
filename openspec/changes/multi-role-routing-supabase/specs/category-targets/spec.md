# Capability: category-targets

## Purpose

Define el panel lateral derecho (*Category Inspector*) y el motor de metas de ahorro mensuales (*Targets*), calculando el estado de financiamiento y guiando las asignaciones del usuario.

## Requirements

### Requirement: Category Inspector Lateral Panel
The system SHALL display a detailed contextual inspector on the right side of the budget screen whenever a category is selected.

#### Scenario: Selecting a category row
- **WHEN** user clicks on a category row (e.g. "Perro" under group "gatos")
- **THEN** system opens the Category Inspector panel on the right displaying the category title, available balance pill, activity details, and Target section

### Requirement: Target Configuration and Progress Calculation
The system SHALL allow setting a monthly savings target for any category and calculate real-time funding progress.

#### Scenario: Setting a monthly spending target
- **WHEN** user configures a target of $120.00 per month for category "Perro"
- **THEN** system saves the target parameters and displays "Set Aside Another $120.00 Each Month By the End of the Month"

#### Scenario: Visual status for underfunded target
- **WHEN** category has a $120.00 target and only $50.00 has been assigned for the month
- **THEN** system highlights the category available pill in yellow and displays "Assign $70.00 more to stay on track"

#### Scenario: Visual status for fully funded target
- **WHEN** category has a $120.00 target and $120.00 or more is assigned
- **THEN** system highlights the category available pill in green and displays "Funded: 100% of your goal"

#### Scenario: Quick auto-assign underfunded
- **WHEN** user clicks "Underfunded" quick action in the inspector
- **THEN** system automatically assigns the remaining missing amount ($70.00) from Ready to Assign if sufficient funds exist
