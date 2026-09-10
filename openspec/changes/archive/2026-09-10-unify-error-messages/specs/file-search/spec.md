## MODIFIED Requirements

### Requirement: User can search files on remote server

The system SHALL allow users to search files on Mailcloud server using AJAX search endpoint.

#### Scenario: Basic filename search (default recursive, all types)

- **WHEN** user executes `ssp search <keyword>`
- **THEN** system returns files and directories matching `<keyword>` in filename, searching recursively across the entire accessible mount point

#### Scenario: Content search with -c flag

- **WHEN** user executes `ssp search -c <keyword>`
- **THEN** system returns files with `<keyword>` in content (requires server full-text index; sends `content=1` parameter)

#### Scenario: Type filter with -t flag for files only

- **WHEN** user executes `ssp search -t file <keyword>`
- **THEN** system returns only files matching `<keyword>`

#### Scenario: Type filter with -t flag for directories only

- **WHEN** user executes `ssp search -t dir <keyword>`
- **THEN** system returns only directories matching `<keyword>`

#### Scenario: Type filter with -t all (explicit all types)

- **WHEN** user executes `ssp search -t all <keyword>`
- **THEN** system returns both files and directories matching `<keyword>` (same as default)

#### Scenario: JSON output

- **WHEN** user executes `ssp search --json <keyword>`
- **THEN** system outputs JSON array of matching files

#### Scenario: Table output with column flags (parity with ls)

- **WHEN** user executes `ssp search -a <keyword>` or `ssp search -s -D <keyword>`
- **THEN** system outputs table with corresponding columns (all / size / date / permissions / owner)

#### Scenario: No matches found

- **WHEN** search returns no results
- **THEN** system displays `No matching results` and exits with code 0

#### Scenario: Search with special characters

- **WHEN** keyword contains Chinese characters or special symbols
- **THEN** system correctly URL-encodes the keyword and searches

#### Scenario: Search error handling

- **WHEN** search API returns error
- **THEN** system displays error message prefixed with `Error:` and exits with non-zero code

#### Scenario: Successful search with results exits with code 0

- **WHEN** search completes successfully (with or without results)
- **THEN** system exits with code 0