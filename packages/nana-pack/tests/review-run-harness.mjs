/**
 * @module packages/nana-pack/tests/review-run-harness.mjs
 * @purpose Materialize a temporary process boundary for retained review-store and command-launch tests.
 * @inputs An OS-temp folder and the public review-run and review-round module URLs.
 * @outputs A temporary Node harness path exposing run and read-only project calls to fixtures.
 * @effects disk (OS-temp script)
 * @errors File errors throw; the generated harness returns the public APIs' status.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function reviewRunHarness(folder) {
  const file = join(folder, 'review-store-harness.mjs');
  writeFileSync(file, `import {runReview} from ${JSON.stringify(new URL('../lib/review-run.mjs', import.meta.url).href)};
import {project} from ${JSON.stringify(new URL('../bin/review-round.mjs', import.meta.url).href)};
const [mode,...args]=process.argv.slice(2), sep=args.indexOf('--');
const own=sep<0?args:args.slice(0,sep);
if(mode==='check') {const r=project(own);if(r.ok)console.log(r.note);else console.error(r.message);process.exitCode=r.ok?0:1;}
else if(mode==='run')process.exitCode=await runReview(own,args.slice(sep+1));
else {console.error('fixture mode must be run or check');process.exitCode=1;}
`);
  return file;
}
