# Research: the working-pattern text change (lane `process`, 2026-10-13)

Stakes: low blast per sentence, but the shared file fans out to every nana project and cuts a template tag. Reversible.
Read-only research against `main` at 9974218. Inferred claims are marked "(inferred)".

## 1. Where the text lives and how the copies stay identical

- Canonical: `templates/_shared/working-under-nana-pi.md` (28 lines, 708 words). The "### Working pattern" subsection is lines 22-28 (248 words); the three bullets that matter are 24 (worktree), 25 (review corpus and launchers), 26 (review ladder, "Maximum three rounds per item"), 27 (land checklist, incl. the standard over-cap reason), 28 (overrides AFTER the marker region).
- `AGENTS.md:68-97` holds a byte copy between `<!-- nana:working-under-nana-pi begin -->` / `end` markers (verified: region == shared file today).
- `CLAUDE.md` is a symlink to `AGENTS.md` (`ls -la`: `CLAUDE.md -> AGENTS.md`, dated Sep 18). Nothing to regenerate there.
- `npm run template:accept` does NOT regenerate root AGENTS.md: `scripts/template-acceptance.mjs:46` only renders the templates into temporary dirs (`copier copy --vcs-ref <sha>`). The task's premise is wrong on this point.
- What does refresh a marker region: `nana-setup project <dir>` -> `refreshWorkingRegion` (`packages/nana-setup/lib/project.mjs:160-238`, markers at `:125-126`). It replaces only the bytes between one ordered marker pair.
- Do NOT run `nana-setup project` on nana-pi itself: `setupProject` (`project.mjs:411-421`) also runs `stepSeeds` (`:111-116`), which seeds `OBJECTIVE.md`. nana-pi deliberately has none (`HANDOFF.md:5`). The builder should hand-copy the bytes, or call the exported `refreshWorkingRegion('.')` directly (e.g. a one-line `node --input-type=module -e` import), then let R-859's check prove identity.
- Language templates include the file verbatim: `templates/python/template/AGENTS.md.jinja:42-44`, `templates/typescript/template/AGENTS.md.jinja:41-43`.
- The adopt-structure skill copies it from the skill-relative canonical path: `packages/nana-pack/skills/adopt-structure/SKILL.md:61`.

## 2. The rulings, exact sources

| Ruling | Primary source | Notes |
|---|---|---|
| Threat model per plan | `docs/sessions/2026-10.md:75`; `HANDOFF.md:18`; shared memory `feedback_lane_process_2026_10_11.md:10` | Ruled text: "honest variation in our own tools' output ... IN scope; deliberate forgery ... OUT". The house-rules phrase "tools, machines and registries" is a later widening, not found in any record (inferred: after the 10-13 pi-codemode registry break). Pick one wording; I use the house-rules one below and flag it. |
| Plan-review caps 1 / 2; only a named fail-open bug reopens | `docs/sessions/2026-10.md:75`; `HANDOFF.md:18`; memory `:11` | Memory names the 2-round class as "gate / ledger-format / cross-repo-parser lanes". HANDOFF says "gate and format lanes". |
| No edits after every reviewer says LAND | same three | |
| Urgent fixes ship alone, hardened later | same three | |
| Install check locally before landing a nana-setup or hook lane | memory `feedback_lane_process_2026_10_11.md:15` only | Dated **(Owner, 2026-10-12, "Yes")** there, not 2026-10-11 as the task says. Not in HANDOFF or the session archive. The rationale is recorded: `nana-land` reads no CI result. |
| Materiality bar; LAND only; LAND-WITH-FIXES retired; delta confirmation rounds | `docs/sessions/2026-10.md:29`; `HANDOFF.md:22`; memory `feedback_review_materiality.md:11-14` | Memory's consequence list: data lost or corrupted, a security or review boundary bypassed in practice, wrong output someone acts on, a broken install or hook, a regression of main's behaviour. The task adds "CI gate". |
| Builder split | memory `reference_roster.md:21-24` (Owner, 2026-10-13, "agreed on the worker split"); evidence `docs/sessions/2026-10.md:15` | Not in HANDOFF. Sonnet 5.5 runs as a seat-spawned Claude subagent in the lane worktree, not through `pi-worker`. |

Consistency check: `nana-land` accepts only `LAND` (`packages/nana-pack/bin/nana-land.mjs:91-93`); the verdict reader records `LAND-WITH-FIXES` as its own verdict (`packages/nana-pack/tests/review-ledger.test.mjs:192`). So "LAND-WITH-FIXES is retired" matches the code.

## 3. Interpretation call: what happens to "Maximum three rounds per item"

