# seat-memory-push — plan attack

Adversary for the plan in this folder, 2026-11-01. Stakes read: high blast, reversible. The hook runs at every Claude Code startup on this machine, but one config line or one revert undoes it.

Inputs read: the plan, the memory factory design (v2), `nana-shared-memory.mjs`, `memory-store.mjs`, `profile-store.mjs`, `hook-producer.mjs` (deadline precedent), `shared-memory-config.mjs`, the replay plan and its built maker call site (`~/nana-pi-wt/memory-replay`, `buildReplayPlan`). I printed no record, claim, quote or transcript text. Counts-only probes are listed under Measured.

## Measured (counts only, 2026-11-01)

- Shared index: 88 entry lines today (87 at the logged load). By file prefix: 75 `feedback_`, 10 `reference_`, 2 `user_`, 1 `project_`. Whole entries are 17,273 chars. Heads only (`- [title](file)`) are 6,091 chars. Titles only are 2,315 chars.
- Live store: 20 records, all `low`. Source: 5 saved, 15 extracted. Kind: 9 decision, 4 preference, 4 lesson, 3 correction. Roles: 16 seat, 4 planner/builder/reviewer. Repository: 5 none (profile), 15 this repository. `invalidAt` set on 0. Repeats 0.
- Stamps: all 15 extracted records share one file-stamp hour (merge run, 2026-11-01 13h). 13 of them carry `date` 2026-10-31. File stamps use the compact `yyyymmddthhmmssmmmz` form, which `Date` does not parse.
- Hook deadline precedent: `HOOK_DEADLINE_MS = 4000` (R-2672) and a measured Windows stall at about six times the median hook time (R-2674).
- Isolation already in place: Claude builder and reviewer children run with `--setting-sources project,local`, so user hooks do not fire. Reviewer children carry `NANA_ROLE=reviewer`. The replay runner uses `--setting-sources ''`. The shaper runner sets `NANA_ROLE=worker`. visual-reader sets `NANA_ROLE=reviewer`.

## MUST

### M1. Replacing the index drops 75 feedback rules from session start, and nothing replaces them

Failing case. A seat starts in nana-pi after land. Claude Code auto-loads only the project `MEMORY.md`. That file points at `shared/` but does not inline `shared/MEMORY.md`. The hook now prints one pointer line instead of 87 entries. The 75 `feedback_` entries are past corrections the owner gave once, which is the measured outcome the design exists to reduce. None of them is in the store, and the 20 records do not cover them (the store was made from one run over about two days). The seat now sees no title, so it has no trigger to read any of them. The design's principle 4 does not require the cut: its bar is "no agent's context larger than today's baseline", and today's baseline is 8,957.

Second failing case, same root. A fresh `nana-profile init` on the second machine, or any repository not enabled for making, gives a valid but near-empty store. The plan counts that as "push available", so the index disappears and the push prints 0 to 5 lines. The seat starts with less memory than today on every non-nana repository.

Fix (smallest honest one). Keep the index beside the push, inside the one 9,000 hook budget.
1. Print the header, then the push (at most 4,000), then the index through the existing shortener with budget `SHARED_MEMORY_OUTPUT_BUDGET − header − push`. Titles alone are 2,315 chars, so all 88 titles fit with the push today. The existing algorithm then shortens descriptions or leaves tail entries out, with its fold line.
2. Pass the remaining budget into the existing shortener as a parameter. The no-push path calls it with the full budget, so the fallback stays byte-identical and the two existing hook tests stay green unchanged.
3. Invert must-meet 1. Assert that every index entry title still prints, not that none prints.
4. Change owner question 1 to: "push beside the index now; drop the index only after the replay shows the bundle alone is no worse". Default `go` on that, with the existing `memoryPush: false` switch.

Migration of the 75 entries into the store is the right later step, but not here. Saved records require owner quotes (`validateProfileSave`), so migration needs its own lane and owner time. Post it as a `next` issue.

### M2. "Newest stamp" and the `asOf` cut use the merge-run file stamp, so order is random and the replay adapter breaks

Failing case 1 (live order). All 15 extracted records carry one file stamp from the merge run. "Newest stamp, then id" therefore orders them by hash within each kind. A record said on 10-31 and one said on 11-01 tie, and the sha256 id decides. As the store grows by batches at each land, "newest" means "merged in the latest batch", not "said most recently".

