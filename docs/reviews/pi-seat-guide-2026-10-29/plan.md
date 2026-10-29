# pi-seat-guide · plan (seat, 2026-10-29)

Feature: FEAT-006 · Launch builders with execution limits

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: 1 MUST, 6 SHOULD, 5 NOTE); the seat took the MUST and every SHOULD. Plans get no review round.

## Purpose

The current priority's appetite says "a pi seat gets the same seat guide as a Claude Code seat" (the owner, 2026-10-27, OBJECTIVE). That is an agreed reading, so this plans without readings. Today the seat guide (`packages/nana-setup/claude/rules/nana-seat.md`) loads only as a Claude Code rule. A pi seat sees one pointer bullet in AGENTS.md and never reads the guide. So a pi seat misses its rules: leave a running builder alone, run the full suite whole, start the issue watch, post a plan's questions and wait on a blocking one. The owner said "Go" on 2026-10-29.

## Assumptions (any may be wrong)

- A1. The rulings file is the precedent: `nana-setup install` places it in pi's agent dir (R-1412), and the `nana-rulings` extension appends it to each session's system prompt, refusing an unusable file with a one-line marker.
- A2. The guide applies only to the seat. Builder and reviewer children run with `NANA_ROLE` set and must not get it (the guide's own first sentence, R-1141).
- A3. One copy stays canonical: the guide's source remains `packages/nana-setup/claude/rules/nana-seat.md`, and pi reads an installed link or copy of it, never a second text.

## Open choices

- O1. A new extension, or one more section from the `nana-rulings` extension. Default: one more section from `nana-rulings`, which already reads, bounds and marks an installed rule file; its `@purpose` header is rewritten to name both.

## Questions for the owner

None.

## Threat model

In scope is honest variation: a missing, empty, oversized or non-UTF-8 installed guide; Windows copies; a stale copy after the guide changes; builder and reviewer sessions; a fresh install and a re-install. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/extensions/nana-rulings.ts`: reads the installed rulings file with a bound and appends it, or a marker.
- `packages/nana-pack/lib/rulings-config.mjs`: the file name, heading, cap and marker for rulings.
- `packages/nana-setup/lib/paths.mjs` and the install step that places `nana-rulings.md` (R-1412): where the guide's link or copy goes.
- `packages/nana-setup/lib/doctor.mjs:511`: the doctor row for the installed rulings file.
- `packages/nana-setup/lib/stale-copies.mjs`: the stale-copy notice on Windows.
- `packages/nana-setup/lib/state-manifest.mjs` and the `copy-record` / `rememberCopy` helpers: how uninstall finds the rulings file and how Windows copies are recorded.
- `packages/nana-setup/bin/install-check.mjs`: the live pi turn that checks the rulings heading.

## Must-meet

Rows from R-3020. Each check carries its `// req:` marker directly above it.

1. **Install places the guide for pi.** `nana-setup install` places `nana-seat.md` in pi's active agent dir as a symlink to the canonical guide, or a byte-equal recorded copy on win32, as it does for the rulings file. Uninstall removes it through the state manifest.
2. **A pi seat session gets the guide.** The extension takes its environment as an input. When `env.NANA_ROLE` is not one of the launcher roles, the session's system prompt carries the whole installed guide under its own fixed heading. Tests pass `env` explicitly, so they hold inside a builder that runs with `NANA_ROLE=worker`.
3. **Builders and reviewers do not.** When `env.NANA_ROLE` is a launcher role, the prompt carries no guide section. The rulings section is unchanged for every session.
4. **An unusable guide says so.** A missing, empty, oversized or non-UTF-8 installed guide injects one marker line with its own prefix, telling the user to run `nana-setup install`, and never throws. The guide's read cap is a sealed value with provenance, pinned by one test.
5. **Doctor and the stale notice check it.** `nana-setup doctor` reports the installed guide as OK, or FAIL for a missing file, a copy on macOS or Linux, or a stale Windows copy, beside the rulings row. The extension's stale-install notice covers it.
6. **Install-check sees it.** The install check's live pi turn, which runs as a seat, checks the guide heading as it checks the rulings heading.
7. **The guide reads right in pi.** The guide gains one sentence: a pi seat runs a second lane's build from another pi session or the desk, because its own builds run in the foreground. The shared working pattern's Seat guide bullet says both runtimes load the guide, and AGENTS.md's region matches the template (R-859). R-1140's row keeps "twelve" and adds the two question rules it now omits.

Residual: pi children that set no `NANA_ROLE` (subagents, bench runs) also get the guide.

## Class and size

- Class: hook. `node scripts/lane-class.mjs --root . --files` on the rulings extension and the install code prints `hook: packages/nana-pack/extensions/nana-rulings.ts — pi extension`. The full ladder applies.
- Size: small.
