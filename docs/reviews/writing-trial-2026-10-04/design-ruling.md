# Writing trial — architecture ruling

Ruler: Fable (architecture + landing, read-only), 2026-10-04. Roles: `../pi-1.0-2026-10-04/ROLES.md`.
Decided by Jake: try Karpathy's standard; start with "Reports and handoffs"; EARS is already the row standard.

## The rulings in one screen

1. **Surfaces.** The trial covers two things: the seat's messages to Jake, and `HANDOFF.md` lines. The pi handoff store waits.
2. **Home.** One file, `packages/nana-setup/claude/rules/nana-writing.md`. Claude Code reads it as a rule. pi reads it as `<agent dir>/AGENTS.md`, a symlink to the same file.
3. **Checker.** One zero-dependency CLI in the pack, report-only, exit 0 always. No hook, no post-edit, no PATH link during the trial. The seat counts before and after, and the trial ends on day 14 with a verdict.
4. **EARS check.** Report-only, yes. Its own lane, in parallel. Not this one.
5. **Rows.** Nine pack rows (R-742 to R-750), four installer rows (R-360 to R-363), one amended row (R-301). Each row is one `shall`.
6. **Build.** Rows, then tests, then code. The allowlist is in section 6. The seat applies `~/.claude` and `~/.pi` after landing.

Legend: **[V]** verified by reading the file or running the command today. **[I]** inferred. Every number below is **[V]** unless marked.

---

## 1. Surfaces in scope

**Decision.** The first trial covers two surfaces.

- The seat's text to Jake: the end-of-task report, the decision point, and the status update. In every repo, not only nana-pi.
- `HANDOFF.md` lines, starting with nana-pi's. Other repos follow as the seat edits them.

The trial excludes the pi handoff store. It excludes code, commit messages, review corpora, briefs and worker reports. Those are technical records. The seat reads them, Jake does not.

**Reason.** Both surfaces exist today, and one writer produces both. The seat writes the report and edits `HANDOFF.md`. One writer learns one rule, and we can count the result.

The pi handoff store has no corpus. `~/.pi/agent/handoffs/` does not exist on this machine [V]. pi's compaction prompt writes that text, not the seat [V, `nana-handoff.ts` writes `compactionEntry.summary` as given]. Shaping it would need a compaction hook. That is machinery for a surface with zero entries.

**What would change my mind.** A compaction summary appears in the store, and Jake reads it to decide. Then the store joins the trial. The checker already reads any file, so the first step costs nothing.

---

## 2. Where the standard lives

**Decision.** One file, `packages/nana-setup/claude/rules/nana-writing.md`. Two links point at it.

| Runtime | Path that reads it | Mechanism | Status today |
|---|---|---|---|
| Claude Code | `~/.claude/rules/nana-writing.md` | add the name to `CLAUDE_RULES` in `packages/nana-setup/lib/steps.mjs`; the existing link step and doctor line cover it | `CLAUDE_RULES = ["nana-soul.md", "nana-standards.md"]` [V] |
| pi | `<agent dir>/AGENTS.md` | a new installer step links it to the rule; doctor gets one line | `~/.pi/agent/AGENTS.md` is absent [V] |

**Reason.** pi reads `<agent-dir>/AGENTS.md` as "user instructions applied across working directories" [V, pi 1.0.2 `docs/configuration.md`]. Context files load regardless of project trust [V, `docs/security.md`]. An `AGENTS.override.md` in a project does not suppress the agent-dir file [V, `docs/configuration.md`]. The loader reads it with `existsSync`, `statSync().isFile()` and `readFileSync` [V, `dist/core/resource-loader.js:116-126`]. All three follow a symlink. So one file serves both runtimes with two links and no code.

**Rejected, and why.**

- `<agent-dir>/APPEND_SYSTEM.md`. A trusted project's `.pi/APPEND_SYSTEM.md` replaces it. "Files with the same name are not combined" [V, `docs/configuration.md`]. A project could silently remove the rule.
- A pack extension that injects the text, like the objective. The objective needs code because it resolves a file, labels trust and caps output. A fixed rule text needs none of that. Code, tests and rows for a text file fail the subtraction test.
- `templates/_shared/working-under-nana-pi.md`. That text is project scope and describes the pack. The writing rule is about Jake, so it is user scope.
- The `requirements` skill. A skill loads on demand. The rule must apply to every message.

