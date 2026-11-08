/**
 * @module packages/nana-pack/tests/experiment-cut.test.mjs
 * @purpose Pin finished experiment removal and reject remaining live references.
 * @inputs Tracked paths, package scripts and tracked text outside preserved history.
 * @outputs One awaited bounded PASS or FAIL case.
 * @effects disk (reads checkout and temporary fixtures), process (git inventory)
 * @errors Assertions or bounded child failures fail the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { check } from './profile-fixture.mjs';
import { tmpDir } from "./tmp-dir.mjs";
const root = fileURLToPath(new URL('../../../', import.meta.url));
const moduleName = words => `${words.join('-')}.mjs`;
const modules = [['memory','replay'], ['memory','replay','config'], ['memory','replay','context'], ['memory','score'], ['outcome','meter'], ['outcome','meter','config'], ['outcome','score'], ['outcome','compare'], ['writing','trial','extractor'], ['blast','radius'], ['blast','radius','config'], ['requirement','rows'], ['tree','kill','scan']].map(moduleName);
const commands = [['memory','replay'], ['memory','score'], ['memory','meter'], ['memory','meter-score'], ['memory','meter-compare'], ['req','rows']].map(words => words.join(':'));
const liveLines = text => text.split(/\r?\n/).filter(line => !/\|\s*retired\s*\||^Artifact:.*· retired:/.test(line));
const mentions = text => liveLines(text).some(line => [...modules, ...commands].some(name => line.includes(name)));
// req: R-3863
await check('R-3863: finished experiments and their live references are gone', async () => {
 const td = tmpDir(path.join(os.tmpdir(), 'experiment-cut-'));
 try {
  for (const [eol, final] of [['\n', true], ['\r\n', true], ['\n', false]]) {
   const file = path.join(td, 'lines');
   fs.writeFileSync(file, [`| R-001 | removed | retired | ${modules[0]} | \t`, 'surviving text \t'].join(eol) + (final ? eol : ''));
   assert.equal(mentions(fs.readFileSync(file, 'utf8')), false);
   fs.appendFileSync(file, `${eol}live import ${modules[0]} \t`);
   assert.equal(mentions(fs.readFileSync(file, 'utf8')), true);
  }
  const inventory = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', timeout: 20000 });
  assert.equal(inventory.status, 0, inventory.stderr);
  const problems = [];
  for (const file of inventory.stdout.split('\0').filter(Boolean)) {
   if (/^(?:docs\/(?:plan|reviews|sessions)|research)\//.test(file)) continue;
   if (modules.includes(path.basename(file))) problems.push(`tracked removed module: ${file}`);
   const absolute = path.join(root, file);
   if (!fs.existsSync(absolute) || fs.lstatSync(absolute).isSymbolicLink()) continue;
   const data = fs.readFileSync(absolute);
   if (!data.includes(0) && mentions(data.toString('utf8'))) problems.push(`live reference: ${file}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const command of commands) assert.ok(!(command in pkg.scripts), command);
  assert.deepEqual(problems, []);
 } finally { fs.rmSync(td, { recursive: true, force: true }); }
});
