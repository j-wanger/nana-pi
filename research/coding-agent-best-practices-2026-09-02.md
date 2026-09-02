# Coding-agent best practices & scaffold stack (2026-09-02)

Third research pass, feeding the "shippable nana-pi" design (see
`../docs/shippable-nana-pi-options-2026-09-02.md` for the decisions this informs). Method:
three deep-research workflow runs with ALL subagents pinned to **Opus 4.8**, every claim
through 3-vote adversarial verification — run 1 agent practices (110 agents, 27 sources,
25 verified → 22 confirmed), run 2 scaffold stack (104 agents, 22 sources, 25 verified →
18 confirmed), run 3 code-organization gap lanes (110 agents, 27 sources, 25 verified →
18 confirmed). 324 agents total. Raw artifacts: `raw/deep-research-2026-09-02-*.json`
(+ matching `-journal.jsonl`).

Vote annotations `(3-0)` = unanimous adversarial survival. **The refuted-claims ledger in
§7 is load-bearing** — it lists things we must NOT cite even though they sound plausible.

---

## 1. Context files & repo navigation

- **Context rot is real and measured** (3-0, high): performance degrades as input grows
  across all 18 frontier models tested (Chroma, July 2025; replicated by Lost-in-the-Middle
  TACL, Adobe NoLiMa, ETH Zurich). Anthropic's mechanism: finite attention budget — target
  the *smallest set of high-signal tokens*, not maximal context.
- **Instruction files bloat and lose adherence** (3-0, medium): AGENTS.md/CLAUDE.md
  accumulate → rules conflict → adherence drops. Thoughtworks Radar Vol.34 put "agent
  instruction bloat" on **Hold**; ETH Zurich found AGENTS.md files *reduced* task success
  while adding ~20% inference cost. Converging practitioner ceiling: **~150-200 discrete
  instructions**. Refinement: the driver is instruction *count*, not byte position.
- **Nested per-folder AGENTS.md is spec-backed** (3-0, medium): agents.md spec — nearest
  file wins on conflict, explicit monorepo support. The "split past ~150-200 lines"
  threshold is a practitioner heuristic, not spec. Implementations diverge on merge:
  OpenAI Codex concatenates root→cwd; Cursor/spec = closest wins. (pi layers all ancestor
  AGENTS.md/CLAUDE.md walking up from cwd, with `AGENTS.override.md` to replace a layer —
  verified in installed pi 0.84.4 docs.)
- **JIT retrieval hybrid beats big indexes** (3-0, high): Claude Code's documented model —
  small context files pre-loaded, grep/glob just-in-time retrieval for everything else,
  lightweight identifiers over pre-computed indexes. Anthropic removed vector search in
  May 2025 (grep "outperformed everything. By a lot."). Guard: the sources recommend a
  *hybrid*, not pure JIT — small pre-loads are part of the pattern; the target is *large*
  pre-computed indexes.
- **Repo maps are token-minimal by design** (3-0, high): aider's map is a file+symbol
  listing under a ~1k default token budget so the model can decide what to open. It is NOT
  signature-level (that claim refuted 0-3).
- **Structural indexes are a tradeoff, not a free win** (3-0 but single-study, medium):
  tree-sitter/SCIP graph agents showed ~10x fewer tokens and 2.1x fewer tool calls but
  **83% vs 92% answer quality** on general queries (arXiv 2603.27277 — single-author vendor
  self-benchmark, n=1 judge, unreplicated). Grep-JIT vs semantic-index is a live,
  contested debate; treat index-heavy navigation as directional only.

## 2. Quality enforcement on agent-generated code

