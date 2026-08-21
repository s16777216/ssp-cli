## ADDED Requirements

### Requirement: User can logout and clear credentials

The system SHALL allow users to logout and clear locally stored credentials.

#### Scenario: Basic logout

- **WHEN** user executes `ssp logout`
- **THEN** system deletes `~/.ssp-config.json` and displays `已登出`

#### Scenario: Logout with --all flag

- **WHEN** user executes `ssp logout --all`
- **THEN** system calls server logout API, then deletes local config, displays `已登出 (含伺服器 session)`

#### Scenario: Local config does not exist

- **WHEN** user executes `ssp logout` but `~/.ssp-config.json` does not exist
- **THEN** system displays `已登出` (冪等操作)

#### Scenario: Server logout fails with --all

- **WHEN** user executes `ssp logout --all` and server logout API fails
- **THEN** system displays warning `警告: 伺服器登出失敗，但本地憑證已清除`, then clears local config