Failing case 2 (cut). Read the live store with `asOf` set to 2026-11-01T00:00Z. By the plan's rule ("drops every record stamped at or after the cut") all 15 extracted records drop, although 13 were said on 10-31. Through raw candidates (`effectiveState(records, [])`, where `stamp = record.date`) the same 13 stay. Must-meet 4 claims the two paths give the same lines; with real data they differ. A8's fallback "its date when no stamp parses" is ambiguous here: the compact stamp does not parse with `Date`, so a builder may fall back to `date` for every store record, or parse the compact form and cut by merge time.

Failing case 3 (replay). The built replay passes raw A-091 candidates to `options.maker`. Those candidates carry no `repository` field; `mergeMemory` adds it. The plan's maker keeps "every record whose `repository` is this repository's root id" and treats records with no repository as profile records. Either the whole treatment bundle is filtered out (empty bundle, so the replay compares the index against nothing) or every extracted candidate is silently classed as a profile record. Neither is what the live push delivers.

Fix.
- Define the maker's time key once: `record.date` (the evidence day). Use it for "newest", with the file stamp only as a tie-break before the id. Make `asOf` act on `date` and `invalidAt` only. The caller owns any instant-level evidence cut, as the replay already does (`candidate.at < cut`).
- Define the class rule in the maker: profile record = no `repository` and `source: saved`; project record = `repository` equal to the argument. Make the replay adapter set `repository` on each raw candidate before calling `effectiveState`.
- Rewrite must-meet 4 with this case: one record dated the day before the cut and merged after it. It appears through both paths. A raw candidate without `repository`, passed through the documented adapter, appears in the project part.

### M3. Git calls at up to 1,000 ms each can push the hook past 5 seconds, and then the seat gets neither push nor index

Failing case. On Windows during a measured stall (R-2674, about six times median), the plan's hook does a 1.36 s cold start, then two or three git spawns at up to 1,000 ms each, then a sync read of every store file. That totals about 4.5 to 5.5 s. Claude Code kills the hook at 5 s, so stdout is lost whole. Today the hook does no git and no store walk, so the index always arrives. The push makes the worst case worse than today. The plan lists this only as unmeasured.

Fix.
- Reuse the precedent `HOOK_DEADLINE_MS` (4,000, R-2672) as one deadline from process start, not a per-call timeout alone. Render the index fallback first, held in memory. Give each git call `min(per-call seal, time left)`. If the deadline passes before the push is ready, print the fallback and log reason `deadline`.
- Cut the git calls. The worktree check can be one `git rev-parse --absolute-git-dir --git-common-dir`. Alternatively, `.git` being a file in the work-tree root marks a linked worktree with no spawn at all.
- Add a must-meet: with an injected git that sleeps past the deadline, the hook ends under `HOOK_DEADLINE_MS` and prints today's index byte for byte. The load line reads `deadline`.

### M4. Ordering by trust, then kind, puts the owner's profile last as soon as the store grows

