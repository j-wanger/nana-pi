#!/usr/bin/env bash
# SessionStart hook (global) — print the SHARED auto-memory index (user · feedback · reference)
# so every session in every repo starts with the same rules, AND self-heal this project's link
# to it. Project-level memory stays in the repo's own ~/.claude/projects/<key>/memory (loaded
# by the harness); the shared dir is symlinked in as `shared/`.
#
# Self-healing (2026-09-18): Claude Code keeps per-project state under
# ~/.claude/projects/<key>, where <key> is the project path with every character outside
# [A-Za-z0-9] replaced by "-" (verified against the installed CLI: `e.replace(/[^a-zA-Z0-9]/g,"-")`,
# truncated at 200 chars with a hash suffix beyond that). We prefer the EXACT dir the harness
# just named via transcript_path and fall back to deriving the key, so a brand-new repo links
# itself on its first session and no installer step is needed per project.
#
# Fail-open: every failure exits 0; a missing shared index prints nothing.

claude_home="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
shared="${NANA_SHARED_MEMORY_DIR:-$claude_home/nana-memory/shared}"
idx="$shared/MEMORY.md"
[ -r "$idx" ] || exit 0

projects="$claude_home/projects"
dir=""

# 1. exact — the transcript the harness hands us on stdin lives in this project's dir.
if [ ! -t 0 ]; then
	input=$(head -c 65536 2>/dev/null)
	t=$(printf '%s' "$input" | sed -n 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
	if [ -n "$t" ]; then
		cand=$(dirname "$t")
		[ "$(dirname "$cand")" = "$projects" ] && dir="$cand"
	fi
fi

# 2. fallback — derive the key from the project dir the way Claude Code does.
if [ -z "$dir" ]; then
	proj="${CLAUDE_PROJECT_DIR:-$PWD}"
	key=$(printf '%s' "$proj" | LC_ALL=C sed 's/[^A-Za-z0-9]/-/g')
	if [ "${#key}" -gt 200 ]; then
		# Beyond 200 chars the harness appends a hash we do not reproduce: match the
		# existing dir instead, and only when it is unambiguous.
		hits=$(find "$projects" -maxdepth 1 -name "${key:0:200}-*" 2>/dev/null)
		[ "$(printf '%s\n' "$hits" | grep -c .)" = "1" ] && dir="$hits"
	else
		dir="$projects/$key"
	fi
fi

if [ -n "$dir" ]; then
	mem="$dir/memory"
	mkdir -p "$mem" 2>/dev/null
	if [ ! -e "$mem/shared" ] && [ ! -L "$mem/shared" ]; then
		ln -s "$shared" "$mem/shared" 2>/dev/null
	fi
fi

echo "[nana:shared-memory] $idx — general feedback/user/reference memories are written HERE (symlinked as shared/ in this project's memory dir); project facts go in the project's own memory dir."
grep '^- \[' "$idx"
exit 0
