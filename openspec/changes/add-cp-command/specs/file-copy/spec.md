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
- **THEN** system recursively copies the directory and all its contents to `<dst>`

#### Scenario: Copy into directory

- **WHEN** user executes `ssp cp <src> <dst-dir>/` where `<dst-dir>` is an existing directory
- **THEN** system copies the source into `<dst-dir>` preserving the original filename

#### Scenario: Target already exists (default)

- **WHEN** target `<dst>` already exists
- **THEN** system displays error `錯誤: 目標已存在 - <dst>` and exits with non-zero code

#### Scenario: Target already exists with -i flag

- **WHEN** user executes `ssp cp -i <src> <dst>` and target exists
- **THEN** system prompts `目標已存在，覆蓋？ [y/N]`, proceeds only on `y`

#### Scenario: Source not found

- **WHEN** source `<src>` does not exist
- **THEN** system displays error `錯誤: 來源不存在 - <src>` and exits with non-zero code

#### Scenario: Permission denied

- **WHEN** user lacks permission to read `<src>` or write to `<dst>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful copy completion

- **WHEN** copy completes successfully
- **THEN** system displays `複製完成: <dst>`