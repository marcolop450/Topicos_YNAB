# Capability: support-chat

## Purpose

Define el widget flotante de atención y chat de soporte para clientes y su canal de comunicación bidireccional con el panel de administración.

## Requirements

### Requirement: Floating Support Widget Interface
The system SHALL display a non-intrusive floating support launcher button in the bottom-right corner of authenticated client views.

#### Scenario: Opening support widget
- **WHEN** client clicks on the floating support widget launcher
- **THEN** system expands a support dialog showing a welcome message, common quick-help options, a message history list, and a text input field

#### Scenario: Selecting a quick help topic
- **WHEN** client clicks a quick-help chip such as "How does Ready to Assign work?"
- **THEN** system immediately outputs the corresponding pedagogical explanation and registers the interaction

### Requirement: Real-Time Client-to-Admin Messaging
The system SHALL allow clients to send custom inquiries and receive responses from platform administrators.

#### Scenario: Sending a support message to admin
- **WHEN** client types a message and submits it in the chat widget
- **THEN** system records the message in the support queue and displays a pending delivery status

#### Scenario: Receiving an admin response
- **WHEN** administrator replies to the client's thread from `/admin`
- **THEN** system displays the administrator's reply inside the client's chat widget and shows an unread badge if closed
