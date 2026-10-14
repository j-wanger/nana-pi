# Change declaration — a short guide for the seat that runs builders and reviewers

*Lane `seat-guide` · branch `feat/seat-guide` · worktree `~/nana-pi-wt/seat-guide`, based on `main` AFTER roster
lands (planned against `5b53ebc`; conflicts in §4) · 2026-10-13. Features: FEAT-006 (new R-1140, R-1141), SUB-019
(new R-1142); reworded R-301. Lane class SMALL: one plan-review round; it touches `packages/nana-setup/`, so the
install check runs locally before `nana-land` (Jake, 2026-10-12). Builder: **Sonnet 5.5**, a subagent in the lane
worktree (about 16 files with tests; Jake's 10-13 split sends multi-file lanes to Sonnet); the brief still names every
test by exact title. Evidence: `research-*.md`, `factcheck-*.md`, `sim/`, `sim-guide-v2.mjs`.*

## 1. Why

Jake, 2026-10-13, verbatim: "We also need to add instructions on how to be a good seat, the opus seat on windows
is checking the work done by the worker every turn".

- **Builders and reviewers get instructions; the seat gets none.** `pi-worker.mjs:92-93` and `pi-review.mjs:37` append
  theirs; the shared pattern says nothing on how a seat waits or verifies (its one "background" is pi's compaction, `:17`).
- **Root cause (INFERRED): the practice lives only in the Mac's shared memory** (`research-seat-practice.md` §1); a
  Windows machine starts from the empty seed (`steps.mjs:62`). Default model behaviour is an equal candidate.
- **The rule file is the only channel that reliably reaches the Windows Claude Code seat.** There `CLAUDE.md` is a
  one-time copy (`project.mjs:241-264`), maybe a one-line text file (`HANDOFF.md:81`); doctor checks rules byte for byte.

**Observable outcome.** After one install, every Claude Code session on both machines loads `nana-seat.md` (doctor
`✓ rule nana-seat.md`). Whether the Windows seat stops checking a running worker is visible only to Jake (§6 item 1).

**Threat model.** In: honest variation — an edit that drops the rule from one list, drops, duplicates or adds a guide
bullet, or edits the template but not `AGENTS.md`; CRLF; a stale Windows copy. Out: forgery, and a seat that ignores the rule.

## 2. Requirement delta

Main's highest ID is R-1111; feat/roster adds R-1120–R-1128; R-1140–R-1149 are unused on both (grep count 0).

| ID | Change | Text (draft) |
|---|---|---|
| R-1140 | added (FEAT-006, after R-1110) | The seat guide `packages/nana-setup/claude/rules/nana-seat.md` shall state each of eight rules exactly once, each as its own bullet, and hold no other bullet: launch in the background and end the turn, one foreground command in pi; no reading or judging of partial work and no re-run of checks while a builder or reviewer runs; act on its completion notification or a monitor's failure or stall signal, in that turn; verify once at the end; re-run the mutation runner after the seat's own change; findings back in the next brief; at most two lanes in flight; the builder preamble and review standard named, not restated. |
| R-1141 | added (FEAT-006) | The seat guide shall open, before its first bullet, with one sentence that scopes it to the session that launches builders and reviewers and says a session started as a builder or reviewer skips it. |
| R-1142 | added (SUB-019, after R-1127) | The shared working pattern shall carry exactly one seat-guide bullet, which states that while a builder or reviewer runs the seat does not read or judge its partial work and acts when the run completes, and names the guide at `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`, a file present in this checkout. |
| R-301 | reworded | WHERE the platform is not win32, the four Claude Code Node hooks and the four rules (nana-soul.md, nana-standards.md, nana-writing.md, nana-seat.md) shall be installed into ~/.claude/ as symlinks into their source copies. Evidence gains `install.test.mjs::rule nana-seat.md is a symlink into the repo`. Precedent: the writing lane amended this row in place (`925f950`). |

R-350, R-954, R-903–R-907 and R-1128 keep their text; R-350's evidence gains one title (§5). The tree's leaf total
moves by +3 from main at branch time (1,113 → 1,116 if roster lands first and nothing else does).

## 3. Design

**Two channels, one source.** One rule file beside soul and standards (so `ruleSource` stays unchanged): Claude Code
seats load it as a rule (symlink on macOS and Linux, copy on Windows); pi seats get one shared-section line naming it.

**Install wiring (2 code lines).** Append `"nana-seat.md"` to `CLAUDE_RULES` (`steps.mjs:48`; drives install and
doctor) and to the literal list in `state-manifest.mjs:59` (without it uninstall leaves the link; measured). Windows
keeps today's rule behaviour: a byte copy, ✗ in doctor after a later edit until re-install (`research-rules-install.md` §3).

**Pointer, not the whole guide, in the shared section.** (1) The section goes into every project's `AGENTS.md`, so the
whole guide would grow every project's always-loaded context. (2) pi loads `AGENTS.md` into builder and reviewer
children, and "end your turn" stops a headless builder (VERIFIED for `claude -p`; inferred for `pi -p`). (3) A second
copy drifts. (4) The Windows Claude Code seat may not see `AGENTS.md` (§1). The pointer carries the core inline, since
a pi session does not open a file a rule only names (R-376 note, Amendment 1 §A3); it is third person, so a child is not
told to act. It goes after roster's "Seat land review" bullet in the template and the `AGENTS.md` copy:

```
- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule.
```

The last clause keeps the matrix sentence true. `readme-check` never scans the template or `AGENTS.md`, so R-1142's own check proves the file exists.

**The guide, exact text** (12 lines, 1,265 bytes, 8 bullets; `nana-writing.mjs`: over=0 passive=0 banned=0
identifiers=0; `nana-seat.proposed.md` is the byte source the acceptance compares against):

```
# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.
- After any change of your own to code or tests, re-run the lane's mutation runner before the review.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- Keep at most two lanes in flight, a nana default. While one runs, work the other or end your turn.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.
```

- **Sources.** Bullets 1–4, 6, 7: Jake's queued content (`reference_roster.md:28`); bullet 2 names what his complaint
  names. Bullet 3's monitor clause: his 07-24 and 08-06 rulings. Bullet 5: seat rule, 2026-10-13
  (`feedback_lane_process_2026_10_11.md:26`). Bullet 8: research §2.
- **Scope sentence (R-1141).** One sentence, two clauses joined by a semicolon. User rules load into subagents too
  (VERIFIED: this planning subagent received them), so a Sonnet builder must be told to skip.
- **Values.** "Two lanes": the seat's own rule, stated to Jake 2026-10-11 (`feedback_lane_process_2026_10_11.md:17`),
  not his ruling; the guide calls it a nana default. "Eight": R-1140's count. R-1140 pins both; provenance also in its evidence.

**Stays unchanged (pairs in §5).** S1 `nana-soul.md` (R-1128; the guide repeats neither roster bullet). S2 the matrix
(R-680). S3 `ruleSource`. S4 the guide checks on a CRLF copy. S5 the `AGENTS.md` region equals the template.

**What NOT to do.** No second copy of the guide; no memory citations, nana-pi-only commands or model names in it; no
ban on monitors or heartbeats; no restating the preamble, review standard, nana-writing or roster's bullets; no edit to
`install-check-config.mjs` (`DOCTOR_NOTES` lists no rule rows); no memory edits inside the lane.

## 4. Scope

**In.** `packages/nana-setup/claude/rules/nana-seat.md` (new); one list entry each in `packages/nana-setup/lib/steps.mjs`
and `packages/nana-setup/lib/state-manifest.mjs` (the only code); the pointer in `templates/_shared/working-under-nana-pi.md`
and `AGENTS.md`; one row after `packages/nana-setup/README.md:39`; new `packages/nana-setup/tests/seat-rule.test.mjs`;
`install`, `win32-degrade`, `state-manifest` (`:57`, `:61` `Array(17)`), `uninstall` (`:288`), `restore` (`:52`),
`templates-render` and `requirements-tree` (`:38`, `:52`, `:53`) tests; `REQUIREMENTS.md`; regenerated tree and code
map; `HANDOFF.md` and `docs/sessions/2026-10.md` (seat, before the final round); this review corpus.

**NOT.** Soul, standards, writing rule; the matrix; `ruleSource`; `doctor.mjs`, `uninstall.mjs`, `fsops.mjs`,
`project.mjs`, `install-check-config.mjs`; preamble and review standard; any pi extension; shared memory.

**Conflicts with feat/roster if branched from `5b53ebc`** (none after roster lands): `REQUIREMENTS.md` (R-1128 follows
R-301); template and `AGENTS.md` (same anchor); `templates-render.test.mjs` (roster adds lines where the R-1142 check
goes); tree test, tree and code map (regenerate). Line cites are at `5b53ebc`.

## 5. Verification

**Exact test titles** (each with its `// req:` marker directly above; the seat's title check must print `0 missing`).
- New `packages/nana-setup/tests/seat-rule.test.mjs` (six-tag header; reads the guide with `\r` stripped):
  - `// req: R-1141` "seat guide scopes itself to the seat in one sentence before its first bullet": exactly one prose
    line before the first bullet, equal to the canonical sentence, whose closing full stop is its only sentence end.
  - `// req: R-1140` "seat guide holds no bullet beyond its eight rules": bullet count equals the test's rule-line
    table, and every bullet is one of its lines.
  - `// req: R-1140`, one per rule, each line present exactly once, titled "seat guide carries: …": "launch in the
    background and end the turn", "no reading or judging partial work mid-run", "act on completion or a monitor's
    failure or stall", "verify once at the end", "re-run the mutation runner after the seat's own change", "findings
    back in the next brief", "at most two lanes in flight", "preamble and review standard named, not restated".
- `install.test.mjs`, `// req: R-301` "rule nana-seat.md is a symlink into the repo".
- `win32-degrade.test.mjs`, `// req: R-350` "win32: nana-seat.md is installed as a copy matching the repo file".
- `templates-render.test.mjs`, `// req: R-1142`: "shared working pattern carries one seat-guide bullet" (one line
  starts `- Seat guide:` and equals the §3 text) and "seat-guide bullet names a guide file present in this checkout".
- Existing titles, inputs extended: R-954 manifest rows, R-903–R-907 dry-run labels, the restore fixture list.

**Wrong code first.** Every new check fails at the base. Each mutation changes the guide, the template, `AGENTS.md`, a
file name or a code list, never an assertion (M1–M6b simulated by `sim-guide-v2.mjs`):
- M1 delete the no-reading bullet → its "carries" check and "no bullet beyond" red. M2 duplicate the verify bullet →
  "…: verify once at the end" red. M3 add "- Send reports verdict-first." → "no bullet beyond" red. M4 drop bullet 3's
  monitor clause → its "carries" check and "no bullet beyond" red. M4b add a monitor-ban bullet → "no bullet beyond" red.
- M5 delete the scope sentence, M6 move it below the first bullet, M6b split it ("; a" → ". A") → R-1141 red.
- M7 drop the name from `CLAUDE_RULES` → R-301's new check and R-954 red. M8 drop it from `state-manifest.mjs` →
  uninstall's round trip and R-954 red (both measured). M9 `copyInstead: false` under forced win32 → R-350 red.
- M10 delete the pointer, M11 duplicate it → R-1142's first check red. M12 point it at `packages/nana-pack/rules/`
  → both R-1142 checks red. M13 rename the guide file, pointer kept → the "present in this checkout" check red.
- Stays: S1 append the no-reading bullet to `nana-soul.md` → acceptance (f) red. S2 add "and nana-seat" to the Claude
  Code seat's matrix cell → R-680 red. S3 route the rule to `PACK_RULES_DIR` → R-301's new check red. S4 CRLF guide →
  every R-1140 and R-1141 check stays green. S5 edit the pointer in the template only → the `AGENTS.md` check red.

**Seat acceptance** (written before the build, seen failing at the base): (a) the title check, `0 missing`; (b) the
guide equals `nana-seat.proposed.md` with `\r` stripped, has 8 bullets, and `nana-writing.mjs` (no `--report`) prints
`over=0 passive=0 banned=0`; (c) template and `AGENTS.md` region each hold the pointer once and the file exists;
(d) in a temp `--home`: install links the rule and doctor prints `✓ rule nana-seat.md`; under `NANA_SETUP_PLATFORM=win32`
it is a byte-equal file; `uninstall --yes` removes the link; (e) R-301 names four rules, R-1140–R-1142 cite these titles,
R-1143–R-1149 unused; (f) `git diff --name-only` base..tip ⊆ §4 In. Then the mutation runner (M1–M13, S1–S5),
`test:locked`, `map:check`, `readme:check`, `req:tree` clean, and `install-check.mjs` before `nana-land`.

**The claim most likely to be wrong:** that a rule line stops the Windows seat checking a running worker.

## 6. Residuals and open questions (each becomes one HANDOFF line; none is YOUR CALL)

1. **Jake's action — install on Windows, then watch one lane.** `git pull`, then `node packages/nana-setup/bin/nana-setup.mjs install`;
   doctor should show `✓ rule nana-seat.md`. Re-run install after any later rule edit (Windows rules are copies).
2. **Seat, at land — Mac.** Run `nana-setup install` once (doctor shows ✗ until then).
3. **Monitors stay:** Jake's 07-24 and 08-06 rulings require a failure-signature monitor and a liveness heartbeat on long background runs, and a passive monitor costs nothing until it fires.
4. **Options, cut as untraceable to Jake's words for this lane:** acceptance seen failing before the build; the brief's ID range, seat checks and titles; no writes in a running worktree; a fresh session after PARTIAL; cheap checks green before review; HANDOFF next steps before the final round; a one-line-slip exception to bullet 6.
5. **Option — a pi seat extension** appending the guide to pi sessions with no `NANA_ROLE`. `nana-writing.ts` appends
   to every session, children included, so the role filter would be new; the file would move into the pack.
6. **Known limits.** Unattended Claude Code sessions (`-p`, Agent SDK, CI, cloud) end background commands after
   30 minutes by default (2 hours at most; 10 minutes for `-p` with a text prompt), while lane mode allows 8 hours
   (R-963); a seat there loses its builder by following bullet 1. A pi seat's `bash` blocks on its launch (two lanes may
   need two pi sessions; `pi-subagents` may background: UNVERIFIED). PowerShell follows Bash's background rules per the
   docs; that and the win32 watchdog's CPU read are unproven on Jake's machine. Jake's Windows clone path is unknown.
7. **NOTE.** Doctor's ✗ rule row names no fix (existing R-341 gap). Moving roster's soul bullets into the guide would
   reopen R-1128. Only acceptance (b) runs the writing checker on the guide (compare R-376).

## Seat revision (2026-10-13)

1. Monitors stay; the guide forbids reading, judging or re-checking a running worker and acting before completion or a monitor's signal; the probe-memory step and its HANDOFF line are gone.
2. Six untraceable bullets and the one-line-slip exception moved to §6 item 4 as options; "the seat does not build" folds into bullet 6 and MUST triage into the bullet 8 pointer; eight remain; "two lanes" is the seat's 10-11 rule, worded as a nana default.
3. Builder: Sonnet 5.5 (about 16 files; Jake's 10-13 split); exact titles still listed.
4. Fixed: install-check ruling dated 10-12; frontmatter citation dropped; "background" claim; R-1141 one sentence (M6b); readme-check claim; `nana-writing.ts` option; M8 measured; M13 added; restore note dropped; unattended background limit in §6.
5. Rows: R-1140 (eight rules), R-1141, R-1142 (pointer reworded to match bullet 2), R-301 reworded; per-bullet tests pin the eight bullets only.
6. Writing check: over=0 passive=0 banned=0 identifiers=0; `--report` still prints one verdict finding, since a rule file opens with no report verdict word.

## Base update (2026-10-14)

Roster landed (main `484329c`), so the lane branches from it and §4's conflicts are moot. At `484329c`: R-1140–R-1149
unused; the leaf total is 1,113 and moves to 1,116; roster's "Seat land review" bullet sits at the template's `:31` and
`AGENTS.md:99`, and the pointer goes right after it; `CLAUDE_RULES` is still `steps.mjs:48` and the rule list
`state-manifest.mjs:59`. Other line cites in this file are at `5b53ebc`; the build brief re-reads them.
