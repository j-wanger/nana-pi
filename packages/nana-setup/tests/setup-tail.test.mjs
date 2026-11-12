/**
 * @module packages/nana-setup/tests/setup-tail.test.mjs
 * @purpose Pin setup-tail project readiness and retained trust behavior.
 * @inputs Setup CLI, pack trust reader and OS temporary projects.
 * @outputs PASS/FAIL lines.
 * @effects disk, process
 * @errors Failed assertions set exit status 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveLayout } from '../lib/paths.mjs';
import { diagnose, STATUS } from '../lib/doctor.mjs';
import { withPiStub } from './stub-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { findPiRoot } from '../../nana-pack/tests/pi-install.mjs';
import { defaultRun } from '../../../scripts/template-acceptance.mjs';

const repo = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const cli = path.join(repo, 'packages/nana-setup/bin/nana-setup.mjs');
const piRoot = findPiRoot().root;
const cases = [];
const SKIP = Symbol('skip');
const check = (title, fn) => cases.push({ title, fn });
function fixture(fn) {
  const root = tmpDir(path.join(os.tmpdir(), 'setup-tail-'));
  const dir = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(dir);
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--home', home], { encoding: 'utf8', timeout: 15000 });
  return Promise.resolve().then(() => fn({ root, dir, home, run })).finally(() => fs.rmSync(root, { recursive: true, force: true }));
}

// req: R-3891 R-674
check('M7: gate plus legacy bytes and project doctor gate trust survive', () => fixture(async ({ dir, home, run }) => {
  const file = path.join(dir, '.pi/nana-pack.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bytes = '{"gate":{"extraPatterns":["setup_tail_probe"]}, "postEdit":{"commands":[]}}\r\n';
  fs.writeFileSync(file, bytes);
  assert.equal(run('project', dir).status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  const before = run('project', dir, '--check');
  assert.equal(before.status, 1);
  assert.match(before.stdout, /! project trust.*nana-setup trust/);
  const layout = resolveLayout({ home });
  const doctor = () => withPiStub(() => diagnose(layout, { projectDir: dir })).find(r => r.label === 'project trust');
  const untrusted = doctor();
  assert.equal(untrusted?.status, STATUS.WARN);
  assert.ok(untrusted.detail.includes(`nana-setup trust ${dir}`));
  const original = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = layout.piHome;
  try {
    const pi = await import(pathToFileURL(path.join(piRoot, 'dist/index.js')).href);
    const config = await import('../../nana-pack/lib/config.ts');
    config.usePiTrustModule(pi);
    const ctx = { cwd: dir, hasUI: false, isProjectTrusted: () => true };
    const handlers = new Map();
    const gate = (await import('../../nana-pack/extensions/nana-gate.ts')).default;
    gate({ on: (event, handler) => handlers.set(event, handler) });
    const probe = () => handlers.get('tool_call')({ toolName: 'bash', input: { command: 'echo setup_tail_probe' } }, ctx);
    await handlers.get('session_start')({ reason: 'startup' }, ctx);
    assert.equal(await probe(), undefined);
    await config.primeNanaTrust(ctx);
    assert.equal(config.loadConfig(ctx).gate.extraPatterns.includes('setup_tail_probe'), false);
    assert.equal(run('trust', dir, '--yes').status, 0);
    await config.primeNanaTrust(ctx);
    assert.equal(config.loadConfig(ctx).gate.extraPatterns.includes('setup_tail_probe'), true);
    await handlers.get('session_start')({ reason: 'startup' }, ctx);
    assert.equal((await probe())?.block, true);
    const after = run('project', dir, '--check');
    assert.equal(after.status, 0, after.stdout + after.stderr);
    assert.notEqual(doctor()?.status, STATUS.WARN);
    assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  } finally {
    if (original === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = original;
  }
}));

function command(cmd, args, cwd, expected = 0, options = {}) {
  const result = defaultRun(cmd, args, { cwd, timeout: 120000, ...options });
  if (expected === 0) assert.equal(result.status, 0, `${cmd} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  else assert.ok(Number.isInteger(result.status) && result.status !== 0, `${cmd} ${args.join(' ')} unexpectedly passed`);
  return result;
}
function runManual(line, cwd, expected = 0, { platform = process.platform, run = command } = {}) {
  return platform === 'win32'
    ? run('cmd.exe', ['/d', '/s', '/c', `"${line}"`], cwd, expected, { windowsVerbatimArguments: true })
    : run('/bin/sh', ['-c', line], cwd, expected);
}

// req: R-3892
check('M8 Windows: manual command argv preserves embedded quotes', () => {
  for (const line of ['uv run python -c "import sys; sys.exit(0)"', 'node -e "process.exit(0)"']) {
    const calls = [];
    runManual(line, 'fixture', 0, { platform: 'win32', run: (...args) => calls.push(args) });
    assert.deepEqual(calls, [['cmd.exe', ['/d', '/s', '/c', `"${line}"`], 'fixture', 0, { windowsVerbatimArguments: true }]]);
  }
});

function toolsAvailable(tools) {
  const missing = tools.filter(tool => {
    const result = defaultRun(tool, ['--version'], { cwd: repo, timeout: 15000 });
    return result.error || result.status !== 0;
  });
  if (!missing.length) return true;
  const reason = `${missing.join(', ')} unavailable`;
  assert.notEqual(process.env.NANA_TEST_REQUIRE_COPIER, '1', reason);
  console.log(`tools: ${reason}`);
  return false;
}
function templateSource(root) {
  const source = path.join(root, 'source');
  fs.mkdirSync(source);
  fs.copyFileSync(path.join(repo, 'copier.yml'), path.join(source, 'copier.yml'));
  fs.cpSync(path.join(repo, 'templates'), path.join(source, 'templates'), { recursive: true });
  return source;
}
function render(source, dir, language) {
  command('uvx', ['copier', 'copy', '--trust', '--defaults', '-d', `language=${language}`, '-d', 'project_name=Tail', '-d', 'description=Tail fixture', source, dir], path.dirname(dir));
}

// req: R-3887
check('M3: fresh scaffolds omit pack config and updates preserve project bytes', () => fixture(({ root }) => {
  if (!toolsAvailable(['uvx'])) return SKIP;
  assert.equal(root, fs.realpathSync.native(root), 'render root must use its canonical filesystem spelling');
  const source = path.join(root, 'history');
  fs.mkdirSync(source);
  const archive = command('git', ['archive', 'v0.6.51', 'copier.yml', 'templates'], repo, 0, { encoding: null }).stdout;
  command('tar', ['-x'], source, 0, { input: archive });
  command('git', ['init', '-q'], source);
  const commit = cwd => {
    command('git', ['add', '--all'], cwd);
    command('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture'], cwd);
  };
  commit(source);
  const projects = [];
  for (const language of ['python', 'typescript']) {
    const dir = path.join(root, `old-${language}`);
    command('uvx', ['copier', 'copy', '--trust', '--defaults', '--vcs-ref', 'HEAD', '-d', `language=${language}`, '-d', 'project_name=Tail', source, dir], root);
    const config = path.join(dir, '.pi/nana-pack.json');
    const bytes = '{ "gate": {"extraPatterns":["project-rule"]}, "postEdit":{"commands":[]} }\r\n';
    fs.writeFileSync(config, bytes);
    command('git', ['init', '-q'], dir);
    commit(dir);
    projects.push({ dir, config, bytes });
  }
  fs.rmSync(path.join(source, 'templates'), { recursive: true });
  fs.cpSync(path.join(repo, 'templates'), path.join(source, 'templates'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'copier.yml'), path.join(source, 'copier.yml'));
  commit(source);
  for (const { dir, config, bytes } of projects) {
    command('uvx', ['copier', 'update', '--trust', '--defaults', '--vcs-ref', 'HEAD', '--conflict', 'inline'], dir);
    assert.equal(fs.readFileSync(config, 'utf8'), bytes);
  }
  for (const language of ['python', 'typescript']) {
    const dir = path.join(root, `new-${language}`);
    render(source, dir, language);
    assert.equal(fs.existsSync(path.join(dir, '.pi/nana-pack.json')), false);
  }
}));

// req: R-3892
check('M8: documented manual checks pass clean and reject broken fixtures', () => fixture(({ root }) => {
  if (!toolsAvailable(['uvx', 'uv', 'pnpm'])) return SKIP;
  const source = templateSource(root);
  for (const language of ['python', 'typescript']) {
    const dir = path.join(root, language);
    render(source, dir, language);
    command(language === 'python' ? 'uv' : 'pnpm', [language === 'python' ? 'sync' : 'install'], dir);
    const text = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
    const skill = fs.readFileSync(path.join(repo, `packages/nana-pack/skills/adopt-${language === 'python' ? 'py' : 'ts'}/SKILL.md`), 'utf8');
    const checks = new Map([...text.matchAll(/^- \*\*Manual ([a-z]+):\*\* `([^`]+)`/gm)].map(m => [m[1], m[2]]));
    for (const name of ['lint', 'types', 'tests', 'map', 'readme', 'length']) {
      assert.ok(checks.has(name), `${language} missing ${name}`);
      assert.ok(skill.includes(checks.get(name)), `adoption missing ${name}`);
    }
    const run = (name, bad = false, file = 'unused') => {
      const line = checks.get(name).replaceAll('{file}', file);
      // Commands are shipped shell text; run them in the rendered project's toolchain.
      runManual(line, dir, bad ? 1 : 0);
    };
    for (const name of ['lint', 'types', 'tests', 'map', 'readme']) run(name);
    const file = language === 'python' ? 'src/tail/__init__.py' : 'src/index.ts';
    const target = path.join(dir, file);
    const clean = fs.readFileSync(target, 'utf8');
    const broken = language === 'python'
      ? { lint: 'import os\n', types: 'value: int = "wrong"\n', tests: 'raise RuntimeError("broken")\n', map: '# no contract header\n' }
      : { lint: 'debugger;\n', types: 'const value: number = "wrong";\n', tests: 'throw new Error("broken");\n', map: '// no contract header\n' };
    for (const name of ['lint', 'types', 'tests', 'map']) {
      fs.writeFileSync(target, broken[name]);
      run(name, true);
      fs.writeFileSync(target, clean);
    }
    const readme = path.join(dir, 'README.md');
    const saved = fs.readFileSync(readme, 'utf8');
    fs.writeFileSync(readme, '# Broken\n');
    run('readme', true);
    fs.writeFileSync(readme, saved);
    const cap = language === 'python' ? 500 : 300;
    for (const ending of ['\n', '\r\n']) for (const final of [true, false]) {
      const lines = count => Array.from({ length: count }, () => language === 'python' ? '# line \t' : '// line \t').join(ending) + (final ? ending : '');
      fs.writeFileSync(target, lines(cap)); run('length', false, file);
      fs.writeFileSync(target, lines(cap + 1)); run('length', true, file);
    }
    fs.writeFileSync(target, clean);
  }
}));

let failures = 0;
for (const { title, fn } of cases) {
  let timer;
  try {
    const result = await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case deadline')), 300000); })]);
    console.log(result === SKIP ? 'SKIP' : 'PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
process.exitCode = failures ? 1 : 0;
