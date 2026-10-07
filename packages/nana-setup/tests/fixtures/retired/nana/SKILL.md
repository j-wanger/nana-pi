---
name: nana
description: "Show installed nana-dev-kit skills grouped by module. Use when the user asks what skills are available, what the kit can do, or wants a quick reference."
---

# nana — Skill Discovery

Show all installed skills with descriptions, grouped by module.

## Procedure

1. **Locate MANIFEST.** Read `~/.claude/.nana-dev-kit-path` to get the kit source directory. Construct the MANIFEST path: `<kit-path>/templates/.claude/skills/MANIFEST`. If the kit path marker is missing, fall back to listing `~/.claude/skills/*/SKILL.md` directory names without descriptions.

2. **Parse descriptions.** Read the MANIFEST file. Extract lines matching `# <skill-dir>: <description>` (comment lines starting with `# ` followed by a lowercase directory name and colon). Ignore checksum lines (md5 + path format).

3. **Group by module.** Organize skills into groups by directory prefix:
   - **Development lifecycle:** `dev-*` (dev-init, dev-plan, dev-check, dev-debrief, dev-scan, dev-wiki)
   - **Knowledge wiki:** `wiki-*`, `knowledge-wiki` (wiki-init, wiki-add, wiki-query, wiki-absorb, wiki-health, wiki-reorg, wiki-bootstrap, wiki-index, wiki-registry, knowledge-wiki)
   - **Python:** `py-*` (py-init)
   - **Spec & review:** `spec`
   - **Other:** anything not matching the above prefixes (nana, memory-consolidate, etc.)

4. **Output.** Print a formatted list with group headers and one line per skill: `- /skill-name — description`. If no descriptions found (empty MANIFEST or missing file), list directory names only.

## Example Output

```
## Development Lifecycle
- /dev-init — Bootstrap a dev-wiki for phase planning
- /dev-plan — Plan one phase at a time
...
## Knowledge Wiki
- /wiki-init — Start a wiki for a project
...
## Other
- /nana — Show installed skills
```
