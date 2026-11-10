/**
 * @module packages/nana-pack/lib/review-run.mjs
 * @purpose Admit, launch and record one command's review under the shared review-store lock protocol.
 * @inputs Review arguments, command argv, optional stdin and spawn callback, reviewer environment and Claude settings.
 * @outputs Review bytes at --out, a verified or unverified v2 record, diagnostics and the reviewer's exit status.
 * @effects disk (output, reservations, settings and review store), process (resolved reviewer and heartbeat)
 * @errors Returns nonzero for admission, launch, output, recording or unread-verdict failures; preserves nonzero child status.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { admit, complete, release, startHeartbeat, readVerdict, unreadVerdictDetail } from '../bin/review-round.mjs';
import { reviewShaped } from '../bin/review-shape.mjs';
import { reviewLaunch } from '../bin/review-launch.mjs';
import { CLAUDE_BUILDER_CHILD_ENV, CLAUDE_SETTINGS_FLAG, REVIEWER_CHILD_ENV } from '../bin/worker-config.mjs';
import { CLAUDE_BIN } from './claude-review-config.mjs';
import { credentialStripEnv } from './credential-strip.mjs';
import { CREDENTIAL_CONFIG_RESETS, CREDENTIAL_ENV, GIT_CONFIG_ENV } from './credential-strip-config.mjs';
import { readClaudeBuilderSettings, writeClaudeBuilderSettings } from './claude-settings-carry.mjs';
import { parseJsonBytes } from './json-text.mjs';
import { startLaneWatcher } from './lane-watcher.mjs';

/** The former ledger run path; completion re-derives the revision under the store lock. */
export async function runReview(args, command, { input, onSpawn, admission, unreadRetry, launcher = 'claude-review' } = {}) {
  const child = [...command];
  const option = name => {
    const eq = child.find(x => x.startsWith(`${name}=`));
    if (eq) return eq.slice(name.length + 1);
    const i = child.indexOf(name);
    return i >= 0 ? child[i + 1] : null;
  };
  const adm = admission ?? admit(args, { launcher, provider: option('--provider'), model: option('--model'), attempts: 1 });
  const note = message => process.stderr.write(`${launcher}: ${message}\n`);
  if (!adm.ok) { note(adm.message); return 1; }
  note(adm.note);
  if (adm.warning) note(`WARNING: ${adm.warning}`);
  const out = adm.res.out;
  let folder = null, stopHeartbeat = () => {};
  const cleanup = () => { release(adm.id); if (folder) { try { rmSync(folder, { recursive: true, force: true }); } catch {} } };
  process.once('exit', cleanup);
  const cannotStart = reason => {
    const line = `cannot start ${child[0] || '""'}: ${reason}`;
    try { writeFileSync(out, `${line}\n`); } catch {}
    note(line); return 1;
  };
  try {
    // Preserve carried role/memory settings, but never let flag settings restore credentials.
    if (basename(child[0]).replace(/\.(?:exe|com|cmd|bat)$/i, '').toLowerCase() === CLAUDE_BIN) {
      try {
        const supplied = option(CLAUDE_SETTINGS_FLAG);
        const settings = supplied === null ? {} : parseJsonBytes(supplied.trimStart().startsWith('{') ? supplied : readFileSync(resolve(adm.res.cwd, supplied)));
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('settings must be an object');
        const suppliedEnv = settings.env ?? {};
        const names = GIT_CONFIG_ENV, count = Number(suppliedEnv[names.count]);
        const alreadySealed = Object.entries({ ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV, ...CREDENTIAL_ENV }).every(([name, value]) => suppliedEnv[name] === value)
          && suppliedEnv[names.parameters]?.endsWith(CREDENTIAL_CONFIG_RESETS.map(([key, value]) => `'${key}=${value}'`).join(' '))
          && Number.isSafeInteger(count) && count >= CREDENTIAL_CONFIG_RESETS.length
          && CREDENTIAL_CONFIG_RESETS.every(([key, value], offset) => suppliedEnv[`${names.key}${count - CREDENTIAL_CONFIG_RESETS.length + offset}`] === key && suppliedEnv[`${names.value}${count - CREDENTIAL_CONFIG_RESETS.length + offset}`] === value);
        if (!alreadySealed) {
          const sealed = { ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV, ...credentialStripEnv({ ...process.env, ...suppliedEnv }) };
          const carry = readClaudeBuilderSettings(sealed, launcher, option('--model'), adm.res.cwd);
          carry.settings = { ...carry.settings, ...settings, env: { ...carry.settings.env, ...suppliedEnv, ...sealed } };
          folder = mkdtempSync(join(tmpdir(), 'nana-claude-review-'));
          if (process.platform === 'win32') startLaneWatcher({ folder, lock: join(folder, 'unused-reviewer.lock'), workerPid: process.pid, commonDir: folder, cwd: adm.res.cwd });
          const settingsFile = join(folder, 'reviewer-settings.json');
          writeClaudeBuilderSettings(settingsFile, carry);
          const index = child.findIndex(word => word === CLAUDE_SETTINGS_FLAG || word.startsWith(`${CLAUDE_SETTINGS_FLAG}=`));
          if (index < 0) child.push(CLAUDE_SETTINGS_FLAG, settingsFile);
          else if (child[index] === CLAUDE_SETTINGS_FLAG) child[index + 1] = settingsFile;
          else child[index] = `${CLAUDE_SETTINGS_FLAG}=${settingsFile}`;
        }
      } catch (error) { return cannotStart(`cannot seal Claude settings (${error.code ?? 'invalid settings'})`); }
    }
    const env = { ...process.env, ...REVIEWER_CHILD_ENV, ...credentialStripEnv(process.env) };
    const run = async (argv, stdin, first = false) => {
      const launch = reviewLaunch(argv, { cwd: adm.res.cwd, env });
      if (launch.refused) return { error: new Error(launch.refused) };
      const chunks = [];
      let k;
      try { k = spawn(launch.command, launch.args, { ...launch.options, cwd: adm.res.cwd, stdio: [stdin === undefined ? 'inherit' : 'pipe', 'pipe', 'inherit'], env }); }
      catch (error) { return { error }; }
      if (first && onSpawn) k.once('spawn', onSpawn);
      if (stdin !== undefined) { k.stdin.on('error', () => {}); k.stdin.end(stdin); }
      const result = await new Promise(done => {
        k.stdout.on('data', chunk => chunks.push(chunk));
        k.once('error', error => done({ error }));
        k.once('close', (status, signal) => done({ status, signal }));
      });
      return { ...result, text: Buffer.concat(chunks).toString('utf8') };
    };
    stopHeartbeat = startHeartbeat(adm.res);
    let result = await run(child, input, true);
    if (result.error) return cannotStart(result.error.code ?? result.error.message);
    let text = result.text;
    try { writeFileSync(out, text); }
    catch (error) { note(`cannot write ${out}: ${error.message} — reservation returned`); return 1; }
    let attempts = 1;
    if (unreadRetry && result.status === 0 && !readVerdict(text).verdict) {
      note(`verdict unread: ${unreadVerdictDetail(readVerdict(text))}; asking the same reviewer for its verdict line only (no new review)`);
      result = await run(unreadRetry.command, unreadRetry.input);
      attempts++;
      text = result.text ?? '';
      if (result.error || result.status !== 0 || !readVerdict(text).verdict || text.trim().split(/\r?\n/).length !== 1) {
        try { writeFileSync(out, `${readFileSync(out, 'utf8')}\n\n--- Verdict confirmation ---\n${text}`); }
        catch (error) { note(`cannot keep confirmation at ${out}: ${error.message}`); }
        note('verdict unread or failed on confirmation — reservation returned, no round consumed');
        return result.status || 1;
      }
      note(`verdict confirmation kept in the review store; original review at ${out}`);
    }
    if (result.status === 0 && text.trim() && reviewShaped(text)) {
      const c = complete(adm.res, out, { attempts, text });
      if (!c.ok) { note(`review written to ${out}, but ${c.message}`); return 1; }
      if (c.unread) { note(c.unread); return 1; }
      note(`verdict recorded for item ${adm.res.item} (round ${c.round}; ${out})`);
      return 0;
    }
    note(`no verdict (exit ${result.status ?? result.signal}; ${text.length} chars) — reservation returned, no round consumed`);
    return result.status || 1;
  } finally { stopHeartbeat(); cleanup(); process.removeListener('exit', cleanup); }
}