- **Deterministic gates in the loop are the documented pattern** (3-0, high): a pre-tool
  hard-block gate plus a checker-on-every-edit post-tool hook, with a block semantic the
  model cannot loosen (Claude Code's exit-2 overrides even an `allow` decision). The
  *mechanism* transfers to pi's `tool_call`/`tool_result` events; the API doesn't.
  Practitioner framing: "the deterministic shell around the probabilistic agent."
- **Agent-code bloat is measured but nuanced** (2-1, single study, Concordia May 2026):
  zero-shot LLM code showed 11 Long Methods vs 1 for human baseline (4 of 5 models over
  baseline). **Agentic generation shifted the smell profile to ARCHITECTURAL smells (God
  Class, too-many-branches), not Long Method** — so per-function caps and file/class-level
  modularity gates catch *different* failure classes, and an agent harness needs both.
- **What we can NOT claim** (see §7): that prompt guidance is useless against smells
  (refuted 1-2), or that code volume predicts architectural decay at rho=0.94 (refuted
  0-3). Net: file-length caps are justified by *mechanism + practitioner consensus*, not
  by proven defect-correlation empirics. Wire them as gates, but don't oversell the
  evidence.

## 3. Python scaffold consensus (high confidence, primary-doc backstopped)

- **uv** is the default bootstrap (3-0 ×4 sources): single binary replacing
  pip/pip-tools/virtualenv/pyenv/Poetry, auto-managed venv, ~8-10x cold / 80-115x warm
  faster than pip; surpassed Poetry in downloads ~April 2026.
- **Ruff for BOTH lint and format** (3-0 ×4): 900+ rules consolidating
  flake8/isort/pyupgrade/pydocstyle/bandit; formatter >99.9% Black-compatible.
- **src/ layout** (3-0, PyPA-backed): forces install-before-test, prevents accidental
  working-tree imports.
- **pyproject.toml as the single config surface** (3-0): [tool.uv]/[tool.ruff]/[tool.mypy]/
  [tool.pytest.ini_options]/[tool.coverage] — no setup.cfg/.flake8/mypy.ini.
- Single-vendor note: uv/ruff/ty share the Astral config pattern; **ty is still beta — NOT
  a scaffold default** (the "uv+ruff+ty" stack claim was refuted 0-3).
- **UNRESOLVED — do not hardcode as consensus**: the type-checker choice (mypy vs pyright
  vs ty). Both proposed split-strategies were refuted. nana-dev-kit pins mypy `strict`;
  that stays a conscious opinion, not community consensus.

## 4. TypeScript scaffold consensus

- **`strict: true` as umbrella** (3-0, official TS docs): equivalent to the whole
  strict-family; re-enumerating sub-flags on top was explicitly refuted as redundant.
  Layer complementary NON-family flags: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`.
- **Vitest as default runner** (3-0): zero-config ESM/TS/JSX; Jest ESM still experimental.
  Caveat: Vitest strips types to run — a separate `tsc --noEmit` typecheck step is still
  required.
- **UNRESOLVED — do not hardcode as consensus**: Biome vs ESLint+Prettier (claims refuted
  in BOTH directions). nana-dev-kit pins Biome; conscious opinion, revisit-able.

## 5. Scaffold maintenance: template drift is the real problem

(3-0, cruft primary docs.) Copy-paste generators leave projects with no path to absorb
upstream template changes; cruft/copier exist precisely for `update` (re-sync) and `check`
(CI drift gate). **Design implication: a project generator must treat generation as an
ongoing update relationship, not one-time emission** — generated projects should know
their template version and be able to diff against it.

## 6. Code-organization norms (run 3 — gap lanes)

### File/module size: caps are convention, complexity is where gating moved

- **What lint tools actually default to** (3-0, high, primary docs): ESLint `max-lines` =
  **300/file**; `max-lines-per-function` = **50** but OFF by default (in no recommended
  config). ESLint's own rationale: *no objective maximum exists; usual recommendations
  span 100-500*. Pylint `too-many-lines` (C0302) real default = **1000** lines/module.
- **The Code Climate successor (Qlty) gates on COMPLEXITY, not lines** (3-0, high):
  function complexity 15, file complexity 50 as the all-language defaults; raw line-count
  caps (250/25 in classic) were dropped from the gating smell set.
- **The empirics cut against naive line caps** (3-0, medium): Koru et al. (peer-reviewed,
  replicated) — defect proneness follows a power law with β<1, i.e. *smaller* modules are
  proportionally MORE defect-prone per line. Two guards: per-unit ≠ "large files safe"
  (bigger files still carry more total defects), and the data is human C/C++/Java
  2008-2014, pre-LLM. The opposing "200-400 LOC sweet spot" U-curve was REFUTED 0-3.
- **AI-code-specific caps exist only as blog-tier opinion** (3-0 descriptive, low):
  Python 150-500 LOC/file; ESLint 50/function + 250/file as "AI guardrails." The
  working-memory rationale behind the Python band was itself refuted.
- **Net for nana-pi**: line caps are a defensible *convention* (agents need a tripwire
  that forces decomposition), but pair them with complexity caps (C901/PLR, Qlty-style) —
  the measured agentic failure mode is architectural (God Class), which a line cap alone
  misses — and frame caps as feedback gates, not empirically-proven defect reducers.

### Folder structure: by-feature + colocation is the consensus

- **Colocation principle** (3-0, high, Dodds canonical + React FAQ): "place code as close
  to where it's relevant as possible."
- **Folder-by-feature over folder-by-type** (3-0, medium — blog-tier primary but
  uncontradicted, corroborated across ecosystems): a feature lives in one folder instead
  of being smeared across controllers/services/models/utils. "Starting a new project with
  any expectation of growth → start with modules."
- **Test placement is genuinely contested**: BOTH "separate top-level tests dir" AND
  "colocate tests with source" were refuted 0-3 as universal recommendations. pytest
  documents both. Pick per-language conventions consciously; don't cite a norm.
- **pytest specifics** (3-0, high): src layout "strongly suggested" under default import
  mode; discovery = `test_*.py` / `*_test.py`; importlib mode recommended for new projects.

### llms.txt: publish-side real, consume-side unconfirmed — skip for code repos

(3-0 publishing / 2-1 consumption, medium.) OpenAI, Anthropic, Gemini all publish it;
~36k instances by May 2026. But the spec only *intends* agent consumption; Ahrefs found
97% of files across 137k domains got ZERO AI requests, and Google says it doesn't consume
it. Not worth generating for a source repo today.

### Still unevidenced after three passes

Barrel files (index.ts re-export guidance), pnpm/monorepo/turborepo defaults, pre-commit
adoption norms, fixture organization. Treat as "not evidenced here," not "no consensus" —
decide these from first principles or tool docs when they bite.

## 7. Refuted / unresolved ledger (do NOT cite these)

- ✗ "Prompt guidance fails to reduce code smells (p>0.8)" — refuted 1-2.
- ✗ "Code volume predicts architectural decay, rho=0.94" — refuted 0-3 (kills the strong
  empirical case for hard file-length caps; mechanism case stands).
- ✗ "Aider repo map includes callable signatures" — refuted 0-3 (file+symbol listing only).
- ✗ "Scaffold uv + Ruff + ty as the standard stack" — refuted 0-3 (ty beta).
- ✗ "Enumerate tsconfig strict sub-flags alongside strict:true" — refuted (redundant).
- ✗ Biome readiness claims in both directions ("97% ESLint parity" AND "not ready") — both
  refuted; genuinely unresolved.
- ✗ "200-400 LOC is the defect-minimizing module size" (Hatton U-curve via TAOUP) —
  refuted 0-3.
- ✗ "pytest recommends a separate top-level tests dir over colocation" — refuted 0-3.
- ✗ "Test files should be co-located with the files they test" (as a universal norm) —
  refuted 0-3. Test placement has NO surviving universal norm.
- ✗ "The 150-500 LOC band is AI-working-memory-specific" — rationale refuted 0-3 (only
  the prescribed band survives, as opinion).
- ? Python type-checker default (mypy/pyright/ty) — no verified recommendation.
- ? Whether structural indexes beat grep-JIT at scale — single unreplicated study.
- ? Barrel files, pnpm/monorepo defaults, pre-commit norms — zero surviving claims across
  three passes.
