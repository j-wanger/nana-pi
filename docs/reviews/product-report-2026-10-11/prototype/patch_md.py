import json
P = '/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/report/'
t = open(P + 'template.html').read()

def rep(a, b):
    global t
    assert t.count(a) == 1, (t.count(a), a[:70])
    t = t.replace(a, b)

MD = r"""function md(s){
  const out = []; const parts = String(s==null?'':s).split(/(`[^`]+`|\*\*[^*]+\*\*)/);
  for (const p of parts){
    if (!p) continue;
    if (p.length>1 && p.startsWith('`') && p.endsWith('`')) out.push(h('code',null,p.slice(1,-1)));
    else if (p.length>3 && p.startsWith('**') && p.endsWith('**')) out.push(h('b',null,p.slice(2,-2)));
    else out.push(p);
  }
  return out;
}
const store = {"""
rep("const store = {", MD)
rep("box.append(m ? h('p',null,h('b',null,m[1]+' '),m[2]) : h('p',null,t));",
    "box.append(m ? h('p',null,h('b',null,m[1]+' '),md(m[2])) : h('p',null,md(t)));")
rep("h('p',{style:'margin-top:8px;font-size:1.05rem'}, purpose.replace(/\\s*\\n\\s*/g,' '))",
    "h('p',{style:'margin-top:8px;font-size:1.05rem'}, md(purpose.replace(/\\s*\\n\\s*/g,' ')))")
rep("h('b',null,'Current priority: '), D.product.priority)", "h('b',null,'Current priority: '), md(D.product.priority))")
rep("outcomes.map(o=>h('li',null,o.replace(/^\\d\\. /,'')))", "outcomes.map(o=>h('li',null,md(o.replace(/^\\d\\. /,''))))")
rep("h('td',{class:'req-text'},q.text.length>420?q.text.slice(0,420)+'…':q.text)",
    "h('td',{class:'req-text'},md(q.text.length>420?q.text.slice(0,420)+'…':q.text))")
rep("h('td',{class:'req-text'},h('b',null,a.title+'. '),a.text)", "h('td',{class:'req-text'},h('b',null,md(a.title+'. ')),md(a.text))")
rep("D.handoff.residuals.map(r=>h('li',null,r))", "D.handoff.residuals.map(r=>h('li',null,md(r)))")
rep("map(l=>h('li',null,l.slice(2)))", "map(l=>h('li',null,md(l.slice(2))))")
rep("h('td',{class:'req-text'}, r.requirement, r.shared_with.length", "h('td',{class:'req-text'}, md(r.requirement), r.shared_with.length")
rep("h('td',{class:'req-text'},r.requirement,\n", "h('td',{class:'req-text'},md(r.requirement),\n")
rep("h('b',null,'Purpose in the ledger: '), f.purpose)", "h('b',null,'Purpose in the ledger: '), md(f.purpose))")
rep("(D.share_reasons[r+'>'+fid]||R[r].requirement)", "md(D.share_reasons[r+'>'+fid]||R[r].requirement)")
rep("' from ', m.from, ': ', m.reason)", "' from ', m.from, ': ', md(m.reason))")
rep("h('td',{class:'req-text'},m.reason)", "h('td',{class:'req-text'},md(m.reason))")
rep("h('b',null,i.title+'. '), i.severity_view,", "h('b',null,md(i.title+'. ')), md(i.severity_view),")
rep("h('span',{class:'pill '+(i.verdict==='CONFIRMED'?'crit':'warn')}", "h('span',{class:'pill '+(i.verdict==='CONFIRMED'?'warn':'plain')}")
open(P + 'template.html', 'w').write(t)

d = json.load(open(P + 'data.json')); w = json.load(open(P + 'assess.json'))
d['assess'] = {f['id']: f for f in w['features']}; d['synth'] = w['synth']
blob = json.dumps(d, ensure_ascii=False).replace('<', '\\u003c'); json.loads(blob)
open(P + 'nana-pi-product-ledger.html', 'w').write(t.replace('/*DATA*/', blob))
print('built', t.count('md('))
