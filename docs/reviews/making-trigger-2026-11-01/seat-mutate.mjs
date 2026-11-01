#!/usr/bin/env node
// Synthetic wrong-code pairs; the suite never imports or executes this lane script.
import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const test='packages/nana-pack/tests/memory-run.test.mjs';
const land='packages/nana-pack/bin/nana-land.mjs';
const recovery='packages/nana-pack/tests/memory-run-recovery.test.mjs';
const one=(file,anchor,replacement)=>({file,anchor,replacement,times:1});
const pairs=[
 {n:'torn-file',name:'unparseable project JSON aborts reads',edits:[one('packages/nana-pack/lib/profile-store.mjs','if(!(error instanceof SyntaxError)||!onUnparseable)throw error;onUnparseable();return undefined;','throw error;')],tests:[recovery],expectRed:[/^R-3291: torn records/,/^R-3291: empty seen/]},
 {n:'timeout-headroom',name:'a call starts without its full timeout remaining',edits:[one('packages/nana-pack/lib/memory-run.mjs','now().getTime()-started+TIMEOUT_MS>MAX_RUN_MS','now().getTime()-started>=MAX_RUN_MS')],tests:[recovery],expectRed:[/^R-3303:/]},
 {n:'merge-wait',name:'the second local clone lock never waits',edits:[one('packages/nana-pack/lib/memory-run.mjs','{waitMs:MERGE_LOCK_WAIT_MS}','{waitMs:0}')],tests:[recovery],expectRed:[/^R-3294:/]},
 {n:'merge-outcome',name:'a merge error is mislabeled busy',edits:[one('packages/nana-pack/lib/memory-run.mjs','error.message===PROFILE_WORDS.locked?W.busy:W.mergeFailed','W.busy')],tests:[recovery],expectRed:[/^R-3291: torn records/]},
 {n:'never-overwrite',name:'publication replaces an existing file',edits:[one('packages/nana-pack/lib/profile-store.mjs','fs.linkSync(scratch,target);','fs.copyFileSync(scratch,target);')],tests:[recovery],expectRed:[/^R-3291: torn records/]},
 {n:'8-isolation',name:'a throwing starter changes the land verdict',edits:[one(land,'catch { line = MEMORY_WORDS.notStarted; }','catch (error) { throw error; }')],tests:[test],expectRed:[/^R-3297:/]},
 {n:'8-placement',name:'the starter runs before the merge',edits:[one(land,'const result = runRecordedLand(options);','let earlyLine; try { if (lane && options.startMemory) earlyLine = options.startMemory({repo:path.resolve(options.main),lane}); } catch { earlyLine = MEMORY_WORDS.notStarted; }\n const result = runRecordedLand(options);'),one(land,'try { line = options.startMemory({repo:path.resolve(options.main),lane}); }','try { line = earlyLine; }')],tests:[test],expectRed:[/^R-3297:/]},
 {n:'2-split',name:'failed calls are marked done like malformed replies',edits:[one('packages/nana-pack/lib/memory-shaping.mjs',"else { counts.failed += batch.length; counts.unsent += options.unitSource ? batch.length : 0;", "else { for (const unit of batch) done(unit, 'unclassified'); counts.failed += batch.length; counts.unsent += options.unitSource ? batch.length : 0;")],tests:[test],expectRed:[/^R-3291:/],alsoRed:[/^R-3295:/]},
 {n:'3-unknown',name:'unknown usage costs zero tokens',edits:[one('packages/nana-pack/lib/memory-run-config.mjs','export const UNKNOWN_USAGE_CHARGE=100000;','export const UNKNOWN_USAGE_CHARGE=0;')],tests:[test],expectRed:[/^R-3292:/]},
 {n:'4-start',name:'the start instant does not filter old owner units',edits:[one('packages/nana-pack/lib/memory-making.mjs','const afterStart = !options.since || Date.parse(timestamp) >= Date.parse(options.since);','const afterStart = true;')],tests:[test],expectRed:[/^R-3293:/]}
];
process.exitCode=await runMutations({lane:'making-trigger',self:import.meta.url,tip:'feat/making-trigger',pairs});
