OPEN: The audit is broad, but three completeness gaps remain.

### No integrated acceptance journey

Each lane proves a component or reconstructs old work.

No lane executes one current product change through the seat, builder, checks, review, land, and next-session continuity.

The historical product run merged before review. Every recent builder path also lacked post-edit checks.

Component fixes can therefore pass while the overall experience still requires remembered handoffs.

Add one bounded, real-product canary after fixing the launcher and trust paths.

### No machine-loss or migration journey

The installer covers creation and repair, but not loss, migration, or restoration of existing user state.

That state includes private rules, memories, trust decisions, ledgers, sessions, service settings, and credentials.

Ten local commits also remain beyond the remote, increasing current machine-loss exposure.

Classify durable versus rebuildable state, then test a replacement-home restore.

### The Codex usage conclusion is overstated

My count found 147 session files since September 20.

However, 146 are imported transcripts. Only one lacks the import marker.

Codex still contaminated shared skills and configuration, but activity counts do not justify runtime-parity work.

Separate native execution from imported history before deciding whether Codex is supported.

```json
{"assessment":"Coverage is strong at the component level but incomplete at two system boundaries: the full coding journey and recovery onto another machine. The current evidence cannot prove that individually repaired seams compose into one coherent experience. The hardening plan also risks treating imported Codex history as native runtime use. These gaps should be resolved before adding more mechanisms.","gaps":[{"key":"S1","angle":"One real task across Claude Code, the canonical builder, post-edit checks, pi review, landing, and continuity","why":"No lane followed the complete current journey. Historical product work merged before review, recent builders received no post-edit checks, and the live receipt directory is absent. This leaves P2, P3, and P4 untested at the exact seams where the audits found failures.","evidence":"G1b notes show reviews after four lanes merged and a direct-main lane with no review at /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/harden/G1b/notes.md:22 and :27. G1d records no post-edit coverage for every recent builder route at /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/harden/G1d/notes.md:21-25. A read-only probe reported that /Users/jwang/.pi/agent/receipts is absent.","severity":"high","suggested_fix":"After launcher and trust repairs, run one small product change as a canary. Require the correct startup context, isolated builder, passing receipt, review of an immutable revision, ledger entry, tested land, frontier update, and successful next-session pickup."},{"key":"S2","angle":"Replacement-machine, home-directory loss, and restore journey","why":"The state-store lane inventoried data, and the install lane covered a fresh setup, but neither classified or restored existing owner state. Reinstalling code does not recover private rules, memories, trust choices, review history, sessions, service configuration, or credentials. Current unpushed work makes this more than a theoretical lifecycle gap.","evidence":"The setup contract lists only install, doctor, and project commands at /Users/jwang/nana-pi/packages/nana-setup/README.md:10; its state table begins at :31 and includes machine-local private and runtime state. Searches found no machine-backup or restore contract. `git rev-list --left-right --count origin/main...HEAD` returned `0 10` for /Users/jwang/nana-pi.","severity":"medium","suggested_fix":"Create a state manifest marking each store rebuildable, disposable, re-ratified, or durable. Provide a tested restore runbook, or a minimal export/import command if the runbook still needs manual copying. Verify it against a temporary clean home without exporting secrets by default."},{"key":"S3","angle":"Reconcile Codex Desktop evidence before declaring a supported third runtime","why":"L2 calls Codex heavily used, while G1b identifies most apparent sessions as Claude transcript imports. Treating imported history as native execution can wrongly expand the parity matrix and hardening scope. The shared-skill contamination remains real and should be handled independently.","evidence":"G1b records import markers and zero native sessions for the two cited product worktree groups at /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/harden/G1b/notes.md:51. An independent read-only count over /Users/jwang/.codex/sessions since 2026-09-20 found 147 files: 146 containing `external-import-turn-1` and one without it. A sampled file shows that marker at /Users/jwang/.codex/sessions/2026/09/22/rollout-2026-09-22T14-45-56-01a0ca70-5cd1-77f3-8fa4-837573d21349.jsonl:2.","severity":"medium","suggested_fix":"Recompute runtime use from native turns and native tool calls, excluding imports. Decide Codex support from that result. Retire or isolate its shared skills and MCP configuration regardless, because their effects on pi are independently established."}],"rule_breaks":"none"}
```
