## ADDED Requirements

### Requirement: User can move/rename a file or folder on remote server

The system SHALL allow users to move or rename a file or folder on Mailcloud server using WebDAV MOVE protocol.

#### Scenario: Successful file move/rename

- **WHEN** user executes `ssp mv <src> <dst>`
- **THEN** system moves/renames the file/folder from `<src>` to `<dst>`

#### Scenario: Move into directory

- **WHEN** user executes `ssp mv <src> <dst-dir>/` where `<dst-dir>` is an existing directory
- **THEN** system moves the source into `<dst-dir>` preserving the original filename

#### Scenario: Target already exists (default)

- **WHEN** target `<dst>` already exists
- **THEN** system displays error `錯誤: 目標已存在 - <dst>` and exits with non-zero code

#### Scenario: Target already exists with -i flag

- **WHEN** user executes `ssp mv -i <src> <dst>` and target exists
- **THEN** system prompts `目標已存在，覆蓋？ [y/N]`, proceeds only on `y`

#### Scenario: Source not found

- **WHEN** source `<src>` does not exist
- **THEN** system displays error `錯誤: 來源不存在 - <src>` and exits with non-zero code

#### Scenario: Permission denied

- **WHEN** user lacks permission to move `<src>` or write to `<dst>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful move completion

- **WHEN** move completes successfully
- **THEN** system displays `移動完成: <dst>`