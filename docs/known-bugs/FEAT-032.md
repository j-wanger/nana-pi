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
- Identity scan (scrub-contracts, final review): the command's main-module guard compares the resolved command path with the module's real path. Run through a symlinked path, it prints nothing and exits 0. One other script in the scripts folder uses the same guard; the suite imports the module, so R-2511 is not affected.
- Identity scan (scrub-contracts, final review): R-2511 scans the folder "." and is right only because the test runner starts inside the repo. Run from outside a git tree, it fails loudly rather than passing.
- Shipped text (scrub-contracts, final review): some role-word swaps read oddly. "until he reopens it" stays in HANDOFF and the seven frozen Status lines, and "If it is not his call" stays in the shipped writing rule. Several sentences start with a lower-case "the owner".
- Trial extractor (scrub-contracts, final review r2): R-2521's test uses only a lower-case stand-in word, so dropping the lower-casing in the owner-word check passes the suite. Archived reports write the name capitalized. A capitalized stand-in in the test would pin it.
- Trial extractor (scrub-contracts, final review r2): nothing pins the owner-word branch to the fifth rubric part; dropping the part guard passes the suite. Only a contrived input with the name alone in an earlier part would show it.
- Trial extractor (scrub-contracts, final review r2): main's case-insensitive Unicode regex folded a few non-ASCII letters, such as the Kelvin sign, onto ASCII ones; the token split and lower-casing do not. Only a contrived spelling shows it.
- Records scrub (scrub-records, plan): home paths and cited memory-file names in the records no longer resolve. CI logs no longer show exactly what CI printed.
- Records scrub (scrub-records, plan): the seat found the 14 work-domain lines with a finder kept outside the repo, because its search terms name the work. Domain text it missed is human judgement that no scan checks.
- Records scrub (scrub-records, final review): the scrub script's one-file mode can no longer clean a pasted log. With the record entries gone, it recovers the words only from the target file and needs all four there; a log holding only a home path exits 1. A seat cleans such a file by hand; the scan still blocks the land.
- Records scrub (scrub-records, final review): the proof at the tip reports 4,441 failures, all in the October session archive, because the notes put a new entry at its top and shifted every line below. Run the proof at 272514cc, where it is clean.
- Identity scan (scrub-records, final review): the README's scan line asks for a manifest-backed pin, but frozen-desk entries carry none; and any other hand-added entry kind needs a test change, since R-2518 accepts only the three sealed manifest kinds.
