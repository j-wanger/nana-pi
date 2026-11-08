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
const check = (title, fn) => cases.push({ title, fn });
function fixture(fn) {
  const root = tmpDir(path.join(os.tmpdir(), 'setup-tail-'));
  const dir = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(dir);
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--home', home], { encoding: 'utf8', timeout: 15000 });
  return Promise.resolve().then(() => fn({ root, dir, home, run })).finally(() => fs.rmSync(root, { recursive: true, force: true }));
}

// req: R-3886
check('M2: project needs no postEdit and preserves a legacy file', () => fixture(async ({ dir, run }) => {
  assert.equal(run('project', dir).status, 0);
  const config = path.join(dir, '.pi/nana-pack.json');
  assert.equal(fs.existsSync(config), false);
  const empty = run('project', dir, '--check');
  assert.equal(empty.status, 0, empty.stdout + empty.stderr);
  assert.doesNotMatch(empty.stdout, /postEdit|post-edit/i);
  fs.mkdirSync(path.dirname(config), { recursive: true });
  const bytes = '{ "postEdit": {"commands": []}}\r\n';
  fs.writeFileSync(config, bytes);
  assert.equal(run('project', dir).status, 0);
  assert.equal(run('trust', dir, '--yes').status, 0);
  const legacy = run('project', dir, '--check');
  assert.equal(legacy.status, 0, legacy.stdout + legacy.stderr);
  assert.doesNotMatch(legacy.stdout, /postEdit|post-edit/i);
  assert.equal(fs.readFileSync(config, 'utf8'), bytes);
}));

// req: R-3891
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
  assert.equal(doctor()?.status, STATUS.WARN);
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

// req: R-3885
check('M1: shipped guidance makes no automatic post-edit claim', () => {
  const files = command('git', ['ls-files'], repo).stdout.trim().split(/\r?\n/).filter(file =>
    /(?:SKILL\.md$|README\.md(?:\.jinja)?$|^templates\/|^packages\/nana-setup\/lib\/)/.test(file)
    && !/(?:\/tests?\/|\/fixtures\/|\/studies\/|\/retired\/)/.test(file));
  const claims = /post-edit (?:gate|preset|on-ramp|check runs)|wired into post-edit|every edit fires|format\+lint on\s+every edit|biome fix on every\s+edit/i;
  const found = files.filter(file => fs.existsSync(path.join(repo, file)) && claims.test(fs.readFileSync(path.join(repo, file), 'utf8')));
  assert.deepEqual(found, []);
});

