# ssp-cli-skill

## Purpose

Define the ssp-cli agent skill: a discoverable `SKILL.md` that guides coding agents to use the `ssp` CLI for operating Mailcloud cloud files, in an agent-agnostic, concise trigger-card style. (Created from change `add-ssp-cli-skill`.)

## Requirements

### Requirement: Skill provides agent-usable ssp-cli guidance

The system SHALL provide an agent skill at `skills/ssp-cli/SKILL.md` that guides a coding agent to use the `ssp` command for operating Mailcloud cloud files, written in an agent-agnostic (通用) style.

#### Scenario: Skill file exists in expected location

- **WHEN** the repository is ready for skill distribution
- **THEN** `skills/ssp-cli/SKILL.md` exists with valid frontmatter (name: `ssp-cli`, description)

#### Scenario: Agent can discover the skill via npx skills

- **WHEN** user runs `npx skills add ./skills --list`
- **THEN** the CLI lists `ssp-cli` as an available skill

### Requirement: Skill instructs agent on how to invoke ssp

The skill SHALL instruct the agent to obtain the command list dynamically via `ssp --help` rather than hard-coding an exhaustive command list, and SHALL provide concise examples for common operations.

#### Scenario: Dynamic command discovery

- **WHEN** the agent loads the skill and needs to know available commands
- **THEN** the skill directs the agent to run `ssp --help` to obtain the command list

#### Scenario: Common operation examples included

- **WHEN** the agent needs to operate Mailcloud files
- **THEN** the skill provides a concise example for each of the common operations: list files (ls), upload, download, remove (rm), and create directory (mkdir)

### Requirement: Skill handles authentication boundary

The skill SHALL note that `ssp` requires an active login, and SHALL instruct the agent to stop and report to the user (to run `ssp login`) when an authentication failure occurs, rather than retrying blindly.

#### Scenario: Authentication failure handling

- **WHEN** a `ssp` command reports not-logged-in / 401 error
- **THEN** the agent stops, does not blindly retry, and reports that the user should run `ssp login` first
