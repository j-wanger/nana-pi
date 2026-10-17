# Design critique r3: roster-notice (fleet lane), seat draft 3

*Adversarial plan review of `fleet/CHANGE.md` (seat draft 3, seat revision 3) at main `2dbc817`, 2026-10-16. Read-only outside this folder.
"Ran" = run here today; "Read" = read, not run; INFERRED = reasoned from code or docs. Closed findings from `design-critique.md` and
`factcheck.md` are not repeated. Verdict: **2 MUST, 11 SHOULD.** Revision 3 applies the decision log faithfully, and the shape, the hook
contract and the fail-open path still hold. Two gaps remain. The rule that makes the split real reaches far fewer places than the notice
does. The pi notice also wipes an existing startup notice.*

*Round note: this is the third plan round of a FORMAT lane. The shared rule lets only a named fail-open bug reopen a plan after round two.
M1 is one: the guard text fails open and the wrong builder runs in silence. M2 is a regression of today's behaviour, which the review
standard counts as a MUST. The seat decides whether M2 reopens the plan or closes as a recorded owner decision; both closes are small.*

## MUST

**M1. The notice reaches every project at once; the rule that makes the split true reaches almost none.**
- The hook is user-scope and the pack loads in every pi session, so the notice shows the split in every folder on a machine.
- The larger-lanes bullet (R-1193) lives only in the shared marker region. A project gets it only when `nana-setup project` runs there.
  - Read: `packages/nana-setup/lib/project.mjs:186-228` rewrites only AGENTS.md's region, and only when run. `project --check` reports a
    stale region but changes nothing (`packages/nana-setup/README.md:251`). INFERRED from a grep: nothing runs it on its own.
  - On Windows, project setup writes CLAUDE.md as a copy of AGENTS.md (`project.mjs:258-260`). A later region refresh rewrites AGENTS.md
    only. Claude Code 2.1.299 loads AGENTS.md "where the project has no CLAUDE.md" (Ran: `strings`, background grep of `cc-strings.txt`).
    So a Windows Claude seat in such a project never reads the new bullet, even after a refresh (INFERRED from both reads).
  - The Claude seat's usual route for shared bullets is nana-soul's copy (R-1128). The plan keeps the new bullet out of nana-soul on purpose.
- Failure, with an honest input: the owner writes a `largerBuilder` on a machine (carry 6). A seat works in any adopted project other than
  nana-pi. The notice says "X for larger lanes and Y for small lanes". The pi seat has no bullet. It runs plain `pi-worker --lane` for every
  lane, and Y builds them all in silence. That is the failure critique M1 named. Residual 15 records the late bullet but not this effect.
