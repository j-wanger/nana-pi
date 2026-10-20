# post-edit-timeout-name — plan attack (one adversary)

Verdict: AMEND

I probed every claim in the plan and it holds up. The amendments make it sharper; they do not change the design. I ran the probes in a temp export of main 445f4d5b, using the plan's exact test file and build. The real repo stayed untouched. I wrote one stray file into a pre-existing /tmp/x folder by mistake and removed it.

(1) Red today: confirmed. R-2150 fails with {"retuned":false,"recorded":[30000]} and R-2151 fails with undefined, exit 1. After the build both pass, and the canonical runner reports 2 pass in 0.6 s.

(2) The lane is worth more than the plan says. Probe: change the default to `c.timeoutMs ?? 0`, which arms no deadline, so a hung checker hangs the turn. All six test files that import the extension (display-surfaces, post-edit-file-queue, post-edit-hardening, post-edit-status, post-edit-utf8, config-handlers-malformed) stay at 0 FAIL. Today no test pins the 30-second default. R-2150 turns that change red. The feature sentence now leads with this promise to the user.

(3) Wrong code, re-probed. W1 records [30000], W2 and W3 record [], W4 shows 20000 and W6 records []: each turns the named check red. W5 turns post-edit-status red on R-1702 and the three R-095 checks. New case W7, `c.timeoutMs || NAME`, passes R-2150, but the existing R-1702 check goes red, so the existing rows cover it.

(4) Done was too narrow. post-edit-file-queue.test.mjs loads the extension through pi's own bundled loader, so it is the proof that the new lib import resolves under pi. With the build it passed 5 of 5. The other blast-radius files also pass with the build: display-surfaces 181, config-handlers-malformed 98, hardening 22, utf8 4, status 32. Done now lists all six.

(5) The seat steps are now concrete. The roster's land model is astra, so the seat writes no seat-land.md. Install-check is warranted on evidence, not just inferred from the rule: its pi session item loads the installed pack's extensions.

(6) Subtraction test. Checking the imported value against the live name would be simpler, but W1, the literal kept in place, would pass it, and W1 is the exact defect this lane removes. So the copy-and-retune check earns its roughly 15 lines.

(7) Class hook is right, because the build changes a pi extension. Rows R-2150 and R-2151 are no wider than their tests. The trace exits 0 with 0 rows off form, and a renamed title makes the trace name the mismatch. The tree and code map regenerate with 0 problems. The provenance is confirmed: git shows the 30_000 literal arrived in the pack's first commit, e1171002 on 2026-09-01. Neither post-edit-status nor the new file is on the Windows skip list, and CI runs Node 22 on all three legs.

(8) No conflicts. No branch in flight touches nana-post-edit.ts, the post-edit tests or a pack post-edit-config module. The R-2150s IDs are unused. The only shared files are REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md, which the builder regenerates after merging main.

The claim most likely wrong: the copy-and-retune check passes on the Windows leg. I proved it on this Mac only. The same setTimeout recorder already passes there in the R-1702 check, but the copy into the temp folder and the import of the copied .ts are unproven on Windows.
