# Research C — the seat's workflow around the lift, and its handoff to the regroup

nana-pi main `d9cf0bc`, 2026-10-14. Repo read only. Probes ran in `plan-lift/probe*/` (scratch, macOS, git 2.50.1). "Ran" = run here. INFERRED = not read or run.
Stakes: high-blast. The tool rewrites another project's contract file. A lost or changed row stays silent unless the proof catches it, and the regroup inherits every gap this lane leaves.

## 1. Answer in brief

- One command, dry run by default: `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .`. It prints the plan and the proof and writes nothing. `--write` comes only after the owner's yes, and only while the ledger (and any mapping file) is tracked and matches HEAD.
- Both seats run it, but only the requirements skill reaches both. That skill must carry the whole flow; the five pi-only skills point to it.
- The regroup should add only the agent's proposal and Jake's checkpoint. So this lane ships one mapping format (default and proposal alike), a validator, the plan output as a checkpoint packet, the write gate on the mapping, and a re-runnable verify.
- `prove.mjs` sets the proof standard (every physical line accounted, baseline from git), but its code cannot be reused. It sees 3-digit IDs only, finds the first of two same-named headings, splits LF only, and is wired to nana-pi (§6, ran).

## 2. Q1 — the command shape

| Purpose | Form (identical in Bash, PowerShell 5.1 and 7) |
|---|---|
| plan + proof, default mapping, writes nothing | `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .` |
| save the default mapping (regroup's start) | `… --root . --emit-mapping docs/reviews/<lane>-<date>/tree-map.json` |
| plan + proof for a supplied mapping | `… --root . --mapping docs/reviews/<lane>-<date>/tree-map.json` |
| apply (after the owner's yes) | `… --root . [--mapping <file>] --write` |
| reviewer re-check on the tip | `… --root . --verify <base-sha> [--mapping <file>]` |

- **`--root` is required.** No default target. The req-tree mover defaulted to nana-pi's own ledger (`docs/reviews/req-tree-2026-10-09/move.mjs:122`). It also always wrote its section map into nana-pi (`:142`). That is the accident to design out.
- **Dry run output is bounded.** It prints counts per heading, never per row, plus one proof line and the tree check result. 1,000 flat rows already overflowed both seats' windows once (`docs/reviews/tree-2026-10-14/CHANGE.md:13-15`). Cap problem lines and print the remainder as a count (cap value INFERRED; a sealed tunable).
- **The tool writes its own files.** The skill never says `> file`, because PowerShell 5.1 `>` writes UTF-16 (threat model, tree `CHANGE.md:30-33`).
- **Where the mapping lives:** in the project, in the lane's corpus `docs/reviews/<lane>-<date>/tree-map.json`. That folder is the working pattern's corpus convention (`AGENTS.md:93`). It also follows req-tree's precedent: `tree.json` sat in its corpus, and `prove.mjs` read it from the approved commit (`prove.mjs:15,23-26`). JSON keeps any `| R-` line out of the Markdown the rails read (`research-adopt.md:95`). Never in nana-pi.
- **The write gate, with cwd = `--root`:** `git ls-files --error-unmatch REQUIREMENTS.md` and `git diff --quiet HEAD -- REQUIREMENTS.md` must both pass. The same applies to the mapping file when `--mapping` is given, so the commit that adds the mapping is the approval (req-tree `CHANGE.md:274-280`).
  - Ran: `diff --quiet` alone passes an UNTRACKED ledger (exit 0), so `ls-files` is required. It catches a staged-only edit (exit 1).
  - Ran: with `core.autocrlf=true`, a clean CRLF working file over an LF blob gives `diff --quiet` exit 0. A raw byte compare against `git show` gives exit 1 there. A byte compare would therefore refuse every clean Windows checkout. `nana-land` uses the same diff check (`packages/nana-pack/bin/nana-land.mjs:25-28`).
  - Ran: `git show HEAD:REQUIREMENTS.md` from a project in a subfolder fails (exit 128); `HEAD:./REQUIREMENTS.md` works. This is the report's open residual 2 (`scripts/product-report.mjs:263,271`).
  - Re-read the ledger just before the rename. Refuse if its bytes changed since the plan: another session may be editing (basketball-geek held six uncommitted lines, `research-adopt.md:45`).
- **Windows.**
  - `node "$HOME/nana-pi/…"` expands in Bash and both PowerShells; `~/` stays literal before PowerShell 7.6 (roster `docs/reviews/roster-2026-10-13/CHANGE.md:166-167`). Paths use `/`, quoted when they hold a space.
  - git runs through `spawnSync("git", args)`, never `shell: true`, as the report already does (`product-report.mjs:203`).
  - Node ≥ 22.18 is required, because the checker imports the `.ts` rail (`scripts/requirements-tree.mjs:13`; `scripts/requirements-trace.mjs:21`).
  - The main guard must compare realpaths. Today's guard exits 0 without a word through a linked checkout (`requirements-tree.mjs:487`; tree `CHANGE.md:229`). After `--write`, a silent 0 reads as success. Every run prints a summary line; the skill says no summary line means the tool did not run.
- **Exit codes** follow the checker (`requirements-tree.mjs:447-449`): 0 when proof and tree check pass, 1 for named refusals, 2 for usage.

## 3. Q2 — who runs it, and what the skill text must carry

- Claude Code gets only `requirements`, `spec` and the py skills (`packages/nana-setup/lib/steps.mjs:58`). pi loads the pack's whole `./skills` (`packages/nana-pack/package.json:14-16`). The scaffold and adopt skills "only exist inside pi" (`packages/nana-setup/README.md:179`).
- R-1159's refusal line already says "The requirements skill describes the next step" (`requirements-tree.mjs:416-418`). So `requirements/SKILL.md` §4 (today `:128-130`) carries the full flow. The five pi skills keep the carve-out sentence that T5/T6 pin (tree `CHANGE.md:144-149`) and point to the requirements skill rather than repeat the command. One copy, no drift.
- The flow the skill states, in order:
  1. **Where.** A nana project, never nana-pi. Work in a lane worktree `~/<repo>-wt/<lane>` on `feat/<lane>` (`AGENTS.md:92`), with `--root` pointing at that worktree.
  2. **Clean.** If the tool refuses uncommitted ledger edits, stop and name them. Never commit, stash or discard another session's lines to get past the refusal.
  3. **Dry run.** Show the owner the plan summary and the proof line. Say that every purpose is a "Not yet sorted" placeholder.
  4. **Write after yes.** Run `--write` only on the owner's yes (tree `CHANGE.md:210`).
  5. **Check.** `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .` gives 0 problems (`SKILL.md:130`), and the project's own suite stays green. The rails are heading-blind (`research-adopt.md:95`).
  6. **Commit and land.** Commit REQUIREMENTS.md by explicit path, with the proof line in the message. Review and land under the project's working pattern (`AGENTS.md:94-97`); the reviewer re-runs `--verify` on the tip.
  7. **Next.** The regroup. Name no command until that lane lands.
- The Windows Claude Code seat holds a byte copy of the skill (`steps.mjs:217-226`). It stays stale until `nana-setup install` re-runs, so this lane needs Jake's HANDOFF line again (tree `CHANGE.md:237`).
- First users (`research-adopt.md:104-113`):
  - aml-desk and basketball-geek take the default lift.
  - yokai-world is a hand-built tree with 29 problems. The default mapping refuses it; it needs its hand fix or a supplied mapping.

## 4. Q3 — what the regroup needs from this lane

nana-pi's own regroup (req-tree, 2026-10-09/10) is the model:
- astra drafted the tree as JSON with IDs, labels, purposes and row lists, never row text (req-tree `CHANGE.md:124-127`).
- Jake ruled on the outline at checkpoint 1, before any build. The approving commit froze the inputs (`:240-243`, `:274-280`).
- `move.mjs` built the ledger. `prove.mjs` rebuilt the expected text independently from that commit and accounted every physical line (`:199-217`). Its output: "1004 BASE rows preserved once; 8 new rows; 125 ledger blocks and 1652 physical lines accounted; 64 old headings mapped" (`prove-output.txt`).
- A placement review of all 1,009 rows moved 17 (`placement-review.md`). Checkpoint 2 read one proof line (`:245`). The old-section map recorded each old heading's new homes (`docs/requirements-sections-2026-10-09.md`; `move.mjs:125-142`).

What this lane should therefore ship, so the regroup adds only the proposal and the checkpoint:
1. **One mapping format** for the default and for a proposal, versioned. Fields:
   - `ledger`: the blob from `git rev-parse HEAD:./REQUIREMENTS.md`; `by`: `mechanical` or `proposal`.
   - `capabilities → features → subgroups`, each with `id`, `label`, `purpose`, `outcome` (CAP), `status` and `also_applies` (FEAT), `rows` (IDs, in order) and `prose_from` (old headings).
   - The ordinary headings that stay, and the closing tail.
   - Old headings are keyed by line number at that blob, because labels repeat (aml-desk has two `## 36b.`, `research-adopt.md:41`). No row text anywhere.
2. **Any parsable ledger as input**, flat or tree, when a mapping is supplied: the regroup's input is the lifted ledger. Without `--mapping`, the default refuses a ledger that already has tree headings and names their count.
3. **A validator that names every problem:**
   - a row missing, duplicated or unknown, or a new ID;
   - a heading ID reused, or a reserved ID (CAP-90, FEAT-900, SUB-900–904) used outside the G rows (`SKILL.md:126`);
   - an empty purpose, a bad status (`requirements-tree.mjs:19`), or rows under a proposed or retired feature (`:189-191`);
   - a blob mismatch: "the ledger changed since this mapping was drawn; re-propose".
4. **The dry run as the checkpoint packet.** It shows each heading with its purpose and row count, old home → new home counts, the proof line and the tree check. `--plan <file>` writes the full list (need INFERRED).
5. **The write gate on the mapping**, so what Jake approved is what lands.
6. **`--verify <base-sha>`.** It rebuilds from `<sha>:./REQUIREMENTS.md` plus the committed mapping and compares byte for byte with the working ledger. This is `prove.mjs --approved`'s role (req-tree `CHANGE.md:199-200`).
7. **"Not yet sorted:"** as a named constant (tree `CHANGE.md:210`), so the regroup and the report can count unsorted features (`research-adopt.md:71`).

Left for the regroup: reading the repo, drafting the proposal, the placement review and Jake's checkpoint. Row reordering happens only as an approved mapping says; the default lift reorders nothing (`research-adopt.md:98`).

## 5. Q4 — what must never happen, and the mechanical check for each

| # | Never | Check | Source |
|---|---|---|---|
| 1 | a row lost or duplicated | ID multiset before = after; both counts printed | `research-adopt.md:88` |
| 2 | a row line changed by a byte (text, status, trailing space, CR) | proof compares each row's raw line, its `\r` included; the BOM and line-ending style are kept; new lines take the file's ending | `:89-91`; report fingerprint `product-report.mjs:33` |
| 3 | an ID renumbered or a new ID | ID set equal; a mapping with an unknown ID is refused | `SKILL.md:10-12`; two project rails read 3-digit IDs only (`research-adopt.md:93`) |
| 4 | a new line shaped like a row | no generated line may match `requirementRowId` or the rail's near-miss pattern | `templates/typescript/template/tests/requirements-trace.ts:60,63-80` |
| 5 | rail markers broken | the tool touches only REQUIREMENTS.md and changes no ID, so every `req:` marker still resolves; G rows stay byte-identical for the general-file cross-check | `requirements-trace.ts:521-560` |
| 6 | rows orphaned or headers mis-shaped | the result must pass `checkTree` before the write; headless fragments get a declared header and delimiter; a padded header gets a declared rewrite to the exact one | `requirements-tree.mjs:20,68,121-136,428-445`; `research-adopt.md:40` |
| 7 | an uncommitted or contended ledger written | the §2 gate; the re-read before rename; a warning (not a refusal) for local branches whose commits touch the ledger | ran §2; yokai has three such branches (`research-adopt.md:52`) |
| 8 | nana-pi's own ledger written by accident | `--root` required; refuse when realpath(root) is the checkout holding the script (`REPO_ROOT`, `requirements-tree.mjs:15`); the default mapping refuses any tree (nana-pi has 68 headings) | `move.mjs:122` |
| 9 | a half-written file | write a temp file in the same folder, run the proof on its bytes, then rename; on a failed rename, refuse and keep the original (Windows rename over an open file may fail, INFERRED) | — |
| 10 | a UTF-16 ledger or mapping | reuse the NUL-byte refusal for both files; strip the BOM before `JSON.parse` | `requirements-tree.mjs:423-427` |
| 11 | fenced rows moved | refuse, naming the line: the checker counts them misplaced and the rail counts them as rows | `requirements-tree.mjs:133-136`; `tree-2026-10-14/sol-r1.md:3` |
| 12 | a placeholder that reads as the owner's words | fixed prefix "Not yet sorted:" | `research-adopt.md:100` |
| 13 | `## Open questions` renamed | kept verbatim under the closing heading | `SKILL.md:126`; `research-adopt.md:99` |
| 14 | a silent success | realpath main guard; a summary line on every run | tree `CHANGE.md:229` |

## 6. Why prove.mjs is a standard, not a library

- **4-digit IDs are invisible.** The row pattern is `[RG]-\d{3}` (`prove.mjs:45`, `move.mjs:35`); ran on `| R-1001 | … |` → null. nana-pi and yokai-world both hold 4-digit rows. Use `requirementRowId` instead (`requirements-trace.ts:45,63-69`).
- **Repeated labels resolve to the first.** Headings are found with `indexOf` (`prove.mjs:99,141`; `move.mjs:50,114`). Ran: a second `## 36b.` resolves to index 0.
- **CRLF breaks it.** It splits on `\n` only (`prove.mjs:28`, `move.mjs:24`), so CRLF lines keep `\r` and exact heading lookups fail (read; not run on CRLF).
- **It is wired to nana-pi:** its intro, the Part A boundary and the R-287–R-294 evidence titles (`prove.mjs:29-38,92`).
- **Keep its standard.** The proof is independent of the writer, takes its baseline from git, and accounts every physical line, blank lines included (req-tree `CHANGE.md:199-217`). Writer and proof must not share placement code, or one bug passes both (INFERRED rule; mutation pairs decide).

## 7. For the plan (seat calls, none is Jake's)

- **Rows (draft, eight at most):**
  - R-1162: the dry run prints the plan and the proof and writes nothing.
  - R-1163: `--write` refuses unless the ledger and the mapping are tracked and match HEAD.
  - R-1164: rows are byte-identical, the ID multiset is equal, and every line is accounted.
  - R-1165: the default mapping, with Part G taking the reserved shape.
  - R-1166: refusals for an existing tree, fenced rows, UTF-16 and nana-pi's root.
  - R-1167: a supplied mapping is validated with named problems and applied to flat or tree input.
  - R-1168: `--verify`.
  - R-1169: the requirements skill names the command and the flow.
- **Part G source.** The default mapping reads Part G's heading lines from `templates/_shared/requirements-general.md:13-80` (the single source) rather than restating them.
- **Line endings and heading forms.** On mixed line endings, a copied line keeps its own ending and a new line takes the first line's. Setext headings count as sections, as the checker reads them (`requirements-tree.mjs:18,50-53`).
- **The claim most likely wrong:** that `git diff --quiet HEAD --` is a sound "matches HEAD" test under every Git for Windows eol setting. It ran only on macOS with `core.autocrlf` true and false; `.gitattributes eol=` and `core.eol` are untested.
