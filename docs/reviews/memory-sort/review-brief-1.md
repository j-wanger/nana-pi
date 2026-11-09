Feature: FEAT-013 · Install and connect harness runtimes
Serves: roadmap step 3 (trim each helper's starting context): guidance moves out of Claude-only memory into the two files every seat reads, and briefs must name the roadmap step they serve.

# Review brief 1: memory-sort

Review the whole lane: `git diff main...HEAD`. Plan: `docs/plan/memory-sort.md` (with its "Changed after the adversary" paragraph). Builder report: `docs/reviews/memory-sort/report.md`. The seat corrected HANDOFF.md itself (builders cannot edit it). The memory audit the builder worked from is at ~/.cache/nana-memory-sort/C-audit.md; the source entries are under ~/.claude/nana-memory/shared/ and this repo's Claude project memory folder under ~/.claude/projects/.

Questions: does each new ruling and seat line keep the meaning of its source entry, including its limits (the autonomy ruling's agreed-scope and outward-facing limits; validation first winning over older wording until its lane lands)? Do any two lines now contradict each other or an existing ruling? Is anything about the owner as a person, a name or a work reference now in these public files? Does the Serves refusal reject missing, empty and malformed values without blocking a valid brief? Rulings 6,545 and seat guide 7,109 bytes: still under the 8,192 cap. Threat model: honest drift in wording; forgery out.
