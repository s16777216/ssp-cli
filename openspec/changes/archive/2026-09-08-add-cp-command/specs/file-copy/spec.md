## ADDED Requirements

### Requirement: User can copy a file or folder on remote server

The system SHALL allow users to copy a file or folder on Mailcloud server using WebDAV COPY protocol.

#### Scenario: Successful file copy

- **WHEN** user executes `ssp cp <src> <dst>`
- **THEN** system copies the file from `<src>` to `<dst>`

#### Scenario: Directory copy without -r flag

- **WHEN** user executes `ssp cp <src-dir> <dst>` where `<src-dir>` is a directory
- **THEN** system displays error `錯誤: 來源為資料夾，請使用 -r` and exits with non-zero code

#### Scenario: Recursive directory copy with -r flag

- **WHEN** user executes `ssp cp -r <src-dir> <dst>`
- **THEN** system copies the directory and all its contents to `<dst>` in a single server-side recursive COPY

#### Scenario: Copy destination is treated as exact target path

- **WHEN** user executes `ssp cp <src> <dst>`
- **THEN** system copies the source to the exact path `<dst>`, without auto-inserting into a directory even if `<dst>` is an existing directory

#### Scenario: Target already exists (default interactive)

- **WHEN** target `<dst>` already exists and user executes `ssp cp <src> <dst>`
- **THEN** system prompts `目標已存在，覆蓋？ [y/N]`, proceeds only on `y` (re-issues COPY with `Overwrite: T`)

#### Scenario: Target already exists with -y flag

- **WHEN** user executes `ssp cp -y <src> <dst>` and target exists
- **THEN** system automatically overwrites the target without prompting (re-issues COPY with `Overwrite: T`)

#### Scenario: Source not found

- **WHEN** source `<src>` does not exist
- **THEN** system displays error `錯誤: 來源不存在 - <src>` and exits with non-zero code

#### Scenario: Permission denied

- **WHEN** user lacks permission to read `<src>` or write to `<dst>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful copy completion

- **WHEN** copy completes successfully
- **THEN** system displays `複製完成: <dst>`