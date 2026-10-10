#!/bin/bash
# Seat verification for req-tree increment B (frozen; the builder runs it from the worktree root and
# pastes its output verbatim). Every mutation runs on a scratch copy in the OS temp dir or a scratch
# clone; the one outline mutation is restored by a trap. Each line ends with what is wanted.
set -u
W=$(git rev-parse --show-toplevel)
BASE=6b9202a501a7fe03dfc834ab34cdfc212f6d92ce
INPUTS=$(git -C "$W" log -1 --format=%H -- docs/reviews/req-tree-2026-10-09/tree-b.json docs/reviews/req-tree-2026-10-09/fixed-text-b.md)
T=$(mktemp -d)
OUT="$W/docs/requirements-tree.md"
cp "$OUT" "$T/outline.bak"
trap 'cp "$T/outline.bak" "$OUT"; rm -rf "$T"' EXIT
cd "$W" || exit 2
echo "inputs commit: $INPUTS"
PROVE() { node docs/reviews/req-tree-2026-10-09/prove.mjs --approved $BASE --inputs "$2" "$1" docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo $?; }
echo "proof on the real ledger exit=$(PROVE REQUIREMENTS.md $INPUTS) (want 0)"

# Ledger mutations for checkTree and the proof (python writes scratch copies).
python3 - "$T" <<'EOF'
import sys,re,json
T=sys.argv[1]
L=open('REQUIREMENTS.md').read().split('\n')
def save(name,lines): open(f'{T}/{name}.md','w').write('\n'.join(lines))
def idx(pred): return next(i for i,l in enumerate(L) if pred(l))
rowre=re.compile(r'^\|\s*([RG]-\d{3})\s*\|')
# feature map: line -> feature id; rows per feature; first Also applies line
feat=None; home={}; alsoline=None; statuses={}
for i,l in enumerate(L):
    m=re.match(r'^## (FEAT-\d{3}) · ',l)
    if m: feat=m.group(1)
    elif l.startswith('# '): feat=None
    if l.startswith('Status: ') and feat: statuses[feat]=i
    if l.startswith('Also applies: ') and alsoline is None: alsoline=(i,feat)
    mm=rowre.match(l)
    if mm and feat: home[mm.group(1)]=(feat,i)
ai,af=alsoline
own=next(r for r,(f,_) in home.items() if f==af)
retired=next(r for r,(f,i) in home.items() if f!=af and '| retired |' in L[i])
first=L[ai].split(': ',1)[1].split(', ')[0]
def withalso(extra):
    a=list(L); a[ai]=a[ai]+', '+extra; return a
save('r292-own-home',withalso(own)); save('r292-retired',withalso(retired))
save('r292-unknown',withalso('R-298')); save('r292-duplicate',withalso(first))
fs=sorted(statuses); f0=fs[0]; si=statuses[f0]
a=list(L); del a[si]; save('r293-missing',a)
for name,val in [('r293-done','Status: done'),('r293-frozen-empty','Status: frozen ()'),('r293-retired-empty','Status: retired ()'),('r293-whitespace','Status: frozen (   )')]:
    a=list(L); a[si]=val; save(name,a)
for name,val in [('r294-proposed','Status: proposed'),('r294-retired','Status: retired (merged into FEAT-002)')]:
    a=list(L); a[si]=val; save(name,a)
legal=["# CAP-01 · C","Purpose: c","Outcome: o",""]
for n,s in enumerate(["proposed","active","frozen (a ruling)","retired (FEAT-002)"],1):
    legal+= [f"## FEAT-00{n} · F{n}","Purpose: p",f"Status: {s}",""]
    if s=="active": legal+=["| ID | Requirement | Status | Evidence |","|---|---|---|---|","| R-001 | A shall work. | untested | — |",""]
open(f'{T}/legal.md','w').write('\n'.join(legal)+'\n')
# proof mutations
tb=json.load(open('docs/reviews/req-tree-2026-10-09/tree-b.json'))
mv=tb['moves'][0]
mi=idx(lambda l:l.startswith(f"| {mv['id']} |")); row=L[mi]
a=list(L); del a[mi]
tgt_hdr=idx(lambda l: l.startswith(f"## {mv['from']} · ") or l.startswith(f"### {mv['from']} · "))
k=next(i for i in range(tgt_hdr,len(a)) if a[i].startswith('|---'))
a.insert(k+1,row); save('proof-old-home',a)
a=list(L); a[si]='Status: active (typo)' if L[si]=='Status: active' else 'Status: active'; save('proof-status',a)
a=list(L); parts=L[ai].split(', '); a[ai]=', '.join(parts[:-1]) if len(parts)>1 else 'Also applies: '; save('proof-also-drop',a)
a=list(L); a.insert(si,'Status: done'); save('dup-status',a)
a=list(L); a.insert(ai,'Also applies: R-298'); save('dup-also',a)
f2=idx(lambda l:l.startswith('## FEAT-002 · '))
a=list(L); a[f2:f2]=['## FEAT-999 · Undeclared','Purpose: not in the approved tree','Status: proposed','']; save('undeclared-heading',a)
i2=idx(lambda l:l.startswith('| R-292 |')); i3=idx(lambda l:l.startswith('| R-293 |'))
a=list(L); a[i2],a[i3]=a[i3],a[i2]; save('proof-new-rows-swapped',a)
EOF

