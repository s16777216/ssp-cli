## ADDED Requirements

### Requirement: Package is installable via npm registry

The system SHALL be distributed as an npm package published to the public npm registry under the scoped name `@s16777216/ssp-cli`, such that users can install and invoke the `ssp` command globally.

#### Scenario: Install from npm registry

- **WHEN** user runs `npm install -g @s16777216/ssp-cli`
- **THEN** the `ssp` command becomes available in the PATH and is invocable

#### Scenario: Invoke version command

- **WHEN** user runs `ssp --version`
- **THEN** system displays the package version from `package.json` (identical to the published version)

### Requirement: Package contains only distributable files

The system SHALL publish only runtime files in the npm tarball, excluding test files and development artifacts.

#### Scenario: Test files excluded from tarball

- **WHEN** the package tarball is generated (e.g., `npm pack --dry-run`)
- **THEN** test files (under `test/`) are not included in the published files

#### Scenario: Runtime files included

- **WHEN** the package tarball is generated
- **THEN** runtime source (`src/`), `README.md`, and `LICENSE` are included

### Requirement: Global install produces working ssp binary

The system SHALL expose a working `ssp` binary when installed globally, verified locally before publishing.

#### Scenario: Local global install validation

- **WHEN** user runs `npm install -g .` locally and then `ssp --version`
- **THEN** the command executes successfully and prints a version matching `package.json`
