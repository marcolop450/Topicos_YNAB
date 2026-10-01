# Capability: auth-roles

## Purpose

Define el sistema de autenticación de usuarios mediante Supabase Auth, gestión de perfiles con roles (`client` y `admin`), contador de periodo de prueba y menú contextual de usuario.

## Requirements

### Requirement: Role-Based User Authentication
The system SHALL authenticate users using Supabase Auth and associate each user with a profile record containing their assigned role and unlimited free plan status.

#### Scenario: User registration with default client role
- **WHEN** new user registers with email and password
- **THEN** system creates an authentication record and a corresponding `profiles` row with role `client` and an active unlimited free account

#### Scenario: User login and session state
- **WHEN** registered user submits valid credentials
- **THEN** system establishes an authenticated session, retrieves the user profile and role, and redirects to `/onboarding` (if first time) or `/app/budget` (or `/admin` if role is `admin`)

### Requirement: User Plan Dropdown and Account Status
The system SHALL display a header user menu presenting the plan name, user email, free account badge, and quick setting actions.

#### Scenario: Opening user plan dropdown
- **WHEN** user clicks on the user profile button in the top navigation bar
- **THEN** system displays the plan name ("Plan Personal Gratuito"), user email, a green badge indicating active free account ("Plan Gratuito"), and navigation links to Plan Settings, Manage Payees, Bank Connections, and Log Out

#### Scenario: User logout
- **WHEN** user clicks "Log Out" in the user dropdown
- **THEN** system terminates the Supabase session, clears local authentication cache, and redirects to `/login`
