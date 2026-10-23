# Handoff — nana-pi frontier

*Frontier only. Narrative lives in this repo's `docs/sessions/`. One line per live decision; drop a line once it is obvious-default, gone, or archived — rewrite, don't accumulate. The live sections come first (Where things stand, Next, Open for the owner), then Landed, then the Known bugs pointer.*

**No `OBJECTIVE.md` here.** nana-pi's objective is the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`. Both runtimes print it and the current priority at session start.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Frozen by the owner on 2026-10-10 until the owner reopens it; its two signing-key violations stay declared limits meanwhile.
- **This file's word budget.** On 2026-10-22 the seat moved the Landed lines to the session archive and shortened every ask, dropping none. The frontier checker prints the remaining count.

## Next

1. **Priority review, 2026-10-24.** Met: the requirements tree, four-digit IDs, the land rule, and the Windows CI runner with its fixes. Partly met: install and hooks. CI's install check passes on macOS and Windows, but the owner's own Windows run at current main is pending. No checklist step has run on a clean account or a fresh machine. The seat brings the review pack and proposes whether the artifact work becomes the next priority.
2. **2026-10-23 readings:** the 6.6 compaction replay and the seat's knowledge pull; the store stays frozen until then. The pull reading drops sessions named for pi-worker or pi-review; the owner then rules. If it stops, `nana-knowledge query` needs its own index refresh.
3. **Lanes in flight (power mode until 2026-10-24).** Building: land reads CI, build records and the session-start frontier. Planned: the project drift notice, then CI timing records once land reads CI lands. After them come Claude Code builder parity and shared helpers. A small lane parks the desk and orphan study deliverables when a build slot frees.
4. **Queue after that.** It holds the builder launch in the install check and the linked Claude folder's repair advice. It also holds a settings file with a byte-order mark and the audit's seat calls. Seat work: regenerate and republish the product report in a reviewed change.
5. **Windows first-try failures.** Count them over 20 CI runs since CI moved to four test files at a time. Two so far, both on 2026-10-22: a parallel-runner output check, then the objective hook row of main's install check. Each re-run passed. Before the 2026-10-21 fix, about 4 of 20 needed a re-run.
6. **Karpathy's other formats.** Nothing blocks the review-timeline diagram any more, and nobody has started it.
7. **Capability kinds (the owner, 2026-10-21).** Other projects gain the capability lines in place, each in its own session.

## Open for the owner (each ask: blocking, optional or parked, and since when)

- **[blocking, since 2026-10-21] Your Windows run at current main, before 2026-10-24.** Default: yes. Commit or stash your work, drop the old launch branch, and pull main. Run `git rm -r --cached -q . && git reset --hard` once, for the old line endings. Then run install, doctor and `node packages/nana-setup/bin/install-check.mjs`. Check `claude --version` is 2.1.139 or later, and watch one pi-worker lane.
- **[optional, since 2026-10-22] What a land waits for.** The land-reads-CI lane makes each land wait about 21 minutes for its tip's CI run. Nothing lands during a GitHub outage, urgent fixes included. Default: wait for the whole run.
- **[optional, since 2026-10-22] Two planned-lane defaults.** A copier project's drift line compares against main, not its template tag. nana-land does not print the CI timing records yet. Default: both stand.
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
- **[optional, since 2026-10-21] The pi upgrade.** pi 1.3.0 is out, and the README and CI pin 1.0.2 installed with `--before 2026-10-04`. Upgrading, and filing the upstream issue about the codemode break, are yours.
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

## Landed (one line each; the narrative is in `docs/sessions/`)

- 2026-09-18 to 2026-10-22: one line each, moved verbatim to the October session archive (`docs/sessions/2026-10.md`), up to 2026-10-20 on 2026-10-21 and the rest on 2026-10-22.
- 2026-10-22: the brief check now reads the Precedent forms seats write. A numbered step list right after a plain Precedent list no longer counts as entries. A bold label line starts the section, and a bold or punctuated path now reaches the check bare. A heading such as "Precedent audit" no longer counts. A brief with no section is told both ways to start one, and brief-check names the brief path it tried. All 17 of the seat's wrong versions of the code turn a check red.

## Known bugs

Known bugs live one line each in `docs/known-bugs/`, one file per feature of the requirements tree, plus `docs/known-bugs/unplaced.md` for a line no feature owns. Desk known limits live in `apps/desk/README.md`.
