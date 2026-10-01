# Capability: onboarding-wizard

## Purpose

Define el asistente de incorporación guiado de 3 pasos (*Onboarding Wizard*) para nuevos clientes, facilitando la comprensión inicial del método de presupuesto en base cero.

## Requirements

### Requirement: Multi-Step Interactive Onboarding
The system SHALL guide newly registered users through a 3-step setup sequence before entering the main budget workspace.

#### Scenario: Greeting and priority selection (Step 1)
- **WHEN** new user accesses `/onboarding`
- **THEN** system renders "Welcome, [Name]! Ready to get good at money?" with an interactive selector of initial financial priorities (e.g. Rent, Groceries, Emergency Fund, Fun Money)

#### Scenario: Setting starting funds on the table (Step 2)
- **WHEN** user advances to Step 2
- **THEN** system prompts user to enter an initial cash balance or choose an instant simulated bank account connection to put their first money on the table

#### Scenario: Assigning first dollars to zero (Step 3)
- **WHEN** user advances to Step 3 with starting funds available
- **THEN** system guides user to allocate money across their selected priorities until Ready to Assign reaches zero, demonstrating Rule 1 in practice

#### Scenario: Finishing onboarding wizard
- **WHEN** user clicks "Let's Go / Finish Setup" on Step 3
- **THEN** system saves the initial budget state, marks user onboarding as completed, and transitions into `/app/budget`
