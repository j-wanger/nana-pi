# nana-pi

Adoption of the [pi coding agent](https://github.com/earendil-works/pi) as a primary
coding-agent platform (macOS + native Windows, Codex subscription + local models).
Sibling repo to `~/nana-agent-loop`.

- `research/` — grounded landscape knowledge. Start with `research/pi-landscape-2026-09-01.md`
  (adoption verdict + full capability map, adversarially verified). `research/raw/` holds the
  deep-research artifacts it was distilled from.
- `packages/` — our pi packages, chiefly the nana extension pack covering the four hook
  classes: pre-tool permission gating, post-edit format/lint/test triggers, session lifecycle,
  notifications/observability. Installable via `pi install git:` or a local path.

Canonical upstream coordinates: repo `earendil-works/pi`, npm `@earendil-works/pi-coding-agent`
(the `@mariozechner/*` scope is deprecated). Latest at repo creation: 0.84.4, Node ≥22.19.