CHECK() { node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { checkTree } = await import('$W/scripts/requirements-tree.mjs');
const r = checkTree(readFileSync('$1','utf8'));
console.log(r.problems.length);" 2>/dev/null || echo ERR; }
echo "checkTree real ledger problems=$(CHECK REQUIREMENTS.md) (want 0)"
for m in r292-own-home r292-retired r292-unknown r292-duplicate r293-missing r293-done r293-frozen-empty r293-retired-empty r293-whitespace r294-proposed r294-retired dup-status dup-also; do
  echo "checkTree $m problems=$(CHECK $T/$m.md) (want >0)"
done
echo "checkTree four legal status forms problems=$(CHECK $T/legal.md) (want 0)"
for m in proof-old-home proof-status proof-also-drop proof-new-rows-swapped; do
  echo "proof $m exit=$(PROVE $T/$m.md $INPUTS) (want 1)"
done

# tree-b.json with one label changed, committed in a scratch clone (never the lane repo).
git clone -q --no-hardlinks "$W" "$T/clone" 2>/dev/null
( cd "$T/clone" && git checkout -q "$INPUTS" && python3 - <<'EOF'
import json
p='docs/reviews/req-tree-2026-10-09/tree-b.json'; t=json.load(open(p))
t['capabilities'][0]['features'][0]['label']+=' (renamed)'
json.dump(t,open(p,'w'),indent=1,ensure_ascii=False)
EOF
git -c user.email=s@x -c user.name=seat commit -qam scratch && git rev-parse HEAD > "$T/mut.sha" )
MUT=$(cat "$T/mut.sha" 2>/dev/null)
( cd "$T/clone" && git checkout -q "$INPUTS" && python3 - <<'PYEOF'
import json
p='docs/reviews/req-tree-2026-10-09/tree-b.json'; t=json.load(open(p))
fs=t['capabilities'][0]['features']
fs.insert(1,{'id':'FEAT-999','label':'Undeclared','purpose':'not in the approved tree','status':'proposed','ids':[]})
json.dump(t,open(p,'w'),indent=1,ensure_ascii=False)
PYEOF
git -c user.email=s@x -c user.name=seat commit -qam scratch2 && git rev-parse HEAD > "$T/mut2.sha" )
MUT2=$(cat "$T/mut2.sha" 2>/dev/null)
( cd "$T/clone" && cp "$T/undeclared-heading.md" "$T/clone/REQUIREMENTS.md" && cp "$W/docs/requirements-sections-2026-10-09.md" "$T/clone/docs/requirements-sections-2026-10-09.md" && node "$W/docs/reviews/req-tree-2026-10-09/prove.mjs" --approved $BASE --inputs "$MUT2" REQUIREMENTS.md docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo "proof with an undeclared heading in both tree-b and ledger exit=$? (want 1)" )
( cd "$T/clone" && cp "$W/REQUIREMENTS.md" "$T/clone/REQUIREMENTS.md" && cp "$W/docs/requirements-sections-2026-10-09.md" "$T/clone/docs/requirements-sections-2026-10-09.md" && node "$W/docs/reviews/req-tree-2026-10-09/prove.mjs" --approved $BASE --inputs "$MUT" REQUIREMENTS.md docs/requirements-sections-2026-10-09.md >/dev/null 2>&1; echo "proof with a tree-b label changed exit=$? (want 1)" )

# Outline mutations: the tree test must fail (restored by the trap).
TEST() { node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs >/dev/null 2>&1; echo $?; }
echo "tree test on the real outline exit=$(TEST) (want 0)"
python3 - "$OUT" <<'EOF'
import sys,re
p=sys.argv[1]; L=open(p).read().split('\n')
i=next(i for i,l in enumerate(L) if re.match(r'^\|\s*[RG]-\d{3}\s*\|',l))
del L[i]; open(p,'w').write('\n'.join(L))
EOF
echo "tree test with one shared-index row deleted exit=$(TEST) (want 1)"
cp "$T/outline.bak" "$OUT"
python3 - "$OUT" <<'EOF'
import sys
p=sys.argv[1]; t=open(p).read(); i=t.find('Status: '); j=t.find('\n',i); t=t[:i]+t[j+1:] if i>=0 else t+'\nX'
open(p,'w').write(t)
EOF
echo "tree test with one status deleted exit=$(TEST) (want 1)"
cp "$T/outline.bak" "$OUT"
python3 - "$OUT" <<'PYEOF'
import sys,re
p=sys.argv[1]; L=open(p).read().split('\n')
i=next(i for i,l in enumerate(L) if re.match(r'^\|\s*[RG]-\d{3}\s*\|',l) and ', ' in l.split('|')[3])
c=L[i].split('|'); fs=c[3].strip().split(', '); c[3]=' '+', '.join(fs[1:])+' '; L[i]='|'.join(c)
open(p,'w').write('\n'.join(L))
PYEOF
echo "tree test with one sharing feature removed from an index row exit=$(TEST) (want 1)"
cp "$T/outline.bak" "$OUT"
echo "outline restored: $(git -C "$W" diff --quiet -- docs/requirements-tree.md && echo yes || echo NO)"
