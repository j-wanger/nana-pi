// Build-only measurements; the suite never imports this driver.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import * as timing from '../../../packages/nana-pack/tests/issue-watch-timing.mjs';
const folder = 'docs/reviews/issue-watch-cli-limit-2026-11-02/';
const watch = 'packages/nana-pack/tests/issue-watch.test.mjs';
const frontier = 'packages/nana-pack/tests/frontier-summary.test.mjs';
const runner = 'packages/nana-pack/tests/test-runner.test.mjs';
function run(file) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
    child.on('error', reject);
    child.on('close', code => resolve({ file, code, output, seconds: (performance.now() - start) / 1000 }));
  });
}
function green(result, log) {
  const safe = result.output.replaceAll(process.cwd(), '<worktree>').replaceAll(process.cwd().replaceAll('\\', '/'), '<worktree>');
  fs.appendFileSync(log, `node ${result.file}\nexit ${result.code}; wall ${result.seconds.toFixed(3)} s\n${safe}\n`);
  if (result.code !== 0) throw Error(`${result.file} failed; see evidence`);
}
const times = [];
fs.writeFileSync(folder + 'timing.txt', 'Windows measurements, 2026-11-02. Full file, all 29 checks per run.\n');
for (let i = 1; i <= 10; i++) {
  const result = await run(watch); times.push(result.seconds);
  fs.appendFileSync(folder + 'timing.txt', `alone ${i}: exit ${result.code}; ${result.seconds.toFixed(3)} s; ${result.output.split('\n').filter(line => line.startsWith('PASS ')).length} PASS\n`);
  if (result.code !== 0) { fs.appendFileSync(folder + 'timing.txt', result.output); throw Error('alone run failed'); }
}
fs.appendFileSync(folder + 'timing.txt', `alone spread: ${Math.min(...times).toFixed(3)}-${Math.max(...times).toFixed(3)} s\n`);
for (let i = 1; i <= 3; i++) {
  // A second existing heavy file runs concurrently, with no model sessions or workers.
  const results = await Promise.all([run(watch), run(runner)]);
  for (const result of results) {
    fs.appendFileSync(folder + 'timing.txt', `concurrent ${i}: ${result.file}; exit ${result.code}; ${result.seconds.toFixed(3)} s\n`);
    if (result.code !== 0) { fs.appendFileSync(folder + 'timing.txt', result.output); throw Error('concurrent run failed'); }
  }
}
const source = fs.readFileSync(watch, 'utf8');
const count = (source.match(/await check\(/g) ?? []).length;
const special = 3;
const sum = (count - special) * timing.CASE_LIMIT_MS + special * (timing.CLI_DEADLINE_MS + timing.CLI_CASE_MARGIN_MS);
fs.appendFileSync(folder + 'timing.txt', `case guards: (${count} - ${special}) * ${timing.CASE_LIMIT_MS} + ${special} * (${timing.CLI_DEADLINE_MS} + ${timing.CLI_CASE_MARGIN_MS}) = ${sum} ms < 300000 ms per file; spare ${300000 - sum} ms.\nChild cleanup fits inside each CLI case margin, not an additional serial guard.\n`);
fs.writeFileSync(folder + 'build-1-green.txt', 'Touched tests, Windows, 2026-11-02. Runtime warning paths replaced with <worktree>.\n');
for (const file of [watch, frontier, runner]) green(await run(file), folder + 'build-1-green.txt');
console.log('10 alone runs, 3 concurrent pairs and 3 touched test files: PASS; see timing.txt and build-1-green.txt');
