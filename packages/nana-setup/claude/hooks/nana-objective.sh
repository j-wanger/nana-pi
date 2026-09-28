#!/usr/bin/env bash
# SessionStart hook (global) — thin launcher. The objective block is produced by ONE
# implementation, packages/nana-pack/bin/nana-objective.mjs (lib/objective.ts), which pi's
# nana-objective extension also uses: both runtimes print byte-identical text.
# Installed as a symlink into this repo; follow it to find the CLI. Fail-open, always exit 0.
src="${BASH_SOURCE[0]}"
while [ -L "$src" ]; do
  t=$(readlink "$src")
  case "$t" in /*) src="$t" ;; *) src="$(dirname "$src")/$t" ;; esac
done
cli="$(cd "$(dirname "$src")/../../.." 2>/dev/null && pwd)/nana-pack/bin/nana-objective.mjs"
if out=$(node --no-warnings "$cli" --cwd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null); then
  [ -n "$out" ] && printf '%s\n' "$out"
  exit 0
fi
printf '%s\n\n%s\n\n%s\n' "[nana:objective]" "## Objective and current priority (nana)" \
  "OBJECTIVE UNAVAILABLE: producer failed ($cli). Tell the user before spending."
exit 0
