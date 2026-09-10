## Purpose

Defines the cross-cutting contract for user-facing CLI messages: every message the CLI shows to the user is in English, error output is prefixed with `Error: ` exactly once at the command layer, and error classification never depends on parsing message text.

## ADDED Requirements

### Requirement: All user-visible CLI messages are in English

The system SHALL display all user-facing output — errors, success messages, interactive prompts, progress output, warnings, and empty-result notices — in English.

#### Scenario: Error messages are in English

- **WHEN** any command reports an error
- **THEN** the message text is English (e.g. `Error: File not found - <local-file>`, never `錯誤: ...` or mixed Chinese/English)

#### Scenario: Success messages are in English

- **WHEN** a command completes successfully and displays a completion message
- **THEN** the message is English (e.g. `Upload complete: <remote-path>`)

#### Scenario: Interactive prompts are in English

- **WHEN** a command asks the user for a decision (overwrite confirmation, deletion confirmation)
- **THEN** the prompt text is English (e.g. `Destination already exists, overwrite? [y/N]`)

#### Scenario: Progress output is in English

- **WHEN** a command displays progress
- **THEN** the progress label is English (e.g. `Uploading... <percent>% (<loaded> / <total>) @ <speed>`)

#### Scenario: Warnings are in English

- **WHEN** a command emits a non-fatal warning
- **THEN** the warning is prefixed with `Warning: ` and its text is English (e.g. `Warning: Server logout failed, local credentials cleared`)

#### Scenario: Empty-result notices are in English

- **WHEN** a search or listing returns no results
- **THEN** the notice is English (e.g. `No matching results`)

### Requirement: Error prefix applied exactly once, at the command layer

The system SHALL prefix error output with `Error: ` exactly once, and that prefix SHALL be added only by the command layer; lower layers SHALL return unprefixed message text.

#### Scenario: API layer returns unprefixed message

- **WHEN** the client/API layer detects a failure and returns a message to the command layer
- **THEN** the message text does NOT include any `Error:` / `錯誤:` prefix

#### Scenario: Command layer adds the prefix

- **WHEN** a command displays a returned error message
- **THEN** it prints `Error: <message>` (single prefix, no comma form such as `Error:, <message>`)

#### Scenario: No double prefix

- **WHEN** any command-relevant failure propagates from the API layer to the command display
- **THEN** the final output contains exactly one `Error: ` prefix

### Requirement: Uniform error fallback and catch formatting

The system SHALL display `Error: Unknown error` when no specific error message is available, and SHALL format caught exceptions consistently.

#### Scenario: Unknown error fallback

- **WHEN** an operation fails and neither the server nor the client provides a message
- **THEN** the system displays `Error: Unknown error` and exits with non-zero code

#### Scenario: Caught exception formatting

- **WHEN** a command catches an exception
- **THEN** it displays `Error: ${err.message}` using template-literal form

### Requirement: Error classification is decoupled from message text

The system SHALL distinguish the "already exists" condition from real failures using structured state, never by searching message text for a substring.

#### Scenario: Recursive mkdir tolerates already-existing intermediates

- **WHEN** user executes `ssp mkdir /a/b/c` and an intermediate folder (e.g. `/a/b`) already exists
- **THEN** the system continues creating the remaining missing folders and exits with code 0

#### Scenario: mkdir of an already-existing folder is reported

- **WHEN** user executes `ssp mkdir /A` and `/A` already exists
- **THEN** the system displays `Error: Folder already exists - /A` and exits with non-zero code