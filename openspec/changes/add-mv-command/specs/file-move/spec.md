## ADDED Requirements

### Requirement: User can move/rename a file or folder on remote server

The system SHALL allow users to move or rename a file or folder on Mailcloud server using WebDAV MOVE protocol.

#### Scenario: Successful file move/rename

- **WHEN** user executes `ssp mv <src> <dst>`
- **THEN** system moves/renames the file/folder from `<src>` to `<dst>`

#### Scenario: Move destination is treated as exact target path

- **WHEN** user executes `ssp mv <src> <dst>`
- **THEN** system moves the source to the exact path `<dst>`, without auto-inserting into a directory even if `<dst>` is an existing directory

#### Scenario: Target already exists (default interactive)

- **WHEN** target `<dst>` already exists and user executes `ssp mv <src> <dst>`
- **THEN** system prompts `目標已存在，覆蓋？ [y/N]`, proceeds only on `y` (re-issues MOVE with `Overwrite: T`)

#### Scenario: Target already exists with -y flag

- **WHEN** user executes `ssp mv -y <src> <dst>` and target exists
- **THEN** system automatically overwrites the target without prompting (re-issues MOVE with `Overwrite: T`)

#### Scenario: Source not found

- **WHEN** source `<src>` does not exist
- **THEN** system displays error `錯誤: 來源不存在 - <src>` and exits with non-zero code

#### Scenario: Permission denied

- **WHEN** user lacks permission to move `<src>` or write to `<dst>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful move completion

- **WHEN** move completes successfully
- **THEN** system displays `移動完成: <dst>`