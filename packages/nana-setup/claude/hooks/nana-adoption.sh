#!/usr/bin/env bash
# SessionStart hook (global, Claude Code only) — thin launcher for
# packages/nana-pack/bin/nana-adoption.mjs: git repositories a session ran in that nobody has
# adopted, read from the nana journal. Prints nothing when there is nothing to say.
# Installed as a symlink into this repo; follow it to find the CLI. Fail-open, always exit 0.
src="${BASH_SOURCE[0]}"
while [ -L "$src" ]; do
  t=$(readlink "$src")
  case "$t" in /*) src="$t" ;; *) src="$(dirname "$src")/$t" ;; esac
done
cli="$(cd "$(dirname "$src")/../../.." 2>/dev/null && pwd)/nana-pack/bin/nana-adoption.mjs"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n%s\n' "[nana:adoption]" "ADOPTION UNAVAILABLE: node not found on PATH."
  exit 0
fi
if out=$(node --no-warnings "$cli" --cwd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null); then
  [ -n "$out" ] && printf '%s\n' "$out"
  exit 0
fi
printf '%s\n%s\n' "[nana:adoption]" "ADOPTION UNAVAILABLE: reader failed ($cli)."
exit 0
