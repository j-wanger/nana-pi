# Review — scrub-contracts (current files stop naming the owner: role words in two contract strings, one asks-heading matcher, and a suite scan with pinned record counts), 2026-10-21 (the land reviewer)

Feature: FEAT-032 · Keep instructions and documentation accurate

Class: install, hook or gate (a pi extension's prompt heading in `packages/nana-pack/extensions/nana-writing.ts`, the SessionStart producer's text, the rules and templates nana-setup installs or renders, and the frontier and product-report readers). Threat model: honest variation in scope — a seat or builder types the owner's name in an ordinary written form, a CI log prints a test title, a fixture copies a local path, other projects on this machine keep the old HANDOFF heading and the old shipped text until they reinstall, a Windows rule copy reads stale until reinstall; deliberate forgery out (homoglyphs, zero-width splits, encoded names, a description that identifies without naming).

Never write a personal name, login, surname or work acronym into your review. The identity words are hashed in `identity-scan.config.json`; do not try to recover them. Probe the scan with made-up words injected through its `config` parameter, as its tests do. In prose say "the owner".

Review `git diff 906fbb56..HEAD` on `feat/scrub-contracts` (main is 906fbb56; the lane branched from it). The plan of record is `docs/reviews/scrub-contracts-2026-10-21/must-meet.md`: seat decisions D1 to D7, the tokenizer, the allowlist pins, six must-meet rows (R-2511 to R-2516) and the seal, what each test does, the tunables and the known limits. `plan-draft.md` and `plan-attack.md` are its inputs. `build-brief-1.md` to `build-brief-3.md` are the three builder sessions: the scan (3b3841df), the one matcher and the writing title (1a37e251), and the scrub with the allowlist (0f8de8a0). Between sessions 2 and 3 the seat renamed HANDOFF's asks heading and scrubbed HANDOFF and the known-bug files (0fc0cabd). The seat's record: the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-0f8de8a0.txt` (7 of 7 red on macOS), the independent check in `independent-check.md` (no material finding; two SHOULDs and five notes recorded as known bugs in `docs/known-bugs/FEAT-032.md`), and the Windows leg's lane files in `ci-windows-0f8de8a0.txt`. The macOS install check passes locally (17 PASS). The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 906fbb5..ad84c2d: 16 rows in 5 features
FEAT-001 · Keep goals and priorities in view
  R-1415 text changed
FEAT-002 · Resume decisions and next actions
  R-682 text changed
  R-875 text changed
  R-877 text changed
  R-878 text changed; also applies: FEAT-039
  R-2470 text changed
  R-2471 text changed
FEAT-005 · Communicate decisions clearly
  R-751 text changed
FEAT-032 · Keep instructions and documentation accurate
  R-2511 new (implemented)
  R-2512 new (implemented)
  R-2513 new (implemented)
  R-2514 new (implemented)
  R-2515 new (implemented)
  R-2516 new (implemented)
FEAT-039 · See the product and its decisions in one report
  R-1018 text changed
  R-1030 text changed
```

CI: run 39685308169 at 0f8de8a0 (PR #159): suite (ubuntu-latest) 203 files, 200 PASS, 0 FAIL, 3 SKIP, checks 8197 pass, 0 fail; suite (macos-latest) 203 files, 201 PASS, 0 FAIL, 2 SKIP, checks 8258 pass, 0 fail; suite (windows-latest) 203 files, 185 PASS, 0 FAIL, 18 SKIP, checks 7188 pass, 0 fail; install-check success on macOS and Windows. Since 0f8de8a0 the lane added only the seat's pairs, the independent check, the CI excerpt, the notes and these briefs; no code or test changed.

Judge whether the feature works for the owner, whose public repo must carry no owner name and nothing about the owner's work, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code (the seat's pairs are the record) and green with it; the seal pins the four committed digests, and R-2511's red evidence on main shows all four nonzero;
- every reader of the asks heading goes through the one exported matcher, and another project's HANDOFF with an old "Open for" heading gets the same asks and frontier findings as on main; "Open formats" and a bare "Open" stay unread;
- the scan's root and file list come from git, not the cwd; its tokenizer finds the census forms and no mixed id; an allowlisted file whose count moves either way is reported;
- the scrub changed what it should and nothing else: shipped rules, the template section and AGENTS.md's copy byte-equal (R-859), sealed texts changed with their tests, row texts and frozen Status lines keeping their IDs, statuses and freezes; each `byte-pinned` entry's pin really holds, and the two `frozen-desk` entries sit under `apps/desk/`;
- the README's scan line, the row texts and the code comments say what the code does;
- the HANDOFF lines (one Landed line, the queue item now the records scrub, two Open asks, the install file's numbers), the known-bug lines in FEAT-032's and FEAT-002's files, and the session entry are accurate.

Known limits already carried (do not send back for them): history keeps every occurrence, by ruling, and commit authors carry the owner's legal name and machine name; the legal first name and the machine name are not hashed; the handle stays in the repository address; short-word digests can be reversed with a dictionary; the scan catches words, not descriptions; the extractor's sealed time zone; the prefix matcher's S1 case and a stray "Open for review"; other projects keep the old shipped text until they rerun `nana-setup project`; a stale Windows rule copy until the next install; a lane in flight fails the scan at its own land; and the independent check's seven findings in FEAT-032's file (escaped or digit-glued words, acronym compounds, the allowlist writer, the `ls-files` buffer, R-2511's failure message, the display test's path). The 882 `record` entries are lane B's work, not this lane's.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
