## ADDED Requirements

### Requirement: User can upload a file to remote server

The system SHALL allow users to upload a local file to a specified remote path on Mailcloud server using WebDAV PUT protocol.

#### Scenario: Successful file upload

- **WHEN** user executes `ssp upload <local-file> <remote-path>`
- **THEN** system uploads the file to `<remote-path>` on the server

#### Scenario: Upload progress display

- **WHEN** file upload is in progress
- **THEN** system displays progress in format: `上傳中... <percent>% (<loaded> / <total>) @ <speed>`

#### Scenario: Progress update frequency

- **WHEN** upload progress changes
- **THEN** system updates progress display every 5%

#### Scenario: Auto overwrite existing file

- **WHEN** remote file already exists at `<remote-path>`
- **THEN** system automatically overwrites the existing file

#### Scenario: Local file not found

- **WHEN** local file does not exist at `<local-file>`
- **THEN** system displays error message `錯誤: 檔案不存在 - <local-file>` and exits

#### Scenario: Upload success completion

- **WHEN** file upload completes successfully
- **THEN** system displays `上傳完成: <remote-path>`

#### Scenario: Upload failure

- **WHEN** file upload fails due to network or server error
- **THEN** system displays error message and exits with non-zero code
