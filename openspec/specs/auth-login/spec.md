## Purpose

The `auth-login` capability enables users to log in to their Mailcloud account. Before saving credentials locally, the system verifies that the session obtained from the login request is actually usable by issuing a protected request to the server, so an invalid session is never recorded as a successful login.

## Requirements

### Requirement: Login verifies session before saving credentials

The system SHALL verify that the session obtained from a successful login request is actually valid by issuing a protected WebDAV PROPFIND request to the user's root directory before saving credentials to the local config file.

#### Scenario: Valid session saves credentials

- **WHEN** user executes `ssp login -u <user> -p <pass>` with correct credentials and the server returns a valid session (verification PROPFIND returns 2xx)
- **THEN** system saves `username`, `password`, `requesttoken`, and `cookies` to `~/.ssp-config.json` and displays `Login successful! Credentials saved.`

#### Scenario: Invalid session is not saved

- **WHEN** user executes `ssp login -u <user> -p <pass>` and the login POST returns 200 but the session verification fails (non-2xx, such as 401/403)
- **THEN** system does NOT write `~/.ssp-config.json`, displays `Error: <message>` and exits with non-zero code

#### Scenario: Existing config preserved on failed verification

- **WHEN** user executes `ssp login` with a previously existing `~/.ssp-config.json` and the new session verification fails
- **THEN** system leaves the existing config file untouched (no overwrite with invalid credentials)

#### Scenario: Verification request includes session credentials

- **WHEN** system performs the session verification PROPFIND after login
- **THEN** system sends the request using the newly obtained requesttoken and cookies (not any previously stored credentials)