**One consequence to accept.** No pack CLI passes `-nc` (`--no-context-files`) to pi [V, grep over `packages/nana-pack/bin/*.mjs`]. So reviewer and worker pi sessions read the rule too. The rule's first paragraph excludes technical records for that reason. **[I]** Risk: a reviewer shortens its findings or drops a path. The next review corpus will show it. If it does, move pi delivery into the pack extension and gate it on `hasUI`. Not before.

**The standard text.** Land this file verbatim as `packages/nana-setup/claude/rules/nana-writing.md`.

```markdown
# Nana — Writing for Jake

This rule applies to a message addressed to Jake: a report, a decision point, a status
update, and a `HANDOFF.md` line. A review, a brief, a worker report, a commit message
and code are technical records. They are out of scope.

## Order

- Put the verdict in the first sentence. Use one of: LANDED, DONE, BLOCKED, OPEN,
  FAILED, CARRIED, YOUR CALL.
- Put the evidence after the verdict.
- Put the technical detail in a file. Point to the file once.

## Sentences

- Keep each sentence under 25 words.
- Put one fact or one instruction in each sentence.
- Use the active voice. Name who did what.
- Use one name for one thing. Do not switch names.

## Words

- Use everyday words. Do not coin a word. "dogfood" is banned.
- Do not put a file path, an identifier, a code name or a row number in the prose.
  The technical record holds them.

## A decision point

A decision point carries five parts, in this order: what was tested, the result in
plain numbers, the trade, the recommendation, and why it is Jake's call. If it is not
his call, decide it and say so.

## Check

Before you send a report, run
`node ~/nana-pi/packages/nana-pack/bin/nana-writing.mjs --report` on the text.
After you edit `HANDOFF.md`, run it on the file. It reports. It does not block.
```

The rule names an absolute path on this Mac, as the knowledge hook in `~/.claude/settings.json` does [V]. A PATH link comes with the verdict, not before.

---

## 3. The checker

**Decision.** One CLI, `packages/nana-pack/bin/nana-writing.mjs`. Two library modules beside it: `packages/nana-pack/lib/writing-config.mjs` holds every tunable, `packages/nana-pack/lib/writing-check.mjs` holds the pure functions. The bin does argv and I/O only. Node, zero dependencies, cross-platform.

**Behaviour.**

- With no path, it reads stdin. With paths, it checks each file.
- Four checks run always: sentence length, passive voice, banned words, and the summary line.
- Two checks run with `--report` only: a verdict word in the first sentence, and identifiers. An identifier is a backtick span, or a token with a slash and a file extension.
- Each finding is one line: `<file>:<line>: <check>: <detail>`. For stdin the file field reads `-`.
- The last line is one summary: `summary sentences=N words=N over=N passive=N banned=N verdict=yes|no|n/a identifiers=N`.
- It exits 0 whatever it finds. A row seals this (R-750). Switching to blocking is a requirement diff, not a flag.

**Why `--report` for two checks.** `HANDOFF.md` carries commit hashes and paths by design. Its lines open with a bold status word already. Flagging 197 backtick spans there is noise [V, count below]. A report to Jake is different: Jake asked four times for no identifiers [V, `feedback_plain_language.md`].

**Tunables.** All of them live in `writing-config.mjs`. Each carries provenance. No literal at a point of use.

