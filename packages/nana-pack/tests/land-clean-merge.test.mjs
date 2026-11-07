/**
 * @module packages/nana-pack/tests/land-clean-merge.test.mjs
 * @purpose Pin supported clean merges, refusals, coverage, guidance and the accepted semantic policy limit.
 * @inputs Synthetic temporary Git repositories, literal content oracles and injected CI artifacts.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check } from './profile-fixture.mjs';
import { cleanMergeFixture, executeCleanMerge, mergeSnapshot, commit, git, gitRunner, reviewTip, regenerateFixture, separateGeneratedHunks } from './land-fixtures.mjs';
import { withReviewLedgerLock } from '../bin/review-round.mjs';
import * as C from '../lib/land-config.mjs';

const unchanged = (f, before, out) => {
 assert.equal(out.code, 1, out.text); assert.equal(out.suites, 0);
 assert.deepEqual(mergeSnapshot(f), before);
};
const refresh = f => { f.tip = git(f.feature, 'rev-parse', 'HEAD'); f.capturedMain = git(f.main, 'rev-parse', 'HEAD'); };
const refused = (f, pattern, options) => {
 const before = mergeSnapshot(f), out = executeCleanMerge(f, options);
 unchanged(f, before, out); assert.match(out.text, pattern); return out;
};

// req: R-3688
await check('M1: clean moved-main merge lands using only accepted-tip CI and review', () => {
 const f = cleanMergeFixture('m1'), source = mergeSnapshot(f);
 const out = executeCleanMerge(f); assert.equal(out.code, 0, out.text); assert.equal(out.suites, 0);
 const merged = git(f.main, 'rev-parse', 'HEAD');
 assert.deepEqual(git(f.main, 'show', '-s', '--format=%P', merged).split(' '), [f.tip, f.capturedMain]);
 assert.equal(git(f.main, 'merge-base', '--is-ancestor', f.tip, 'main'), '');
 const lists = out.calls.filter(args => args.at(-1).includes('/actions/runs?'));
 assert(lists.length >= 2); assert(lists.every(args => args.at(-1).includes(`head_sha=${f.tip}&`)));
 withReviewLedgerLock(f.home, ({ rounds, reservations }) => {
  assert(![...rounds, ...reservations].some(row => row.revision === merged));
 });
 assert.equal(git(f.feature, 'rev-parse', 'HEAD'), source.source);
 assert.equal(git(f.feature, 'status', '--porcelain'), '');
 assert.deepEqual(out.text.split(/\r?\n/).filter(line => line.startsWith(C.CLEAN_MERGE_PREFIX)),
  [`${C.CLEAN_MERGE_PREFIX} ${f.capturedMain} into ${f.tip} as ${merged}`]);
 assert.equal(out.end.outcome, 'landed');
});

// req: R-3689, R-3830
await check('M2: clean merge content matches literals and an independent ordinary merge', () => {
 const base = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\n';
 for (const kind of ['hunks', 'rename', 'added']) {
  const f = cleanMergeFixture(`m2-${kind}`, { 'shared.txt': base });
  // Honest repository settings must not select a custom default driver or disable supported rename detection.
  git(f.main, 'config', 'merge.default', 'keep'); git(f.main, 'config', 'merge.keep.driver', 'true');
  git(f.main, 'config', 'merge.renames', 'false'); git(f.main, 'config', 'merge.renormalize', 'true');
  let expected;
  if (kind === 'hunks') {
   commit(f.feature, 'shared.txt', base.replace('one\n', 'lane one\n'), 'first hunk');
   commit(f.main, 'shared.txt', base.replace('nine\n', 'main nine\n'), 'last hunk');
   expected = { 'shared.txt': 'lane one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nmain nine\n' };
  } else if (kind === 'rename') {
   git(f.feature, 'mv', 'shared.txt', 'renamed.txt'); git(f.feature, 'commit', '-m', 'rename');
   commit(f.main, 'shared.txt', base.replace('nine\n', 'main nine\n'), 'edit renamed input');
   expected = { 'renamed.txt': 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nmain nine\n' };
  } else {
   commit(f.feature, 'shared.txt', 'lane edit\n', 'edit'); commit(f.main, 'new.txt', 'main added\n', 'add');
   expected = { 'shared.txt': 'lane edit\n', 'new.txt': 'main added\n' };
  }
  refresh(f);
  const clone = path.join(f.root, 'oracle'); git(f.root, 'clone', '--no-hardlinks', f.main, clone);
  git(clone, 'config', 'user.name', 'Synthetic'); git(clone, 'config', 'user.email', 'synthetic@example.invalid');
  git(clone, 'checkout', '--detach', f.tip); git(clone, 'merge', '--no-ff', '--no-edit', f.capturedMain);
  const out = executeCleanMerge(f); assert.equal(out.code, 0, out.text);
  for (const [file, text] of Object.entries(expected)) {
   assert.equal(gitRunner(f.main, ['show', `HEAD:${file}`]).stdout, text);
   assert.equal(gitRunner(clone, ['show', `HEAD:${file}`]).stdout, text);
  }
  assert.equal(git(f.main, 'rev-parse', 'HEAD^{tree}'), git(clone, 'rev-parse', 'HEAD^{tree}'));
  if (kind === 'rename') assert(!fs.existsSync(path.join(f.main, 'shared.txt')));
 }
});

// req: R-3690
await check('M3: unsupported attributes and malformed or failing merge-tree refuse unchanged', () => {
 const f = cleanMergeFixture('m3-driver', { '.gitattributes': 'base.txt merge=keep\n' });
 git(f.main, 'config', 'merge.keep.driver', 'true'); git(f.main, 'config', 'core.autocrlf', 'true');
 commit(f.feature, 'base.txt', 'lane\n', 'lane hunk'); commit(f.main, 'base.txt', 'main\n', 'main hunk'); refresh(f);
 const driver = refused(f, /base.txt/); assert.match(driver.text, /unsupported/i);
 const attributes = cleanMergeFixture('m3-attributes');
 commit(attributes.main, '.gitattributes', '*.txt text\n', 'attributes'); refresh(attributes);
 refused(attributes, /\.gitattributes.*unsupported|unsupported.*\.gitattributes/i);
 for (const result of [{status:129,stderr:'unsupported option'}, {status:0,stdout:''},
  {status:0,stdout:'not a tree\n'}, {status:1,stdout:`${'a'.repeat(40)}\n`},
  {status:0,stdout:`${'a'.repeat(40)}\nextra\n`}]) {
  const bad = cleanMergeFixture('m3-git');
  refused(bad, /git merge-tree/, { runGit: (cwd, args) => args.includes('merge-tree') ? result : gitRunner(cwd, args) });
 }
 // Valid line transports remain clean: CRLF, trailing space/tab and no final newline.
 for (const mode of ['crlf', 'space', 'no-final']) {
  const valid = cleanMergeFixture(`m3-${mode}`);
  const out = executeCleanMerge(valid, {runGit:(cwd,args)=>{
   const r=gitRunner(cwd,args); if(!args.includes('merge-tree') || r.status!==0) return r;
   const id=r.stdout.trim(); return {...r,stdout: mode==='crlf'?`${id}\r\n`:mode==='space'?`${id} \t\n`:id};
  }}); assert.equal(out.code,0,out.text);
 }
});

// req: R-3690
await check('M10: rename destination merge driver refuses before merge-tree unchanged', () => {
 const base = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\n';
 const f = cleanMergeFixture('m10', { 'old.txt': base, '.gitattributes': 'new.txt merge=keep\n' });
 git(f.main, 'config', 'merge.keep.driver', 'true');
 git(f.feature, 'mv', 'old.txt', 'new.txt');
 commit(f.feature, 'new.txt', base.replace('one\n', 'lane one\n'), 'rename and edit');
 commit(f.main, 'old.txt', base.replace('nine\n', 'main nine\n'), 'main edit'); refresh(f);
 let merges = 0;
 const out = refused(f, /unsupported.*new.txt.*merge attribute/, { runGit: (cwd, args) => {
  if (args.includes('merge-tree')) merges++;
  return gitRunner(cwd, args);
 }});
 assert.equal(merges, 0); assert.equal(out.calls.length, 0);
});

// req: R-3697, R-3828, R-3834
await check('M11: separate-hunk generated changes land exact real-generator bytes', () => {
 for (const file of C.CLEAN_MERGE_GENERATED_PATHS) {
  const f = regenerateFixture('m11', []);
  assert.equal(separateGeneratedHunks(f,[file]).status,0);
  const out = executeCleanMerge(f);
  assert.equal(out.code,0,out.text); assert.equal(out.suites,0);
  assert.equal(fs.readFileSync(path.join(f.main,file),'utf8'),f.expected[file]);
  assert(out.text.includes(file));
  const merged=git(f.main,'rev-parse','HEAD');
  assert(out.calls.filter(args=>args.at(-1).includes('/actions/runs?')).every(args=>args.at(-1).includes(`head_sha=${f.tip}&`)));
  withReviewLedgerLock(f.home,({rounds,reservations})=>assert(![...rounds,...reservations].some(row=>row.revision===merged)));
 }
 assert.deepEqual(C.CLEAN_MERGE_GENERATED_PATHS, ['docs/code-map.md', 'docs/requirements-tree.md']);
});

// req: R-3688
await check('M12: descendant main already containing the accepted tip refuses unchanged', () => {
 const f = cleanMergeFixture('m12');
 git(f.main, 'merge', '--no-ff', '--no-edit', f.tip);
 commit(f.main, 'later.txt', 'later\n', 'main advanced after land'); refresh(f);
 const out = refused(f, /already contained/); assert.equal(out.calls.length, 0);
});

// req: R-3691, R-3830
await check('M4: conflict names paths and the merge-review-CI remedy before any CI read', () => {
 const f = cleanMergeFixture('m4'); commit(f.feature, 'base.txt', 'lane\n', 'lane conflict');
 commit(f.main, 'base.txt', 'main\n', 'main conflict'); refresh(f);
 const out = refused(f, /base.txt/); assert(out.text.includes(C.CLEAN_MERGE_REMEDY));
 assert.match(out.text,/conflict/i); assert.equal(out.calls.length, 0);
});

// req: R-3692
await check('M5: merge eligibility requires applicable CI, suite proof and unchanged proof paths on both sides', () => {
 const noOrigin = cleanMergeFixture('m5-origin', {}, {origin:null});
 refused(noOrigin,/CI.*no origin|no origin.*CI/);
 refused(cleanMergeFixture('m5-record'), /clean merge needs proven suite: CI suite records could not be read/, {records:false});
 for (const [side, action] of [['lane','runner'], ['main','runner'], ['main','delete'], ['main','rename']]) {
  const f=cleanMergeFixture(`m5-${side}-${action}`), dir=side==='lane'?f.feature:f.main;
  if(action==='runner') {fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});commit(dir,'scripts/test.mjs','changed\n','runner');}
  else {git(dir,action==='delete'?'rm':'mv','.github/workflows/ci.yml',...(action==='rename'?['.github/workflows/renamed.yml']:[]));git(dir,'commit','-m',action);}
  refresh(f); const out=refused(f,new RegExp(`${side}.*proof|proof.*${side}`)); assert.equal(out.calls.length,0);
 }
});

// req: R-3693
await check('M6: uncovered lane commits including a lane-authored merge remain refused', () => {
 for(const kind of ['commit','merge']) {
  const f=cleanMergeFixture(`m6-${kind}`); const accepted=reviewTip(f.feature,f.home); f.reviewed=[`${accepted}=item`];
  if(kind==='commit') commit(f.feature,'unreviewed.txt','unreviewed\n','unreviewed commit');
  else {
   git(f.feature,'merge','--no-ff','--no-edit',f.capturedMain);
   commit(f.main,'later.txt','later main\n','later main');
  }
  refresh(f); const out=refused(f,/uncovered commits/); assert(out.text.includes(f.tip));
 }
});

// req: R-3695
await check('M8: accepted policy limit lands a textually clean but semantically broken merge', () => {
 const f=cleanMergeFixture('m8', {'a.mjs':'export const oldName = () => 1;\n'});
 commit(f.feature,'a.mjs','export const newName = () => 1;\n','rename export');
 const moduleName='./a.mjs';
 commit(f.main,'b.mjs',`import { oldName } from ${JSON.stringify(moduleName)}; console.log(oldName());\n`,'new caller'); refresh(f);
 for(const [cwd,file] of [[f.feature,'a.mjs'],[f.main,'b.mjs']]) assert.equal(spawnSync(process.execPath,[file],{cwd,timeout:10000}).status,0);
 const out=executeCleanMerge(f); assert.equal(out.code,0,out.text);
 const broken=spawnSync(process.execPath,['b.mjs'],{cwd:f.main,encoding:'utf8',timeout:10000});
 assert.notEqual(broken.status,0); assert.match(broken.stderr,/does not provide an export named 'oldName'/);
});

// req: R-3696, R-3712, R-3832
await check('M9: shared guidance, rendered region, README and ruling agree on the exemption', () => {
 const read=rel=>fs.readFileSync(new URL(`../../../${rel}`,import.meta.url),'utf8');
 const shared=read('templates/_shared/working-under-nana-pi.md'), agents=read('AGENTS.md');
 const begin='<!-- nana:working-under-nana-pi begin -->\n', end='<!-- nana:working-under-nana-pi end -->';
 assert.equal(agents.split(begin)[1].split(end)[0],shared);
 for(const name of ['Review ladder','Land checklist']) {
  const bullet=shared.split('\n').find(line=>line.startsWith(`- ${name}:`));
  assert.match(bullet,/without conflict|conflict-free/); assert(!bullet.includes('there are no exemptions'));
 }
 for(const sentence of shared.split(/(?<=\.)\s+/).filter(s=>/every later commit/i.test(s))) assert.match(sentence,/lane authors/);
 assert(shared.includes("In nana-pi, lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands."));
 const readme=read('packages/nana-pack/README.md');
 for(const phrase of ['without new CI or review','merge.renormalize=false','check-attr --source','git ≥ 2.40','bors-ng']) assert(readme.includes(phrase),phrase);
 const exception='a conflict only in the generated files the land contract names, rebuilt by their own generators, counts as no conflict';
 for(const text of [shared,readme])assert(text.includes(exception),exception);
 const ruling='- 2026-11-02: An independent reviewer accepts every revision that reaches main. The one exception: when nana-land merges current main into an accepted tip whose CI passed and git finds no conflict, that merge lands without new CI or review; a generated file the land contract names, changed on both sides and rebuilt by its own generator, counts as no conflict. Nobody commits to main directly. Notes go in before the final round, and nothing is written after a land.';
 const rulings=read('packages/nana-pack/rules/nana-rulings.md');
 assert.equal(rulings.split('\n').filter(line=>line===ruling).length,1);
 assert(!rulings.includes('- 2026-10-10: An independent reviewer'));
});

// req: R-3697
await check('seal: clean-merge vocabulary and conflict-name cap are declared once', () => {
 assert.equal(C.CLEAN_MERGE_MESSAGE,'nana-land: merge current main into accepted tip');
 assert.equal(C.CLEAN_MERGE_PREFIX,'merged main:'); assert.equal(C.CLEAN_MERGE_NAME_CAP,10);
 assert.equal(C.CLEAN_MERGE_REMEDY,'merge main into the lane, then review and CI that tip');
 assert.deepEqual(C.CLEAN_MERGE_GIT_CONFIG,['merge.renormalize=false','merge.default=text','merge.renames=true']);
 assert.deepEqual(C.CLEAN_MERGE_REASONS,{
  conflict:'merge conflict', unsupported:'unsupported merge semantics', git:'git merge-tree failed',
  noCi:'clean merge needs applicable CI', suite:'clean merge needs proven suite',
  proof:'clean merge proof path changed', ciChanged:'clean merge CI changed before lock',
 });
});
