## ADDED Requirements

### Requirement: User can download a file from remote server

The system SHALL allow users to download a file from Mailcloud server to local path using WebDAV GET protocol.

#### Scenario: Successful file download

- **WHEN** user executes `ssp download <remote-path> [local-destination]`
- **THEN** system downloads the file from `<remote-path>` to local destination

#### Scenario: Default download to current directory

- **WHEN** user executes `ssp download <remote-path>` without local destination
- **THEN** system downloads file to current working directory with original filename

#### Scenario: Download to specified directory

- **WHEN** user executes `ssp download <remote-path> <local-directory>`
- **THEN** system downloads file to specified directory with original filename

#### Scenario: Download progress display

- **WHEN** file download is in progress
- **THEN** system displays progress in format: `下載中... <percent>% (<loaded> / <total>) @ <speed>`

#### Scenario: Progress update frequency

- **WHEN** download progress changes
- **THEN** system updates progress display every 5%

#### Scenario: Auto overwrite existing file

- **WHEN** local file already exists at destination
- **THEN** system automatically overwrites the existing file

#### Scenario: Remote file not found

- **WHEN** remote file does not exist at `<remote-path>`
- **THEN** system displays error message `錯誤: 檔案不存在 - <remote-path>` and exits

#### Scenario: Download success completion

- **WHEN** file download completes successfully
- **THEN** system displays `下載完成: <local-destination>`

#### Scenario: Download failure

- **WHEN** file download fails due to network or server error
- **THEN** system displays error message and exits with non-zero code
