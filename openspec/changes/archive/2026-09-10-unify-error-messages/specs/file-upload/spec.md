## MODIFIED Requirements

### Requirement: User can upload a file to remote server

The system SHALL allow users to upload a local file to a specified remote path on Mailcloud server using WebDAV PUT protocol.

#### Scenario: Successful file upload

- **WHEN** user executes `ssp upload <local-file> <remote-path>`
- **THEN** system uploads the file to `<remote-path>` on the server

#### Scenario: Upload to a directory target

- **WHEN** user executes `ssp upload <local-file> <directory/>` where `<directory/>` ends with a `/`
- **THEN** system uploads the file to `<directory>/<basename-of-local-file>` on the server (the file is placed inside the directory, keeping its original filename)

#### Scenario: Upload progress display

- **WHEN** file upload is in progress
- **THEN** system displays progress in format: `Uploading... <percent>% (<loaded> / <total>) @ <speed>`

#### Scenario: Progress update frequency

- **WHEN** upload progress changes
- **THEN** system updates progress display every 5%

#### Scenario: Auto overwrite existing file

- **WHEN** remote file already exists at `<remote-path>`
- **THEN** system automatically overwrites the existing file

#### Scenario: Local file not found

- **WHEN** local file does not exist at `<local-file>`
- **THEN** system displays error message `Error: File not found - <local-file>` and exits

#### Scenario: Upload success completion

- **WHEN** file upload completes successfully
- **THEN** system displays `Upload complete: <remote-path>`

#### Scenario: Upload failure

- **WHEN** file upload fails due to network or server error
- **THEN** system displays error message and exits with non-zero code