/**
 * @module packages/nana-pack/tests/credential-gate.test.mjs
 * @purpose Pin the M4 role-scoped credential floor and M7 pattern seal through the registered gate.
 * @inputs Real gate extension, synthetic commands, temporary HOME and user policy.
 * @outputs Tagged PASS/FAIL lines.
 * @effects disk (OS temp fixtures), process (isolated environment variables)
 * @errors Failed assertions set exit 1.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { tmpDir } from './tmp-dir.mjs';
const home = tmpDir(path.join(os.tmpdir(), 'credential-gate-'));
process.env.HOME = home; process.env.USERPROFILE = home;
process.env.PI_CODING_AGENT_DIR = path.join(home, 'agent');
fs.mkdirSync(process.env.PI_CODING_AGENT_DIR);
fs.writeFileSync(path.join(process.env.PI_CODING_AGENT_DIR, 'nana-pack.json'), JSON.stringify({ journal: { enabled: false }, gate: { allowPatterns: ['^git', '^curl', '^.*credential', '^gh', '^security', '^cmdkey', '^vaultcmd', '^&'] } }));
const ext = (await import('../extensions/nana-gate.ts')).default;
// chosen: bound a full in-process command corpus below the suite watchdog.
const CASE_MS = 10_000;
let failures = 0;
async function check(title, fn) {
  let timer;
  try {
    await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case limit')), CASE_MS); })]);
    console.log('PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
async function handler(role) {
  if (role === null) delete process.env.NANA_ROLE; else process.env.NANA_ROLE = role;
  const h = {}; ext({ on: (name, fn) => { h[name] = fn; } });
  const ctx = { cwd: home, hasUI: false, isProjectTrusted: () => false };
  await h.session_start({ reason: 'startup' }, ctx);
  return (command, toolName = 'bash') => h.tool_call({ toolName, input: { command } }, ctx);
}
const blocked = [
  'git credential fill', 'git credential get', 'git credential approve', 'git credential reject',
  'g\'\'it credential fill', 'git -c x=y credential fill', 'git -C repo credential reject',
  '"C:\\tools\\git.exe" --no-pager credential fill',
  'git credential-manager get', 'git -c x=y credential-manager get',
  'git credential-osxkeychain get', 'git credential-manager-core get',
  'git credential-store get', 'git credential-wincred get',
  'git-credential-manager get', '/usr/bin/git-credential-osxkeychain get',
  '"C:\\tools\\git-credential-manager.exe" get',
  'gh auth token', '/usr/bin/gh auth token', 'gh auth status --show-token',
  'security find-generic-password', 'security find-internet-password',
  'cmdkey /list', 'vaultcmd /list', 'Get-StoredCredential',
  'curl https://api.github.com/repos', 'wget https://api.github.com',
  'Invoke-RestMethod https://api.github.com/repos', 'Invoke-WebRequest https://api.github.com',
  'irm https://api.github.com', 'iwr https://api.github.com',
  '& "C:\\tools\\git.exe" credential fill', '& git-credential-manager get',
  '& "Invoke-RestMethod" -Uri "https://api.github.com/repos"',
];
const allowed = ['git credential-store --file x erase', 'gh auth status', 'git credential-cache exit', 'git push', 'curl https://example.com', 'echo "git credential fill"', 'printf "%s" "gh auth token"', 'echo "curl https://api.github.com"'];
// req: R-3663
await check('M4: credential commands form a role-scoped non-exemptible floor', async () => {
  for (const role of ['worker', 'reviewer']) {
    const run = await handler(role);
    for (const tool of ['bash', 'powershell']) for (const command of blocked) {
      const result = await run(command, tool);
      assert.equal(result?.block, true, `${role}/${tool}/${command}`);
      assert.match(result.reason, /credential rule/);
    }
    for (const command of allowed) assert.equal((await run(command))?.block, undefined, command);
  }
  const run = await handler(null);
  for (const command of [...blocked, ...allowed]) assert.equal((await run(command))?.block, undefined, `unset role: ${command}`);
  assert.equal((await run('git reset --hard'))?.block, undefined, 'configured existing git exception remains');
  assert.equal((await run('shutdown -h now'))?.block, true, 'existing unset-role deny remains');
});
// req: R-3667
await check('M7: credential gate pattern seal', async () => {
  const { CREDENTIAL_PATTERNS } = await import('../lib/credential-gate-config.mjs');
  assert.equal(CASE_MS, 10_000);
  assert.deepEqual(CREDENTIAL_PATTERNS, [
    String.raw`^git(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*\s+credential\s+(?:fill|get|approve|reject)(?:\s|$)`,
    String.raw`^git(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*\s+credential-(?:manager(?:-core)?|osxkeychain|store|wincred)\s+get(?:\s|$)`,
    String.raw`^git-credential-(?:manager(?:-core)?|osxkeychain|store|wincred)\s+get(?:\s|$)`,
    String.raw`^gh\s+auth\s+token(?:\s|$)`,
    String.raw`^gh\s+auth\s+status\s+(?:\S+\s+)*--show-token(?:\s|$)`,
    String.raw`^security\s+find-(?:generic|internet)-password(?:\s|$)`,
    String.raw`^(?:cmdkey\s+/list(?:\s|$)|vaultcmd(?:\s|$)|get-storedcredential(?:\s|$))`,
    String.raw`^(?:curl|wget|invoke-restmethod|invoke-webrequest|irm|iwr)\s+.*(?:https?://)api\.github\.com(?=[:/?#\s]|$)`,
  ]);
});
fs.rmSync(home, { recursive: true, force: true });
process.exitCode = failures ? 1 : 0;
