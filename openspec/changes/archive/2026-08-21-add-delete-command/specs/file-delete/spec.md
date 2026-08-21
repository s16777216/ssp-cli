## ADDED Requirements

### Requirement: User can delete a file from remote server

The system SHALL allow users to delete a file from Mailcloud server at specified path using AJAX API.

#### Scenario: Successful file deletion

- **WHEN** user executes `ssp delete <remote-path>`
- **THEN** system displays confirmation prompt

#### Scenario: User confirms deletion

- **WHEN** user enters `y` at confirmation prompt
- **THEN** system deletes the file at `<remote-path>`

#### Scenario: User cancels deletion

- **WHEN** user enters `n` or presses Enter at confirmation prompt
- **THEN** system cancels deletion and displays `已取消刪除`

#### Scenario: Confirmation prompt format

- **WHEN** system displays confirmation prompt
- **THEN** prompt format is: `確認刪除 <remote-path>? [y/N]`

#### Scenario: Remote file not found

- **WHEN** remote file does not exist at `<remote-path>`
- **THEN** system displays error message `錯誤: 檔案不存在 - <remote-path>` and exits

#### Scenario: Delete success completion

- **WHEN** file deletion completes successfully
- **THEN** system displays `刪除完成: <remote-path>`

#### Scenario: Delete failure

- **WHEN** file deletion fails due to network or server error
- **THEN** system displays error message and exits with non-zero code
