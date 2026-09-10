## MODIFIED Requirements

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
- **THEN** system prompts `Destination already exists, overwrite? [y/N]`, proceeds only on `y` (re-issues MOVE with `Overwrite: T`)

#### Scenario: Target already exists with -y flag

- **WHEN** user executes `ssp mv -y <src> <dst>` and target exists
- **THEN** system automatically overwrites the target without prompting (re-issues MOVE with `Overwrite: T`)

#### Scenario: Source validated before move

- **WHEN** user executes `ssp mv <src> <dst>` and `<src>` does not exist
- **THEN** system validates source via statPath first, displays `Error: Source not found - <src>` and exits with non-zero code

#### Scenario: Cross-storage move rejected

- **WHEN** user attempts to move across storage spaces (detected via server error)
- **THEN** system displays `Error: Cross-storage move not supported, use cp + rm instead` and exits with non-zero code

#### Scenario: Destination parent directory missing

- **WHEN** user executes `ssp mv <src> <dst>` and parent directory of `<dst>` does not exist
- **THEN** system displays `Error: Destination directory not found` and exits with non-zero code

#### Scenario: Permission denied

- **WHEN** user lacks permission to move `<src>` or write to `<dst>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful move completion

- **WHEN** move completes successfully
- **THEN** system displays `Move complete: <dst>` and exits with code 0

#### Scenario: User cancels overwrite in interactive mode

- **WHEN** target exists and user enters `n` at `Destination already exists, overwrite? [y/N]` prompt
- **THEN** system displays `Move cancelled` and exits with code 0