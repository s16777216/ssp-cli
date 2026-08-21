## ADDED Requirements

### Requirement: User can search files on remote server

The system SHALL allow users to search files on Mailcloud server using AJAX search endpoint.

#### Scenario: Basic filename search

- **WHEN** user executes `ssp search <keyword>`
- **THEN** system returns files matching `<keyword>` in filename

#### Scenario: Content search with -c flag

- **WHEN** user executes `ssp search -c <keyword>`
- **THEN** system returns files with `<keyword>` in content (requires server full-text index)

#### Scenario: Type filter with -t flag

- **WHEN** user executes `ssp search -t file <keyword>`
- **THEN** system returns only files matching `<keyword>`

#### Scenario: Type filter for directories

- **WHEN** user executes `ssp search -t dir <keyword>`
- **THEN** system returns only directories matching `<keyword>`

#### Scenario: JSON output

- **WHEN** user executes `ssp search --json <keyword>`
- **THEN** system outputs JSON array of matching files

#### Scenario: No matches found

- **WHEN** search returns no results
- **THEN** system displays `無符合結果` and exits with code 0

#### Scenario: Search with special characters

- **WHEN** keyword contains Chinese characters or special symbols
- **THEN** system correctly URL-encodes the keyword and searches

#### Scenario: Search error handling

- **WHEN** search API returns error
- **THEN** system displays error message and exits with non-zero code