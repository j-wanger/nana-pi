# Research: seat and land (lane roster, 2026-10-13, planned against main 9974218)

Stakes: medium-blast and reversible for the text and pi-review parts. High-blast for the nana-land change, because it
decides what reaches main.
Threat model: honest variation in our tools, machines and registries is in scope. Deliberate forgery of ledger lines or
roles is out (README "Trust model": the ledger is user-writable).
Read-only research. Nothing in the repo was edited.

---

## Q1. What a fresh-machine Claude Code seat reads at startup, and where the rule must live

### Surfaces, with evidence

| Surface | What it carries on a fresh machine | Evidence |
|---|---|---|
| User rules `~/.claude/rules/` | nana-soul, nana-standards, nana-writing, plus private nana-personal. **Copies on win32**, refreshed only by re-running `nana-setup install`. Doctor flags a stale copy by comparing bytes. Loaded in every project. | `packages/nana-setup/lib/steps.mjs:47` (CLAUDE_RULES), `:109-117` (copyInstead on win32); `packages/nana-setup/lib/fsops.mjs:61-82`; `packages/nana-setup/lib/doctor.mjs:73-83, 340-342`; R-350 |
| Project `CLAUDE.md` | nana-pi: a **git symlink** (`git ls-files -s` → mode 120000) to `AGENTS.md`. Adopted projects on win32: `nana-setup project` makes a **one-time copy** of AGENTS.md. The shared-region refresh writes AGENTS.md only, so that copy goes stale. Doctor accepts any regular file there. | `AGENTS.md`/`CLAUDE.md` ls; `packages/nana-setup/lib/project.mjs:257-260` (win32 copy), `:186-228` (refresh writes AGENTS.md only), `:539-544` (copy judged by `isFile()` only) |
| SessionStart hooks | objective block, unadopted-repo block, shared-memory index. On win32 they run in exec form **from the checkout**, so a `git pull` makes them current. | `packages/nana-setup/lib/settings.mjs:215-217`; `packages/nana-setup/lib/install-check-config.mjs:11-13`; `packages/nana-setup/lib/hook-producer.mjs:12-41`; `packages/nana-setup/claude/hooks/nana-shared-memory.mjs:32-89` |
| Shared memory index | The shared-memory hook prints only the `- [` lines of the shared `MEMORY.md`. On a fresh machine that file is the seed, which has **no entries**. So `reference_roster.md` does not exist there. | `packages/nana-setup/claude/memory/MEMORY.seed.md` (3 lines, no entries); `nana-shared-memory.mjs:89` |
| Knowledge pull (UserPromptSubmit) | Pulls per prompt from local markdown stores. Delivery is not guaranteed, and it cannot pull a memory file the machine does not have. | `packages/nana-setup/lib/settings.mjs:226` |
| Project auto-memory | Machine-local and empty on a fresh machine. | — |

**Confirmed gap 1:** `AGENTS.md:66` says "the roster source is shared memory `reference_roster.md`". On any machine except
the Mac seat, that pointer leads nowhere. The Mac file itself (`~/.claude/nana-memory/shared/reference_roster.md:26`) already
records both 2026-10-13 rulings. It also says they "go into the per-machine roster lane".

**Inferred, unverified, possibly larger:** on Windows, Git checks out a committed symlink as a plain text file holding the
link target unless `core.symlinks=true`. In that case nana-pi's `CLAUDE.md` contains the 9 bytes `AGENTS.md`, and a Claude
seat may never load nana-pi's AGENTS.md at startup. I am not sure whether current Claude Code also reads AGENTS.md
natively. Verify on the work machine with `git config --get core.symlinks` and `type CLAUDE.md` in the nana-pi clone.

### Where to state it

1. **The default-pattern rule goes in the user-scope Claude rule `nana-soul.md`, under "Work habits"** (`nana-soul.md:39`).
   - It is the only surface loaded in every project on every machine.
   - It is installed and refreshed by `nana-setup install`, and doctor flags a stale copy.
   - `nana-standards.md:3-4` assigns "process" to nana-soul. R-682 is a precedent: a nana-soul process clause with its own test.
   - Proposed text: "Run every change that touches code with tests through the builder, reviewer and land pattern, using
     this machine's roster. Answer questions and one-line fixes directly (Owner, 2026-10-13)."
2. **Mirror the same rule in the shared working pattern** (`templates/_shared/working-under-nana-pi.md:22-28`) for pi seats
   and adopted projects. Do not rely on it alone, for two reasons:
   - pi seats get no Claude rules.
   - A Windows Claude seat may read a stale `CLAUDE.md` copy, or the symlink stub described above.
