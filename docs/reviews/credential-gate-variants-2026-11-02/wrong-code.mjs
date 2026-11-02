// Builder wrong-code probes: execute only the in-process gate test in an OS-temp copy.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
const folder = 'docs/reviews/credential-gate-variants-2026-11-02/';
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'credential-variants-wrong-'));
const configPath = 'packages/nana-pack/lib/credential-gate-config.mjs';
const gatePath = 'packages/nana-pack/extensions/nana-gate.ts';
const base = '7d5f8ea4';
const original = (file) => {
  const result = spawnSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('base read failed');
  return result.stdout;
};
try {
  fs.cpSync('packages/nana-pack', path.join(scratch, 'packages/nana-pack'), { recursive: true });
  const source = original(configPath);
  fs.writeFileSync(path.join(scratch, configPath), source);
  fs.writeFileSync(path.join(scratch, gatePath), original(gatePath));
  const record = folder + 'wrong-code.txt';
  fs.writeFileSync(record, `Base code: ${base}; new tests, unchanged assertions.\n`);
  const run = (label) => {
    const result = spawnSync(process.execPath, ['packages/nana-pack/tests/credential-gate.test.mjs'], {
      cwd: scratch, encoding: 'utf8', timeout: 30_000, env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.split(scratch).join('<scratch>');
    fs.appendFileSync(record, `\n${label}: exit ${result.status}\n${output}`);
    return { code: result.status, output };
  };
  const narrow = run('Base narrow patterns and plain-space join');
  if (narrow.code !== 1 || !narrow.output.includes('FAIL M1:') || !narrow.output.includes('PASS M2:')) throw new Error('unexpected base result');
  const test = fs.readFileSync('packages/nana-pack/tests/credential-gate.test.mjs', 'utf8');
  const list = test.slice(test.indexOf('  assert.deepEqual(CREDENTIAL_PATTERNS, [') + '  assert.deepEqual(CREDENTIAL_PATTERNS, '.length, test.indexOf('\n  ]);') + '\n  ]'.length);
  // Obvious wrong implementation: widened helper rules but the base's lossy plain-space join.
  fs.writeFileSync(path.join(scratch, configPath), source.slice(0, source.indexOf('export const CREDENTIAL_PATTERNS')) + `export const CREDENTIAL_PATTERNS = Object.freeze(${list});\n`);
  const wide = run('Wide helper patterns, base plain-space join');
  if (wide.code !== 1 || !wide.output.includes('FAIL M2:') || !wide.output.includes('--file "get secrets" erase')) throw new Error('M2 did not catch the wrong join');
  console.log('Base M1 red, M2 green; wide patterns with plain join M1/M2 red; exits 1 recorded.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
