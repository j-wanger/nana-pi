"""Extract every fact the decision report shows, from the lane's committed files. Prints a summary."""
import json, re, subprocess, collections, os

W = '/Users/example/nana-pi-wt/req-tree'
SP = '/private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad'
OUT = f'{SP}/report/data.json'
os.chdir(W)
L = open('REQUIREMENTS.md').read().split('\n')
rowre = re.compile(r'^\|\s*([RG]-\d{3})\s*\|')

def cells(line):
    c = line.strip()
    assert c.startswith('|') and c.endswith('|')
    parts = c[1:-1].split('|')
    return [p.strip() for p in parts]

caps, feats, subs, rows = [], {}, {}, {}
cap = feat = sub = None
pending_note = None
for i, l in enumerate(L):
    m = re.match(r'^(#{1,3}) (CAP-\d+|FEAT-\d+|SUB-\d+) · (.*)$', l)
    if m:
        lvl, hid, label = len(m.group(1)), m.group(2), m.group(3)
        if lvl == 1:
            cap = {'id': hid, 'label': label, 'purpose': '', 'outcome': '', 'features': []}; caps.append(cap); feat = sub = None
        elif lvl == 2:
            feat = {'id': hid, 'label': label, 'capability': cap['id'], 'purpose': '', 'status': '', 'also_applies': [],
                    'subgroups': [], 'rows': [], 'notes': []}
            feats[hid] = feat; cap['features'].append(hid); sub = None
        else:
            sub = {'id': hid, 'label': label, 'feature': feat['id'], 'purpose': '', 'rows': []}
            subs[hid] = sub; feat['subgroups'].append(hid)
        continue
    if l.startswith('#'):
        cap = feat = sub = None
        continue
    tgt = sub or feat or cap
    if tgt is not None:
        if l.startswith('Purpose: ') and not tgt.get('purpose'): tgt['purpose'] = l[9:]
        elif l.startswith('Outcome: ') and tgt is cap: cap['outcome'] = l[9:]
        elif l.startswith('Status: ') and feat and not sub: feat['status'] = l[8:]
        elif l.startswith('Also applies: ') and feat and not sub: feat['also_applies'] = l[14:].split(', ')
        elif l.startswith('Note (moved from old'): feat['notes'].append(l)
    mm = rowre.match(l)
    if mm and feat:
        c = cells(l)
        rid = mm.group(1)
        rows[rid] = {'id': rid, 'requirement': c[1], 'status': c[2], 'evidence': c[3], 'feature': feat['id'],
                     'subgroup': sub['id'] if sub else None, 'capability': feat['capability'], 'shared_with': []}
        (sub or feat)['rows'].append(rid)
        if sub: feat['rows'].append(rid)

for f in feats.values():
    for rid in f['also_applies']:
        rows[rid]['shared_with'].append(f['id'])

# Governance and purpose text, verbatim from the ledger.
def block(start, stop):
    a = next(i for i, l in enumerate(L) if l == start)
    b = next((i for i in range(a + 1, len(L)) if L[i].startswith('#')), len(L))
    return '\n'.join(L[a + 1:b]).strip()
gov = block('## How the tree is governed', None)
org = block('## How this file is organized', None)
purpose_block = block('## Purpose and outcomes', None)
oq = block('## Open questions', None)
omissions = block('## Deliberate omissions', None)

# Open questions: numbered items.
questions = []
for item in re.split(r'\n(?=\d+[a-z]?\. |- \()', oq):
    item = item.strip()
    if not item: continue
    m = re.match(r'^(\d+[a-z]?)\. (.*)', item, re.S)
    qid, text = (m.group(1), m.group(2)) if m else ('note', item.lstrip('- '))
    questions.append({'id': qid, 'text': re.sub(r'\s+', ' ', text), 'closed': bool(re.search(r'\(closed|closed by', text[:80]))})

# Placement review: moves with reasons.
tb = json.load(open('docs/reviews/req-tree-2026-10-09/tree-b.json'))
pr = json.load(open('docs/reviews/req-tree-2026-10-09/placement-review.json'))
up = {}
for x in pr['workflow']['upheld']: up[(x['id'], x['kind'], x['target'])] = x['reason']
for x in pr['critic_additions_verification']:
    if x['upheld']: up[(x['id'], x['kind'], x['target'])] = x['reason']
moves = [{**m, 'reason': up.get((m['id'], 'move', m['to']), '')} for m in tb['moves']]
share_reasons = {}
for (rid, kind, tgt), r in up.items():
    if kind == 'share': share_reasons[f'{rid}>{tgt}'] = r

