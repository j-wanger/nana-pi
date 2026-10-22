#!/bin/bash
# Seat check of the astra r4 fixes and amendment A1, on scratch copies only.
W=/Users/example/nana-pi-wt/req-tree
SHA=6b9202a501a7fe03dfc834ab34cdfc212f6d92ce
AM=$(git -C "$W" log --format=%H -1 -- docs/reviews/req-tree-2026-10-09/amendment-A1.json)
T=$(mktemp -d)
cd "$W" || exit 2
P() { node docs/reviews/req-tree-2026-10-09/prove.mjs --approved $SHA --amendment $AM "$1" docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo $?; }
echo "amendment commit: $AM"
echo "real ledger proof exit=$(P REQUIREMENTS.md) (want 0)"
for id in R-287 R-288 R-289 R-290 R-291; do
  python3 - "$id" "$T/$id.md" <<'EOF'
import sys
i,out=sys.argv[1],sys.argv[2]
L=open('/Users/example/nana-pi-wt/req-tree/REQUIREMENTS.md').read().split('\n')
k=next(n for n,l in enumerate(L) if l.startswith(f'| {i} |'))
c=L[k].split('|'); c[3]=' untested '; c[4]=' — '; L[k]='|'.join(c)
open(out,'w').write('\n'.join(L))
EOF
  echo "placeholder '$id | untested | —' proof exit=$(P "$T/$id.md") (want 1)"
done
python3 - "$T/line11.md" <<'EOF'
import sys
L=open('/Users/example/nana-pi-wt/req-tree/REQUIREMENTS.md').read().split('\n')
L[10]=L[10].replace('R-292–R-299 stay the reserve','R-293–R-299 stay the reserve',1)
open(sys.argv[1],'w').write('\n'.join(L))
EOF
echo "different line-11 edit proof exit=$(P "$T/line11.md") (want 1)"
grep -c 'R-287–R-291 consumed 2026-10-09 (the requirements tree), R-292–R-299 stay the reserve' REQUIREMENTS.md | sed 's/^/amendment text present in ledger: /'
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { checkTree } = await import('$W/scripts/requirements-tree.mjs');
const L = readFileSync('$W/REQUIREMENTS.md','utf8').split('\n');
const h = L.findIndex(l => l.startsWith('## FEAT-001 · ')); const p = h + 1;
const purpose = L.splice(p, 1)[0]; const f2 = L.findIndex(l => l.startsWith('## FEAT-002 · '));
L.splice(f2, 0, purpose, '');
const r = checkTree(L.join('\n'));
console.log('late purpose: checkTree problems=' + r.problems.length + ' (want >0)');
console.log('real ledger: checkTree problems=' + checkTree(readFileSync('$W/REQUIREMENTS.md','utf8')).problems.length + ' (want 0)');
"
grep -n 'problems.length === 0\|problems.length===0\|problems, \[\]\|problems.length == 0' packages/nana-pack/tests/requirements-tree.test.mjs | head -3 | sed 's/^/test asserts empty problems at: /'
node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs >/dev/null 2>&1; echo "tree test exit=$? (want 0)"
rm -rf "$T"
