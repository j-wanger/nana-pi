#!/bin/bash
# usage: run.sh <name> <ledger-file> [mapping-file]  -> fresh repo, dry, write, commit, verify
V=/private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate4-verify
CODE=${CODE:-$V/tree}
N=$1; F=$2; M=$3
R=$V/repos/$N; rm -rf "$R"; mkdir -p "$R"; cp "$F" "$R/REQUIREMENTS.md"
G() { git -c user.name=t -c user.email=t@t -c commit.gpgsign=false -c core.autocrlf=false "$@"; }
L() { node $CODE/scripts/requirements-lift.mjs "$@" 2> >(grep -v -e MODULE_TYPELESS -e Reparsing -e 'To eliminate' -e trace-warnings >&2); }
cd "$R" && git init -q && G add . && G commit -qm base
MA=()
if [ -n "$M" ]; then mkdir -p lift; cp "$M" lift/m.json; G add . ; G commit -qm map; MA=(--mapping lift/m.json); fi
L --root . "${MA[@]}" --write > $R.out 2> $R.err; echo "[$N] write exit $?: $(tail -1 $R.out) $(head -c 400 $R.err)"
G add REQUIREMENTS.md; G commit -qm lift 2>/dev/null
L --root . "${MA[@]}" --verify HEAD~1 > $R.vout 2> $R.verr; echo "[$N] verify exit $?: $(tail -1 $R.vout | cut -c1-80) $(head -c 300 $R.verr)"
