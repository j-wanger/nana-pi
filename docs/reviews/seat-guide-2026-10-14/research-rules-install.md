# Research: how nana-setup installs Claude Code rules, and adding nana-seat.md

Base: main 5b53ebc (read only). Simulation: a `git clone --local` of 5b53ebc at
`scratchpad/plan-seat-guide/sim/` with the change applied. The real repo was not touched.
Stakes: low blast, reversible. One list entry plus a file. Re-install adds it, uninstall removes it.

## 1. How rules are installed today

| Piece | Evidence |
|---|---|
| The list of managed rules | `packages/nana-setup/lib/steps.mjs:48`: `CLAUDE_RULES = ["nana-soul.md", "nana-standards.md", "nana-writing.md"]` |
| Where each rule's source lives | `steps.mjs:54-56` `ruleSource(rule)`: `nana-writing.md` comes from `packages/nana-pack/rules/` (`PACK_RULES_DIR`, `:52`). Every other name comes from `packages/nana-setup/claude/rules/<name>` |
| The install step | `steps.mjs:110-139` `stepRules`: loops `CLAUDE_RULES` and calls `linkFile(<rulesDir>/<rule>, ruleSource(rule), { copyInstead: win() })`. The row label is `rule <name>`. Then it seeds `nana-personal.md` (a private file, created only when absent, must be a regular file) |
| posix | `fsops.mjs:84-102`: symlink. A link to the same source stays UNCHANGED. A link elsewhere is relinked without writing through it. A regular file is moved to `<name>.bak-YYYYMMDD` and then linked |
| win32 | `fsops.mjs:61-83`: byte copy. A byte-equal regular file stays UNCHANGED. A symlink is unlinked, never written through. Any other regular file is backed up to `.bak-YYYYMMDD`, then copied. So on Windows **every later edit to a rule needs a re-install**. Until then doctor reads ✗ |
| Layout | `paths.mjs:46`: `rulesDir = <claudeHome>/rules` (`--home`/`--claude-home` aware) |
| doctor | `doctor.mjs:340-343`: loops `CLAUDE_RULES`. The row is `✓/✗ rule <name>  -> <src>`, from `linkOk` (`doctor.mjs:73-83`): posix needs a symlink whose realpath equals the source realpath; win32 needs a regular file byte-equal to the source. A missing rule is ✗ and doctor exits 1 (R-341). The private rule is its own row (`doctor.mjs:346-358`) |
| State manifest | `state-manifest.mjs:59` repeats the names as a **literal**, not an import of `CLAUDE_RULES`: `for (const name of ["nana-soul.md", "nana-standards.md", "nana-writing.md"]) rebuild(\`rule link ${name}\`, …)`. Class `rebuildable`, kind `link`, owner `nana-setup`, restore "re-run nana-setup install". Rebuildable rows are not archived by `state --paths` (durable only) |
| Uninstall | `uninstall.mjs:21` takes owner `nana-setup` rows of kind link/seed/…. `:113-121` unlinks a link row only when it is a symlink that resolves inside the repo. A row absent from the manifest is **left behind**. Uninstall is POSIX-only (`:41`, R-900) |
| Install check | `install-check-config.mjs:31-35` `DOCTOR_NOTES` lists no rule rows. Every rule row must be ✓ after install on darwin, linux and win32. A new rule that installs cleanly needs no config change |
| Not involved | `retired.mjs`, `settings.mjs`, `project.mjs`, the hooks and `install-check.mjs` never enumerate rules (grep `rulesDir`: only steps, doctor and state-manifest) |

## 2. The exact change (recommended: Option A, a setup-owned rule)

Put the source at `packages/nana-setup/claude/rules/nana-seat.md`, beside soul and standards.
`ruleSource` needs **no change**, because its default branch already maps there.

Code (2 lines):

1. `packages/nana-setup/lib/steps.mjs:48`: append `"nana-seat.md"` to `CLAUDE_RULES`. This alone drives install (`stepRules`) and doctor (`doctor.mjs:340`).
2. `packages/nana-setup/lib/state-manifest.mjs:59`: append `"nana-seat.md"` to the literal list. Without it, uninstall leaves the link behind.

Tests (must change, measured):

3. `packages/nana-setup/tests/install.test.mjs`, after `:110`:
   `// req: R-301` then `check("rule nana-seat.md is a symlink into the repo", link(path.join(home, ".claude", "rules", "nana-seat.md")) === path.join(pkg, "claude", "rules", "nana-seat.md"));`
4. `packages/nana-setup/tests/state-manifest.test.mjs:57`: append `"nana-seat.md"`. **And** change `:61` `Array(16)` to `Array(17)`. The 16 is 4 hooks + 3 rules + 5 skills + 4 bins.
5. `packages/nana-setup/tests/uninstall.test.mjs:288`: add `"rule link nana-seat.md"` to `expectedLabels` (an exact-equality check).
6. `packages/nana-setup/tests/restore.test.mjs:52`: add `"rule link nana-seat.md"` to `NON_DURABLE_FIXTURE_STORES`. The test stays green without it. With it, the independent fixture list stays complete. SHOULD, not MUST.

