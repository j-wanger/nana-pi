#!/usr/bin/env bash
# SessionStart hook (global) — print the SHARED auto-memory index (user · feedback · reference)
# so every session in every repo starts with the same rules, AND self-heal this project's link
# to it. Project-level memory stays in the repo's own ~/.claude/projects/<key>/memory (loaded
# by the harness); the shared dir is symlinked in as `shared/`.
#
# Self-healing (2026-09-18): Claude Code keeps per-project state under
# ~/.claude/projects/<key>. Verified against the installed CLI (2.1.269):
#   key = path.replace(/[^a-zA-Z0-9]/g, "-")
#   and when that exceeds 200 chars: key.slice(0,200) + "-" + Math.abs(hash32(path)).toString(36)
#   with hash32 = the classic 32-bit rolling string hash, h = (h<<5) - h + charCode, |0.
# We prefer the EXACT dir the harness names via transcript_path, then the derived key (hash and
# all). We NEVER pick a directory by pattern: two projects can share the first 200 characters,
# and a wrong guess would mutate another project's memory dir. No >200-char project dir exists on
# this machine, so the hash branch is pinned against the CLI's rule above by the package's tests
# (tests/shared-memory-hook.test.mjs compares it to the JS reference in lib/project-key.mjs).
#
# Fail-open: every failure exits 0; a missing shared index prints nothing.

# Math.abs((h<<5)-h+c |0).toString(36), in bash. ASCII input only — the caller checks.
nana_hash36() {
	local s=$1
	# NOTE: separate statements on purpose — bash expands every word of a `local` line BEFORE
	# assigning any of them, so `local s=$1 n=${#s}` would read the OUTER s and set n to 0.
	local n=${#s}
	local i c code h=0 out="" d
	local digits=0123456789abcdefghijklmnopqrstuvwxyz
	for ((i = 0; i < n; i++)); do
		c=${s:i:1}
		printf -v code '%d' "'$c" 2>/dev/null || return 1
		h=$(((((h << 5) - h + code)) & 0xFFFFFFFF))
	done
	((h >= 0x80000000)) && h=$((0x100000000 - h))
	if ((h == 0)); then printf '0'; return 0; fi
	while ((h > 0)); do
		d=$((h % 36))
		out="${digits:d:1}$out"
		h=$((h / 36))
	done
	printf '%s' "$out"
}

claude_home="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
shared="${NANA_SHARED_MEMORY_DIR:-$claude_home/nana-memory/shared}"
idx="$shared/MEMORY.md"
[ -r "$idx" ] || exit 0

projects="$claude_home/projects"
dir=""
note=""

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
	if printf '%s' "$proj" | LC_ALL=C grep -q '[^ -~]'; then
		# The harness works in UTF-16 code units; this shell works in bytes, so a non-ASCII path
		# would give a DIFFERENT key and a stray directory. Say so and change nothing — such a
		# session still self-heals through transcript_path above.
		note="self-heal skipped: non-ASCII project path (the key cannot be derived in the shell)"
	else
		key=$(printf '%s' "$proj" | LC_ALL=C sed 's/[^A-Za-z0-9]/-/g')
		if [ "${#key}" -gt 200 ]; then
			h=$(nana_hash36 "$proj") && dir="$projects/${key:0:200}-$h" || note="self-heal skipped: could not derive the project key"
		else
			dir="$projects/$key"
		fi
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
[ -n "$note" ] && echo "[nana:shared-memory] $note"
grep '^- \[' "$idx"
exit 0
