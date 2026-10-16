# Plan review — the regroup, 2026-10-15 (gpt-5.6-sol; format lane: up to two rounds)

Review the change declaration `docs/reviews/regroup-2026-10-15/CHANGE.md` on `feat/regroup` (based on main `e451c90`, the
lift landed). Nothing is built yet. Read its "Seat revision (2026-10-15)" section: it folds in two fact-checks.

Jake's words: 2026-10-14, "Lift is the tool that enables better regroup, but this is a core feature for nana, understanding
existing repo and turn into feature trees, then development really becomes feature oriented"; 2026-10-10 (nana-pi's own
regroup), "Do one review on all 1009 placements, also we should allow multiple features pointing to the same requirements";
2026-10-15, on the owner's packet, "Short package". Shares are the parallel lane `regroup-shares`, declared separately.

Threat model: honest variation in our tools' output and our users' files in scope — including an agent's grouping that
names a row that does not exist, drops or duplicates a row, invents a reason, or drifts a purpose from its rows;
deliberate forgery out. Lane class: format. The review standard pi-review appends governs the bar and the verdict line.

Evidence in the folder: `research-lift-api.md`, `research-precedent.md` (nana-pi's October regroup), `research-understand.md`
(aml-desk and basketball-geek as read-only subjects), `factcheck-repo.md`, `factcheck-external.md` (both against draft 1).

Check: (1) the deterministic layer catches every identity error an agent's grouping can make (unknown, lost or duplicated
rows; stale proposal; wrong headings; uncounted review); (2) the lift change that reports each old section's destination
by old line is proved and keeps the lift's existing guarantees; (3) the packet is the short form Jake ruled and fits the
stated reading time; (4) the every-row review record is structured, counted, and honest about a same-family fallback; (5)
rows R-1170–R-1180 are each pinned by named tests and the "wrong code first" pairs red what they name; (6) the per-project
cost is stated and plausible; (7) scope is the smallest that serves Jake's words; (8) any MUST under the standard.
