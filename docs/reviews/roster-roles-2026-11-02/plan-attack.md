<!-- Adversary: pi, openai-codex gpt-6-astra, read-only, via pi-worker non-lane mode (2026-11-02). -->

1. **MUST — The fallback does not establish independence on a pi seat.**  
   **Evidence:** `plan.md:29,82,127` exempts seat planners from comparison and treats provider/runtime aliases as different lineages. `packages/nana-pack/bin/worker-config.mjs:128–135` defaults both builder and reviewer to OpenAI. A pi seat planning on OpenAI therefore gets an OpenAI adversary; the default checker also matches its reviewer. A roster written whole by `set` can retain those defaults—it is not merely the “no roster block” case. Moreover, a valid larger-builder/reviewer separation says nothing about the small `builder` used for fallback.
   
   **Plan change:** Test *resolved* pairs, including fallbacks, for both seat runtimes and file-backed defaults. Normalize the known OpenAI and Anthropic aliases. When the seat’s lineage is unknown, report “independence unverified,” not silent success. Put that diagnostic on role launch or session notice, not only a separately invoked roster command. Do not silently substitute another model.

2. **MUST — MM3 misses the laptop’s whole-file creation path and conflicts with its own precedent.**  
   **Evidence:** `plan.md:117` tests only an existing roster and demands exactly its previous keys. But `packages/nana-pack/lib/roster-set.mjs:68–73` normalizes before writing, adding absent optional fields. `packages/nana-pack/tests/nana-roster-set.test.mjs:65–88` already exercises absent-file creation. The planned fix strips only the three new fields, so an existing four-slot roster still acquires `largerBuilder`, contradicting MM3’s exact-key assertion. The incoming `lanes` member is described at `plan.md:104` but absent from these acceptance cases.
   
   **Plan change:** Cover absent file, file containing only `lanes`, four-slot legacy roster, and the laptop-style fully materialized old roster. Require no *unrequested new role fields*, preservation of unrelated members, and successful reading by the frozen old validator. Explicitly decide whether preserving absence of `largerBuilder` is included; do not imply it accidentally.

3. **MUST — Showing scout breaks a standing requirement the amendment list omits.**  
   **Evidence:** `plan.md:125` requires a configured scout in the notice, while `REQUIREMENTS.md:2348` explicitly requires no scout, set or null. `packages/nana-pack/tests/roster-notice.test.mjs:156–162` pins that exclusion. `plan.md:129` amends R-1194 but not R-1199.
   
   **Plan change:** Amend or retire R-1199 explicitly and replace its negative test with configured/null scout cases for both pi and Claude entries. Add this semantic contract reversal to the forecast; it is not just an exact-string update. Also reconcile MM1’s immediate `source:` line with the intervening `lanes:` line promised at `plan.md:104`.

4. **MUST — The proposed load-log precedent can record delivery when no child started.**  
   **Evidence:** `plan.md:89,123` proposes reusing `onSpawn` and requires one delivery line. However, `packages/nana-pack/bin/pi-watchdog.mjs:190–202` invokes `opts.onSpawn` immediately after `spawn()`, before its asynchronous success/error outcome. On macOS, `packages/nana-pack/bin/review-launch.mjs:27` returns the bare Claude command without checking availability. Missing Claude therefore can produce a load line despite `ENOENT`. Conversely, logging intentionally fails open for unsafe or unwritable destinations (`packages/nana-pack/lib/context-load-log.mjs:19–36`).
   
   **Plan change:** Define the event as successful child spawn, not attempted spawn or successful completion. Test missing executable, launch refusal, child failure after spawn, and unavailable log storage. Require zero delivery lines before spawn, one after spawn, and one bounded diagnostic without changing delivery when logging fails. Qualify MM6’s unconditional “exactly one” accordingly.

5. **MUST — Windows cleanup and role lifecycle are in scope but have no acceptance test.**  
   **Evidence:** `plan.md:38,76,90` promises a ceiling, zero retries, Windows shim routing, and hard-stop cleanup. MM4–MM6 test only ordinary launch/refusal/logging. The reused lifecycle is not generic: `packages/nana-pack/bin/pi-worker.mjs:330–340` enters its capture-folder cleanup and watchdog configuration only in `laneMode`. The cleanup-only watcher requires a sentinel lock and common directory (`packages/nana-pack/bin/claude-review.mjs:103–110`); it cannot simply receive a missing lock because `packages/nana-pack/lib/lane-watcher.mjs:43–47` resolves those paths.
   
   **Plan change:** Extend a must-meet with actual Windows role-mode `.cmd` execution, paths containing spaces, ceiling expiry, and forced launcher termination. Assert settings/capture cleanup, no lane lock/build record/lane-class output, and no repeated child attempt. State the existing child-survival limitation explicitly: the watcher does not kill Windows children (`lane-watcher.mjs:193–195`).