| Name | Value | Provenance |
|---|---|---|
| `SENTENCE_CAP` | 25 | ASD-STE100 Issue 9, descriptive-text cap, via `research/karpathy-x-2026-10-04.md` §5.2, 2026-10-04 [S] |
| `PASSIVE` | `\b(is\|are\|was\|were\|be\|been\|being)\s+\w{3,}(ed\|en)\b` | chosen: the regex from `research` §5.4, widened to `-en`; report-only, so false positives cost one line |
| `PASSIVE_EXCEPTIONS` | a short word list (e.g. `need`, `speed`, `indeed`) | chosen: words that end in `ed` and are not participles; grow it from the baseline run, never inline |
| `VERDICT_WORDS` | LANDED, DONE, BLOCKED, OPEN, FAILED, CARRIED, YOUR CALL | chosen: the words `HANDOFF.md` and the review ledger already use, plus Jake's decision-point shape |
| `BANNED_WORDS` | `dogfood` | Jake, 2026-07-03, `feedback_plain_language.md`; case-insensitive, matches `dogfooding` |
| `IDENTIFIER` | a backtick span, or `\S*/\S+\.\w{1,5}` | chosen: the two shapes Jake named (paths, code names); row numbers like `R-451` are **[I]** too noisy to add before the baseline shows a count |
| `MIN_SENTENCE_WORDS` | 3 | chosen: a shorter fragment is a heading or a bullet label, not a sentence |

Sentence splitting is simple: strip code spans and URLs, split on `.`, `!`, `?` followed by space, and on a line break. Known limit: `e.g.` and `vs.` split early. Record it in the pack README; do not build an abbreviation engine.

**Where it runs.** By hand, from the rule. In the suite, over fixtures and over the rule file itself. Nowhere else during the trial.

**Rejected, and why.**

- A Claude Code `PostToolUse` hook on `HANDOFF.md` edits. It needs a `matcher` group. The installer's merge appends only to matcher-less groups [V, `lib/settings.mjs` header]. New merge code, tests and rows for a report-only line.
- A `.pi/nana-pack.json` post-edit entry. nana-pi has no `.pi/` directory [V]. No `trust.json` exists in `~/.pi/agent` [V], so **[I]** this machine holds no trust decision for nana-pi. And the seat edits `HANDOFF.md` from Claude Code, not from pi.
- A Claude Code `Stop` hook over the last message. It fires on every turn and parses a transcript format we do not own.
- A `~/.local/bin` link. One more installer step, doctor line and row. The verdict decides whether the tool stays.

**Measurement.** The trial ends in numbers, then Jake's call.

Baseline today, from a rough throwaway pass over `HANDOFF.md` [V]: 125 sentences, 50 over 25 words (40%), longest 102 words. Also 16 passive matches, 197 backtick spans, 1 "dogfood". The real checker recomputes this on landing day.

| Step | When | Command | Written to |
|---|---|---|---|
| Baseline, handoff | landing day, by the seat | the checker over `HANDOFF.md` and `docs/sessions/*.md` | `baseline.md` in this folder |
| Baseline, reports | landing day, by the seat | a throwaway command: the last assistant message of 80+ words from every Claude Code session file dated in the 14 days before landing, piped through `--report` | `baseline.md` |
| After, handoff | day 14 | the checker over the lines `git diff <landing>..HEAD -- HANDOFF.md` added | `after.md` |
| After, reports | day 14 | the same throwaway command over sessions dated after landing | `after.md` |

Session files: 72 under jev-research, 33 under nana-agent-loop, 1 under nana-pi [V, `~/.claude/projects/*/`]. **[I]** Retention is Claude Code's 30-day default, and a session's last long message is a report. The throwaway command is not shipped code.

**Targets, all chosen.** Over-cap sentences at or under 10% in both corpora (a quarter of the 40% baseline). A verdict word in sentence one in 90% of reports. Zero banned words. Then Jake's call: faster to read, nothing missing.

**Stop condition.** Day 14 after landing, or 20 checked reports, whichever comes first. Early stop: Jake says twice that a report lost detail he needed.

**Verdicts.** Adopt: add the PATH link, make the pre-send check mandatory in the rule, and decide blocking per surface. Extend once: the numbers moved, Jake's call is open, 14 more days. Drop: remove the rule, both links and the checker. No zombie code.

---

## 4. EARS-form check

**Decision.** Add it, report-only, in its own lane. Run that lane in parallel with this one.

**Reason.** The files are disjoint. The rail has one source, `templates/typescript/template/tests/requirements-trace.ts`; nana-pi reads it through the shim `scripts/requirements-trace.mjs` [V]. The Python rail lives in `templates/python/template/tests/conftest.py` [V]. This lane touches neither. The check's number also feeds a decision Jake has not made: the cleanup of rows with more than one `shall`. My count today: 200 of 507 rows [V]; the seat's rough count was 194 of 495. One lane, one verdict.

