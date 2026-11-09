/**
 * @module packages/nana-pack/tests/memory-cut-guidance.test.mjs
 * @purpose Prove scaffolds and adoption teach explicit search without changing other runtime contracts.
 * @inputs Checkout template sources, copier, shared guidance and project adoption helper.
 * @outputs One awaited bounded PASS or FAIL case.
 * @effects disk (OS-temporary templates/projects), process (bounded copier children)
 * @errors Assertions or copier failures fail the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { check } from './profile-fixture.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { refreshWorkingRegion } from '../../nana-setup/lib/project.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
function judge(text) {
 const rows = text.split(/\r?\n/).filter(line => line.startsWith('| '));
 // Other runtime details are pinned by templates-render; this matrix no longer repeats a search cell per runtime.
 assert.ok(text.includes('Knowledge search: explicit `nana-knowledge query` only, no automatic pull.'));
 const supported = rows.filter(line => /^\| (?:Claude Code|pi )/.test(line));
 assert.equal(supported.length, 3);
 assert.ok(supported.some(row => row.includes('Same pi extensions')));
 assert.ok(!text.includes('`nana-knowledge` extension (`before_agent_start`)'));
}
// req: R-3867
await check('R-3867: scaffold and adoption guidance changes only explicit knowledge search', async () => {
 const td = tmpDir(path.join(os.tmpdir(), 'cut-guidance-'));
 try {
  const source = path.join(td, 'source'); fs.mkdirSync(source);
  fs.copyFileSync(path.join(root, 'copier.yml'), path.join(source, 'copier.yml'));
  fs.cpSync(path.join(root, 'templates'), path.join(source, 'templates'), { recursive: true });
  for (const language of ['python', 'typescript']) for (const adopt of ['false', 'true']) {
   const dest = path.join(td, `${language}-${adopt}`);
   const result = spawnSync('uvx', ['copier', 'copy', '--trust', '--defaults', '-d', `language=${language}`, '-d', 'project_name=Synthetic', '-d', `adopt=${adopt}`, source, dest], { encoding: 'utf8', timeout: 20000 });
   assert.equal(result.status, 0, result.stderr);
   judge(fs.readFileSync(path.join(dest, 'AGENTS.md'), 'utf8'));
  }
  const begin = '<!-- nana:working-under-nana-pi begin -->', end = '<!-- nana:working-under-nana-pi end -->';
  for (const [index, [eol, final]] of [['\n', true], ['\r\n', true], ['\n', false]].entries()) {
   const project = path.join(td, `existing-${index}`); fs.mkdirSync(project);
   const prefix = `# Existing project \t${eol}${eol}`, suffix = `${eol}## Owner rules \t${eol}Keep this text.${final ? eol : ''}`;
   const file = path.join(project, 'AGENTS.md'); fs.writeFileSync(file, `${prefix}${begin}${eol}old managed guidance${eol}${end}${suffix}`);
   refreshWorkingRegion(project);
   const after = fs.readFileSync(file, 'utf8');
   assert.equal(after.slice(0, after.indexOf(begin)), prefix);
   assert.equal(after.slice(after.indexOf(end) + end.length), suffix);
   judge(after);
  }
 } finally { fs.rmSync(td, { recursive: true, force: true }); }
});
