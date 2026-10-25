# Handoff — nana-pi frontier

*Frontier only; the narrative lives in `docs/sessions/`. One line per live decision: rewrite, don't accumulate. The live sections come first, then Landed, then the Known bugs pointer.*

**No `OBJECTIVE.md` here.** nana-pi's objective is the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`. Both runtimes print it and the current priority at session start.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Frozen by the owner on 2026-10-10 until the owner reopens it; its two signing-key violations stay declared limits meanwhile. The seat parked its eight deliverables on 2026-10-22; reopening the desk deletes their park lines.

## Next

1. **Current priority: the artifact work (the owner, 2026-10-23).** Each artifact comes from an existing run, is read by code, and shows its age. The owner's Windows run and checklist passed that day.
2. **2026-10-23 readings:** the 6.6 compaction replay and the seat's knowledge pull; the store stays frozen until then. The pull reading drops sessions named for pi-worker or pi-review; the owner then rules. If it stops, `nana-knowledge query` needs its own index refresh.
3. **Lanes in flight (power mode continues; the owner, 2026-10-23).** On 2026-10-25 the owner lifted the pause for four page-free lanes. Three are on main; one more and a Windows lane are still building.
4. **Product page readability (the owner, 2026-10-24).** The page is getting too complex. It stays frozen: no page addition until the owner's discussion.
5. **Queue after that.** The owner's discussion sets it. Seat work: after each land, check the land-written report's commit against main, then publish it to the owner's copy.
6. **Windows first-try failures.** Since 2026-10-22, flaky tests failed 32 of 171 first Windows runs, about 18% both before and after the 2026-10-23 hardening lane. The owner picked both Windows test lanes; one is on main, and one is building.
7. **Capability kinds (the owner, 2026-10-21).** Other projects gain the capability lines in place, each in its own session.

## Open for the owner

- **[blocking, since 2026-10-24] The page discussion.** The page stays frozen until it. The artifact assessment asks eleven questions, and the page brief offers three options. Default: option two.
- **[optional, since 2026-10-22] What a land waits for.** Each land waits about 21 minutes for its tip's CI run. Nothing lands during a GitHub outage, urgent fixes included. Default: wait for the whole run.
- **[optional, since 2026-10-22] A copier project's drift line.** It compares against main, not the project's template tag. Default: it stands.
- **[optional, since 2026-10-23] A real Claude Code builder behind a proxy.** The seat checked its login and proxy settings against a fake endpoint only. Start one real build behind a proxy and check that it logs in and commits. Default: the seat waits for your run.
- **[optional, since 2026-10-23] Cloud provider settings for a Claude Code builder.** A builder started from a pi seat gets no Bedrock, Vertex or Foundry settings. Carry them too? Default: no.
- **[optional, since 2026-10-21] The blocking-ask cap.** The trial ended with no blocking ask standing. Keep the cap of three blocking asks? Default: keep.
- **[optional, since 2026-10-21] The trust gap in the lane loop.** Sharing the gate's pipe-check row onto the build and review features would close it. A share changes the tree, so it is your call.
- **[optional, since 2026-10-21] The install feature's known bugs.** Its file holds 177 lines in 46 KB and grows about 2 KB each install lane. Split the feature, or let the seat prune stale lines? Default: prune.
- **[optional, since 2026-10-21] Known-bug files and the writing rule.** Should the feature files count as technical records, outside the rule? Default: technical records.
- **[optional, since 2026-10-21] Personal project names.** About 15 stay in current files, naming neither you nor your work. Keep them? Default: keep.
- **[optional, since 2026-10-21] The commit author.** Every commit carries your legal name and your machine's name. Changing the git author for new commits is your call. Default: leave it.
- **[optional, since 2026-10-19] Byte-order-mark rows.** Three lanes filed them under diagnosing the active environment. Should the install, project, gate and roster features share them? It is your call.
- **[optional, since 2026-10-19] Stale labels in the not-passed list.** A test label marked changed since still keeps its row in the report's not-passed list. Reverse that? It changes one rule and one requirement.
- **[optional, since 2026-10-19] A dry run under a held lock.** The dry run exits 0 and the real run exits 2. Should the dry run preview past the lock, then exit 2 and name it? Either way one requirement gives way.
- **[optional, since 2026-10-19] Four more Claude skills on Windows.** The seat now installs spec, py-lint, py-review and py-test there. Confirm the Windows Claude Code seat should get them.
- **[optional, since 2026-10-23] pi 1.4.0 on both machines.** This Mac runs pi 1.0.2, below the supported range. Upgrade with the setup README's command and restart the desk; the second machine may keep 1.0.3. Default: yes.
- **[optional, since 2026-10-15] Lift your flat projects.** Each lift is its own lane, with your yes on its dry run. Confirm the work project that left the adoption refresh leaves the lift too; default: drop it. Then basketball-geek, then trading-zone.
- **[optional, since 2026-10-05] Background subagents.** You saw subagents not running in the background. Where was it: pi, the desk or Claude Code? Did the agent wait, or never start one?
- **[optional, since 2026-10-07] One TUI check.** Trigger a gate approval in an unfocused pi TUI window. Expect an "Approval needed in pi" notification, or a recorded notifier failure.
- **[optional, since 2026-10-04] pi 1.0 screen-only parts.** FleetView and stopping a run in the TUI have had no feel check.
- **[optional, since 2026-09-29] The process is unfelt.** Judge the session-start block, the provenance label and the review cost by use.
- **[optional, since 2026-10-02] REQUIREMENTS decisions.** Open questions 1, 6, 6b, 10–12, 15 and 13's template half wait for you.
- **[optional, since 2026-10-08] Codex re-imports legacy skills.** Switch off its nightly Claude-skill import, or let the seat retire the legacy dev and wiki skills?
- **[optional, since 2026-10-08] edge-screener.** Moving `main` to its local `p87-setup` branch and publishing are yours.
- **[optional, since 2026-10-09] Backups.** The tar backup has no destination, and some repos hold unpushed work. A clean-account test needs your admin rights.
- **[optional, since 2026-10-09] Read protection.** Approve deny rules and the sandbox credential block? Nobody has tested the sandbox with pi.
- **[parked, since 2026-09-16] Changes-bar baseline.** The files-changed bar is the working tree against HEAD, not the conversation. Switching is a design change.
- **[parked, since 2026-09-16] Raw-only wikis.** The index skips the raw folders of two scrape-only wikis. This rides with hardening D2(c).

## Landed

- 2026-09-18 to 2026-10-23: moved verbatim to the October session archive (`docs/sessions/2026-10.md`), all but the newest.
- 2026-10-25: the setup test that killed processes by reused process IDs now judges each one at once and kills nothing.

## Known bugs

Known bugs live one line each in `docs/known-bugs/`, one file per feature, plus `docs/known-bugs/unplaced.md`. Desk known limits live in `apps/desk/README.md`.
