DONE — Independent check found no MUST findings.

Reviewed tip: `429671c5f67ff766bc091a992d5224ee0ebac41c`, against `2c0a3e4a`, including the main merge.

### NOTE — Upgrade removes only managed knowledge commands

Command:
```sh
node "$TMPDIR/seat-pull-off-independent.6uxpEj/check.mjs"
```

The independent harness exercised the real CLIs in six temporary homes.

| Settings shape | Output |
|---|---|
| Shell form | PASS |
| Quoted path with spaces | PASS |
| Exec form | PASS |
| Win32 through `NANA_SETUP_PLATFORM` | PASS |
| No hooks key | PASS |
| Machine never had the hook | PASS |

Every install exited 0 and retained six active hooks. Foreign commands, siblings, group metadata and preexisting empty groups survived unchanged.

Preservation checks compared serialized JSON bytes and order, not whole-file whitespace. Groups emptied by retirement disappeared. Repeated installs changed no settings bytes.

### NOTE — Doctor names remaining wiring and its fix

Command, before and after install:
```sh
node packages/nana-setup/bin/nana-setup.mjs doctor \
  --home "$TMPDIR/seat-pull-off-independent.6uxpEj/<case>"
```

Representative output:
```text
✗ settings UserPromptSubmit retired hook  retired hook still wired: node C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts hook — run `nana-setup install`
```

Each seeded case reported both remaining invocations. After install, every case had zero knowledge-hook rows.

Index and sources checks remained. Doctor still reported the fixture’s missing pi-subagents package; that failure was unrelated to retirement.

### NOTE — Uninstall retains its existing behavior

Command:
```sh
node packages/nana-setup/bin/nana-setup.mjs uninstall --yes \
  --home "$TMPDIR/seat-pull-off-independent.6uxpEj/<case>"
```

Output: all five POSIX cases exited 0. Each removed a reinserted historical checkout-owned shell entry while preserving foreign commands and siblings.

Forced win32 exited 2:
```text
uninstall is POSIX-only
```

Settings remained unchanged.

### NOTE — Explicit search works after install

Command, with `HOME` set to the search fixture:
```sh
node packages/nana-knowledge/bin/nana-knowledge.ts \
  query 'quasar retirement' --json
```

Output: exit 0; matching result `~/notes/independent.md`, titled `Quasar retirement`.

Install built the real SQLite index. Knowledge runtime and pi-extension files have no diff against the base.

### NOTE — Requirement and regression checks pass

Commands and output:

- `node packages/nana-setup/tests/seat-pull-off.test.mjs`: eight PASS, covering R-3739 through R-3746.
- `npm_config_prefix="$HOME/.local" node scripts/test.mjs settings-merge.test retired-artifacts.test checkout-converge.test doctor-detail.test install-check.test win32-hook-repair.test win32-degrade.test install.test`: 11 files PASS; 751 checks pass; zero failures.
- `node scripts/requirements-trace.mjs`: exit 0; zero off-form rows.
- `git diff --check`: exit 0.
- `git status --short`: empty.

The eight requirement rows match their tests. The eight retired rows retain their IDs and name this retirement.

The install-check diff removes only Claude knowledge dispatch and expectations. Pi-turn checks remain unchanged. No other behavior regression surfaced.

**Limits:** forced win32 is not native Windows execution. I did not rerun the model-backed install check.

I edited neither the repository nor the real home. Harness and normalized logs remain under `$TMPDIR/seat-pull-off-independent.6uxpEj/`.

Writing-check identifier warnings remain because this technical review requires commands, paths and revision IDs.

VERDICT: LAND