3. **The roster pointer must name the per-machine roster file, not shared memory.** Change `AGENTS.md:66` and add a bullet
   to the shared region.
   - Write the location `~`-prefixed: R-598's claim checker skips `~` paths (`templates/typescript/template/scripts/readme-check.mjs:312`).
   - A repo-relative path such as `packages/...` in the shared region fails R-598 in every rendered target. The process
     lane hit the same limit (`feat/process` CHANGE.md:59).
   - Put the Windows `node <checkout>/packages/nana-pack/bin/pi-review.mjs` form outside the markers, in nana-pi's
     AGENTS.md or the pack README.
4. **Optional, deferred:** a SessionStart line printing the machine roster. On win32 it is the only surface that is live
   from the checkout and specific to the machine. The cost is a sixth hook:
   - edits to the settings wiring, `install-check-config.mjs` and doctor;
   - The owner's 2026-10-11 rule then requires a local install check.
   Add it only if a seat still misses the rule once it lives in nana-soul.
5. **The Mac `reference_roster.md` should stop being a second source.** Its "current roster" table should point at the
   file, and its history stays as evidence. This is a memory edit for the seat, not a repo edit.

Possible separate lane, not this one: make a committed `CLAUDE.md` a regular file holding the Claude Code import line
`@AGENTS.md`, instead of a symlink or a copy. It never goes stale and needs no symlink privilege. This needs its own rows
(doctor, `nana-setup project`) and a check that the import resolves on Windows.

---

## Q2. Recording a seat land review when no land model is set

### What nana-land checks today

- **Coverage.** Each `--reviewed <sha>=<item>` needs at least one record that is version 2, `verdict === "LAND"`, not
  `unverified`, and matches that item and revision. **Role is not read.** `packages/nana-pack/bin/nana-land.mjs:89-97`
  (line 91); R-976, R-1011.
- **Veto.** Any verified record for the sha, or a snapshot of it, under **any item and any role**, with a non-LAND or empty
  verdict refuses the land. `nana-land.mjs:92-93`; R-1004.
- **Uncovered commits** refuse the land. `nana-land.mjs:99-103`; R-1002.
- **Merge** is `git merge --ff-only`, so a land makes no land commit. `nana-land.mjs:114`.
- README says the land helper "checks every recorded verdict but does not prove reviewer independence or review scope"
  (`packages/nana-pack/README.md` Trust model).
- `--role` is free-text audit metadata that defaults to `reviewer` (`review-round.mjs:475`; README "`--role` is audit
  metadata only").
- The ledger's tally holds 658 rows from 15+ distinct roles. Examples: `slice`, `land`, `land ruler`, `sol`, `astra`,
  `adversarial`, `confirm-land`.
- Every row came from launcher `pi-review`. `review-ledger run` has never been used.
- **The second prong is not enforced today, even on the Mac.** nana-land accepts sol's LAND alone. The working pattern
  makes the land reviewer conditional: "land reviewer when blast radius warrants both" (`working-under-nana-pi.md:26`).

### Options

| Option | Verdict | Why |
|---|---|---|
| (c) Nothing | Reject | Nothing would show whether the second prong happened. That contradicts the Trust model aim: "every completed verdict and override is recorded — a bypass must be explicit". |
| (b) Note in the land commit | Impossible | A fast-forward land has no land commit (`nana-land.mjs:114`). Any note commit after the final round is an uncovered commit (`:99-103`). The working pattern also says "nothing is written after a land". Putting the note in before sol's final round costs an extra sol round on every land. That defeats the owner's token-allowance reason for an optional land model. |
| (a) Ledger record, role `seat-land` | **Recommend, with one nana-land change** | The ledger already admits any launcher through `review-ledger run` (`review-ledger.mjs:19-21, 71-103`), with no new code. A seat review of the revision sol already reviewed is the same round and consumes nothing (`review-round.mjs:459-461`; README "A land ruling on the revision the last round reviewed consumes nothing"). |

### The hazard option (a) opens, and what nana-land must accept

A documented seat-land record **is a LAND that nana-land counts today**. A realistic honest input runs like this:
1. The seat fixes a SHOULD after sol's LAND. That makes a new commit.
2. The seat records its own `seat-land` LAND on the new tip.
3. The seat runs `nana-land --reviewed <newtip>=<item>`.

The land passes with no independent reviewer. That breaks the owner's land rule (R-978's retirement note, 2026-10-10:
"nothing reaches main unless an independent reviewer accepted it"). So the mechanism must ship with this rule:

