#!/usr/bin/env bash
# SessionStart hook (global) — print the objective + current priority every session.
# Resolution (2026-09-18): the nearest OBJECTIVE.md walking UP from the session cwd wins
# (a product carries its own objective, e.g. ~/aml-desk); fall back to the umbrella at
# ~/nana-agent-loop/OBJECTIVE.md. Fail-open.
umbrella="$HOME/nana-agent-loop/OBJECTIVE.md"
dir="${CLAUDE_PROJECT_DIR:-$PWD}"
f=""
while [ -n "$dir" ] && [ "$dir" != "/" ]; do
  if [ -r "$dir/OBJECTIVE.md" ]; then f="$dir/OBJECTIVE.md"; break; fi
  dir=$(dirname "$dir")
done
[ -z "$f" ] && f="$umbrella"
[ -r "$f" ] || exit 0
echo "[nana:objective] $f"
sed -n '/^\*\*Objective/,/^\*\*Current priority.*$/p' "$f"
if [ "$f" != "$umbrella" ] && [ -r "$umbrella" ]; then
  echo "Umbrella (nana): $(sed -n '/^\*\*Objective/p' "$umbrella" | head -1)"
fi
echo "Every session must be able to say which of these two lines its spend serves. If it cannot, raise it before spending."
exit 0
