# pack-config-utf16 — plan attack (one adversary)

Verdict: AMEND

The plan holds; the amendments are small. The amended plan, brief and rows below are what gets built.

Probes ran on main 6f0098a8 in a throwaway clone under temporary homes with made-up names. I applied the plan's candidate change in that clone only, and then deleted the clone. Nothing was left running.

What the probes confirmed:
- R-2230, the gate (P1). On main, a UTF-16LE or UTF-16BE nana-pack.json stops every gated tool in a fresh pi, `ls` included, with "gate block is malformed … invalid JSON". The UTF-8 file blocks only `terraform destroy`. With the candidate, both UTF-16 files behave exactly like UTF-8. This is the biggest harm: one PowerShell 5.1 `>` disables every gated tool in pi, so the lane is worth building.
- R-2231, the objective producer (P2). On main, a UTF-16LE `objective.enabled:false` still prints the objective block plus the config-failure line, so the owner cannot turn the objective off. With the candidate it prints nothing.
- R-2232, the roster (P3). On main, `nana-roster --json` and `set` both refuse. With the candidate, the --json output for UTF-16LE matches UTF-8. The file `set` writes is byte-identical across the two inputs, and `.bak` keeps the original FF FE bytes.
- R-2233, doctor (P4). On main, the pi nana-pack.json row is ✗, projectFile falls back to its default and the objective file is ✗. With the candidate all three rows match UTF-8.
- R-2235, adoption (P6). On main, adoptionSettings falls back to the default journal and OBJECTIVE.md. With the candidate it reads the configured journal and GOALS.md.
- R-2236, unparseable shapes (P7). I tested six shapes: LE with no mark, BE with no mark, LE with two marks, BE with two marks, LE plus one byte, BE plus one byte. All six print the config-failure line with the manual repair, on main and with the candidate. Removing the odd-count check lets LE plus one byte parse, because Buffer's utf16le decoder silently drops the extra byte. BE plus one byte still fails without the check, because swap16 throws a RangeError, which every reader's catch already handles.
- I did not re-run P5. The R-2234 claim rests on reading the code: project.mjs:683 and readPiPackConfig, which project.mjs calls at lines 380 and 667.

Completeness: seven readers are the full set of nana readers of nana-pack.json, apart from the frozen desk and install-check. The roster-notice hook, its extension, pi-worker and pi-review all go through resolveRoster. Every pi extension goes through config.ts readConfigFile.

Lane class: install, hook or gate is right. The change reaches the gate's config read, doctor, install's objective seed, and the roster that pi-worker and pi-review read.

Amendments:
1. R-2232's row "treat it exactly as" was vague and wider than its test. It is now byte-identical --json output and a byte-identical file written by `set`. I probed that this holds.
2. R-2236's row covered BE, but its test did not. The test now has six shapes, including BE with two marks and BE with an odd byte count.
3. Two likely builder mistakes are added as wrong code:
   - slicing the two mark bytes before decoding, which strips two marks;
   - TextDecoder's default ignoreBOM:false, which also strips two marks.
   I confirmed TextDecoder strips one mark by default. Both make R-2236 go red.
4. Every child process the tests start sets HOME, USERPROFILE and PI_CODING_AGENT_DIR to the temporary home. The `set` child also drops PI_SESSION_ID, which is how nana-roster-set.test.mjs builds its environment. Two reasons:
   - `set` refuses inside a pi model shell, so R-2232 would fail under pi-worker.
   - An inherited agent dir would let `set` rewrite a real file outside the temporary folder.
   config-gate-fallback's freshProcess sets only HOME and USERPROFILE, so copying it as-is is not enough.
5. R-2237: one PowerShell run writes both files, and the JSON stays on one line under 80 characters, because Out-File formats to the host width. The row text drops its status parenthetical, which belongs in the status and evidence columns.
6. The Done list adds install.test.mjs, because it holds R-1581, which uses the same readPiPackConfig. The npm-prefix workaround goes in the shell that runs the test, never in the test file.

Conflicts: main is now a112fd30, because notify-lifecycle-pins and mutation-runner-takeover-race have landed. This lane does not edit the same lines as any in-flight lane. checkout-spelling-converge changes only linkSkill in steps.mjs, at line 297. The overlaps in REQUIREMENTS.md, the pack README, code-map and requirements-tree are only merge conflicts in generated or shared files. gate-rm-bare-repo is probably in gate-rm-inside.ts, not config.ts. If install-link-race adds imports to steps.mjs, the two will touch the same import block; merge main before the final review. Nothing has to wait.

Most likely wrong: R-2237 on the Windows CI leg. That Windows PowerShell 5.1's Out-File and `>` write FF FE comes from its documentation and was not run. Next after that is that the owner's failing file is UTF-16 at all, since nobody has seen it.
