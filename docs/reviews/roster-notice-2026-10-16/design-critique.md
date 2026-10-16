# Design critique: roster-notice (fleet lane), seat draft 2

*Adversarial plan review of `fleet/CHANGE.md` at main `2dbc817`, 2026-10-16. Read-only. "Ran" means run here today; INFERRED means read or
reasoned, not run. Verdict: **3 MUST, 11 SHOULD.** Shape B, the hook output contract, the fail-open path and the census hold. The plan does not
yet make the lineup it shows true on a pi seat. Its Claude Code entry accepts models the Claude seat cannot start. It also ships a
segment the owner did not ask for.*

## MUST

**M1. On a pi seat, the notice shows a builder split that nothing carries out.**
- The plan relies on `--lane-size larger` (§3.2) and on R-1191's refusal (S8) to make the split real on a pi seat. Only the seat can pass that
  option. Nothing a pi seat reads tells it when:
  - the size rule stays in the Claude seat's memory (residual 4);
  - pi has no shared auto-memory (AGENTS runtime table);
  - pi gets no prompt section (§3.6, S6);
  - the shared working pattern says only that "the builder, reviewer and land models come from this machine's roster"
    (`templates/_shared/working-under-nana-pi.md:30`).
- Failure: a user on a pi seat sets a pi `largerBuilder` (or keeps D1's `sonnet`). The notice says "X for larger lanes and gpt-6-luna high for
  small lanes". The seat runs plain `pi-worker --lane <name>` for every lane:
  - a pi `largerBuilder` is never used;
  - a Claude Code one never reaches R-1191's refusal;
  - luna quietly builds every lane.

  That is the "luna builds every lane on a pi seat" outcome the owner rejected, and the notice now claims otherwise. Research had already flagged
  this sentence as needed (`research-alter.md` §6, "the shared section therefore needs one sentence"). The plan dropped it (S8).
- Fix: add one new bullet to the shared working pattern. It must be a separate bullet, not the default-pattern bullet, so R-1128 and nana-soul
  stay untouched. Proposed text: "When the roster prints a `largerBuilder`, a seat builds a larger or riskier lane with it: a pi entry through
  `pi-worker --lane-size larger`, a Claude Code entry as a Claude Code subagent in the lane worktree. A seat that cannot start that builder
  stops and asks the user rather than starting another."
  - Add one row (next free ID), one templates-render check and one wrong-code pair.
  - Regenerate the marker region (already in scope).
  - The criterion is a process rule. It holds no owner name or work detail, so the fleet lane does not depend on the rulings lane.
  - If the owner wants the size criterion itself held for the rulings lane, keep only "when the seat or the user calls a lane larger" plus the
    stop-and-ask clause.

**M2. A Claude Code entry accepts model names that the Claude Code seat cannot start.**
- R-1122 gives the Claude Code entry's `model` the pi string rule (non-empty, no whitespace). Its provenance is `claude --help` `--model`
  ("an alias … or a model's full name"), which belongs to the headless CLI, a later-lane consumer (§3.3).
- In this lane, the only thing that starts a Claude Code entry is the Claude Code seat's Agent tool (§3.7). In 2.1.299 that tool's `model`
  field is an enum. Ran: `cc-strings.txt` holds
  `model:U(["sonnet","opus","haiku","fable"]).optional().describe("Optional model override for this agent…`.
- Failure: an honest file says `{"runtime":"claude-code","model":"claude-sonnet-5"}`, the full name the seat's own memory uses
  (`reference_roster.md`, model-id note), or `"sonnet[1m]"`.
  - The roster passes and both notices name it as the larger-lane builder.
  - The seat's subagent call fails schema validation, and the seat improvises a different builder.
  - The lineup shown is not the lineup run.
- Fix:
  - Add a contract value `CLAUDE_CODE_SUBAGENT_MODELS = ['sonnet','opus','haiku','fable']`, with provenance "Claude Code 2.1.299 Agent tool
    input schema, Ran strings 2026-10-16".
  - R-1122 refuses any other value, naming `roster.largerBuilder.model`.
  - Add N2 cases for a full model name and `sonnet[1m]`, and one pair.
  - Fix the `CLAUDE_CODE_RUNTIME` provenance line.
  - The later headless lane widens the list. Trade: a new Claude Code alias needs a nana update. It is refused loudly and by name, never
    silently.

**M3. The open-lanes segment was not asked for, and it says wrong things outside nana lanes.**
- The owner asked to see the current builder lineup and, in a later answer, a lineup the user can change (paraphrased). The plan itself says open
  lanes are "never a running builder" (S7). They are not the fleet and not the lineup.
- Wrong output: the hook is user-scope (`~/.claude/settings.json`) and the pack loads in every pi session, so the segment runs in every
  project.
  - A repository on `master`, or any repository with no local `main`, prints `open lanes: unknown` at every start (R-1199), though nothing
    failed.
  - A repository that does not use `feat/` prints `none`.
  - A home-folder dotfiles repository answers for every folder under home that is not its own repository. The `.git` walk-up stops there.
  - A worktree deleted without `git worktree prune` still lists as open.
- Cost: open lanes is the only reason the lane needs any of these:
  - a git spawn in a 5 s SessionStart hook;
  - a 2 s await in pi's `session_start`, which delays every later handler (`runner.js:813-839`);
  - the unknown Windows git `%(worktreepath)` support (residual 12);
  - three rows (R-1198 to R-1200), four tests (L8 to L11), nine pairs (17 to 25);
  - four tunables (`OPEN_LANES_SHOWN`, `GIT_TIMEOUT_MS`, `MAIN_BRANCH`, `LANE_PREFIX`) and residual 9.
- Fix: cut all of it, and the `openLanes(cwd, {run, exists})` export. Put it to the owner as a separate question. If the owner wants it, show it
  only in a repository whose `AGENTS.md` carries the nana marker region, and print nothing (not `unknown`) when `main` is absent.

## SHOULD

**S1. D1's trade leaves out three costs. Recommend null, still the owner's call.**
- (a) Safety. A `sonnet` default makes an un-gated Claude subagent the larger-lane builder on every new machine. It runs outside pi-worker's
  lock, branch check and wall-clock ceiling, and outside the pi gate's worktree write guard. The roster memory records that seat-spawned
  subagents do not build by default, since they lack the gate, the post-edit checks and a worktree cwd (hardening audit 2026-10-06, G1d-*). Sonnet was the
  owner's one exception. D1 makes that exception the public default.
- (b) pi-only machines get a default slot they can never start.
- (c) A machine with a roster file ignores the default slot (R-1121 reads an absent slot as null).
  - The owner's Windows machine reportedly has a file naming its own provider (INFERRED from memory; `research-roster.md` §6 unknown 6).
  - Its split vanishes under either answer, so it needs a hand edit anyway.
  - If its Claude seat keeps launching Sonnet from its own memory, that seat's notice shows a lineup it does not run.
- So null costs one more file edit, on this Mac. It changes nothing for anyone else and puts the split where the owner said it belongs: the
  configurable file.
- Either way, add a HANDOFF carry: write `largerBuilder` into each of the owner's machines' files after the land, Windows included.

**S2. D4 is a live case, not a hypothetical one.** Memory (`user_<owner>_windows_both_seats.md`) says the owner runs both seats on one Windows
machine with one file. With one slot set to `sonnet`, that machine's pi seat stops for every larger lane (after M1). Without M1, it silently
uses the small-lane builder. State that in D4 so the owner decides with the real case in view.

**S3. The ` (` cut can cut a path in half.**
- File-level refusals start with the file path (`nana-roster.mjs:37-40`: `${file} is a directory…`, `${file} is unreadable (…)`).
- A `PI_CODING_AGENT_DIR` such as `D:\Tools (x86)\pi`, or `~/My (old)/agent`, puts ` (` inside the path. The notice then shows a truncated
  path and no reason. `tildeify` does not help, because it only replaces a home prefix.
- Fix: R-1196 says the order. Swap the file path for a placeholder, cut, then put the tilde form back. Add the case to L6.

**S4. Several rows carry more than one behaviour. Split them, so each row is no weaker than its clause.**
- R-1195 carries four: null land, null scout, lone builder with no label, the default mark.
- R-1201 carries two: context on every source, and a user message on three sources.
- R-1192 carries two: one-line content, and the no-provider privacy rule.
- R-1197 carries two: the change pointer, and `~` wherever the path appears.

**S5. Rows and tests disagree in two places.**
- R-1201 says the user message shows when the source "is absent". H1 tests "a missing or unreadable source".
- R-1204 does not name `additionalContext`, but I1 fails on a missing context.

Align each pair.

**S6. R-1191 does not pin what S8 relies on.** §3.7 and S8 say the refusal tells the user both ways out: a Claude Code seat, or a pi entry
in `largerBuilder`. R-1191 pins only `roster.largerBuilder` and "pi entries only". Pin both ways out in the row and in W3.

**S7. Changing the lineup is still a five-slot hand edit.**
- The pointer leads to a file with no `roster` key on this Mac (Ran in research).
- R-1121 means that changing one slot means writing all five from the README by hand.
- A JSON slip there stops pi's gate at its next start (`research-alter.md` §2).
- The owner named changing the lineup as the notice's purpose. Use what M3's cut frees: research-alter option B (`nana-roster --json` prints
  the resolved roster as a paste-ready `roster` block, one row and about two tests, named in the README Machine roster section). Or bring D2's
  `set` forward. The owner decides through D2.

**S8. The `NANA_ROLE` guard in the pi extension is not needed.** Every `NANA_ROLE` child runs with `-p`, where `hasUI` is false
(`research-surfaces.md` §3, facts 2 and 10). Cut it from R-1205, from half of L13 and from pair 27, or name a child with a UI that needs it.

**S9. Owner quotes are headed for the public review corpus.**
- §1 quotes the owner word for word three times, including the answer about names. The header says the file "can enter a public review corpus
  unchanged".
- The owner declined quotes. Paraphrase them here and in the HANDOFF and session lines the lane writes.

**S10. "Larger" drops "riskier".** The 2026-10-13 split sends the larger or riskier lanes to Sonnet: gate-adjacent code, multi-file
changes and lanes with many rows (`reference_roster.md`, paraphrased). Keep the key `largerBuilder`. Say "larger or riskier" in R-1190, the README and M1's
bullet, so a small gate change is not sent to the small-lane builder because of the label.

**S11. Name one more residual: headless `claude -p` runs.** Any `claude -p` run without `--setting-sources ''` now gets a `systemMessage`
in its stream-json output and the notice in its context (`hooks.md:1013,1252`). The repo's own judge passes the flag (Ran:
`apps/bench/lib/catch-judge.mjs:116`). Other callers on the machine are unknown.