**Shape for that lane.** One line in the rail summary, never a problem: `ears: 200 of 507 rows carry more than one shall`. Row G-013 in `templates/_shared/requirements-general.md`, mirrored in nana-pi's Part G. The five-template opening check is fuzzy (the Ubiquitous form has no keyword), so count `shall` only.

**What would change my mind.** No second worker this week. Then fold it in as its own commit, with the two template files added to the allowlist.

---

## 5. Requirements

ID blocks [V, `REQUIREMENTS.md` line 11]: the pack continues at R-742 (R-741 is the last used). The installer block has R-360 to R-398 free (R-359 and R-399 are used). New rows start `planned`; the builder flips each to `implemented` only with the pinning test cited.

### Pack rows (new section under Part A, "The writing checker")

| ID | Requirement | Pinning test (`packages/nana-pack/tests/writing-check.test.mjs::…`) |
|---|---|---|
| R-742 | WHEN no path is given, the writing checker shall read the text from stdin. | `stdin: a piped text is checked and named -` |
| R-743 | WHEN paths are given, the checker shall check each file and prefix each finding with the path and line number. | `files: two files, findings carry path:line` |
| R-744 | The checker shall report every sentence longer than SENTENCE_CAP words with its word count. | `length: a 26-word sentence is reported with its count` and `seal: SENTENCE_CAP is 25` (the one test that pins the value) |
| R-745 | The checker shall report every sentence that matches the passive-voice pattern and is not on the exception list. | `passive: "was edited by" is reported` and `passive: "is needed" exception is not` |
| R-746 | The checker shall report every occurrence of a banned word, case-insensitive. | `banned: Dogfooding is reported once` |
| R-747 | WHERE --report is given, the checker shall report a first sentence that carries no verdict word. | `report: "LANDED." passes, "The work went well." is reported` |
| R-748 | WHERE --report is given, the checker shall report every backtick span and every slash path. | `report: a backtick span and a path are two findings` |
| R-749 | The checker shall end its output with one summary line carrying the sentence count and the count of each check's findings. | `summary: last line parses and the counts match` |
| R-750 | The checker shall exit 0 regardless of its findings. | `exit: a text with findings exits 0` |

G-001 and G-002 govern the tunables; cite them in the config module's header, do not duplicate them.

### Installer rows (sections 21 and 25)

| ID | Requirement | Pinning test |
|---|---|---|
| R-301 (amend) | The four Claude Code hooks and the three rules (nana-soul.md, nana-standards.md, nana-writing.md) shall be installed into ~/.claude/ as symlinks into the repo's own copies. | add `rule nana-writing.md is a symlink into the repo` to `install.test.mjs` |
| R-360 | WHEN pi's active agent dir has no AGENTS.md, install shall create it as a symlink to the repo's claude/rules/nana-writing.md (win32: a copy). | `writing-rule.test.mjs::pi AGENTS.md is a symlink to the writing rule` |
| R-361 | IF the agent dir's AGENTS.md exists and is not a link into the repo THEN install shall leave it untouched, report ✗ with the fix, and exit 1. | `writing-rule.test.mjs::a foreign AGENTS.md is untouched and install exits 1` |
| R-362 | doctor shall read ✓ when the agent dir's AGENTS.md links to the writing rule and ✗ with the fix otherwise. | `writing-rule.test.mjs::doctor ✓ linked, ✗ missing` |
| R-363 | The writing rule shall pass its own checker with zero findings. | `writing-rule.test.mjs::the rule passes nana-writing with zero findings` (imports the checker, not a literal) |

The agent dir is pi's ACTIVE one, from `piAgentDir()`, as every user-scope resource since U2 [V, CLAUDE.md].

---

## 6. Build scope

**Order.** Rows first (all `planned`). Then tests with a `// req:` marker above each `check(`. Then code. Then README lines. Then `npm run map`. Then flip rows to `implemented`, each with its test cited.

**Allowlist.** Create or modify only these.

