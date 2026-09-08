---
name: adopt-structure
description: Add the nana-pi agent-navigation layer to an EXISTING project of ANY language — a coherent root AGENTS.md, lean per-folder AGENTS.md files, and a starter .pi/nana-pack.json. Pure docs; no language stack, no copier, no source/config/CI changes. Use when the user wants the nana AGENTS.md navigation structure without adopting a language toolchain (that's adopt-py / adopt-ts).
---

# Add the nana navigation layer to an existing project

Give a real project the agent-navigation layer pi relies on: a lean root
`AGENTS.md`, a one-screen `AGENTS.md` in each major folder, and a starter
`.pi/nana-pack.json` on-ramp for the post-edit gate. Language-agnostic and
documentation-only — this NEVER touches source, language configs, or CI, and it
does not run copier or create a template-update relationship. For the pinned
toolchain overlay (pyproject/tsconfig, gates wired, `copier update`), use
`adopt-py` / `adopt-ts` instead; the two are complementary.

## Hard rules

- The ONLY files this skill writes are `AGENTS.md` files and one
  `.pi/nana-pack.json`. Never edit or create source files, language/build
  configs (pyproject, package.json, tsconfig, biome, ruff…), lockfiles, or CI.
- Derive every doc from the folder's REAL contents — read before you write. No
  invented structure, no aspirational rules.
- Safe on re-run: if a file already exists, RECONCILE (refresh what's stale,
  keep what's still true, fold in hand edits) — never clobber.

## Steps

1. **Scan the tree.** List the top-level folders and identify the major source
   folders (skip `node_modules`, `.git`, `dist`/`build`, `.venv`, vendored
   deps). Note the project name and its one-line purpose (from an existing
   README / AGENTS.md / package manifest — read, don't guess). Detect any
   existing `AGENTS.md` / `CLAUDE.md` / `AGENTS.override.md` files to fold in.

2. **Root `AGENTS.md`** — author or refresh it, lean (< 150 lines), three parts:
   - **Header**: `# <project name>` + one line of purpose.
   - **Layout**: one line per major top-level folder, derived from the real
     tree, each pointing at its folder's `AGENTS.md` where one exists.
   - **The canonical "Working under nana-pi" section** — see step 4. If a root
     `AGENTS.md`/`CLAUDE.md` already exists, merge its project-specific content
     into Header/Layout and any project "Rules"; do not drop hand-written rules.

3. **Per-folder `AGENTS.md`** — walk each major source folder and give it a lean
   one (one screen max), derived from what's actually in the folder:
   - purpose (what changes together here), key files/subfolders, and local rules
     that genuinely apply (conventions, entry points, "don't do X here").
   - Write each to stand alone as an on-demand read: pi layers only cwd + ancestors,
     so a session at the repo root does NOT auto-load a subfolder's `AGENTS.md` —
     its rules must make sense when read directly.
   - Skip folders whose purpose is obvious from the name and that carry no local
     rule. Reconcile existing files rather than overwrite. Mirror the terse
     style of the folder-level examples the templates ship.

4. **Canonical section — copy from the single source, do not re-derive.** The
   "Working under nana-pi" section has ONE source of truth:
   `templates/_shared/working-under-nana-pi.md` in the nana-pi template source
   (the same source this pack was installed from). Copy that file's contents
   VERBATIM into the root `AGENTS.md` — scaffolded projects emit the identical
   block, and the whole point is that adopted and scaffolded projects read the
   same. Do not paraphrase or hand-write it. If that file is not reachable on
   disk, lift the exact text instead by rendering a throwaway scaffold and
   copying the `## Working under nana-pi` section out of its `AGENTS.md`:

   ```bash
   uvx copier copy --defaults --data language=python --data project_name=_tmp https://github.com/j-wanger/nana-pi.git /tmp/nana-canon && sed -n '/## Working under nana-pi/,$p' /tmp/nana-canon/AGENTS.md
   ```

5. **Starter `.pi/nana-pack.json`** — the post-edit on-ramp. FIRST check `~/.pi/agent/nana-pack.json`: if the user
   already has user-scope `postEdit.commands`, do NOT write this starter —
   project config replaces user config per key-group, so a project `postEdit`
   block would SHADOW their global checks in this project; say the global checks
   stay active and skip the file. Otherwise, if no project config exists, write this
   starter at the project root. It is a SAFE on-ramp: the post-edit
   `match` matches no real path and the `run` is an obvious placeholder, so
   **nothing runs until the user replaces them** with their real toolchain. The
   starter carries ONLY `postEdit` — omit the `gate` and `handoff` keys on purpose:
   they default correctly, and empty project arrays / `handoff.enabled` would only
   shadow the user's user-scope gate patterns or re-enable a globally-disabled
   handoff in this one project.

   ```json
   {
     "postEdit": {
       "commands": [
         { "match": "(?!)", "run": "your-formatter {file}" }
       ]
     }
   }
   ```

   `(?!)` is a regex that matches nothing, so post-edit stays inert until the
   user swaps it for a real path regex (e.g. `\.py$`) and sets their command.

   If a `.pi/nana-pack.json` already exists, RECONCILE — leave a user-defined
   `postEdit.commands` and any gate/handoff settings untouched; only add the
   `postEdit` placeholder if it is missing. Never overwrite real commands with the placeholder. Tell the
   user where to fill in their real `match`/`run`, and that this file takes effect
   **only in a trusted project** (pi's project-trust gate) — an untrusted repo's
   **project** config is ignored, though any user-scope `~/.pi/agent/nana-pack.json`
   commands still run.

6. **Report** — list the `AGENTS.md` files written/refreshed and whether the
   `.pi/nana-pack.json` was created or reconciled. Point the user at the one edit
   they still owe: replacing the post-edit placeholder with their formatter/linter.

## Notes

- This skill is auto-discovered: the pack's `package.json` registers `./skills`,
  so a `SKILL.md` under `skills/adopt-structure/` is picked up with no other
  wiring — nothing to add to any manifest.
- No `.copier-answers.yml` is written — this is not a template adoption, so
  `copier update` does not apply. Layer `adopt-py` / `adopt-ts` on top later if
  the project also wants the pinned toolchain.
- Keep the root lean. Deep or folder-specific rules belong in that folder's
  `AGENTS.md`, which pi layers closest-wins.
