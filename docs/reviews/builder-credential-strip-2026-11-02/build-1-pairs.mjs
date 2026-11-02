/**
 * @module docs/reviews/builder-credential-strip-2026-11-02/build-1-pairs.mjs
 * @purpose Record code-breaking mutation pairs for the eight must-meet checks in disposable source copies.
 * @inputs Lane checkout and its two must-meet test files.
 * @outputs Sanitized mutation output and one exit/verdict line per pair.
 * @effects disk (OS temp source copies only), process (bounded fixture tests)
 * @errors Exits 1 if a mutant survives or its named check does not fail.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'credential-pairs-'));
const pack = 'packages/nana-pack/';
// chosen: allow the complete fixture matrix, bounded below the outer evidence run.
const PAIR_MS = 180_000;
const clean = (text) => {
  for (const [from, to] of [[root.replace(/[\\/]$/, ''), '<worktree>'], [temp, '<mutation-temp>'], [os.homedir(), '<home>']]) {
    for (const form of [from, from.replaceAll('\\', '/'), from.replaceAll('\\', '\\\\')]) text = text.split(form).join(to);
  }
  return text;
};
try {
  for (const entry of ['packages/nana-pack', 'packages/nana-setup', 'scripts', 'templates/_shared', 'AGENTS.md', 'package.json', 'identity-scan.config.json']) {
    fs.cpSync(path.join(root, entry), path.join(temp, entry), { recursive: true, filter: (p) => !p.split(path.sep).includes('node_modules') });
  }
  const cases = [
    ['M1', 'lib/credential-strip.mjs', '  return env;', '  return {};', 'credential-strip.test.mjs', 'M1: builder'],
    ['M2', 'bin/review-ledger.mjs', ', ...credentialStripEnv(process.env) }', ' }', 'credential-strip.test.mjs', 'M2: reviewer'],
    ['M3', 'lib/credential-strip.mjs', '[parameters, ...CREDENTIAL_CONFIG_RESETS', '[...CREDENTIAL_CONFIG_RESETS', 'credential-strip.test.mjs', 'M3: unrelated'],
    ['M4', 'extensions/nana-gate.ts', 'if (process.env.NANA_ROLE === "worker" || process.env.NANA_ROLE === "reviewer")', 'if (false)', 'credential-gate.test.mjs', 'M4: credential'],
    ['M5', 'prompts/builder-preamble.md', 'Do not push; the seat pushes after verifying; report the tip', 'Push the builder tip', 'credential-strip.test.mjs', 'M5: shipped'],
    ['M6', 'rules/nana-rulings.md', '- 2026-11-02: In nana-pi, a tip', '- 2026-11-01: In nana-pi, a tip', 'credential-strip.test.mjs', 'M6: dated'],
    ['M7/R-3666', 'lib/credential-strip-config.mjs', "GCM_INTERACTIVE: 'never'", "GCM_INTERACTIVE: 'always'", 'credential-strip.test.mjs', 'M7: credential strip'],
    ['M7/R-3667', 'lib/credential-gate-config.mjs', 'fill|get|approve|reject', 'get|approve|reject', 'credential-gate.test.mjs', 'M7: credential gate'],
  ];
  let failed = false;
  for (const [name, relative, before, after, test, needle] of cases) {
    const target = path.join(temp, pack, relative);
    const original = fs.readFileSync(target, 'utf8');
    if (original.split(before).length !== 2) throw new Error(`mutation is not unique: ${name}`);
    fs.writeFileSync(target, original.replace(before, after));
    let result;
    try {
      const env = { ...process.env, NODE_NO_WARNINGS: '1' };
      for (const key of Object.keys(env)) if (/^(NANA_|PI_CODING_AGENT_DIR|CLAUDE_CONFIG_DIR)/.test(key)) delete env[key];
      result = spawnSync(process.execPath, ['--experimental-strip-types', path.join(temp, pack, 'tests', test)], { cwd: temp, env, encoding: 'utf8', timeout: PAIR_MS });
    } finally { fs.writeFileSync(target, original); }
    const killed = result.status === 1 && result.stdout.includes(`FAIL ${needle}`);
    console.log(`PAIR ${name}: ${relative}; code mutation; exit=${result.status}; ${killed ? 'RED' : 'SURVIVED/ERROR'}`);
    console.log(clean(result.stdout + result.stderr));
    if (!killed) failed = true;
  }
  console.log(failed ? 'PAIRS FAILED' : '8 mutation pairs: 8 RED, 0 survived');
  process.exitCode = failed ? 1 : 0;
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
