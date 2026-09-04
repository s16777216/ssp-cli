---
name: ssp-cli
description: Use the `ssp` CLI to operate Mailcloud/SecuSharePro cloud files (list, upload, download, remove, create folders). Trigger when a task involves working with Mailcloud cloud storage.
---

# ssp-cli

`ssp` is a CLI for **Mailcloud / SecuSharePro (ownCloud)** cloud file operations. Use it when a task requires listing, uploading, downloading, removing, or creating files/folders in the Mailcloud cloud storage.

## When to use

Use `ssp` whenever you need to interact with Mailcloud cloud files directly (e.g., verify an upload, list remote files, clean up a remote path, or download an artifact) instead of reading source code or guessing.

## Getting the command list

**Always run `ssp --help` first** to get the authoritative list of commands and options. Command set may evolve; rely on `--help`, not memory. For subcommand options, run `ssp <command> --help`.

## Common examples

These are starting points for the most frequent operations. Confirm exact flags with `ssp <command> --help` when in doubt.

- **List files** in a directory:
  `ssp ls` (root) or `ssp ls --dir /Projects --size --date`
- **Upload** a local file to a remote path:
  `ssp upload ./report.pdf /Projects/report.pdf`
- **Download** a remote file (optional local destination):
  `ssp download /Projects/report.pdf ./downloaded.pdf`
- **Remove** a remote file or folder:
  `ssp rm /Projects/obsolete.txt`
- **Create a folder** (use `-p` to create parents):
  `ssp mkdir /Projects/NewFolder` or `ssp mkdir -p /a/b/c`

## Authentication

`ssp` requires an active login (credentials stored in `~/.ssp-config.json`). If a command reports a not-logged-in / 401 error, **stop** — do not blindly retry. Tell the user they need to run `ssp login` first, then wait for them to do so before continuing.