// req: R-3887
check('M3: fresh scaffolds omit pack config and updates preserve project bytes', () => fixture(({ root }) => {
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
      command(process.platform === 'win32' ? 'cmd.exe' : '/bin/sh', process.platform === 'win32' ? ['/d', '/s', '/c', line] : ['-c', line], dir, bad ? 1 : 0);
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

// req: R-3889
check('M5: uninstall removes only an owned retired verifier link', () => fixture(({ root, home, run }) => {
  if (process.platform === 'win32') return; // Uninstall is explicitly POSIX-only.
  const hooks = path.join(home, '.claude/hooks');
  fs.mkdirSync(hooks, { recursive: true });
  const retired = path.join(hooks, 'verifier-pipe.mjs');
  const ownedTarget = path.join(repo, 'packages/nana-setup/claude/hooks/verifier-pipe.mjs');
  const foreign = path.join(root, 'foreign.mjs');
  fs.writeFileSync(foreign, 'foreign bytes');
  for (const kind of ['owned', 'foreign-link', 'foreign-dangling', 'regular']) {
    fs.symlinkSync(path.join(repo, 'packages/nana-setup/claude/hooks/nana-objective.mjs'), path.join(hooks, 'nana-objective.mjs'));
    if (kind === 'regular') fs.writeFileSync(retired, 'user bytes');
    else fs.symlinkSync(kind === 'owned' ? ownedTarget : kind === 'foreign-link' ? foreign : path.join(root, 'missing'), retired);
    const result = run('uninstall', '--yes');
    assert.equal(result.status, 0, result.stdout + result.stderr);
    if (kind === 'owned') assert.throws(() => fs.lstatSync(retired), { code: 'ENOENT' });
    else {
      assert.ok(fs.lstatSync(retired));
      if (kind === 'regular') assert.equal(fs.readFileSync(retired, 'utf8'), 'user bytes');
      else assert.equal(fs.readlinkSync(retired), kind === 'foreign-link' ? foreign : path.join(root, 'missing'));
      fs.unlinkSync(retired);
    }
    assert.equal(fs.readFileSync(foreign, 'utf8'), 'foreign bytes');
  }
}));

// req: R-3893
check('M9: a sole retired link supports dry run repeat and foreign refusal', () => fixture(({ root, home, run }) => {
  if (process.platform === 'win32') return; // Uninstall is explicitly POSIX-only.
  const hooks = path.join(home, '.claude/hooks');
  fs.mkdirSync(hooks, { recursive: true });
  const link = path.join(hooks, 'verifier-pipe.mjs');
  const target = path.join(repo, 'packages/nana-setup/claude/hooks/verifier-pipe.mjs');
  fs.symlinkSync(target, link);
  const dry = run('uninstall', '--dry-run');
  assert.equal(dry.status, 0, dry.stdout + dry.stderr);
  assert.equal(fs.readlinkSync(link), target);
  assert.match(dry.stdout, /would unlink/);
  assert.deepEqual(fs.readdirSync(hooks), ['verifier-pipe.mjs']);
  assert.equal(fs.existsSync(path.join(home, '.claude/settings.json')), false);
  const remove = run('uninstall', '--yes');
  assert.equal(remove.status, 0, remove.stdout + remove.stderr);
  assert.deepEqual(fs.readdirSync(hooks), []);
  assert.equal(run('uninstall', '--yes').status, 0);
  fs.symlinkSync(path.join(root, 'missing-foreign'), link);
  const before = fs.readlinkSync(link);
  const refused = run('uninstall', '--yes');
  assert.equal(refused.status, 1, refused.stdout + refused.stderr);
  assert.match(refused.stdout, /inventory links do not resolve inside/);
  assert.equal(fs.readlinkSync(link), before);
}));

// req: R-3890
check('M6: dead floor notify and prompt order are gone and legacy notify is silent', () => fixture(async ({ home, dir }) => {
  const misses = [];
  const doctor = await import('../lib/doctor.mjs');
  if ('PI_SUBAGENTS_FLOOR' in doctor) misses.push('unused floor export');
  if (fs.readFileSync(path.join(repo, 'packages/nana-pack/lib/prompt-sections.mjs'), 'utf8').includes('"nana-handoff"')) misses.push('retired prompt order');
  const config = await import('../../nana-pack/lib/config.ts');
  const original = process.env.PI_CODING_AGENT_DIR;
  const agent = path.join(home, 'agent');
  process.env.PI_CODING_AGENT_DIR = agent;
  fs.mkdirSync(agent, { recursive: true });
  try {
    for (const notify of [{ enabled: false, headless: true }, { enabled: 'bad' }, 7]) {
      const normalized = config.normalizeRaw({ notify });
      if (normalized.problems.length || 'notify' in normalized.blocks) misses.push(`normalized ${JSON.stringify(notify)}`);
      fs.writeFileSync(path.join(agent, 'nana-pack.json'), JSON.stringify({ notify }));
      const notices = [];
      const loaded = config.loadConfig({ cwd: dir, hasUI: true, ui: { notify: (...args) => notices.push(args) } });
      if ('notify' in loaded || notices.length) misses.push(`loaded ${JSON.stringify(notify)}`);
    }
    if (fs.existsSync(path.join(agent, 'nana-journal.jsonl'))) misses.push('legacy config diagnostic');
  } finally {
    if (original === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = original;
  }
  assert.deepEqual(misses, []);
}));

let failures = 0;
for (const { title, fn } of cases) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case deadline')), 300000); })]);
    console.log('PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
process.exitCode = failures ? 1 : 0;