## What holds (checked)

- **Shape B.** It is the smallest shape that holds the split, keeps every existing file valid, and fails loudly on an older checkout. The
  rejections of A, C, D and B2 hold.
- **Other readers of the file.** `config.ts` skips the roster, so the new slot cannot touch the gate. pi-review reads no roster.
- **Output contract.** `systemMessage` plus `hookSpecificOutput.{hookEventName, additionalContext}` matches the saved docs and the 2.1.299
  binary. `fork` is a real source since 2.1.214.
- **Fail-open path.** It needs no import and starts no second node. The `err.code ?? err.name` reason holds no path.
- **Cross-package import.** The pack importing `tildeify` from nana-setup is allowed: nana-pi publishes as one package
  (`code-map.config.json` `$comment` and layers).
- **Time.** Without git the hook needs about 0.1 s against its 5 s timeout. `readHookInput` returns on a TTY and is bounded at 64 KiB.
- **Row IDs.** R-1190 to R-1219 are unused on main and on `feat/regroup` (Ran: `git show <branch>:REQUIREMENTS.md`, 0 hits).
- **Unchanged checks.** `nana-roster.test.mjs:75` compares slot by slot, so the normalised copy keeps it green, as the census says.

## Answers to the six questions

1. **Does it do what the owner asked, and nothing more?**
   - It shows the lineup in both seats and points at where to change it.
   - Not yet true on a pi seat: M1.
   - Asked-for but thin: changing the lineup (S7).
   - Not asked for: open lanes (M3).
2. **Is the lineup shape the simplest that holds the split and stays compatible?** Yes: B, with one slot. Two gaps:
   - the Claude Code model rule is too loose (M2);
   - the default value has costs the plan does not show (S1).
3. **Can an honest input crash, block, hang or show a wrong lineup?**
   - No crash, block or hang found. All git paths are bounded and fail open.
   - Wrong output: a full Claude model name (M2); every pi seat with a split (M1); every non-nana repository's open-lanes segment (M3); a
     path containing ` (` (S3); a machine with a file and a split held in memory (S1c).
4. **Does a row carry two behaviours or an untestable clause?** Two behaviours: R-1195, R-1201, R-1192, R-1197 (S4). No untestable clause,
   but two rows disagree with their tests (S5).
5. **Is a part unearned under the subtraction test?** Open lanes (M3) and the pi `NANA_ROLE` guard (S8).
6. **Is the pi seat's handling of a Claude Code entry honest?**
   - The label is honest.
   - The behaviour is not, until a seat-readable rule makes the seat pass `--lane-size larger` and stop and ask (M1).
   - The refusal text does not pin what S8 relies on (S6).