- **nana-land shall not count a `seat-land` record as coverage.** At least one verified version-2 LAND with any other role
  is still required. This is a new row beside R-976 and R-1011; R-1011 itself keeps its ID and text.
- **A seat-land non-LAND verdict still refuses the land.** No change is needed (R-1004), so the seat's SEND-BACK is honoured.
- **nana-land does not require the second prong.** Requiring it would break the "when blast radius warrants" rule and every
  current land in trading-zone and yokai-world.
- **Report-only addition:** the success text lists the roles, models and verdicts recorded for each reviewed revision. The
  land evidence then shows "slice LAND gpt-5.6-sol; seat-land LAND <seat model>" without gating anything.

### How the seat writes it (recommend a dedicated subcommand over the generic recipe)

- **Generic, no new code:**
  `node ~/nana-pi/packages/nana-pack/bin/review-ledger.mjs run --item <slug> --role seat-land --tree <worktree> --out <scratch>/seat-land.md -- node -e "process.stdout.write(require('fs').readFileSync(process.argv[1],'utf8'))" <scratch>/seat-land-draft.md`.
  Weaknesses:
  - The role is typed by hand, so an honest typo such as `--role seat` evades the nana-land exclusion and reopens the
    self-certification path.
  - Provider and model are recorded as null. R-1008 expects the model.
- **Dedicated:** `review-ledger seat-land --item <slug> --tree <worktree> --from <file> --model <seat model id>`.
  - It reuses `admit`/`complete` (`review-round.mjs:564, 615`), with role and launcher fixed to `seat-land`.
  - It reads the verdict with the existing grammar (`review-round.mjs:413-444`), the same last-line rule as the process
    lane's review standard.
  - It spawns no child, so it has no Windows `.cmd` problem.
  - It is about 30 lines.
  - Pair it with a refusal of the reserved role `seat-land` in `pi-review` and `review-ledger run`. Then only this path can
    write it.
- **Optional guard:** the subcommand refuses unless the revision already has a verified LAND from another role. This stops
  a seat from spending a capped round (`REVIEW_ROUND_CAP = 3`, `review-round.mjs:68`) on a revision no independent reviewer
  has passed. The rule's order is then exact: the seat land review is given on the revision sol LANDed.

---

## Q3. pi-review reading the roster without breaking existing callers

### How the reviewer's provider and model are chosen today

- **Only by the caller's pi arguments after `--`.** pi-review reads `--provider` and `--model`/`-m` from them solely to
  write ledger metadata (`pi-review.mjs:159-168`), then passes them to pi unchanged (`:177`; `pi-watchdog.mjs:107`).
- With no `-m`, pi falls back to its own `settings.json` default. On the Mac that default is `openai-codex` /
  `gpt-5.6-sol`, thinking medium. That serves one slot only, so it cannot carry both sol and astra.
- `pi-review` refuses usage with no pi args after `--` (`pi-watchdog.mjs:51`). A roster call still needs `-- -p "<brief>"`.

### Distinct invocations in the ledger

Source: `~/.pi/agent/review-ledger.rounds.jsonl` (658 rows) and `review-ledger.jsonl` (796 rows).

| provider / model | Repos | Dates |
|---|---|---|
| `openai-codex` / `gpt-5.6-sol` | nana-pi 117, trading-zone 86, yokai-world 69, nana-agent-loop 2, one probe repo 1 | 2026-10-08 to 10-13 |
| `openai-codex` / `gpt-6-astra` | nana-pi 67, trading-zone 86, yokai-world 74 | 2026-10-08 to 10-13 |
| null / null | nana-pi 132, work-project 16, a few scratch paths | 2026-09-28 to 10-08, before metadata existed. Unknown, not recorded |

- Every row with metadata names **both** `--provider openai-codex` and a model.
- The launcher is always `pi-review`.
- No scripted caller exists in the sibling repos. The only one is the `~/nana-agent-loop/app/scripts/pi-review.mjs`
  forwarder, which passes arguments through. trading-zone, yokai-world and jev-research only name `pi-review` in their
  AGENTS.md text.

### Design

- **Use a new own-option `--roster reviewer|land`. Do not overload `--role`.**
  - `--role` is documented audit metadata (README).
  - It already carries `land` and `land ruler` from callers that pass astra explicitly.
