# Fact-check (repo claims) — seat-guide CHANGE.md

Checked against main 5b53ebc and `feat/roster` c7c7690 (merge-base = 5b53ebc), read-only.
Simulations ran in a scratch copy of the planner's `sim/` clone (`fc-sim/`), never the repo.
Logs: `fc-*.log`; guide-check simulation: `fc-sim-guide.mjs`.

## WRONG

W1. **R-1141 vs the guide text.** The row says the guide opens with "one sentence" that scopes it
    and says builders and reviewers skip it. The proposed scope line is two sentences
    ("...for the owner. A session started as a builder or reviewer skips it."). The planned test checks
    "exactly one prose line", not one sentence, so it stays green while the row's "one sentence"
    clause is false. Fix the row ("one line"/"two sentences") or merge the text into one sentence.

W2. **§1 "no 'poll', 'background' or 'end your turn' in the template".** `background` appears at
    `templates/_shared/working-under-nana-pi.md:17` ("pi-owned background state"), on main and
    on roster. The point (nothing on how a seat waits) holds; the literal claim does not.

W3. **§3 "`readme-check` treats `$`-paths as machine paths".** `looksLikePath`
    (`templates/typescript/template/scripts/readme-check.mjs:305-318`) returns null for `$HOME/...`
    because `$` is not a path character, not because it is a machine path. Readme-check also
    scans only the seven READMEs in `readme-check.config.json`, never the template or `AGENTS.md`.
    The conclusion (only R-1142's own test proves the file exists) still holds.

W4. **§1 citation `feedback_no_duplicate_mechanical_checks.md:3-5`** (shared memory, not repo).
    Lines 3-5 are frontmatter: "never produce the same mechanical evidence twice ... consume the
    script's verdict". It says nothing about polling. It also cuts against the verify bullet
    ("Re-run the seat checks yourself"), since the preamble already makes the builder run them.

W5. **§6 item 3 "as nana-writing.ts does".** `packages/nana-pack/extensions/nana-writing.ts` has no
    NANA_ROLE filter. It appends to worker and reviewer children too (matrix row 3). A no-role
    filter would be new behaviour, not a copy of the writing extension.

## UNVERIFIED (or now verified)

U1. **M8 R-954 red, marked INFERRED → VERIFIED.** Dropping `nana-seat.md` from
    `state-manifest.mjs:59` in the copy: `state-manifest.test.mjs` FAIL "every path created by
    install maps to a nana-setup-owned manifest row" (unmapped nana-seat.md). `uninstall.test.mjs` FAIL
    on the round trip, the R-660 check and the R-903–907 dry-run labels.
U2. **M7 → VERIFIED.** Dropping it from `CLAUDE_RULES`: install FAIL "rule nana-seat.md is a symlink into
    the repo"; state-manifest FAIL (absent=nana-seat.md).
U3. **Unmutated wiring → VERIFIED green.** install, state-manifest, uninstall, win32-degrade and restore all
    exit 0 in the copy.
U4. **M1–M6, S4 → VERIFIED by simulation** of the described checks (`fc-sim-guide.mjs`).
    M1/M2/M4 also turn "no bullet beyond" red; M5/M6 turn R-1141 red; CRLF stays green.
U5. **Restore needs `npm_config_prefix=$HOME/.local` → UNVERIFIED.** Here `npm config get prefix`
    is already `~/.local`, and restore passes with and without the variable.
U6. **Line cites shift once roster lands.** `pi-worker.mjs:92-93` becomes `:100-101`, and
    `pi-watchdog.mjs:16-23` becomes about `:19-26`. They are correct on 5b53ebc.

## GAP

G1. **The monitor and log-read ban reverses a standing the owner ruling, decided by the seat.** the owner asked
    for it four times (`feedback_probe_all_background_work.md`: monitor at launch, a 30-minute
    heartbeat, and a v2 heartbeat that reads worktree file activity). It also says "Passive log
    reading doesn't violate the wait-for-the-runner rule". The guide bans exactly that, and §6 says
    "none is YOUR CALL". Either cite the owner's 10-13 request as the superseding ruling, word for word,
    or put the reversal to the owner as YOUR CALL. Do not leave the seat to narrow the memory itself.
G2. **R-1142's "a file present in this checkout" has no discriminating mutation.** M12 goes red on the
    text-equality clause first. A pair that keeps the pointer text and moves the guide file would pin
    the existence clause, though R-1140 also goes red then.
G3. **Provenance sits away from the definition.** "Two lanes" and "three items per session" live in the
    guide. Their provenance goes in R-1140's evidence and in the test table. The standard asks for
    provenance beside the definition. The plan states this choice, but a reviewer may call it.
G4. **The conflict list omits `packages/nana-pack/tests/templates-render.test.mjs`.** Roster adds +18 lines
    in `checkInstructionContracts`, where the R-1142 check would go. This does not matter if the lane
    branches after roster lands, as planned.
G5. **The writing bar for the guide is acceptance (b) only.** No suite test runs it. Compare R-376 for the
    writing rule. A later edit can push a sentence past 25 words and nothing fails. The scope rule
    may exempt it, because the guide is not addressed to the owner.
G6. **Placement and matrix (notes).** FEAT-006 is "Launch builders with execution limits", following the
    R-1110 precedent. The Claude rules live elsewhere: R-301 in SUB-012 and R-376 in FEAT-005. The matrix row for the
    Claude Code seat still lists only "Both Claude rules" and the writing rule. R-680 covers only hooks and
    extensions, so no test breaks.

## Confirmed (no finding)

- `steps.mjs:48` CLAUDE_RULES; `:54-56` ruleSource (only the writing rule goes to the pack); `:62` SHARED_MEMORY_SEED.
- `state-manifest.mjs:59` is a separate literal rule list. `doctor.mjs:73-83` linkOk: a byte-equal copy is ✓
  only on win32. `:340-343` prints `rule <name>` with `-> src` and no fix hint (the R-341 gap is real).
- `project.mjs:240-267`: the win32 CLAUDE.md is a copy made only when neither file exists. The
  working-region refresh touches only AGENTS.md. `HANDOFF.md:81` is the one-line CLAUDE.md warning.
- Repo CLAUDE.md is a committed symlink (mode 120000).
- IDs: the main max is R-1111. Roster holds R-1120–R-1128. R-1140–R-1149 appear on no branch. R-1128 sits on
  the line after R-301 on roster. FEAT-006 and SUB-019 are leaf headings.
- Leaf total 1,104 on main and 1,113 on roster, in `requirements-tree.test.mjs:38,52,53`. +3 gives 1,116.
- `state-manifest.test.mjs:57`, `:61 Array(16)`; `uninstall.test.mjs:288`; `restore.test.mjs:52`.
- Existing titles exist verbatim: R-954, R-903–907 dry-run, R-859 byte-identical, R-680 matrix (exact-row
  includes, so S2 turns red). R-1128 strips `\r`. 925f950 is the R-301 in-place precedent.
- `DOCTOR_NOTES` has no rule rows. `install-check.mjs`, `NANA_SETUP_PLATFORM`, `uninstall --yes` and
  `npm run req:tree|map` all exist.
- The guide equals `nana-seat.proposed.md` (19 lines, 2,183 bytes, 15 bullets). nana-writing prints
  over=0 passive=0 banned=0 on both the guide and the pointer. The §3 pointer equals `pointer.proposed.txt`.
- pi bash has no default timeout (pi 1.0.2 `dist/core/tools/bash.js`). pi-worker passes no
  `--no-context-files`, so children load AGENTS.md. The preamble defines VERDICT PARTIAL. The review
  standard holds the MUST bar.
- Only two copies of the shared region exist (template, AGENTS.md). The test runner auto-discovers
  `packages/*/tests/*.test.mjs`, and the code map covers `packages/nana-setup/tests`.