- The plan's own second "most likely wrong" claim is the same gap: "nothing makes a seat pass `--lane-size larger`".
- Fix, recommended (a): make the choice a lane-mode check instead of text.
  - New row (R-1212): IF pi-worker lane mode receives no `--lane-size` and the roster's larger-lane builder is not null, THEN it shall refuse
    before taking the worktree lock or starting pi, naming `--lane-size small` and `--lane-size larger`.
  - Cost: one row, one W check, one pair.
  - While the slot is null (D1's recommended default) nothing changes for anyone.
  - Once the slot is set, every seat in every project must choose, on every platform, with no marker-region refresh. A Claude seat that
    never read the bullet learns the Claude Code way out from R-1191's text.
  - It also closes the `--lane-size=larger` hole: that form is not in `ownOptionNames` (`pi-worker.mjs:26`). The watchdog ignores unknown
    options (factcheck), so today the form would run the small-lane builder in silence. Under (a) it is refused as "no `--lane-size`".
- Fix, minimum (b), if the owner wants no new refusal:
  - carry 6 runs `nana-setup project --check` and a refresh in every adopted project on a machine before its file gains `largerBuilder`;
  - nana-soul carries the new bullet too (R-1128 reworded to three bullets, the `templates-render.test.mjs:392` check extended, one pair);
  - residual 15 states the effect: a seat in an un-refreshed project builds every lane with the small-lane builder.

**M2. In the pi TUI the roster notice replaces nana-handoff's startup notice.**
- pi shows an info notice as a status line. A second info status with nothing between them replaces the first
  (Read: `interactive-mode.js:2270-2280`, `:3060-3078`).
- At startup nana-handoff raises `compaction summary picked up from …` as info (`nana-handoff.ts:420`, in its `session_start` handler for
  startup).
- Extensions load in directory order. Ran: `readdirSync` on this Mac lists `nana-handoff.ts` before `nana-roster-notice.ts`. The handlers
  between them (lifecycle, notify, objective, post-edit) add nothing to the chat on a clean start (Read).
- Failure, with an honest input: a pi TUI session starts in a folder that has a compaction summary. The user no longer sees that the summary
  was picked up. Today they do.
- The pack README promises that notice in TUI sessions (`packages/nana-pack/README.md:366-375`, "Toasts: … compaction summary … picked up").
  The census and the residuals do not name it. No check reds: the tests capture notify calls, not the screen.
- If the order flips (Linux readdir order is not sorted), the handoff notice wipes the roster notice instead.
- Fix: choose now. Either use the plan's own fallback, `setWidget` above the editor (one value, one test), which does not share the status
  line. Or keep `notify`, then name the loss in §5.2, residuals and the README section, and put it to the owner beside the feel check (7).

## SHOULD

**S1. The bullet is silent when `largerBuilder` is null, but D1 and §3.7 rely on it.**
- D1 says "until then, under the new bullet, its larger lanes go to the small-lane builder". §3.7 says "the builder builds every lane in both
  seats". The bullet only covers the slot when it is set.
- A Claude seat that remembers the earlier split (this Mac until residual 5 runs) shows "builder X" with no label and still sends larger
  lanes to a subagent.
- Fix: add "With no `largerBuilder`, the builder builds every lane" to the bullet, as its own row and T check, or drop the claim from D1
  and §3.7.

**S2. R-1193 carries two behaviours, and pair 60 pins only one.** It covers the route by entry kind and the stop-and-ask rule. No pair reds
a bullet that sends a pi entry through plain `pi-worker --lane`. Split the row, with one T check and one pair each.

**S3. R-1190 carries a clause no test can pin.** "which a seat passes for a larger or riskier lane" describes the seat, not pi-worker. W1 and
W2 cannot see it. Move it to the bullet's row, which already says "larger or riskier".

**S4. R-1195 is wider than its test.** "shall contain no provider" fails on an honest roster whose model id contains the provider string.
Examples: a routing service that prefixes model ids with a provider name, or provider `acme` with model `acme-large`. L2's fixtures use placeholders
found nowhere else, so they never meet the case. Reword: the notice builds each entry from its model and thinking only, never from its
provider field.

**S5. R-1205, R-1206 and R-1207 overlap.**
- R-1205 says the context is the roster notice "on every source". R-1207 says it is the unavailable text after a throw.
- A stdin read error fits both R-1206 ("can read no source", so show the notice) and R-1207 ("throws", so show unavailable). §3.5 reads
  input inside the one try, so the build would pick R-1207.
- Fix: scope R-1205 to a hook that loaded its modules. State that an input read error counts as no source. Add that case to H2.

**S6. The `--json` paste instruction can break the file.**
- `--json` prints a whole object, `{"roster":{…}}`. The README text says to paste it "into the file". On this Mac the file already holds
  other keys (research). A second top-level object is a JSON error. That stops pi's gate at the next start (residual 9).
- Fix: tell the user to set the file's `roster` key to the printed `roster` value. Or print only the value and adjust N4.
- Add a residual: once the file holds `roster`, the desk's nana-pack editor refuses every save by name. The client spreads every top-level
  key (`apps/desk/public/app.js:2186`), and the server refuses `roster` (`apps/desk/server.mjs:2358-2359`). This exists today, but the lane
  now invites users to add the key.

**S7. `SHOW_SOURCES` leaves out two session starts.**
- §1 says every session start. Claude Code's `/clear` and pi's `/new` start new sessions.
- `/clear` also clears the Claude Code screen, so the notice is gone from view (INFERRED).
- The choice is one config value. Include `clear` and `new` (H2, L13, L14 and pairs 20 and 24 move). Or state the exclusion in D-form so
  the owner can overrule it.

**S8. Add three residuals with what is now known.**
- (a) The hook runs with Claude Code's environment (`hooks.md:414,754`). Claude Code's Bash tool starts from the user's shell profile.
  `PI_CODING_AGENT_DIR` exported only in the profile, with Claude Code started from an app or an IDE, means the notice reads the home agent
  dir while the seat's `pi-worker` reads the other one. The notice's file path shows it. INFERRED.
- (b) Residual 14 now has a known caller on this machine. pi-subagents 0.75.0, which nana-setup installs, starts Claude Code children with
  `--setting-sources user` (Read: `claude-code-adapter.js:222`), so each child runs the hook. Its environment allowlist (`:14-30`) drops
  `PI_CODING_AGENT_DIR`, so a child's context can name a different roster file.
- (c) No repo code or rule starts the scout (Ran: `git grep -i scout`), yet the notice names it when set. Say "configured; no nana rule
  starts it", or leave it out of the notice.

**S9. The pack README's "What you will see" section does not gain the notice.** §3.8 adds the table row and the counts, but not this list
(`packages/nana-pack/README.md:366-375`). It is the user-facing list of what each TUI shows. Add the roster notice there, and add M2's
outcome.

**S10. The subtraction table's reason for no effort field is wrong.** It says "no thinking or effort (no consumer)". The 2.1.299 Agent tool
takes `effort:U(ua).optional()` on the same schema line as `model` (Ran: `cc-strings.txt:337100`). Keep the field out if wanted, with the
true reason: the split names no effort, and the field's own help says to set it only when instructions ask. Residual 3 stands.

**S11. R-1191's refusal text reads as an order to the seat.** "Start it as a subagent from a Claude Code seat, or put a pi entry in
largerBuilder" tells a model to edit the user's lineup file. A seat in a project without the bullet (M1) has only this text to go on.
Claude Code has no nana gate on that file. Phrase it as the user's choice: "ask the user to start it … or to put a pi entry …". Keep W3's
two ways out.

## What holds (checked)

- **Row IDs.** R-1190 to R-1219 are unused on main `2dbc817`, on `feat/regroup` (now `5a992d7`, not the `22e0140` the header cites) and in
  the regroup worktree's uncommitted files (Ran: `git grep`, `grep -r`). The regroup tip's highest row is R-1187. Every proposed row has
  exactly one `shall` and no pipe inside a cell, which the trace rail requires.
- **Agent tool model list.** Ran: `cc-strings.txt:337100` holds `model:U(["sonnet","opus","haiku","fable"])`. The same schema has a `cwd`
  field that one variant omits (`Wo().omit({cwd:!0})`), so "in the lane worktree" stays prompt-led, as it is today.
- **The pi extension can import a bin module.** Ran: pi's own jiti loader imports a `.ts` file that imports a shebang `.mjs`. The module
  loads and its `import.meta.url` main check does not fire. pi installs the whole repo (`package.json` pi manifest; README install lines),
  so the pack importing `tildeify` from nana-setup resolves.
- **No role check needed in pi.** pi-subagents binds child sessions in print mode (Read: `child-session.js:436-437`), so they have no UI.
  This supports critique S8's cut.
- **Install check.** It strips `PI_CODING_AGENT_DIR` (`install-check-config.mjs:20`) and sends `source: "startup"`
  (`install-check.mjs:257`), so the new branch sees the default notice with a user message.
- **Lengths.** Ran `notice-lengths.mjs`: 144, 208, 205, 169, and 283 with the `--json` pointer. All match §3.4.
- **Recounts.** 22 rows added and 12 reworded. 32 titles: L1-L15, H1-H3, I1, N1-N5, W1-W5, T1, X1-X2. 60 pairs, numbered with no gap.
  Every new check except the Windows-only ones has at least one pair (checked by hand).
- **Public-repo rule.** No owner name, no quote of the owner, no provider or machine name in CHANGE.md (Ran: `grep -i`).
- **M3 cut.** No git call, no open-lanes text and no open-lanes tunable remain, except Later lanes (d) (Ran: `grep`).

## Answers to the six questions

1. **Does it do what the owner asked, and nothing more?**
   - It shows the lineup in both seats, makes the split configurable and points at where to change it.
   - It is not yet true outside nana-pi: M1.
   - The `--json` print is earned only if its paste instruction is safe (S6).
   - `OPTIONAL_SLOTS` and `CLAUDE_CODE_SLOTS` hold the same one name. One constant would do, a nit.
2. **Is the lineup shown the lineup each seat runs?**
   - nana-pi on macOS: yes for both seats, once residual 5 runs.
   - Other projects, and Windows Claude seats with a copied CLAUDE.md: no, until M1 is fixed.
   - A null slot with a remembered split: S1.
   - Divergent environments: S8a.
3. **Can an honest input crash, block, hang or show a wrong lineup?**
   - No crash, block or hang found. The hook reads bounded stdin that Claude Code closes, and it starts no child.
   - Wrong lineup: M1 and S1.
   - Wrong or lost output: M2 (handoff notice), S6 (broken file after a paste) and S8b (child contexts).
4. **Does a row carry two behaviours or an untestable clause?**
   - Two behaviours: R-1193 (S2).
   - An untestable clause: R-1190 (S3).
   - Overlapping rows: R-1205, R-1206 and R-1207 (S5).
   - A row wider than its test: R-1195 (S4).
5. **Is any part unearned?** Nothing large. The duplicate slot constants are a nit. `--json` needs S6.
6. **Is the decision log applied faithfully?**
   - Yes, item by item: M3 cut, M1 bullet, M2 list, D1 null, the S3-S11 splits, `--json`, no role check, no quotes, D3 replaced, D4 live
     case, factcheck fold-in and the recount.
   - Gaps:
     - item 5's "larger or riskier" in R-1190 makes S3's untestable clause;
     - item 2's pair 60 pins half of R-1193 (S2);
     - item 3 kept a false reason for leaving out effort (S10);
     - item 7's reason holds and is now confirmed for pi-subagents;
     - the header's regroup hash is stale.