Optional (generic loops already cover it, so no new test is needed):
- `win32-degrade.test.mjs:77-81` pins R-350 on `nana-soul.md` only. The copy loop is generic, and the sim shows nana-seat.md copied under forced win32.
- `skills-and-standards.test.mjs:257,265`: the decoy relink loop uses two example rules. Leave it.

Requirements:

7. `REQUIREMENTS.md:700` **R-301**: amend "the three rules (nana-soul.md, nana-standards.md, nana-writing.md)" to "the four rules (nana-soul.md, nana-standards.md, nana-writing.md, nana-seat.md)". Append the new install.test title to its evidence. Precedent: the writing-rule lane amended R-301 in place from "two rules" to "three rules" (commit 925f950, "the R-301 amendment"). That keeps the "which rules are installed" fact in one row. The lane's new IDs (R-1140 onward) then go to the guide's content rows.
   - R-350 (`:787`, win32 copies) says "rules" generically. No change.
   - R-954 (`:1000`, one manifest row per store) is covered by step 4.
   - R-903/R-905 (uninstall round trip) are covered as they stand. Step 5 keeps R-903 to R-907's dry-run check exact.
   - Content rows (new, R-1140 to R-1149): follow the builder-preamble precedent R-1110 ("shall state each of N rules exactly once"). Put them in a pack or instructions feature, not in FEAT-013. That belongs to the content researcher.
8. `packages/nana-setup/README.md`: add a table row after `:39`: ``| `claude/rules/nana-seat.md` (running builders and reviewers) | `~/.claude/rules/` | **symlink** into `claude/rules/` |``. The Platforms paragraph (`:376-377`) already covers win32 copies.
9. Generated files: `docs/code-map.md` needs **no** change, because no module header or import changes (map:check measured 0 problems). `docs/requirements-tree.md` must be regenerated (`npm run req:tree`) only when new rows are added. An amended R-301 alone leaves it unchanged (measured).
10. Land: run the install check locally (Owner 2026-10-11, nana-setup lanes): `node packages/nana-setup/bin/install-check.mjs`. `DOCTOR_NOTES` stays unchanged.

### Measured in the sim (5b53ebc plus steps 1-8)

- `node scripts/test.mjs packages/nana-setup/tests`: 37 files, 36 PASS, 0 FAIL, 1 SKIP (hooks-win32-exec runs on the Windows leg only). 1,265 checks pass.
- requirement-rows, requirements-trace and requirements-tree tests: PASS (242 checks with install.test). `map:check`: 0 problems. `readme:check`: 654 claims, 0 problems.
- Baseline before the change: the same 9 affected files all PASS. `restore.test.mjs` needs `npm_config_prefix=$HOME/.local` on this Mac, because the runner's temp HOME loses `~/.npmrc` and `npm root -g` then points at `~/.hermes/node`. This is an environment issue, not caused by the change.

### Mutations (each one fails a named test, measured)

| Forgotten or mutated | Red check |
|---|---|
| `nana-seat.md` dropped from `CLAUDE_RULES` | install.test `rule nana-seat.md is a symlink into the repo`. state-manifest.test `every path created by install maps to a nana-setup-owned manifest row` (absent=…/rules/nana-seat.md) |
| state-manifest row missing (step 2 skipped) | uninstall.test `install --desk then uninstall restores the independent home snapshot` and `released context entry is retired by install and its link is removed on uninstall`. The leftover link breaks the snapshot |
| state-manifest row added but uninstall.test `expectedLabels` not updated | uninstall.test `dry-run lists manifest pieces without writes and repeated uninstall is empty` |
| state-manifest.test list not updated | **Nothing goes red**: the test silently stops covering the new path. That is why step 4 is required |

## 3. Blast radius on an existing install (measured, posix and forced win32)

The state of an older install was simulated by deleting the new rule after a full install.

