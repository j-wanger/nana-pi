# Fable consult — the product-report plan, 2026-10-10 (seat adversarial consult; Fable 5.1)

*Fable challenged the first draft of `CHANGE.md`; the seat adopted its points (no accept command — the suite is the gate; no capability summary prose; per-row fingerprints over a feature's own and shared rows; three more rows). The plan reflects the revised draft.*

**Verdict: CHANGE — keep the shape, cut one command, fix the fingerprint, add three rows.**

**1. Split and subtraction.** The split is right: mechanical page, stored prose, deterministic gate. Two cuts. (a) Drop `--accept`. The committed `assessments.json` must be validated by the suite anyway (a hand edit bypasses any accept command), so the suite *is* the gate and `--accept` duplicates it. Refresh = write candidate into the file, run the report test, fix what it names. (b) Drop the capability `summary` prose; its content is counts, which the page renders live. Keep `decision` lines. Keep `--packets` (context shaping is the lever; cheap).

**2. Fingerprint.** Too lax as drafted. It hashes the `Also applies:` *line*, not the shared rows, yet assessments speak about shared rows ("four shared watchdog rows it relies on are untested"). A shared row flipping status leaves the lister's assessment "current". Hash: purpose, status, and for every home *and* shared row its `(id, requirement, status)`. Exclude evidence (churns on test renames) and heading labels. Store per-row hashes, not one digest: same function, and the page/packet can then name *which* rows changed, which makes refresh targeted. Normalize CRLF and trailing whitespace before hashing — today's lesson, and `parseLedger` splits on `\n` with no `\r` handling, so a Windows autocrlf checkout gives different digests (or zero tables). Record the tree checker's CRLF gap as a residual.

**3. Acceptance check.** It guarantees scope, currency, schema, enum values, and ID-free prose — nothing about truth. The corrections list shows the fact-checkers mostly caught wrong feature *names*; no regex catches that, so the brief keeps a checker pass and each assessment carries structured provenance (`written_by`, `checked_by`, `date`). "Counts in prose are uncheckable" — subtract the problem: ban numerals in prose fields (43 prose fields carry them today), render counts from data. Add one consistency floor: a feature with violated or untested rows cannot read `solid`.

**4. Sources.** Canonical only: keep. Audit issues into Open questions: separate lane (ledger edit, the owner picks the confirmed ones). HANDOFF parsing: don't write a second regex — `nana-frontier` already pins the `[kind, since date]` grammar at line 135; export that grammar from a lib both use.

**5. Both seats.** Works: Node only, no workflow tool. Commit the single-model loop as the brief (packet → candidate → test → fix), with a second model as checker "when available"; the 17-agent run is not the feature. Publishing differs: Artifact republish only from Claude Code; from pi "publish" means open the file. Say so in the README entry.

**6. Output.** Gitignored stable path: fine, but `.nana/` is a new dot-dir with no other tenant; name its second tenant or use an existing folder. Fonts: a CDN link is fine; state the page reads without network (fallback fonts). Determinism: stamp commit hash and commit date, never wall clock, so one commit yields identical bytes. Keep the `&lt;` → `\u003c` escape from today's build.

**7. Rows.** R-1002 bundles three clauses; "no model call" is unpinnable. Replace with a reproducibility row (two builds at one commit are byte-identical). Split R-1006 into one row per refusal class (plus numerals), reworded as suite failures. Missing rows: the page states commit and dirty state; ledger text renders as text (mutation: `&lt;/script&gt;` in a cell); fingerprints equal for LF and CRLF ledgers.

**8. Queue.** Outside the appetite, so the owner amends the line or queues it. Place it after the land rule and before the Windows runner. Note at checkpoint 1: the 10-05 ruling holds HTML decision pages until 10-18; today's ask either lifts it or doesn't — one line. Interim now: commit `assess.json` and the template as a dated record (the expensive, non-reproducible parts, ~150 KB), not the page or the scratch-coupled extractor.

**One change I'd insist on:** the fingerprint covers shared rows' text and status, normalized for line endings — otherwise the feature fails at its own purpose, silently stale.

**Claim most likely wrong:** that excluding the evidence cell never hides a meaning change; some maturity prose reads evidence ("one test exercises the separator rule through the launcher").