# nana-pi

Adoption of the [pi coding agent](https://github.com/earendil-works/pi) as a primary
coding-agent platform (macOS + native Windows, Codex subscription + local models).
Sibling repo to `~/nana-agent-loop`.

- `research/` — grounded landscape knowledge. Start with `research/pi-landscape-2026-09-01.md`
  (adoption verdict + full capability map, adversarially verified). `research/raw/` holds the
  deep-research artifacts it was distilled from.
- `packages/` — our pi packages, chiefly the nana extension pack covering the four hook
  classes (pre-tool permission gating, post-edit format/lint/test triggers, session lifecycle,
  notifications/observability) plus scaffold + dev-workflow skills. Installable via
  `pi install git:` or a local path.
- `templates/` — copier project templates behind the `scaffold-py`/`scaffold-ts` skills
  (greenfield) and `adopt-py`/`adopt-ts` (retrofit onto an existing project — adopt mode
  emits configs only, source tree untouched). Opinionated Python and TypeScript stacks,
  folder-by-feature, nested AGENTS.md, post-edit quality gates. The copier src is the
  REPO ROOT (root `copier.yml`, `language` question) so copies are tag-versioned and
  re-sync via `uvx copier update` — template changes ship by commit + `v*` tag.
- `apps/desk/` — the pi desk, a zero-dependency local browser dashboard over pi sessions.
- `docs/` — design docs; `docs/shippable-nana-pi-options-2026-09-02.md` is the ratified
  shippability plan.

Canonical upstream coordinates: repo `earendil-works/pi`, npm `@earendil-works/pi-coding-agent`
(the `@mariozechner/*` scope is deprecated). Latest at repo creation: 0.84.4, Node ≥22.19.
