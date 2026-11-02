// Build evidence driver; never imported by the suite. Fixtures live in OS temp.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const test = 'packages/nana-pack/tests/issue-watch.test.mjs';
const folder = 'docs/reviews/issue-watch-cli-limit-2026-11-02/';
const original = execFileSync('git', ['show', `f6a475658217bed9cb58b9413dd21f35e8b11673:${test}`], { encoding: 'utf8' });
const current = fs.readFileSync(test, 'utf8');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-proof-'));
function run(source, title, label) {
  source = source.replace(/from (["'])(\.\.?\/[^"']+)\1/g, (_, q, rel) => `from ${JSON.stringify(pathToFileURL(path.resolve(path.dirname(test), rel)).href)}`)
    .replace(/new URL\("([^\"]+)", import.meta.url\)/g, (_, rel) => `new URL(${JSON.stringify(pathToFileURL(path.resolve(path.dirname(test), rel)).href)})`);
  const file = path.join(temp, 'probe.mjs'); fs.writeFileSync(file, source);
  const result = spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 60000, env: { ...process.env, NANA_TEST_CASE: title } });
  const lines = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.split('\n').filter(line => /^(PASS|FAIL)|Error: (CLI limit|case limit)|AssertionError|^'case limit'$/.test(line));
  const text = `${label}\nexit ${result.status}\n${lines.join('\n')}\n`;
  fs.appendFileSync(folder + 'wrong-code.txt', text); console.log(text);
  return result.status;
}
try {
  if (process.argv[2] === 'baseline') {
    fs.writeFileSync(folder + 'wrong-code.txt', 'Wrong-code evidence (Windows, 2026-11-02)\n');
    let body = original.split('await check("R-2992: real opted-in command keeps polling prints an owner answer and ends with restart", async () => {')[1].split('\n});')[0];
    body = body.replace('`import { WATCH_INTERVAL_MS', '`Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, startDelayMs); import { WATCH_INTERVAL_MS');
    // The delay is embedded into the generated preload, not looked up in the child.
    body = body.replace('0, 0, startDelayMs); import', '0, 0, ${startDelayMs}); import');
    const at = body.indexOf('\n\tassert.equal(cli.status');
    body = body.slice(0, at) + '\n return { ...cli, polls: Number(fs.readFileSync(count, "utf8")) };';
    const replaceHarness = (body) => current.slice(0, current.indexOf('async function runCli(')) + `async function runCli({ startDelayMs = 0 } = {}) {${body}\n}\n` + current.slice(current.indexOf('function assertCli('));
    let source = replaceHarness(body);
    if (run(source, 'R-3703:', 'M1 / main harness + synchronous 4000 ms preload delay') !== 1) throw Error('baseline must fail');
    const hanging = body.replace('0, 0, ${startDelayMs}); import', '0, 0, ${startDelayMs}); setInterval(() => {}, 1000); import').replace('6000', '23000').replace('new Error("CLI limit")', 'new Error("case limit")');
    source = replaceHarness(hanging);
    if (run(source, 'R-3704:', 'M2 / main harness with only case-limit failure and referenced handle') !== 1) throw Error('hang must fail');
    source = current.replace('import * as timing from "./issue-watch-timing.mjs";', 'const timing = {};');
    if (run(source, 'R-3705:', 'M3 / missing timing surface') !== 1) throw Error('seal must fail');
  } else if (process.argv[2] === 'mutate') {
    // Break only timeout ownership. A case-owned timer kills safely, then emits the generic error.
    let source = current.replace('new Error(`CLI deadline: ${missing}`)', 'new Error("case limit")');
    source = source.replace('}, timing.CLI_DEADLINE_MS);', '}, timing.CLI_DEADLINE_MS + timing.CLI_CASE_MARGIN_MS);');
    // Disable only this case guard so its rejection can inspect the generic case-owned failure.
    source = source.replace('}, timing.CLI_DEADLINE_MS + timing.CLI_CASE_MARGIN_MS);\n// req: R-3705', '}, timing.CLI_DEADLINE_MS + timing.CLI_CASE_MARGIN_MS + timing.CLI_CLEANUP_MS);\n// req: R-3705');
    if (run(source, 'R-3704:', 'M2 / only case-owned timeout (safe kill retained)') !== 1) throw Error('mutation must fail');
  } else {
    for (const id of ['R-3703:', 'R-3704:', 'R-3705:']) if (run(current, id, `${id} corrected harness`) !== 0) throw Error('correct harness must pass');
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
