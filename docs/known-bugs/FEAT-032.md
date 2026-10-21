# FEAT-032 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Identity scan (scrub-contracts, plan): history keeps every occurrence of the owner's name, by the 2026-10-21 ruling. Every commit's author also carries the owner's legal name and machine name; the git author setting is the owner's call.
- Identity scan (scrub-contracts, plan): the legal first name and the machine name are not hashed, because a three-letter calendar token would flood the logs. A pasted git log passes the scan.
- Identity scan (scrub-contracts, plan): the GitHub handle stays in the repository address, because installs depend on it.
- Identity scan (scrub-contracts, plan): short words hashed with sha256 can be reversed with a dictionary. The digests hide the words from casual reading only.
- Identity scan (scrub-contracts, plan): the scan catches words, not descriptions. The work domain described in other words passes.
- Writing trial extractor (scrub-contracts, plan): its sealed time zone names the owner's region. The recorded trial uses it, so it stays.
- Asks heading (scrub-contracts, plan adversary): under the prefix matcher, another project whose heading reads "Open for" plus a name and a colon goes from 0 asks to 2 malformed ones. A stray "Open for review" heading would read as asks. The independent check found one such project among 68 on this machine; it has no ledger, so no product report breaks.
- Shipped text (scrub-contracts, plan): other projects keep the old shipped text until they rerun `nana-setup project`. Until then its check reports their AGENTS.md region as differing.
- Shipped text (scrub-contracts, plan): a Windows rule copy reads stale until the next install, through the normal copy-record path.
- Identity scan (scrub-contracts, plan adversary): a lane in flight when this lands fails the scan at its own land, and must scrub before its final round.
- Identity scan (scrub-contracts, independent check): the tokenizer misses a word glued to digits or an escape letter. Examples are `%2F` or `%5C` before it in an encoded path, a JSON `\n` before a lower-case word, and a word followed by a year. UTF-16 and gzip files are missed too. No current file holds such a form.
- Identity scan (scrub-contracts, independent check): a plural or all-caps compound of the work acronym, such as the acronym plus `s`, `DESK` or `API`, is missed.
- Identity scan (scrub-contracts, independent check): `--write-allowlist` raises an existing record's count and adds any new record file. So one documented command lets a record gain the owner's name and pass. The records lane closes it with R-2518 and a writer that stops writing record entries.
- Identity scan (scrub-contracts, independent check): the `git ls-files` call keeps the 1 MiB default output buffer. The output is 209,030 bytes now, so the scan would throw near 18,000 tracked files.
- Identity scan (scrub-contracts, independent check): an R-2511 failure prints per-word counts only. It names no path and does not point to the scan command that lists them.
- Display test (scrub-contracts, independent check): the Windows path in `display-surfaces.test.mjs` became one with "the owner" and its space, not D1's `C:\Users\example`. The file still passes.
- Identity scan (scrub-contracts, final review): the command's main-module guard compares the resolved command path with the module's real path. Run through a symlinked path, it prints nothing and exits 0. One other script in the scripts folder uses the same guard; the suite imports the module, so R-2511 is not affected.
- Identity scan (scrub-contracts, final review): R-2511 scans the folder "." and is right only because the test runner starts inside the repo. Run from outside a git tree, it fails loudly rather than passing.
- Shipped text (scrub-contracts, final review): some role-word swaps read oddly. "until he reopens it" stays in HANDOFF and the seven frozen Status lines, and "If it is not his call" stays in the shipped writing rule. Several sentences start with a lower-case "the owner".
