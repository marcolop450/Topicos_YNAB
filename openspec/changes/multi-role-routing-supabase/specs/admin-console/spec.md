# Capability: admin-console

## Purpose

Define el panel de control y consola de administración global (`/admin`) para supervisar métricas de la plataforma, auditar la actividad de usuarios y atender la mesa de ayuda.

## Requirements

### Requirement: Platform KPIs and Global Metrics
The system SHALL present aggregate platform metrics to authorized administrators.

#### Scenario: Viewing admin dashboard overview
- **WHEN** user with role `admin` enters `/admin`
- **THEN** system renders summary cards showing total active users, total funds budgeted across clients, active trial accounts count, and real-time database connection status

### Requirement: User Management and Activity Audit Log
The system SHALL provide an audit table of user accounts and chronological system activity.

#### Scenario: Inspecting registered users list
- **WHEN** administrator accesses the users section
- **THEN** system displays a table of registered users with email, role (`client` / `admin`), trial expiration, and creation date

#### Scenario: Reviewing audit trail events
- **WHEN** administrator views the activity audit log
- **THEN** system presents chronological log entries for events such as user logins, salary simulations, major allocations, and support requests

### Requirement: Admin Help Desk and Ticket Response
The system SHALL provide an inbox of client inquiries where administrators can review open threads and send replies.

#### Scenario: Replying to a client message
- **WHEN** administrator selects a client support conversation and submits a response
- **THEN** system saves the answer, updates ticket status to answered, and dispatches message to client widget
