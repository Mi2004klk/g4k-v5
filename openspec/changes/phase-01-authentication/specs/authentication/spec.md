## Purpose
Establish secure, role-aware authentication and session management for all users.

## ADDED Requirements

### Requirement: Branded sign-in screen
The system SHALL present a sign-in screen showing the landscape company logo, a welcome description, the copyright text "Games4King Workplace OS", and an info tooltip "Gen2k Conglomerate (2018) • Milestone 1". (R1.1)

#### Scenario: sign-in screen renders branding
- **WHEN** an unauthenticated user opens the app
- **THEN** the landscape logo, welcome copy, copyright, and info tooltip are visible

### Requirement: Credential sign-in
The system SHALL authenticate a user by Email or Employee ID plus password, with the password masked and a show/hide toggle. (R1.2, R1.3)

#### Scenario: successful sign-in
- **WHEN** a user submits valid credentials
- **THEN** a loading animation plays and they proceed to role selection or their dashboard

#### Scenario: failed sign-in
- **WHEN** a user submits invalid credentials
- **THEN** an error message appears without exposing which field was wrong

### Requirement: Role selection for dual-role users
The system SHALL show a Role Selection screen listing all assigned roles when a user holds more than one system role. (R1.4)

#### Scenario: dual-role user picks a role
- **WHEN** a dual-role user signs in
- **THEN** they choose a role and land on that role's dashboard

### Requirement: Forgot password
The system SHALL provide a forgot-password flow delivering an SMTP reset link, plus an in-app path requiring Admin approval. (R1.5, R1.6)

#### Scenario: SMTP reset
- **WHEN** a user requests a reset with their email/Employee ID
- **THEN** they receive a reset link, set a new password, and are redirected to sign-in

#### Scenario: Admin-approval reset
- **WHEN** the in-app path is used
- **THEN** an Admin approves the request before the reset is allowed

### Requirement: Account lockout
The system SHALL lock an account after 5 failed attempts within 10 minutes and allow retry only after the lockout period. (R1.7)

#### Scenario: lockout triggers
- **WHEN** a user fails 5 attempts within 10 minutes
- **THEN** the account is locked and further attempts are rejected until the period elapses

### Requirement: Suspicious-login alerts
The system SHALL notify HR and Admin when suspicious login activity is detected. (R1.8)

#### Scenario: anomaly notification
- **WHEN** suspicious login activity is detected for an account
- **THEN** HR and Admin receive a notification

### Requirement: First-login password change
The system SHALL force a password change on first login. (R1.9)

#### Scenario: forced change
- **WHEN** a user signs in for the first time
- **THEN** they must set a new password before reaching their dashboard

### Requirement: Onboarding welcome
The system SHALL show a welcome/setup screen on first login. (R1.10)

#### Scenario: first-time welcome
- **WHEN** a new account logs in for the first time
- **THEN** a setup guide/welcome screen is displayed

### Requirement: Device session management
The system SHALL list a user's logged-in devices and allow remote logout from any device and logout from the current device. (R1.11)

#### Scenario: remote logout
- **WHEN** a user revokes a device from their session list
- **THEN** that device's token is invalidated immediately

### Requirement: Capability-gated routing
The system SHALL enforce capability-based access on both frontend routes and backend endpoints. (R1.12)

#### Scenario: unauthorized route access
- **WHEN** a user without the required capability attempts a guarded route or endpoint
- **THEN** access is denied

### Requirement: Offline login attempt
The system SHALL queue a login attempt when offline and sync the result on reconnection. (R1.13)

#### Scenario: offline attempt queued
- **WHEN** a user submits credentials while offline
- **THEN** the attempt is queued and processed once connectivity returns