- **doctor before re-install**: `✗ rule nana-seat.md  -> <src>`, exit 1. The other four rule rows are unaffected. The detail does not name the fix. That gap already exists for every rule row against R-341 ("name … the fix to run"). Leave it as a NOTE, out of scope.
- **re-install**: `+ rule nana-seat.md  created` on posix (a symlink). On win32 it reads `created  copied (no symlink on this platform)`. Summary: `1 changed, 31 already in place, 6 skipped` (posix) and `1 changed, 19 already in place, 13 skipped` (win32). Doctor then reads ✓.
- **win32 after a later edit to the source**: doctor reads `✗ rule nana-seat.md` (exit 1). Re-install prints `updated  backed up nana-seat.md -> nana-seat.md.bak-20261013, then copied`. This is today's behaviour for every rule. The owner's Mac already has `nana-soul.md.bak-20260918` files in `~/.claude/rules/`.
- **posix after a later edit**: no action needed. The symlink follows `git pull` on the checkout the link points into. On this Mac all rule links point into `/Users/example/nana-pi` (main).
- **uninstall (posix)**: unlinks it as `rule link nana-seat.md`. Uninstall refuses on win32 (R-900).
- **Unchanged**: settings.json, hooks, the knowledge index, pi config and the `state --paths` archive (the new row is rebuildable).
- **Context reach**: `~/.claude/rules/*` load into every Claude Code session on the machine, in every project, and into **subagents too**. Evidence: this workflow subagent's context carried nana-soul, nana-standards, nana-writing and nana-personal. So nana-seat.md also reaches non-seat sessions, such as builders run as Claude subagents and workflow agents. The text must scope itself, for example "When you launch builders or reviewers…". The three shared rules total 9,393 bytes today (soul 4,411, standards 3,679, writing 1,303). The builder preamble is 2,258 bytes. If a size bound is pinned, it is a tunable: define it once with provenance. Never use an inline literal.

Machine actions after land (for HANDOFF):
- Mac: run `nana-setup install` once. The link does not exist until then, and doctor shows ✗.
- Windows: `git pull`, then `node packages/nana-setup/bin/nana-setup.mjs install`, since nana-setup is not on PATH there. Re-run it after every later edit to any rule.

## 4. Facts that bear on the rule-file versus shared-region decision

- **posix Claude seats in nana projects already read the shared region.** `CLAUDE.md -> AGENTS.md` is a symlink (verified in this repo; `project.mjs:241-264` writes it). If the shared region carries the whole guide **and** nana-seat.md does too, the posix Claude seat loads it twice.
- **Windows Claude seats do not get shared-region updates through CLAUDE.md.** On win32, `project` writes CLAUDE.md as a copy only when neither file exists (`project.mjs:241-260`). `refreshWorkingRegion` (`project.mjs:160-228`) refreshes AGENTS.md only. The project check calls any regular-file CLAUDE.md healthy without comparing bytes (`project.mjs:545-546`). For the owner's Windows Opus seat, the rule file is the channel that install refreshes and doctor checks. This supports a rule file. Inferred: Claude Code reads CLAUDE.md, not AGENTS.md. Unknown: whether the Windows work project was set up by `nana-setup project`.
- **pi does not follow pointers reliably.** R-376's note (`REQUIREMENTS.md:322`, Amendment 1 §A3) says "a pi session … will not open a file the rule merely points at". A one-line pointer in the shared region is weak for pi seats. The core instruction, launch in the background, end the turn and never poll, should sit inline in the shared region. The full guide goes in nana-seat.md.
- **Precedent from the roster lane.** feat/roster puts the default-pattern and seat-land-review bullets in BOTH the shared region and nana-soul.md. R-1128 pins that "nana-soul shall carry … byte for byte, as the Claude Code seat's copy". nana-seat.md must not repeat the default-pattern bullet ("a change that touches code with tests goes through the pattern; questions and one-line fixes get a direct answer"). Moving those bullets from soul into nana-seat.md would reopen R-1128. That is out of scope; leave them in soul.

### Option B (not recommended): a pack-owned rule
Option B means `packages/nana-pack/rules/nana-seat.md`, like nana-writing, so pi reads the same file through an extension. It would need four things:
- `ruleSource` generalized: `rule === "nana-writing.md"` at `steps.mjs:55` becomes a set.
- A new pi extension, or a generalized `nana-writing.ts`, that injects it.
- Role gating, so worker and reviewer children (`NANA_ROLE`) do not get seat text.
- Section ordering in `prompt-sections.mjs`.
That is a much larger lane for a pi seat that the shared region already reaches inline.

## 5. Expected conflicts with feat/roster (plan against 5b53ebc; the lane runs after roster lands)

| File | roster's change | seat-guide change | Conflict |
|---|---|---|---|
| `REQUIREMENTS.md` | inserts **R-1128 directly after R-301** (hunk `@@ -698,6 +704,7`), edits R-961 and R-684, adds R-1120 to R-1127 | amends the R-301 line, plus new rows | **Yes, if branched from 5b53ebc**: the change is on the line next to roster's insertion. None if branched from main after roster |
| `packages/nana-setup/README.md` | the Support line (`:374`) | a table row after `:39` | separate hunks; merges automatically |
| `packages/nana-setup/claude/rules/nana-soul.md` | +2 bullets (pinned by R-1128) | **do not touch** | none if untouched |
| `templates/_shared/working-under-nana-pi.md` and `AGENTS.md` region | +2 bullets before the "Project-specific overrides" line | the shared-region researcher's change | same insertion point: likely conflict from 5b53ebc |
| `docs/requirements-tree.md` and `docs/code-map.md` | regenerated | tree regenerated only if rows are added | mechanical: regenerate after the merge |
| nana-setup lib and tests | untouched by roster | steps 1-6 | none |