- `packages/nana-setup/claude/rules/nana-writing.md` — new, verbatim from section 2
- `packages/nana-setup/lib/steps.mjs` — `CLAUDE_RULES` gains the name; one new step for the agent-dir link
- `packages/nana-setup/lib/doctor.mjs` — one line for the agent-dir link
- `packages/nana-setup/README.md` — one table row per link
- `packages/nana-setup/tests/install.test.mjs` — the R-301 check
- `packages/nana-setup/tests/writing-rule.test.mjs` — new
- `packages/nana-pack/bin/nana-writing.mjs` — new
- `packages/nana-pack/lib/writing-config.mjs` — new
- `packages/nana-pack/lib/writing-check.mjs` — new
- `packages/nana-pack/tests/writing-check.test.mjs` — new
- `packages/nana-pack/README.md` — the ninth CLI, its output shape, the splitting limit
- `REQUIREMENTS.md` — the rows above
- `docs/code-map.md` — regenerated
- `CLAUDE.md` — "eight CLIs" becomes "nine"; one word
- `HANDOFF.md` — one landing line under the new rule; every older line stays as it is, because it is the baseline
- `docs/reviews/writing-trial-2026-10-04/` — the brief, the rounds

**Do not touch.** `~/.claude/*` and `~/.pi/*` (the seat runs `nana-setup install` after landing). `templates/**` and `scripts/**` (the EARS lane). `packages/nana-pack/extensions/**`. `packages/nana-knowledge`, `packages/nana-stage`, `apps/**`. Any `HANDOFF.md` line that exists today.

**Acceptance, in order.**

1. `npm test` green, the new tests included. The rail reports R-742 to R-750 and R-360 to R-363 as `implemented`.
2. `node packages/nana-pack/bin/nana-writing.mjs packages/nana-setup/claude/rules/nana-writing.md` prints zero findings and exits 0.
3. `printf 'LANDED. The install is done.\n' | node packages/nana-pack/bin/nana-writing.mjs --report` reports `verdict=yes`. `printf 'The file was edited by the worker.\n' | …` reports one passive finding.
4. The install test's temporary-home harness shows `+ rule nana-writing.md` and the agent-dir link created; a second run shows both unchanged.
5. `npm run map:check` and `npm run readme:check` green.
6. gpt-6-astra review through `pi-review`, three rounds at most.

**After landing, the seat.** Runs `nana-setup install`, then `doctor`. Restarts open pi sessions or runs `/reload`. Writes `baseline.md` in this folder the same day.

---

## The claim I would most expect to be wrong

That reviewer sessions read the rule without harm. The scope paragraph should hold, but a model under a 25-word cap may drop the path a finding needs. The first review corpus after landing is the check. If it shows that, pi delivery moves into the pack extension gated on `hasUI`.

---

## Amendment 1 (after astra r1)

Ruler: Fable, 2026-10-04, after `astra-r1.md` (BLOCK, 6/10). Branch `feat/writing-trial` in `~/nana-pi-wt/writing`.

**In one screen.** Three findings land on the design, and I change the design on all three. pi delivery moves from a context file to a pack extension. Sentence splitting becomes Markdown-aware. The rule names the banned word in a code span. The worker fixes the other five items as written, with the two changes in A4. Round 2 reviews the amended build.

Note on IDs: the pi 1.0 lane used R-360 to R-372 first, so the worker's R-373 to R-376 are the real IDs. The mapping is in commit `925f950`.

### A1. Delivery to pi (MUST 1, SHOULD 3)

**Decision.** Drop the agent-dir link. A seventh pack extension, `packages/nana-pack/extensions/nana-writing.ts`, appends the rule text to the system prompt. It uses the call the objective extension uses today: read at `session_start` for every reason, append `${event.systemPrompt}\n\n${block}` at `before_agent_start` [V, `nana-objective.ts:64-85`]. The rule file moves to `packages/nana-pack/rules/nana-writing.md`. nana-setup links `~/.claude/rules/nana-writing.md` to it, the way it links skills into the pack today [V, `PACK_SKILLS_DIR`, `steps.mjs:43-45`].

**Reason.** pi reads the first usable file of five names per directory [V, `resource-loader.js:115-131`]. Any file we place is in that race. Astra executed both losses: our link hid a user `CLAUDE.md`, and an `AGENTS.override.md` hid our rule while doctor read ✓. An installer that checks all five names re-implements pi's precedence and must track upstream, and pi releases fast. The extension API is the stable surface two extensions already use, verified on 1.0.2 [V, main `64a3297`, acceptance A1 to A6]. An append replaces nothing. No context file, project prompt or override can remove it. The code volume is about equal to the installer step it replaces, and the failure class is gone.