# The 15 audit issues (astra) with the seat's verification verdicts.
ex = json.load(open(f'{SP}/explorer-data.json'))
ver = json.load(open(f'{SP}/wf-result.json'))
vmap = {v['id']: v for v in ver['issueResults']}
issues = []
for it in ex['issues']:
    v = vmap.get(it['id'], {})
    affected = [r for r in it['requirement_ids'] if r in rows]
    issues.append({'id': it['id'], 'title': it['title'], 'finding': it['finding'], 'recommendation': it['recommendation'],
                   'decision': it['decision'], 'audit_priority': it['priority'],
                   'verdict': v.get('verdict', 'CONFIRMED' if it['id'] == 'C18' else ''),
                   'fix_kind': v.get('fix_kind', 'policy-decision' if it['id'] == 'C18' else ''),
                   'severity_view': v.get('severity_view', 'ID space: 5 usable IDs left after the tree (R-295–R-299).' if it['id'] == 'C18' else ''),
                   'tracked': v.get('already_tracked', 'Open question 9' if it['id'] == 'C18' else ''),
                   'fix_sketch': v.get('fix_sketch', ''),
                   'rows': affected, 'features': sorted({rows[r]['feature'] for r in affected})})

# HANDOFF (lane copy): open asks and carried residuals.
H = open('HANDOFF.md').read()
def section(title):
    a = H.index(title); b = H.find('\n## ', a + 1)
    return H[a:b if b > 0 else None]
asks = []
for l in section('## Open for Owner').split('\n'):
    m = re.match(r'^- \*\*\[(\w+), since ([\d-]+)\] (.+?)\*\* (.*)$', l)
    if m: asks.append({'kind': m.group(1), 'since': m.group(2), 'title': m.group(3).rstrip('.'), 'text': m.group(4)})
residuals = [l[2:] for l in section('## Carried residuals').split('\n') if l.startswith('- ')]
nexts = [re.sub(r'^\d+\. ', '', l) for l in section('## Next').split('\n') if re.match(r'^\d+\. ', l)]

# Review history from the ledger.
def ledger(item):
    out = subprocess.run(['node', '/Users/example/nana-pi/packages/nana-pack/bin/review-ledger.mjs', 'report', '--item', item],
                         capture_output=True, text=True).stdout
    res = []
    for l in out.split('\n'):
        p = [x.strip() for x in l.split('|')]
        if len(p) >= 7 and p[0] == item: res.append({'item': item, 'revision': p[1][:7], 'role': p[2], 'model': p[3], 'verdict': p[6]})
    return res
reviews = sum([ledger(i) for i in ['req-tree-plan', 'req-tree', 'req-tree-b-plan', 'req-tree-b']], [])

obj = open('/Users/example/nana-agent-loop/OBJECTIVE.md').read()
objective = re.search(r'\*\*Objective \(since [^)]*\):\*\* (.*)', obj).group(1)
priority = re.search(r'\*\*Current priority \(since [^)]*\):\*\* (.*)', obj).group(1)

for f in feats.values():
    c = collections.Counter(rows[r]['status'] for r in f['rows'])
    f['counts'] = {k: c.get(k, 0) for k in ['implemented', 'untested', 'violated', 'planned', 'retired']}
    f['shared_out'] = sorted({r for r in f['rows'] if rows[r]['shared_with']})

data = {
    'meta': {'commit': subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip(),
             'branch': 'feat/req-tree', 'state': 'built and reviewed; not yet merged to main; waiting for Owner at checkpoint 2',
             'generated': '2026-10-10'},
    'product': {'purpose_block': purpose_block, 'objective': objective, 'priority': priority, 'organized': org, 'governance': gov,
                'omissions': omissions},
    'capabilities': caps, 'features': feats, 'subgroups': subs, 'rows': rows,
    'moves': moves, 'share_reasons': share_reasons, 'issues': issues, 'questions': questions,
    'handoff': {'asks': asks, 'residuals': residuals, 'next': nexts}, 'reviews': reviews,
}
json.dump(data, open(OUT, 'w'), ensure_ascii=False)
st = collections.Counter(r['status'] for r in rows.values())
print('caps', len(caps), 'features', len(feats), 'subgroups', len(subs), 'rows', len(rows), dict(st))
print('shared rows', sum(1 for r in rows.values() if r['shared_with']), 'links', sum(len(r['shared_with']) for r in rows.values()))
print('frozen', [f['id'] for f in feats.values() if f['status'].startswith('frozen')])
print('issues', len(issues), [(i['id'], i['verdict'], len(i['rows'])) for i in issues])
print('questions', len(questions), [q['id'] for q in questions])
print('asks', len(asks), 'residuals', len(residuals), 'next', len(nexts), 'reviews', len(reviews))
print('moves', len(moves), 'missing reasons', [m['id'] for m in moves if not m['reason']])
print('bytes', os.path.getsize(OUT))
