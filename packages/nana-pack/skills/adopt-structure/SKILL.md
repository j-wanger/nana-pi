---
name: adopt-structure
description: Add the nana-pi agent-navigation layer to an EXISTING project of ANY language — a coherent root AGENTS.md, lean per-folder AGENTS.md files, a starter .pi/nana-pack.json, and the three frontier seeds (OBJECTIVE.md, HANDOFF.md, docs/sessions/) when absent. Pure docs; no language stack, no copier, no source/config/CI changes. Use when the user wants the nana AGENTS.md navigation structure without adopting a language toolchain (that's adopt-py / adopt-ts).
---

# Add the nana navigation layer to an existing project

Give a real project the agent-navigation layer pi relies on: a lean root
`AGENTS.md`, a one-screen `AGENTS.md` in each major folder, a starter
`.pi/nana-pack.json` on-ramp for the post-edit gate, and — only when they are
missing — the three files a session here is steered by: `OBJECTIVE.md`,
`HANDOFF.md` and `docs/sessions/README.md`. Language-agnostic and
documentation-only — this NEVER touches source, language configs, or CI, and it
does not run copier or create a template-update relationship. For the pinned
toolchain overlay (pyproject/tsconfig, gates wired, `copier update`), use
`adopt-py` / `adopt-ts` instead; the two are complementary.

## Hard rules

- The ONLY files this skill writes are `AGENTS.md` files, one
  `.pi/nana-pack.json`, and the three frontier seeds of step 6 (`OBJECTIVE.md`,
  `HANDOFF.md`, `docs/sessions/README.md`) **when they are absent**. Never edit or
  create source files, language/build configs (pyproject, package.json, tsconfig,
  biome, ruff…), lockfiles, or CI.
- Derive every doc from the folder's REAL contents — read before you write. No
  invented structure, no aspirational rules.
- Safe on re-run: reconcile existing `AGENTS.md` files (refresh what's stale,
  keep what's still true, fold in hand edits) — never clobber them. Existing
  frontier seeds are never overwritten; resolve `OBJECTIVE.md` ratification as
  described in step 6.

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
   `../../../../templates/_shared/working-under-nana-pi.md` relative to this skill directory. Copy that file's contents
   VERBATIM into the root `AGENTS.md` — scaffolded projects emit the identical
   block, and the whole point is that adopted and scaffolded projects read the
   same. Do not paraphrase or hand-write it. Only when this canonical path is absent on
   disk may you render a throwaway scaffold and copy the `## Working under nana-pi`
   section out of its `AGENTS.md`.

   Render it with **this project's real name**, not a dummy: copier substitutes
   `<name>` in the step-6 seeds at render time, so a throwaway named `_tmp` would
   seed `# Objective and current priority — _tmp`. With the real name, the seeds
   come out of the render already correct and step 6 fills only `<date>`.

   **The name is DATA — put it in an environment variable, never in the command
   text.** A project called `$(rm -rf ~)` or `` `whoami` `` pasted into a command
   line is executed by the shell, and a name containing a quote corrupts the
   argument; assigning it once, in single quotes, and expanding that variable into
   the `--data` argument passes it through as one literal value. (A name with a
   single quote in it is typed `'\''` in bash and doubled `''` in PowerShell.)

   Separate commands on purpose — `&&` breaks in Windows PowerShell 5.1 — and
   `node` instead of `sed`, which a native Windows shell does not have.
   macOS / Linux:

   ```bash
   NANA_PROJECT_NAME='<the project name>'
   uvx copier copy --defaults --data language=python --data project_name="$NANA_PROJECT_NAME" https://github.com/j-wanger/nana-pi.git /tmp/nana-canon
   node -e "const s=require('fs').readFileSync('/tmp/nana-canon/AGENTS.md','utf8');const i=s.indexOf('## Working under nana-pi');if(i!==-1)process.stdout.write(s.slice(i))"
   ```

   Windows PowerShell (in cmd use `"%TEMP%\nana-canon"` — quoted — for the destination; the
   `node -e` line is identical in both shells):

   ```powershell
   $env:NANA_PROJECT_NAME = '<the project name>'
   uvx copier copy --defaults --data language=python --data project_name=$env:NANA_PROJECT_NAME https://github.com/j-wanger/nana-pi.git $env:TEMP\nana-canon
   node -e "const s=require('fs').readFileSync(process.env.TEMP + '\\nana-canon\\AGENTS.md','utf8');const i=s.indexOf('## Working under nana-pi');if(i!==-1)process.stdout.write(s.slice(i))"
   ```

   Delete the throwaway scaffold afterwards — it is outside the project on
   purpose, so the "only these files" hard rule above still holds. The same
   throwaway render also carries the step-6 seeds, so one render serves both.

5. **Starter `.pi/nana-pack.json`** — the post-edit on-ramp. FIRST check the user-scope config — `$PI_CODING_AGENT_DIR/nana-pack.json` when
   `PI_CODING_AGENT_DIR` is set, else `~/.pi/agent/nana-pack.json` (that is the one the pack
   reads; a file in the other location is ignored): if the user
   already has user-scope `postEdit.commands`, do NOT write this starter —
   project config replaces user config per key-group, so a project `postEdit`
   block would SHADOW their global checks in this project; say the global checks
   stay active and skip the file. Otherwise, if no project config exists, write this
   starter at the project root. It is a SAFE on-ramp: the canonical starter is `{"postEdit":{"commands":[]}}`;
   nothing runs until a command is added. Its shape is in the pack README Config section. The
   starter carries ONLY `postEdit` — omit the `gate` and `handoff` keys on purpose:
   they default correctly, and empty project arrays / `handoff.enabled` would only
   shadow the user's user-scope gate patterns or re-enable a globally-disabled
   handoff in this one project.

   ```json
   {"postEdit":{"commands":[]}}
   ```

   Post-edit stays inert until a real command is added.

   If a `.pi/nana-pack.json` already exists, RECONCILE — leave a user-defined
   `postEdit.commands` and any gate/handoff settings untouched; only add the
   `postEdit` placeholder if it is missing. Never overwrite real commands with the placeholder. Tell the
   user where to fill in their real `match`/`run`, and that this file takes effect
   **only in a trusted project** (pi's project-trust gate) — an untrusted repo's
   **project** config is ignored, though any user-scope `nana-pack.json` commands (the one in pi's
   active agent dir, as above) still run. The folder-trust step is `nana-setup trust <dir>`; do not direct the user to `/trust` in pi.

6. **The three frontier seeds — only when absent.** A project the pack can
   actually run a session in needs `OBJECTIVE.md` (what session start prints and
   scores the session against), `HANDOFF.md` (the frontier) and `docs/sessions/`
   (the narrative). They come from the SAME single source as step 4 —
   `../../../../templates/_shared/OBJECTIVE.md`, `../../../../templates/_shared/HANDOFF.md`,
   `../../../../templates/_shared/docs/sessions/README.md` — copied VERBATIM, with the same
   throwaway-render fallback when that directory is not on disk. Which source you
   used decides what is left to fill:

   - **from `templates/_shared`** — fill `<date>` with today's date (`YYYY-MM-DD`)
     **and** `<name>` with the project name.
   - **from the throwaway render** — copier already substituted `<name>` (that is
     why step 4 renders it with the real project name), so fill only `<date>`.
     Check the first line reads `# Objective and current priority — <the project>`
     before you copy it in; if it names a dummy, you rendered with the wrong name.
   - The seed step never replaces an existing file. An existing `OBJECTIVE.md`
     whose objective and current-priority lines contain the owner's words is
     already ratified. If either line is a seeded placeholder or DRAFT, ask the
     owner for both lines, then replace only those seeded placeholder lines and
     their DRAFT suffix with the owner's words. Leave owner-written lines
     unchanged; never infer that placeholders are ratified.
   - For a newly copied `OBJECTIVE.md`, ask the owner for one objective line
     and one current-priority line. Write only the owner's words over the two
     placeholders and DRAFT suffix, fill `<date>`, and never invent either
     line. If the owner defers, leave the DRAFT lines and say so in the handover.

   **First two steps:** after seed handling
   1. Ratify `OBJECTIVE.md`: ask the owner for one objective line and one current-priority line; write their words only over seeded placeholder lines and their DRAFT suffix, leave owner-written lines unchanged, and never invent words.
   2. Trust the folder: `nana-setup trust <dir>`.

   `nana-setup project <dir>` is a broader alternative outside this skill's hard rule. It also runs `git init`, writes an AGENTS.md stub and CLAUDE.md link when neither exists, refreshes a marked AGENTS.md region, seeds `.pi/nana-pack.json`, writes the month log and refreshes the knowledge index.

7. **Run the requirements audit mode — before the report, not after it.** What
   the audit finds is the most important thing the report carries, and a report
   written first would describe a project whose promises are still unknown. The
   navigation layer tells an agent where things are; it does not say what the
   project promises. Offer the `requirements` skill's audit mode: extract EARS
   rows from the design docs, `HANDOFF.md` and the test suite with read-only
   workers, add the standard `Part G` engineering block, place the `req:`
   markers, then do the conflicts + failing-now pass with each conflict carried
   in `Open questions` naming whose call it is. This skill writes no
   `REQUIREMENTS.md` itself — it is not one of the files the hard rule above
   permits.

8. **Report** — list the `AGENTS.md` files written/refreshed, the seeds created
   vs. left alone (and, when you used the fallback render, that the seeds carry
   this project's name and today's date), whether the `.pi/nana-pack.json` was
   created or reconciled, and what the audit left behind (rows drafted, conflicts
   open, rows that are honestly `violated`). Tell the user whether the empty
   post-edit list needs real commands.

## Notes

- This skill is auto-discovered: the pack's `package.json` registers `./skills`,
  so a `SKILL.md` under `skills/adopt-structure/` is picked up with no other
  wiring — nothing to add to any manifest.
- No `.copier-answers.yml` is written — this is not a template adoption, so
  `copier update` does not apply. Layer `adopt-py` / `adopt-ts` on top later if
  the project also wants the pinned toolchain.
- Keep the root lean. Deep or folder-specific rules belong in that folder's
  `AGENTS.md`, which pi layers closest-wins.
