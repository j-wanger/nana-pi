## Findings

### MUST — R-858 is marked implemented even when its evidence never runs

**Files:** `REQUIREMENTS.md:423`, `packages/nana-pack/tests/templates-render.test.mjs:213-282`

The rail finds static `req:` markers regardless of runtime skips. The template test exits successfully when Copier, Ruff, or Biome is unavailable.

I proved this with a PATH containing only Node:

```text
SKIP typescript: renders and the code map checks
SKIP python: renders and the code map checks
all passed
exit=0
```

Even when available, the cited checks run `uvx ruff` and `pnpm dlx @biomejs/biome`, not the rendered projects’ own installed commands. They therefore do not fully assert “its own lint and format gates.”

On this machine the checks did run, and regressions would be caught here. However, availability elsewhere changes an asserted contract into a silent skip while the rail still reports R-858 implemented.

**Smallest fix:** either make missing required tools fail and run the rendered projects’ actual gates, or return R-858 to `untested` with the manual fresh-render evidence. The latter matches the original brief’s permitted fallback.

### MUST — The canonical shared instructions still make false categorical claims

**Files:** `templates/_shared/working-under-nana-pi.md:30-58`, byte-copied into `AGENTS.md`

R-859 correctly proves the two files are byte-identical, but it cannot detect drift from implementation. Several sentences conflict with code:

- Line 30 says every session receives an objective. `nana-objective.ts:71` skips injection when user-scope `objective.enabled` is false.
- Line 40 says compaction writes the fixed handoff store. `nana-handoff.ts` uses configured `handoff.path` when present and honors `handoff.enabled: false`. The hash is over canonical cwd, case-folded on Windows, not literal cwd.
- The same unqualified fixed-store claim appears in `packages/nana-pack/README.md:593-600`, despite its later custom-path section.
- Line 50 promises a desktop notification. `nana-notify.ts` permits `notify.enabled: false`, suppresses headless notification by default, and can only fall back in-app when an OS notifier fails.
- Line 53 claims “pi auth” is protected generally. R-058 already records that `auth.json` under a relocated active agent directory is not protected.
- Line 57 says policy files are caught through edit/write in every path form. `gate-paths.ts` records symlink targets only for user/default-agent policy files; the project-policy symlink-target gap remains carried in `HANDOFF.md`.
- The claim that gate loosening always waits for session start or reload omits the deliberate live clearing of a malformed-config stop after repair.

These instructions ship to every generated project, making the inaccuracies consequential.

**Smallest fix:** qualify the objective, handoff, and notification paragraphs as defaults; document `handoff.path`; name the relocated-auth and project-policy-symlink gaps; and narrow the gate-loosening sentence to ordinary valid policy changes.

### SHOULD — The pi 1.0 addendum has two factual inaccuracies

**File:** `research/pi-landscape-2026-09-01.md:383-408`

- Line 406 says `nana-setup doctor` reads `!` below pi-subagents 0.75.0. `doctor.mjs:318-321`, R-364, and the setup README all say it reads failure, rendered as `✗`.
- Line 383 describes MCP tool names only as sanitized `mcp__<server>__<tool>`. Pi’s installed `docs/mcp.md` and `dist/extensions/mcp/tools.js` add a hash suffix for colliding sanitized names and overlong names.

**Smallest fix:** change `!` to `✗`, and mention collision/length hash suffixes.

### SHOULD — The edited Part G introduction retains a stale module count

**File:** `REQUIREMENTS.md:1047-1053`

The layer-exempt correction is accurate, but the same edited paragraph still says “73 modules in all.” I loaded the real code-map graph: 172 mapped modules, comprising 77 non-test modules and 95 test modules.

**Smallest fix:** replace 73 with 77, preferably generated from the map rather than maintained manually.

### NOTE — The shared TypeScript impact command adds a bogus path

**File:** `templates/_shared/working-under-nana-pi.md:129`

I ran the documented command:

```text
pnpm map:impact -- src/index.ts
```

It invokes:

```text
node scripts/code-map.mjs --impact -- src/index.ts
```

The output reports `-- [NOT A MAPPED MODULE]` before correctly reporting `src/index.ts`.

**Smallest fix:** document `pnpm map:impact src/index.ts` without the extra `--`.

## Verified successfully

- Fresh Python and TypeScript templates rendered from branch `HEAD`.
- Python: `uv sync`, Ruff check, Ruff format check, and pre-commit all passed. I initialized Git before pre-commit because Copier does not do so.
- TypeScript: `pnpm install` and `pnpm check` passed, including 52 tests.
- Scoped-ignore probes remained strict:
  - a user Python file with an ambiguous dash failed RUF003;
  - a user TypeScript function at complexity 16 failed Biome’s limit of 15.
- The template suite ran Ruff and Biome on this machine rather than skipping them.
- `npm test`: 95/95 files passed, 5,780 checks passed, four internal skips.
- `npm run map:check`: 172 modules, zero problems.
- `npm run readme:check`: 553 claims, zero problems.
- Requirements trace: 797 rows, 510 implemented, zero rows off form.
- R-859’s mirror test passes and its one-byte mutation fails the predicate. It proves byte mirroring, not semantic correctness.
- Installed pi reports 1.0.2.
- The remaining MCP claims—configuration scopes, exposure modes, `registerMcpServer`, `--no-extensions`, explicit `builtin:mcp`, and `structuredContent` behavior—match installed pi 1.0.2 docs and source.
- The desk MCP limitation and corrected `dist/core/mcp-servers.d.ts` citation are accurate.
- The README Install/Test move preserved section content except for the newline transferred at the moved boundary.
- The handoff store’s default location really is fixed outside `PI_CODING_AGENT_DIR`; only the missing custom-path qualification is wrong.
- `HANDOFF.md` remains untouched, as required.

Score: 6/10.

VERDICT: BLOCK
