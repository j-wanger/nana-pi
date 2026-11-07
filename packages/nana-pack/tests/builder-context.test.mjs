/**
 * @module packages/nana-pack/tests/builder-context.test.mjs
 * @purpose Pin measured builder lessons, fix-card precedent exceptions and helper guidance.
 * @inputs Repository prompts and launchers, OS-temp git worktrees and fake builder commands.
 * @outputs Seven requirement-tagged checks.
 * @effects disk (OS-temp fixtures), process (bounded git and fake worker children).
 * @errors Assertion failures exit nonzero; each case has a time limit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { FIX_CARD_LINE } from '../lib/brief-config.mjs';
import { checkBriefForLaunch } from '../lib/brief-precedent.mjs';
import { writeFakePi } from './fake-pi.mjs';

const pack = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => fs.readFileSync(path.join(pack, file), 'utf8');
const preamble = () => read('prompts/builder-preamble.md');
const planner = () => read('prompts/planner.md');
const options = { timeout: 60_000 };
const missing = 'pi-worker: lane refused: Precedent section needs a Precedent heading, or a line holding only Precedent:, then one entry in either form: - <path> or - none: <reason>';
const malformed = 'pi-worker: lane refused: Precedent section needs one entry in either form: - <path> or - none: <reason>';
const privateSentence = 'If it is private, drop the leading underscore, update its existing callers, and import the public name; never import a private name from another module. A move to a shared module needs the brief to name it.';
function fixture() {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'builder-context-'));
 const repo = path.join(root, 'repo'), lane = path.join(root, 'lane'), bin = path.join(root, 'bin'), agent = path.join(root, 'agent'), home = path.join(root, 'home');
 for (const d of [repo, bin, agent, home]) fs.mkdirSync(d);
 const git = (cwd, args) => {
  const r = spawnSync('git', ['-c','user.name=Fixture','-c','user.email=fixture@example.invalid',...args], { cwd, encoding:'utf8', timeout:10_000 });
  assert.equal(r.status, 0, r.stderr); return r.stdout;
 };
 git(repo, ['init','-q','-b','main']); fs.writeFileSync(path.join(repo,'seed'), 'seed'); git(repo,['add','seed']); git(repo,['commit','-qm','seed']);
 git(repo,['worktree','add','-q','-b','feat/example',lane]);
 const capture = path.join(root,'capture'), briefPath = path.join(root,'brief.md');
 const body = `const fs=require('node:fs');const a=process.argv.slice(2);const flag=a.includes('--append-system-prompt-file')?'--append-system-prompt-file':'--append-system-prompt';fs.copyFileSync(a[a.indexOf(flag)+1],process.env.BC_CAPTURE);process.stdout.write('done\\n');`;
 if (process.platform === 'win32') { writeFakePi(bin,body); fs.writeFileSync(path.join(bin,'claude.cmd'), `@echo off\r\n"${process.execPath}" "${path.join(bin,'fake.cjs')}" %*\r\n`); }
 else for (const name of ['pi','claude']) fs.writeFileSync(path.join(bin,name), `#!${process.execPath}\n${body}\n`, {mode:0o755});
 fs.writeFileSync(path.join(bin,'fake.cjs'),body);
 fs.writeFileSync(path.join(agent,'nana-pack.json'), JSON.stringify({roster:{scout:null,builder:{provider:'fake',model:'fake',thinking:null},largerBuilder:{runtime:'claude-code',model:'fable'},reviewer:{provider:'fake',model:'review',thinking:null},land:null}}));
 return { root, briefPath, capture,
  check(text, laneSize) { fs.writeFileSync(briefPath,text); return checkBriefForLaunch({briefPath,worktreeRoot:lane,laneSize,gitRunner:args=>git(lane,args)}); },
  run(text,size) { fs.writeFileSync(briefPath,text); return spawnSync(process.execPath,[path.join(pack,'bin/pi-worker.mjs'),'--lane','example','--brief',briefPath,'--lane-size',size,'--out',path.join(root,'out'),'--poll','0.1'],{cwd:lane,encoding:'utf8',timeout:20_000,env:{...process.env,HOME:home,USERPROFILE:home,PI_CODING_AGENT_DIR:agent,CLAUDE_CONFIG_DIR:home,PATH:`${bin}${path.delimiter}${process.env.PATH}`,BC_CAPTURE:capture}}); },
  close() { fs.rmSync(root,{recursive:true,force:true}); }
 };
}
// req: R-3733
test('R-3733: frozen lessons end the preamble and reach both builder runtimes', options, () => {
 const text = preamble();
 const footer = text.split('## Lessons from earlier work\n')[1];
 assert.ok(footer, 'lessons heading');
 const lines = footer.trimEnd().split('\n');
 assert.equal(lines[0], 'Lessons from earlier work on this repository (project memory):');
 assert.equal(lines.length, 5);
 assert.equal(createHash('sha256').update(lines.slice(1).join('\n')+'\n').digest('hex'), '67a3531f25d4157e10f061db65c8e3c76a7612d698ed881ed37c0b66f53cc1ec');
 assert.equal(createHash('sha256').update(footer).digest('hex').slice(0,16), '6b521260dae24d4c');
 const f=fixture(); try { for(const size of ['small','larger']) { const r=f.run('Precedent:\n- seed\n',size); assert.equal(r.status,0,r.stderr); assert.ok(fs.readFileSync(f.capture,'utf8').includes(footer)); } } finally { f.close(); }
});
// req: R-3734
test('R-3734: private helpers become public without unnamed shared moves', options, () => {
 const text=preamble();
 for(const part of ['drop the leading underscore','update its existing callers','import the public name','never import a private name from another module','A move to a shared module needs the brief to name it']) assert.ok(text.includes(part),part);
 assert.ok(!text.includes('report the departure and stop'));
});
// req: R-3735
test('R-3735: fix cards without precedent launch at every lane size with one exception line', options, () => {
 assert.equal(FIX_CARD_LINE, 'Card: fix');
 const f=fixture(); try { for(const size of ['small','larger']) for(const text of ['Card: fix\n','\uFEFFCard: fix \t\r\nOther text','Other text\rCard: fix\t']) { const r=f.run(text,size); assert.equal(r.status,0,r.stderr); const lines=r.stderr.split(/\r?\n/).filter(l=>l.includes('Card: fix')); assert.equal(lines.length,1,r.stderr); assert.match(lines[0],/Precedent.*omitted/); } } finally { f.close(); }
});
// req: R-3736
test('R-3736: unmarked and malformed briefs retain exact refusals at every lane size', options, () => {
 const f=fixture(); try { for(const size of [undefined,'small','larger']) {
  for(const text of ['No card\n','Card: feature\n','Card: fixture','Text Card: fix\n']) assert.equal(f.check(text,size).line,missing);
  for(const section of ['Precedent:\n','Precedent:\n- none:\t']) assert.equal(f.check('Card: fix\r\n'+section,size).line,malformed);
  const result=f.check('Card: fix\nPrecedent:\n- missing.mjs',size);
  assert.equal(result.ok,false);
  assert.match(result.line,/^pi-worker: lane refused: Precedent entries at HEAD [0-9a-f]+: "missing.mjs" is not tracked at HEAD \(bullet: "missing.mjs"\); each Precedent bullet names one tracked path, in backticks or as its first word; commit the file, or merge main if it landed there$/);
 } } finally { f.close(); }
});
// req: R-3737
test('R-3737: planner specifies helper calls fix markers and the identical private clause', options, () => {
 const text=planner();
 assert.ok(text.includes('call <symbol> (<path:lines>) rather than re-implementing it — <what it does>'));
 assert.match(text,/small fix briefs[^\n]*`Card: fix`/);
 assert.ok(text.includes(privateSentence)); assert.ok(preamble().includes(privateSentence));
});
// req: R-3747
test('R-3747: planner requires fresh-search and map-impact caller contracts with traceback and NaN examples', options, () => {
 const text=planner();
 assert.ok(text.includes('When a change alters what a function returns or raises, list each caller found at plan time by freshly searching the repo for the function\'s name and by running the project\'s map impact command as its own must-meet line stating the caller\'s observable contract, never just "still works".'));
 assert.ok(text.includes('For example: "the report has no NaN; the CLI exits non-zero with a message, never a traceback".'));
});
// req: R-3738
test('R-3738: precedent ruling keeps plans required and exempts marked fix cards', options, () => {
 const ruling=read('rules/nana-rulings.md').split('\n').filter(l=>l.includes('Every plan and brief'));
 assert.equal(ruling.length,1);
 assert.match(ruling[0],/Card: fix.*may omit.*owner.*2026-11-06.*#338/);
 assert.ok(ruling[0].includes('plans and other briefs still require it'));
});
