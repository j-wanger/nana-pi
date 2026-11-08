/**
 * @module packages/nana-knowledge/tests/pull-cut.test.mjs
 * @purpose Prove prompt-time knowledge delivery is absent while explicit query retains its pointers.
 * @inputs Package manifests, extension sources and an OS-temporary built index.
 * @outputs Bounded awaited PASS or FAIL result.
 * @effects disk (temporary fixture), process (build and query children)
 * @errors Assertions fail the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { check } from '../../nana-pack/tests/profile-fixture.mjs';
import { tmpDir } from "./tmp-dir.mjs";
const root = fileURLToPath(new URL('../../../', import.meta.url));
// req: R-3860
await check('R-3860: prompts have no knowledge producer and explicit query retains pointers', async () => {
 const home = tmpDir(path.join(os.tmpdir(), 'pull-cut-'));
 try {
  const notes = path.join(home, 'notes'); fs.mkdirSync(notes);
  fs.writeFileSync(path.join(notes, 'zircon.md'), '# Zircon retrieval\nZircon retrieval evidence.\n');
  fs.writeFileSync(path.join(home, 'sources.json'), JSON.stringify({ roots: [{ path: notes, kind: 'articles' }] }));
  const cli = path.join(root, 'packages/nana-knowledge/bin/nana-knowledge.ts');
  const run = args => {
   const r = spawnSync(process.execPath, [cli, ...args], { env: { ...process.env, NANA_KNOWLEDGE_HOME: home }, encoding: 'utf8', timeout: 20000 });
   assert.equal(r.status, 0, r.stderr); return r.stdout;
  };
  run(['build']);
  assert.equal(run(['query', 'zircon retrieval']), `- Zircon retrieval — ${notes}/zircon.md — # Zircon retrieval Zircon retrieval evidence.\n`);
  for (const manifest of ['package.json', 'packages/nana-knowledge/package.json']) {
   const pkg = JSON.parse(fs.readFileSync(path.join(root, manifest), 'utf8'));
   for (const directory of pkg.pi?.extensions ?? []) {
    const dir = path.resolve(root, path.dirname(manifest), directory);
    for (const file of fs.readdirSync(dir)) {
     const source = fs.readFileSync(path.join(dir, file), 'utf8');
     assert.ok(!source.includes('customType: "nana-knowledge"'), `${manifest}: knowledge prompt producer`);
    }
   }
  }
 } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
