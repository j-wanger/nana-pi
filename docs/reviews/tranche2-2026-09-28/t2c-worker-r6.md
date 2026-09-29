**Commit:** `3409023` on `lane/t2c-provenance-label`, not pushed.

**Disagreement reproduced before the fix:** I put an affirmative record in `ro/trust.json` and made the folder `0555` with `PI_CODING_AGENT_DIR=ro`. Our `trustRecord` returned `{"vouched":true,"problem":null}`, so no label. pi's `get()` threw `EACCES … mkdir '…/ro/trust.json.lock'`, so pi treats the project as untrusted.

**Fixed:** `trustRecord()` now runs the round-4 `writeProblem` check before looking at `vouched`. A folder problem ("folder not writable" or "path is not a folder") means not vouched, whatever the store holds. After the fix the same script gives `vouched:false, problem:"folder not writable", object:<ro>`. Once the folder is writable again, both we and pi say `true`. New test T14 checks that pi's `get()` throws in this case, that we label it with the folder remedy, and that the label clears once the folder is writable. Run against the pre-fix `objective.ts`, those checks FAIL.

**Remedy shown for this case:** "…pi's trust store belongs at S, but the folder O is not writable (another owner, its permissions, or a read-only volume), so /trust cannot record a decision — make that folder writable first (this may need rights you do not have), then start pi in <dir> itself (not a subfolder), run /trust there, and restart the session."

**`objectivePath()`:** the default and relative paths now resolve through `piAgentDir()`. What changes: with `PI_CODING_AGENT_DIR` set, a null `objective.path` now reads `<override>/nana-objective.md`, and a relative path resolves under the override, where both used `~/.pi/agent` before. With the variable unset, or with the seeded `"~/.pi/agent/nana-objective.md"` (a `~/` path, not default), nothing changes. Test T15 pins this, and both runtimes print byte-identical output. I updated the docs in `config.ts`, the extension header and the README.

**`npm test`:** exit 0. 71 files: 70 PASS, 0 FAIL, 1 SKIP; 4262 checks pass, 0 fail, 6 skip.

**Residuals:**
- A store file that is read-only in a writable folder still vouches, because pi's lock lives in the folder and its `get()` reads the `true` (pinned by a test).
- `nana-setup` still seeds `nana-objective.md` under `~/.pi/agent`, not the override. I left it alone as out of scope.
- `config.ts` may still read `nana-pack.json` from the default dir. I didn't check.

**Claim most likely wrong:** that "folder not writable" matches pi's lock failure in every case. I only checked `W_OK|X_OK` on the nearest existing folder, and only on macOS as non-root. ACLs, a read-only volume, or root could make the two diverge.

VERDICT: DONE
