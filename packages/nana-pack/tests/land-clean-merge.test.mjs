/**
 * @module packages/nana-pack/tests/land-clean-merge.test.mjs
 * @purpose Pin computed clean-merge trees, unsupported semantics and uncovered authored commits.
 * @inputs Synthetic temporary Git repositories, literal content oracles and injected CI artifacts.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check } from './profile-fixture.mjs';
import { cleanMergeFixture, executeCleanMerge, computeCleanMerge, mergeSnapshot, commit, git, gitRunner, reviewTip } from './land-fixtures.mjs';
import * as C from '../lib/land-config.mjs';

const unchanged = (f, before, out) => {
 assert.equal(out.code, 1, out.text); assert.equal(out.suites, 0);
 assert.deepEqual(mergeSnapshot(f), before);
};
const refresh = f => { f.tip = git(f.feature, 'rev-parse', 'HEAD'); f.capturedMain = git(f.main, 'rev-parse', 'HEAD'); };
const refused = (f, pattern, options) => {
 const before = mergeSnapshot(f), out = computeCleanMerge(f, options);
 unchanged(f, before, out); assert.match(out.text, pattern); return out;
};

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
  const out = computeCleanMerge(f); assert.equal(out.code, 0, out.text);
  for (const [file, text] of Object.entries(expected)) {
   assert.equal(gitRunner(f.main, ['show', `${out.tree}:${file}`]).stdout, text);
   assert.equal(gitRunner(clone, ['show', `HEAD:${file}`]).stdout, text);
  }
  assert.equal(out.tree, git(clone, 'rev-parse', 'HEAD^{tree}'));
  if (kind === 'rename') assert(!git(f.main, 'ls-tree', '--name-only', out.tree).split('\n').includes('shared.txt'));
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
 for (const result of [{status:129,stderr:'unsupported option'}, {status:0,stdout:'not a tree\n'}]) {
  const bad = cleanMergeFixture('m3-git');
  refused(bad, /git merge-tree/, { runGit: (cwd, args) => args.includes('merge-tree') ? result : gitRunner(cwd, args) });
 }
 // Valid line transports remain clean: CRLF, trailing space/tab and no final newline.
 for (const mode of ['crlf', 'space', 'no-final']) {
  const valid = cleanMergeFixture(`m3-${mode}`);
  const out = computeCleanMerge(valid, {runGit:(cwd,args)=>{
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

// req: R-3963
await check('M12: descendant main already containing the accepted tip refuses unchanged', () => {
 const f = cleanMergeFixture('m12');
 git(f.main, 'merge', '--no-ff', '--no-edit', f.tip);
 commit(f.main, 'later.txt', 'later\n', 'main advanced after land'); refresh(f);
 const before = mergeSnapshot(f), out = executeCleanMerge(f);
 unchanged(f, before, out); assert.match(out.text, /already contained/); assert.equal(out.calls.length, 0);
});

// req: R-3691, R-3830
await check('M4: conflict names paths and the merge-review-CI remedy before any CI read', () => {
 const f = cleanMergeFixture('m4'); commit(f.feature, 'base.txt', 'lane\n', 'lane conflict');
 commit(f.main, 'base.txt', 'main\n', 'main conflict'); refresh(f);
 const out = refused(f, /base.txt/); assert(out.text.includes(C.CLEAN_MERGE_REMEDY));
 assert.match(out.text,/conflict/i); assert.equal(out.calls.length, 0);
});

// req: R-3693
await check('M6: uncovered lane commits including a lane-authored merge remain refused', () => {
 for(const kind of ['commit','merge']) {
  const f=cleanMergeFixture(`m6-${kind}`); const accepted=reviewTip(f.feature,f.home); f.reviewed=[`${accepted}=item`];
  if(kind==='commit') commit(f.feature,'unreviewed.txt','unreviewed\n','unreviewed commit');
  else {
   git(f.feature,'merge','--no-ff','--no-edit',f.capturedMain);
   fs.writeFileSync(path.join(f.feature,'lane.txt'),'hidden edit\n');
   git(f.feature,'add','lane.txt');git(f.feature,'commit','--amend','--no-edit');
  }
  refresh(f); const before=mergeSnapshot(f),out=executeCleanMerge(f);
  unchanged(f,before,out);assert.match(out.text,/uncovered commits/);assert(out.text.includes(f.tip));
 }
});
