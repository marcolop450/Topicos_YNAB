# Capability: landing-page

## Purpose

Define la página de aterrizaje pública con diseño profesional estilo SaaS, acorde a la estética y propuesta de valor de YNAB, con presentación de las 4 reglas, mockup de producto y llamadas a la acción.

## Requirements

### Requirement: Hero Section and Visual Mockup
The system SHALL present an engaging, clean, light-themed hero section with prominent value propositions, direct free-access call-to-action buttons ("Comenzar Gratis", "Ver Demo"), and a visual preview of the budget interface with high contrast light palette.

#### Scenario: Viewing the hero banner
- **WHEN** visitor loads `/`
- **THEN** system displays the headline "A modern take on a zero-based budget", sub-headline explaining purposeful money management, "Comenzar Gratis" button, and an interactive mockup container showcasing the YNAB application UI in a luminous, crisp design

### Requirement: Four Rules Interactive Showcase
The system SHALL present the four foundational rules of the YNAB method with explanatory light-card graphics and key principles.

#### Scenario: Exploring the 4 YNAB rules
- **WHEN** visitor navigates through the rules section
- **THEN** system showcases:
  - Rule 1: Give Every Dollar a Job (*Dale un trabajo a cada dólar*)
  - Rule 2: Embrace Your True Expenses (*Acepta tus gastos reales*)
  - Rule 3: Roll With The Punches (*Ajusta tus velas ante imprevistos*)
  - Rule 4: Age Your Money (*Envejece tu dinero*)

### Requirement: Navigation Header and Direct Action Links
The system SHALL provide a transparent/sticky light navigation bar with brand logo, links to features and rules, and direct links to "Iniciar Sesión" and "Registrarse Gratis".

#### Scenario: Clicking Free Registration
- **WHEN** visitor clicks "Registrarse Gratis"
- **THEN** system redirects to `/register` with immediate 100% free account creation
