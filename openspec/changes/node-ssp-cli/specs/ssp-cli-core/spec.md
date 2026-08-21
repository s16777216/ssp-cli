## ADDED Requirements

### Requirement: Authentication and Session Management
The system SHALL provide a client capable of logging into Mailcloud using credentials and managing cookies and CSRF request tokens.

#### Scenario: Successful login and token extraction
- **WHEN** user provides valid username and password
- **THEN** system successfully authenticates, acquires CSRF token and cookies, and saves session state

#### Scenario: Expired token auto-recovery
- **WHEN** API call returns an expired token error
- **THEN** system automatically refreshes token or prompts re-authentication
