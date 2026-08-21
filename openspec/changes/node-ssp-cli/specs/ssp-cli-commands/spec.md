## ADDED Requirements

### Requirement: CLI Commands Support
The system SHALL provide command-line interface commands for login, list, upload, download, and delete.

#### Scenario: List files in directory
- **WHEN** user executes `ssp list --dir /`
- **THEN** system prints the list of files and folders in the root directory

#### Scenario: Upload file
- **WHEN** user executes `ssp upload <localPath> <remoteDir>`
- **THEN** system uploads the local file to the specified remote directory
