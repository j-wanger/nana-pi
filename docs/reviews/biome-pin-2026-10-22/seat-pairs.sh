#!/bin/bash
# Seat wrong-code pairs for lane biome-pin (written by the seat 2026-10-22 at tip 2d4ec87e). The render test copies the
# template from git HEAD (--vcs-ref HEAD), so a template pair must be committed in the scratch worktree before the run;
# the shared mutation runner never commits, so these four run here, one at a time, each from a clean reset to the tip.
# usage (from the lane worktree root): bash docs/reviews/biome-pin-2026-10-22/seat-pairs.sh <scratch dir> > <output file>
set -u
tip=$(git rev-parse HEAD); scratch=$1
git worktree add -q --detach "$scratch" "$tip" || exit 2
T=packages/nana-pack/tests/templates-render.test.mjs
PKG=templates/typescript/template/package.json.jinja
run_pair() { # name, title regex, file, perl substitution, commit(yes|no)
	local name=$1 want=$2 file=$3 sub=$4 commit=$5
	git -C "$scratch" reset -q --hard "$tip"
	perl -0pi -e "$sub" "$scratch/$file"
	if git -C "$scratch" diff --quiet; then echo "ANCHOR-MISS $name"; return; fi
	[ "$commit" = yes ] && git -C "$scratch" -c user.name=seat -c user.email=seat@localhost commit -qam "seat pair $name"
	local out; out=$(cd "$scratch" && node scripts/test.mjs --verbose templates-render 2>&1)
	if grep -qE "^FAIL +$want" <<<"$out"; then echo "RED $name — $(grep -E "^FAIL +$want" <<<"$out" | head -1 | cut -c1-140)"; else echo "GREEN $name — SURVIVED"; fi
}
echo "seat pairs: lane biome-pin, tip $tip, $(date -u +%Y-%m-%dT%H:%M:%SZ), $(uname -s)"
run_pair b1-caret-back 'R-2559: ' "$PKG" 's/"\@biomejs\/biome": "2\.5\.15"/"\@biomejs\/biome": "^2.5.15"/' yes
run_pair b2-adopt-caret 'R-2559: ' "$PKG" 's/"\@biomejs\/biome": "2\.5\.15"/"\@biomejs\/biome": "{% if adopt %}^2.0.0{% else %}2.5.15{% endif %}"/' yes
run_pair b3-wrong-key 'R-2559: ' "$T" 's/const biomeVersion = renderedPackage\.devDependencies\?\.\["\@biomejs\/biome"\];\n\t\t\t\tbiomePins\.scaffold/const biomeVersion = renderedPackage.dependencies?.["\@biomejs\/biome"];\n\t\t\t\tbiomePins.scaffold/' no
run_pair b4-unversioned-check 'typescript: a fresh scaffold passes biome check with no edits' "$T" 's/const biomePackage = `\@biomejs\/biome\@\$\{biomeVersion\}`;/const biomePackage = "\@biomejs\/biome";/' no
git worktree remove --force "$scratch"