6. **SHOULD — The older-checkout warning overlooks the newly legal Claude scout.**  
   **Evidence:** `plan.md:31` says only deliberately setting a *new slot* can make older readers refuse. Yet MM2 adds `set scout claude-code sonnet`. The old `CLAUDE_CODE_SLOTS` excludes scout (`packages/nana-pack/bin/worker-config.mjs:48`), and its validator rejects the resulting entry (`packages/nana-pack/bin/nana-roster.mjs:81–93`).
   
   **Plan change:** Include Claude scout in the compatibility decision and tests. Prefer a backward-compatible storage arrangement if mixed checkout versions must remain usable. Otherwise document both incompatible operations and their recovery path. A top-level `roles` alternative for only the three new slots does not solve Claude scout compatibility.

7. **SHOULD — “Research gathering” is not demonstrated by launching a builder-shaped scout.**  
   **Evidence:** The owner explicitly asks for research gathering (`plan.md:12`), but A4 postpones all role-tool distinctions. `packages/nana-pack/bin/worker-config.mjs:77–78` deliberately excludes web tools from Claude’s builder allowlist, and `pi-worker.mjs:213–214` applies that same list as both tools and allowed tools. MM4 never launches a configured scout.
   
   **Plan change:** Add a scout acceptance case for code scouting and one supported research-gathering route. State whether research means supplied/local material, shell-based retrieval, or web tools. Do not claim the broader capability solely from model selection, and do not defer a tool capability needed by reading A to B.

8. **SHOULD — B and C cannot attach merely by changing the delivered-parts function.**  
   **Evidence:** `plan.md:35,49` puts the true role only in the log and suggests B/C change one function. But A4 also defers tool selection, while Claude children disable automatic memory (`packages/nana-pack/bin/worker-config.mjs:89–90`). The child environment, tools and prompt assembly are separate concerns in `packages/nana-pack/bin/pi-worker.mjs:157–160,202–230`.
   
   **Plan change:** Keep `NANA_ROLE=worker` for existing child suppression, but carry the requested role through one internal launch specification used by prompt assembly, logging and future role policy. Describe C as explicit role-memory delivery, not automatic-memory enablement. Replace “without rework” with the narrower promise of no roster-schema or launcher-interface migration.

9. **SHOULD — MM8 combines unrelated behaviour and pins prose instead of the useful contract.**  
   **Evidence:** `plan.md:127` combines lineage diagnostics, guide wording, three documents and fallback instructions in one row. `plan.md:129` then requires eight new rows even though MM1–MM3 and MM7 also amend existing roster/notice contracts. Existing guide tests already compare exact bullets (`packages/nana-setup/tests/seat-rule.test.mjs:25–46,62–66`).
   
   **Plan change:** Separate lineage behaviour from seat guidance. Reuse existing requirement rows where their behaviour expands; add rows only for genuinely new launch/log contracts. Test that guidance names the launcher, supported roles and seat/null exceptions, without freezing one sentence. Do not turn four available roles into four mandatory launches per lane.

10. **SHOULD — The new launch instruction needs a Windows-native form and runtime scheduling guidance.**  
    **Evidence:** `plan.md:127` pins only `pi-worker --slot …`. The existing shared pattern supplies a checkout-based Node fallback when PATH commands are unavailable (`templates/_shared/working-under-nana-pi.md`, “Default pattern”). The seat guide’s background/foreground instruction currently names only builders and reviewers (`packages/nana-setup/claude/rules/nana-seat.md:5`), not these new role launches.
    
    **Plan change:** Give role launches the same Node entry-point alternative, with a PowerShell-valid path example for the laptop. Explicitly extend the existing Claude-background/pi-foreground guidance to launched roles. Keep this a short extension of existing instructions, not another workflow or checklist.

MUST: 5 · SHOULD: 5 · NOTE: 0
