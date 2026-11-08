Feature: FEAT-033 · Adopt explicit engineering standards

# Review brief 2: data-pack-template — confirmation round

Confirmation round. The seat squashed the lane into one commit on current main (bdb12b9d) so its early history (which named the real data project and real people) never reaches main. Review the change since round 1's tip by content: `git diff 01c7c1a7 HEAD -- . ':!docs/code-map.md' ':!docs/requirements-tree.md' ':!REQUIREMENTS.md'` shows builder 3's fixes plus main's newer landed content; judge only builder 3's fixes (`docs/reviews/data-pack-template-2026-11-07/revision-2.md`) against round 1's MUST (opted-in scaffold fails its own pytest and CI) and its two cheap NOTEs, and that the squash dropped nothing of the lane (`git diff main HEAD --stat`). Generated files were rebuilt by their generators. Threat model and bar as in round 1.