Failing case. Every record is `low`, so trust orders nothing. The kind order is correction, decision, preference. The 5 saved profile records are owner-quoted and mostly `preference`. The 15 extracted records are machine-shaped, unverified (A4) and 9 of them are `decision`. Each land adds extracted decisions and lessons. Once those exceed about 4,000 chars (25 to 30 records at today's claim lengths, which the plan itself expects "within days"), every saved preference folds out. The seat then gets project decisions it could search for, and loses the profile. The design's stage table puts the user profile in the seat push and lists project memory as searchable. The owner's reading named both, but the profile came first.

Fix. Order by part first: profile records, then project records. Inside each part keep trust, kind, newest. Or reserve a share of the push for the profile (for example, profile first up to the whole budget, project records fill the rest). Within the same trust, rank `source: saved` above `extracted`, because a saved record carries the owner's words and an extracted one is an unverified inference. Extend must-meet 2 with this case: 40 extracted low decisions plus 2 saved low preferences, over budget. Both preferences print, and the fold counts only project records.

## SHOULD

### S1. The replay cannot judge this lane's change as specified

The replay's A5 slot holds the AutoMem files plus the hook output. Its treatment swaps that whole slot for the bundle. So treatment loses the project `MEMORY.md` as well as the index, while live keeps the project `MEMORY.md`. That bias works against the bundle and makes a replay null uninformative about this lane. The replay also judges only extracted candidates, while the live push leads with saved records (see M4), so the two pushes differ in content as well as in slot.

Fix. Export the hook's push-mode renderer as one pure function: `renderSeatMemory({ header, push, index, budget })`. The replay treatment is then "AutoMem files kept, hook output replaced by `renderSeatMemory` as of the cut". With M1 adopted, treatment equals control's index plus the push, which asks the question the owner actually decides: does adding the push reduce repeats. Post the slot change to the replay lane as a blocking ask before its confirmatory run on this maker. The first run per maker hash is the only confirmatory run, so a wrong slot burns the confirmation.

### S2. A damaged or unreadable store silently hides the push forever

`readMemoryStore` reads the profile area with no `onUnparseable`, so one damaged profile JSON throws. The hook then falls back byte for byte. The reason goes only to the load log, which nobody reads at startup. The owner believes the push is live, but no session gets it again. Damaged project files are skipped with no count at all.

Fix. For the no-pointer, role, CI and worktree cases, keep the silent byte-for-byte fallback. For a store error on a machine with a valid pointer and marker, append one fixed line after the index: `[nana:memory] push unavailable: store error`. Count skipped project files into the load line. Split must-meet 3's "unreadable record folder" case into two parts. A damaged profile JSON (works on Windows, unlike chmod) asserts the note line. The pure skip cases assert byte equality.

### S3. The retract instruction invites the seat to invent owner words

The header tells the seat to run `nana-profile retract <id> --quote "<owner words>"`. The quote check is only "not empty". A seat that thinks a record is wrong will fill the quote itself. That breaks principle 7, and with a 12-hex prefix it reaches project records the seat never saved.

Fix. Header wording: `retract only when the owner says a record is wrong: nana-profile retract <id> --quote "<the owner's words>"`. Keep it as one sealed phrase in `memory-bundle-config.mjs`.

### S4. Owner profile text now sits in every session's context, including sessions in public repositories, with no handling rule

The hook is user-level. So every startup in any repository on this machine, open-source ones included, gets the owner's quoted profile records. Those seats write public issues, PR bodies and commits. The identity scan knows four words. Today's index carries 2 `user_` entries, so this risk is not new, but the push makes quoted owner text its main payload.

Fix. Add one sealed clause to the push header: `private: never quote these in issues, commits, PRs or HANDOFF`. Add a must-meet line that the header carries it.

### S5. The sealed "pull share = 9,000 − 4,000" has no reader and the wrong unit

The later pull is a UserPromptSubmit block. It fires per prompt and has its own 10,000-char hook cap. A per-session 5,000 split does not bound it; the knowledge pull's `BLOCK_MAX_CHARS` is the real precedent. A sealed value with no consumer fails the subtraction test, and it fixes the wrong contract for the next lane.

Fix. Seal the push budget only, plus the existing 9,000 hook budget. Leave the pull budget to the pull lane. Drop the third seal from must-meet 8.

### S6. The header's self-count can flip the fold

`<c> of 4000 chars` sits inside the push. Its length depends on how many digits `c` has (999 versus 1000). The renderer must then guess its own length, and must-meet 2's "exactly 4,000 prints every line, one more folds" can pass or fail on digit width.

Fix. Define `c` as record-line characters only. Budget the header at its widest form (four digits). Pin it in must-meet 2 with a case whose record lines total 999 and one whose lines total 1,000.

## NOTE

- N1. Two isolation layers already protect launched agents: user hooks do not load in Claude children, and `NANA_ROLE` is set. Must-meet 3 should also cover `NANA_ROLE=""` (set but empty). The profile guard treats that as set (`!== undefined`), while frontier uses `LAUNCHER_ROLES.includes`. Pick the profile rule and say so.
- N2. A reworded re-extraction of a retracted claim gets a new id and comes back on the next push. Record this as a known-bug line, owned by upkeep.
- N3. Must-meet 5 logs 12-hex prefixes of sha256(claim). That is fine under the threat model, but say in the README that ids are claim hashes.
- N4. `show` prints supersede-conflict lines. If `show` calls the maker (Precedent), the maker either carries conflict lines or `show` keeps them. Say which.
- N5. Before choosing replace over keep, a cheap private check helps. The seat counts how many of the 20 records restate an index feedback entry. Report the count only. A high overlap would make migration cheaper. A low one confirms M1's loss.
- N6. `startup` only (A5): after `/clear` or compaction, the seat keeps no push and no index, same as today. That is not a regression, but say it in the README contract note.

## Missing must-meets (summary)

- Deadline under slow git: index byte for byte, reason `deadline` (M3).
- Index kept beside the push: every title prints (M1). Empty or near-empty store: index still prints (M1).
- Profile records survive an over-budget project part (M4).
- Time key: dated before the cut but merged after it, the same line through both paths (M2).
- Store-error note line on a valid pointer (S2). Private clause in the header (S4).