The owner's cap ruling is about PLAN reviews. "Maximum three rounds per item" (shared line 26) is the code-review cap pi-review enforces: `REVIEW_ROUND_CAP = 3` at `packages/nana-pack/bin/review-round.mjs:68`, row R-719 ("The cap shall be three rounds per item", `REQUIREMENTS.md:392`, untested). Memory line 20 says the text "still says 'max three rounds' — change it", but no ruling changes the code-review cap.
Recommendation: keep the three-round sentence (code reviews) and ADD the plan caps beside it. This also keeps R-683's literal `"three rounds"` check green (`templates-render.test.mjs:314`). If the drafter reads the memory line as a cap change, that is a YOUR CALL for the owner, not a seat edit.

## 4. Proposed text change (smallest form)

### 4a. Shared file `templates/_shared/working-under-nana-pi.md` — two edits, no deletions

Line 25, append one sentence (builder split):

```
- Review corpus: `docs/reviews/<lane>-<date>/`. Builder launcher: `pi-worker --lane <name> --brief <file> --out <file>`; reviewer launcher: `pi-review`. Sonnet 5.5 builds larger or riskier lanes as a Claude subagent in the lane worktree; luna builds small lanes through `pi-worker`, and its brief names every required test by exact title.
```

After line 26 (Review ladder, unchanged), insert two bullets:

```
- Plans: every plan names its threat model. Honest variation in our own tools, machines and registries is in scope; deliberate forgery is out, and findings outside the model are residuals. A small lane gets one plan-review round, a gate or format lane two; after that only a named fail-open bug reopens the plan. Urgent fixes ship alone and are hardened in a later lane.
- Review bar: a MUST names a realistic input and a consequence that matters: data lost, a real bypass, wrong output someone acts on, a broken install, hook or CI gate, or a regression of main's behaviour. Anything else is a SHOULD or NOTE, recorded as a residual. The verdict is LAND when no MUST stands, else SEND-BACK; LAND-WITH-FIXES is retired because `nana-land` accepts only LAND. A confirmation round reviews only the change since the last round. Once every reviewer says LAND, nothing more is edited.
```

About 150 added words to every session start in every consuming repo. No size budget test exists. Hardening plan 2.6 (`docs/hardening-plan-2026-10-06.md:126`) wants this file leaner, so a reviewer may ask to cut.

If this lane makes pi-review refuse a non-standard over-cap reason, add to line 27 after the quoted reason: "pi-review refuses any other reason." Declare the reason once as a constant in `review-round.mjs` and have a test assert the shared file quotes it byte-for-byte. Today nothing pins that quoted string (grep of tests: no hit).

### 4b. nana-pi-only rule: the install check — OUTSIDE the marker region

It must not go in the shared file:
- A backticked `packages/nana-setup/bin/install-check.mjs` is a path claim. R-598 judges every shared-file path against the python/typescript scaffold and adopt renders, which have no such file (`packages/nana-pack/tests/skill-claims.mjs:24`, `:111-118`). The suite would fail.
- Downstream repos have no nana-setup and no hooks to check.
- The shared text itself says overrides go after the marker region (shared line 28).

Proposed: a new subsection in `AGENTS.md` after `### Shared-machine test runs` (`AGENTS.md:136-138`), outside the markers:

```
### Install check before a land

A lane that touches `packages/nana-setup/` or a hook runs `node packages/nana-setup/bin/install-check.mjs` locally before `nana-land`, because `nana-land` reads no CI result (Owner, 2026-10-12).
```

The command is already documented and readme-checked in `packages/nana-setup/README.md:399-401`. AGENTS.md is not in `readme-check.config.json` scope, so the new row's test should also assert the path exists.

## 5. Tests and checks that pin this text

None of them break if 4a/4b keep the existing phrases. All are listed for the drafter:

