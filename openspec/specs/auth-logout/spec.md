## Purpose

The `auth-logout` capability enables users to log out from the Mailcloud server by clearing locally stored credentials (username, password, requesttoken, cookies) and optionally revoking the server-side session.

## ADDED Requirements

### Requirement: User can logout and clear credentials

The system SHALL allow users to logout and clear locally stored credentials.

#### Scenario: Basic logout

- **WHEN** user executes `ssp logout`
- **THEN** system deletes `~/.ssp-config.json` and displays `已登出`, exits with code 0

#### Scenario: Logout with --all flag

- **WHEN** user executes `ssp logout --all`
- **THEN** system calls server logout API, then deletes local config, displays `已登出 (含伺服器 session)`, exits with code 0

#### Scenario: Local config does not exist

- **WHEN** user executes `ssp logout` but `~/.ssp-config.json` does not exist
- **THEN** system displays `已登出` (冪等操作), exits with code 0

#### Scenario: Server logout fails with --all

- **WHEN** user executes `ssp logout --all` and server logout API fails (non-2xx)
- **THEN** system displays warning `警告: 伺服器登出失敗，但本地憑證已清除`, then clears local config, exits with code 0

#### Scenario: Local config deletion fails

- **WHEN** user executes `ssp logout` but cannot delete `~/.ssp-config.json` (e.g., permission denied)
- **THEN** system displays `Error: <message>` and exits with non-zero code