**Rejected.**

- Keep the link and detect the five names. It tracks upstream, and a later override still hides the rule until someone runs doctor.
- `<agent dir>/APPEND_SYSTEM.md`. A trusted project's copy replaces it, as ruled in section 2.
- Exit 1 on a foreign file (SHOULD 3). Moot: the step is gone, and install exits 1 for nothing new.

**Not now.** A `writing.enabled` key: the trial ends in adopt or drop, and drop removes the code. A `hasUI` gate: one line later, if the next review corpus shows harm. pi 1.0.2 prefers `systemPromptOptions` over a returned `systemPrompt` [V, `docs/extensions.md:103`]; that refinement belongs to lane A and applies to all three injectors together.

**Rows.** Delete R-373, R-374 and R-375 from the branch. They never landed and nothing references them, so the IDs stay unused. A gap costs less than three retired rows for a step that never shipped. R-376 stays, with the new path. R-301 stays amended; its source for the writing rule is the pack directory. New pack rows:

| ID | Requirement | Pinning test (`packages/nana-pack/tests/writing-injection.test.mjs::…`) |
|---|---|---|
| R-751 | The pack shall append the writing rule's text to every session's system prompt under the heading ## Writing for Jake (nana). | `inject: the rule text follows the base prompt under its heading` |
| R-752 | IF the rule file is missing, unreadable or not valid UTF-8 THEN the extension shall inject nothing and journal writing_rule_unavailable with the cause. | `unavailable: ${cause} injects nothing and journals the cause` |
| R-753 | The injected block shall not exceed WRITING_INJECT_CAP chars, with the truncation announced. | `cap: an oversized rule is cut at the cap and the cut is announced`, plus one seal test for the value |
| R-754 | The extension shall read the rule at every session_start reason, so a reload picks up an edit. | `reload: an edited rule is injected after session_start reason reload` |

`WRITING_INJECT_CAP` = 4000, chosen. The rule is 1,358 bytes today [V], so the cap is about three times its size. A stray large file cannot flood the prompt. It lives in `writing-config.mjs` with the others. Copy the harness of `objective-injection.test.mjs`.

**Files.** Delete `stepWritingRule`, its doctor block and its tests. Add the extension and its test. Count the extensions as seven in `packages/nana-pack/README.md`, `CLAUDE.md` and `templates/_shared/working-under-nana-pi.md` (one word each; the template file joins the allowlist for that word only). After landing, `~/.pi/agent/AGENTS.md` must not exist; it does not exist today [V].

### A2. Sentence splitting (MUST 3, and the first-sentence half of MUST 2)

**Decision.** A Markdown-aware prose extractor replaces newline splitting. The rules, in order of application:

1. A fence line (three backticks or tildes, after optional indent) toggles fence state. Every check skips fenced lines.
2. The sentence count skips a heading line (`#` to `######` then a space) and a table row (a line starting with `|`). The banned scan still reads them.
3. A blank line ends the current block.
4. A list-item line (`-`, `*`, `+`, or digits followed by `.` or `)`, then a space) ends the previous block and starts a new one. The extractor strips the marker.
5. Any other non-blank line joins the current block with one space. This is the soft wrap.
6. A block is split into sentences on `.`, `!` or `?` followed by whitespace, a closing quote or bracket, or the end. The extractor masks code spans and URLs first, as built.
7. A sentence's line number is the line where it starts.

The verdict check reads the first sentence of the first prose block. Empty input gives `verdict=no`. The identifier check runs on prose blocks only, so a fence no longer produces findings. The abbreviation limit (`e.g.`, `vs.`) stays, recorded as before.

**Fixtures to pin before the baseline.** The same 26-word sentence, as one line and wrapped to two, gives identical summaries. A text with a heading, a table, a fence and a numbered list gives the sentence count of its prose alone. `1. DONE. I checked the file.` gives `verdict=yes`.

