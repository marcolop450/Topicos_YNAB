# Capability: routing

## Purpose

Define la arquitectura de navegación multi-ruta con `react-router-dom`, layouts especializados y protección de rutas según el rol del usuario autenticado.

## Requirements

### Requirement: Multi-Route Separation
The system SHALL organize application views into dedicated URL paths instead of a single monolithic page.

#### Scenario: Navigating to public landing page
- **WHEN** unauthenticated visitor enters `/` or `/landing`
- **THEN** system renders the public SaaS landing page with marketing content and authentication action buttons

#### Scenario: Navigating to login and registration
- **WHEN** visitor enters `/login` or `/register`
- **THEN** system renders the authentication forms for email/password sign-in and sign-up

### Requirement: Role-Based Route Protection
The system SHALL enforce route guards restricting access to protected client and admin routes based on active user authentication and role.

#### Scenario: Client attempting to access protected budget view
- **WHEN** authenticated client navigates to `/app/budget`
- **THEN** system allows access and displays the zero-based budget workspace

#### Scenario: Unauthenticated visitor attempting to access `/app/budget`
- **WHEN** unauthenticated visitor navigates to `/app/budget`
- **THEN** system redirects the visitor to `/login` with a return URL parameter

#### Scenario: Client attempting to access admin route
- **WHEN** authenticated user with role `client` navigates to `/admin`
- **THEN** system denies access and redirects user to `/app/budget` with an unauthorized alert

#### Scenario: Admin accessing administration dashboard
- **WHEN** authenticated user with role `admin` navigates to `/admin`
- **THEN** system allows access and displays the administrative control console