| Check | Where | What it pins | Effect of the change |
|---|---|---|---|
| R-859 byte identity, root | `packages/nana-pack/tests/templates-render.test.mjs:208-238` (checks at `:220`, `:224`, `:236`) | AGENTS.md region == shared file; the paragraph before the begin marker ends in `.!?`; one-byte mutation | Fails until AGENTS.md is refreshed in the same commit |
| R-859 byte identity, rendered | `templates-render.test.mjs:414-420` | Each copier render's region == shared file | Renders with `--vcs-ref HEAD` (`:57`). Commit before trusting it. Copier's dirty-tree inclusion is not verified (inferred) |
| R-683 generic defaults | `templates-render.test.mjs:313-314` | Literals incl. `"three rounds"`, `"different model lineage"`, `"Land checklist"`, `"pi-worker"`, `"pi-review"` | Unchanged if line 26 stays. Breaks if "three rounds" is reworded |
| R-966 lane launcher | `templates-render.test.mjs:226-227` | `pi-worker --lane <name> --brief <file>` and the AFTER-marker override sentence | Unchanged (4a appends to line 25) |
| R-981 land helper | `packages/nana-pack/tests/land.test.mjs:497-505` | Regexes over the whole AGENTS.md for the land checklist phrases | Unchanged if line 27 keeps them |
| R-680 / R-985 runtime matrix | `templates-render.test.mjs:286-299`; `packages/nana-setup/tests/verifier-pipe.test.mjs:151-157` | The matrix rows, exact | Untouched |
| R-681 startup scope | `templates-render.test.mjs:300-310` | The startup sentence | Untouched |
| R-598 / R-599 / R-629 claims | `packages/nana-pack/tests/skill-claims.test.mjs:26-100`; `templates-render.test.mjs:355-395` | Every backticked path resolves in scaffolds, adopt renders and the checkout; nana commands' flags and subcommands exist in source | 4a adds only `nana-land` and `pi-worker` (bins, no flags). Fine. A future `pi-review --over-cap` mention is fine (`pi-review.mjs:21`). No `*.md` or `*.mjs` names in backticks |
| Setup refresh and doctor | `packages/nana-setup/tests/project-working-region.test.mjs:16`; `packages/nana-setup/tests/project.test.mjs:81-83` | Read the shared file dynamically | Unaffected |
| `nana-setup project --check` | `project.mjs:483-495`; CLI `packages/nana-setup/bin/nana-setup.mjs:338-350` | Reports "differs — fix: nana-setup project <dir>" for a stale region | Every marked downstream repo reports drift until refreshed |
| `map:check`, `readme:check`, `req:tree` | — | — | Only the new rows and test checks touch them |

### Requirement rows (lane range R-1100 to R-1119; the drafter allocates across the lane)

- New row, SUB-019 next to R-683 (`REQUIREMENTS.md:863`): "The shared working pattern shall state the plan threat-model line, the plan-review caps, urgent fixes alone, the review materiality bar with LAND-only verdicts and delta confirmation rounds, no edits after an all-LAND review, and the builder split." Better as two or three rows, one clause group each, so each check pins one thing. Test: a phrase-presence check in `checkInstructionContracts` (`templates-render.test.mjs`), plus an in-memory mutation like `:234-238`.
- New row for 4b: "nana-pi's AGENTS.md shall require, outside the shared marker region, the local install check before a land of any lane touching nana-setup or a hook." Test: the phrase sits outside `markerBlock(agents)`, and `fs.existsSync` of the install-check path.
- Leave R-683 as written. Its "review cap" clause stays true.

## 6. Blast radius: repos that receive the section

Scanned every `~/*/AGENTS.md` on this machine:

| Repo | How it receives the text | State today |
|---|---|---|
| jev-research, the-hive | `nana-setup project <dir>` (marker pair present; `CLAUDE.md` symlink) | Already drifted: 20 changed lines vs the current shared file. Last AGENTS commit 2026-10-07 |
| trading-zone | markers plus copier template (`_commit: v0.6.8`) | Drifted, 2 lines |
| yokai-world | markers plus copier template (`_commit: v0.6.7`); no CLAUDE.md | Drifted, 6 lines; last AGENTS commit 2026-10-13 |
| work-project, family-planner, game-world, returner | Hand copies with the heading but NO markers; `nana-setup project` skips them (`project.mjs:186-190`) | Need a one-time marker wrap. work-project's is a known carry (`HANDOFF.md:27` U2) |
| basketball-geek | copier `v0.4.0`, no section at all | Gets it only on `copier update` past the tag that introduced the section |
| Future scaffolds and adoptions | jinja include; adopt-structure copy | Get the new text automatically |
| nana-agent-loop | no section | None |

Template release: `RELEASE_SURFACE = ["templates", "copier.yml"]` (`packages/nana-pack/lib/release-status.mjs:12`). A shared-file change is a template commit, so CI cuts the next tag after green suite and install-check jobs on main (`AGENTS.md:39`). `copier update` then offers it to trading-zone, yokai-world and basketball-geek.
Nothing refreshes a downstream region automatically. Each marked repo shows "!" under `nana-setup project --check` until someone runs `nana-setup project` there. That run is a downstream-repo commit, and each repo has its own review rule. Recommend listing it as a HANDOFF carry rather than doing it in this lane.

## 7. Builder call for this part

This part is text plus two phrase-presence checks: small, luna-sized, with every test named by exact title.
The riskier part of the lane is pi-review: the over-cap reason refusal, plus the standard verdict instruction that the land rule's evidence depends on. Per the split, that goes to Sonnet 5.5. If the lane stays one, Sonnet builds it all. The text is cheap either way.

## 8. The claim most likely to be wrong

The reading in section 3: that the owner's caps leave the three-round code-review cap in place. Memory line 20 can be read the other way.
Second: the date of the install-check ruling. Memory records 2026-10-12; the task says 2026-10-11.