- **With `--roster <slot>`:** pi-review reads the machine roster through the same reader pi-worker uses. That reader is
  the roster-file design, which another research question owns. pi-review then:
  - inserts `--provider`, `--model` and, when set, `--thinking` into `w.piArgs` **before** `admit`
    (`pi-review.mjs:168`), so the ledger records the real provider, for example `example-gateway`;
  - sets `--role <slot>` when the caller gave none.
- **Refusals, all before admission, so no round and no worktree is spent:**
  - `--roster` together with a caller `--provider`, `--model`, `-m` or `--thinking`. This prevents mixed provenance.
  - An unreadable roster, or a missing slot. Fail closed; never fall back to pi's default.
  - `--roster land` with no land model set. The message names `review-ledger seat-land`.
- **Without `--roster`:** the child argv is byte-identical to today's. A test pins this. All 520 recorded calls since
  metadata began are therefore unchanged.

### Adjacent dependency (inferred, needs verification)

`pi-watchdog.mjs:107` spawns `pi` without Windows command resolution. The repo's own win32 pattern resolves pi first
(`findPi` + `winCommand`, `packages/nana-setup/lib/steps.mjs:980-985`). The suite skips pi-review spawn on win32
(`packages/nana-pack/tests/handoff-writer-role.test.mjs:73`).

So on the work machine, documenting `node <path>/pi-review.mjs` may still fail at the spawn. pi-worker has the same
exposure. Verify on Windows with `node <checkout>\packages\nana-pack\bin\pi-review.mjs --item probe --out %TEMP%\p.md -- -p hi`.
This belongs to the PATH lane or a follow-up, but the roster lane's docs must not claim that a Windows review works until
this is checked.

---

## Expected conflicts with lane `process` (feat/process f912f21, not yet landed)

- **`templates/_shared/working-under-nana-pi.md` "Working pattern" list:** process inserts its bullets after "Review
  ladder" (CHANGE.md:56-57), the same list this lane adds to. Expect a textual conflict. It is byte-mirrored into
  `AGENTS.md:68-97`, so expect it twice.
- **`AGENTS.md` outside the markers:** process adds "### Install check before a land" after "### Shared-machine test runs"
  (CHANGE.md:59-60). This lane edits `AGENTS.md:66`, next to the begin marker. Expect a nearby conflict, not an overlap.
- **`packages/nana-pack/bin/pi-review.mjs:148-177`:** process appends the review standard at `:177` and adds a refusal
  before admission. This lane adds roster injection before `:168`. Expect a hunk conflict. The two do not interact in
  meaning, because both are refusals before admission.
- **Rows:** process uses R-1100 to R-1111, and R-683 and R-859 test the shared region (`templates-render.test.mjs`). This
  lane's shared-text clause must keep R-683's "generic defaults": no model names in the shared region.

## Draft rows (R-1120 to R-1139 range; renumber at the plan with the other research questions)

Essential:
- The nana-soul rule shall direct a seat to run every change that touches code with tests through the builder, reviewer
  and land pattern, and to answer questions and one-line fixes directly.
- The shared working pattern and nana-pi's `AGENTS.md` shall name the per-machine roster file, not shared memory, as the
  roster source.
- The land merge command shall not count a round record whose role is `seat-land` as authorising a reviewed revision.
- `review-ledger seat-land` shall record the seat's land review as a version-2 round with role and launcher `seat-land`
  and the model the seat names.
- `pi-review` and `review-ledger run` shall refuse the reserved role `seat-land`.
- WHEN `pi-review` receives `--roster <slot>`, it shall pass that slot's provider, model and thinking level to pi and
  record them in the round.
- WHEN `pi-review` runs without `--roster`, it shall pass the caller's pi arguments to pi unchanged.
- IF `pi-review` receives `--roster` with a caller provider, model or thinking option, an unreadable roster, or a missing
  slot, THEN it shall refuse before admission.
- IF `pi-review` receives `--roster land` and the machine roster sets no land model, THEN it shall refuse before
  admission, naming the seat land command.

Optional:
- IF the revision has no verified LAND from another role, THEN `review-ledger seat-land` shall refuse before admission.
- WHEN a land merge succeeds, it shall print each reviewed revision's recorded roles, models and verdicts.

## The claim most likely wrong

The Windows `CLAUDE.md` symlink stub, and Claude Code not reading AGENTS.md natively. Both are inferred, not observed on
the work machine. If Claude Code reads AGENTS.md, or `core.symlinks` is on, the nana-soul rule is still right, but the
urgency of the separate `@AGENTS.md` lane drops.
