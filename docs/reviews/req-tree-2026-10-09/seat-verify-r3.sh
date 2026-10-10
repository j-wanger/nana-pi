#!/bin/bash
# Seat check of the two sol r3 fixes, on scratch copies only. Prints one line per attack.
W=/Users/jwang/nana-pi-wt/req-tree
SHA=6b9202a501a7fe03dfc834ab34cdfc212f6d92ce
T=$(mktemp -d)
cd "$W" || exit 2
node docs/reviews/req-tree-2026-10-09/prove.mjs --approved $SHA REQUIREMENTS.md docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo "real ledger proof exit=$? (want 0)"
mk() { python3 - "$1" "$2" <<'EOF'
import sys,re
mode,out=sys.argv[1],sys.argv[2]
L=open('/Users/jwang/nana-pi-wt/req-tree/REQUIREMENTS.md').read().split('\n')
i=next(k for k,l in enumerate(L) if l.startswith('| R-291 |'))
cells=L[i].split('|')
if mode=='trailing': L[i]=L[i]+'UNACCOUNTED-BYTES'
elif mode=='fifth': L[i]=L[i]+' extra |'
elif mode=='untested': cells[3]=' untested '; L[i]='|'.join(cells)
elif mode=='noevidence': cells[4]=' '; L[i]='|'.join(cells)
open(out,'w').write('\n'.join(L))
EOF
}
for m in trailing fifth untested noevidence; do
  mk $m "$T/$m.md"
  # prove.mjs resolves the after-path relative to the repo root; pass an absolute path
  node docs/reviews/req-tree-2026-10-09/prove.mjs --approved $SHA "$T/$m.md" docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo "proof on new-row attack '$m' exit=$? (want 1)"
done
node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs >/dev/null 2>&1; echo "tree test on real tree exit=$? (want 0)"
cp docs/requirements-tree.md "$T/outline.bak"
printf 'extra line\n' >> docs/requirements-tree.md
node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs >/dev/null 2>&1; echo "tree test with an appended outline line exit=$? (want 1)"
cp "$T/outline.bak" docs/requirements-tree.md
git diff --quiet -- docs/requirements-tree.md && echo "outline restored, worktree clean for it"
rm -rf "$T"