**Targets, restated.** The over-cap target is one quarter of the baseline share the fixed checker measures on landing day, written in `baseline.md`. Today's estimate stays 10%. **[I]** `HANDOFF.md` bullets are single physical lines and chat reports have no soft wraps, so the baseline should move little. The verdict and banned targets stay as they were.

**The rule's own text.** The decision-point paragraph has 27 words and passed only through wrapping. Replace it with this list:

```markdown
## A decision point

A decision point carries five parts, in this order:

1. what you tested
2. the result in plain numbers
3. the trade
4. the recommendation
5. why it is Jake's call

If it is not his call, decide it and say so.
```

I ratify "what you tested": it is active, where my draft was passive.

### A3. The banned word in the rule (astra's NOTE on R-376)

**Decision.** Overruled: the rule does not point at a config file for its banned list. The rule's line reads "Do not coin a word. Jake banned" followed by the word dogfood in a code span. R-746 gains three words, "outside a code span". A quoted word is a mention, not a use. In report mode the span is still an identifier finding, so a report to Jake still gets one line for it.

**Reason.** A pi session has no memory of the ban and will not open the file the worker's wording names. The rule must carry the word. One masking call and one test cover the change.

### A4. Items the worker fixes as written, and two I change

**As written.**

- MUST 2. Match whole verdict words and the phrase YOUR CALL on the first prose sentence from A2. Add positive and negative fixtures through the CLI, including astra's four cases.
- MUST 4. One seal test per exported policy value, including a regex's source and flags, and each list. Every other test imports the name.
- MUST 5. CLI-level assertions for R-743 (line numbers), R-746 (every occurrence), R-747 and R-748 (`--report` honoured) and R-749 (summary present). The R-373 to R-375 parts vanish with A1. R-301's "four hooks" loop covering three predates this lane; carried to the seat, not fixed here.

**Changed.**

- SHOULD 1. An exception matches a whole word, not a prefix, so the checker catches `needed` and excepts `need`, `speed` and `indeed`. The adjectives astra's set found (`green`, `wooden`, `open`, `golden`, `even`) join the list with provenance "astra r1 labelled set, 2026-10-04". The detail text and the README say "passive candidate". Astra's 24 labelled sentences become a fixture that prints precision and recall and pins no number. A floor would be a tunable with no provenance, and the check is report-only.
- SHOULD 2. In report mode the summary carries `verdict=<passes>/<inputs>`; otherwise `verdict=n/a`. The worker creates `docs/reviews/writing-trial-2026-10-04/tally.md`. Its header carries the landing date and the stop condition: day 14 or 20 reports, whichever first, or two lost-detail complaints. Each row is one day: date, reports checked, verdict passes, sentences, over-cap, complaints. The seat fills it. The pack README documents one invocation per report.

### A5. Allowlist and acceptance changes

**Added.** `packages/nana-pack/rules/nana-writing.md` (moved), `packages/nana-pack/extensions/nana-writing.ts`, `packages/nana-pack/tests/writing-injection.test.mjs`, `templates/_shared/working-under-nana-pi.md` (one word), `docs/reviews/writing-trial-2026-10-04/tally.md`.

**Removed.** `packages/nana-setup/claude/rules/nana-writing.md` (moved out), `stepWritingRule` in `steps.mjs`, the agent-dir block in `doctor.mjs`, and their tests in `writing-rule.test.mjs`. That test file keeps the Claude Code link check and R-376.

**Acceptance, added to section 6.**

7. The wrapped and unwrapped fixture give identical summaries.
8. `node packages/nana-pack/bin/nana-writing.mjs packages/nana-pack/rules/nana-writing.md` prints zero findings.
9. The injection test shows the rule text after the base prompt, and nothing when the file is absent.
10. After the install test runs, no `AGENTS.md` exists in the test's agent dir.
11. `printf 'I reopened the case.\n' | … --report` gives `verdict=0/1`.

**The claim I would most expect to be wrong now.** That two extensions returning `systemPrompt` compose on pi 1.0.2. If they do not, only one of the writing block and the objective block reaches the model. The objective and handoff blocks compose today **[I]**, by the acceptance run, not by a test that asserts both. The injection test should assert the base prompt, the objective block and the writing block together once.
