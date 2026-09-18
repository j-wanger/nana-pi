#!/usr/bin/env bash
# UserPromptSubmit hook — monitors transcript size as proxy for context usage.
# Emits one warning per session at 5MB threshold.

set -euo pipefail

# --- jq fail-open guard ---
command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")

if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  exit 0
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
WARN_FLAG="$ROOT/.claude/.context-warned"

# Only warn once per session
if [ -f "$WARN_FLAG" ]; then
  exit 0
fi

SIZE=$(wc -c < "$TRANSCRIPT" 2>/dev/null | tr -d ' ')
THRESHOLD=5242880

if [ "$SIZE" -gt "$THRESHOLD" ] 2>/dev/null; then
  mkdir -p "$ROOT/.claude"
  touch "$WARN_FLAG"
  SIZE_KB=$(( SIZE / 1024 ))
  echo "[nana:context] Transcript at ${SIZE_KB}KB. Context getting heavy — consider /dev-debrief then /compact to preserve quality." >&2
fi

exit 0
