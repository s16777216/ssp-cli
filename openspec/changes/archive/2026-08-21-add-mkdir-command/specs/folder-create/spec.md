## ADDED Requirements

### Requirement: User can create a folder on remote server

The system SHALL allow users to create a folder at specified remote path on Mailcloud server using WebDAV MKCOL protocol.

#### Scenario: Successful folder creation

- **WHEN** user executes `ssp mkdir <remote-path>`
- **THEN** system creates the folder at `<remote-path>` on the server

#### Scenario: Recursive folder creation with -p flag

- **WHEN** user executes `ssp mkdir -p <remote-path>` with non-existent parent directories
- **THEN** system creates all necessary parent directories and the target folder

#### Scenario: Folder already exists

- **WHEN** folder already exists at `<remote-path>`
- **THEN** system displays error message `錯誤: 資料夾已存在 - <remote-path>` and exits with non-zero code

#### Scenario: Parent directory does not exist without -p flag

- **WHEN** user executes `ssp mkdir <remote-path>` where parent directory does not exist
- **THEN** system displays error message `錯誤: 父目錄不存在` and exits with non-zero code

#### Scenario: Remote path with special characters

- **WHEN** user executes `ssp mkdir` with path containing Chinese characters or spaces
- **THEN** system correctly encodes the path and creates the folder

#### Scenario: Permission denied

- **WHEN** user does not have permission to create folder at `<remote-path>`
- **THEN** system displays error message from server and exits with non-zero code

#### Scenario: Successful creation confirmation

- **WHEN** folder creation completes successfully
- **THEN** system displays `建立完成: <remote-path>`