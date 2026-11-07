/**
 * @module apps/desk/test/page-retire.test.mjs
 * @purpose Pin desk-page retirement and the surviving app host in HTTP and browser requests.
 * @inputs The real server, OS-temporary manifests and a deterministic RPC child; PW_ROOT for browser checks.
 * @outputs Awaited bounded TAP cases.
 * @effects disk (temporary fixtures), network (loopback), process (server, stub and browser).
 * @errors Assertions, timeouts and missing browser tooling fail the owning case.
 */
import assert from 'node:assert/strict';
import { test } from './test-case.mjs';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { stopServer } from './stop-server.mjs';
import { WINDOWS_SKIPS } from '../../../packages/nana-pack/lib/windows-skips-config.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const options = { timeout: 30000 };
const browserRequire = createRequire(process.env.PW_ROOT ? path.join(process.env.PW_ROOT, 'package.json') : import.meta.url);
let browserTool;
try { browserTool = browserRequire('playwright'); } catch { try { browserTool = browserRequire('playwright-core'); } catch {} }
const browserOptions = { ...options, skip: !browserTool && 'Playwright and Chromium required; set PW_ROOT for browser cases' };
const removed = ['public/app.js', 'public/changes.js', 'changes.mjs', 'public/index.html'];
const routes = [['GET', '/api/sessions'], ['GET', '/api/transcript'], ['GET', '/api/live'], ['POST', '/api/spawn'], ['GET', '/api/pick-dir'], ['POST', '/api/pick-dir'], ['GET', '/api/resources'], ['POST', '/api/derive-titles'], ['GET', '/api/settings'], ['POST', '/api/settings'], ['POST', '/api/mcp'], ['GET', '/api/nana-pack'], ['POST', '/api/nana-pack'], ['GET', '/api/context-file'], ['POST', '/api/context-file'], ['GET', '/api/agents'], ['POST', '/api/agents'], ['DELETE', '/api/agents'], ['POST', '/api/rename'], ['DELETE', '/api/session/1'], ...['events', 'prompt', 'rpc', 'ui-response', 'bash', 'files', 'export', 'abort', 'changes', 'changes/file'].flatMap(p => [['GET', `/api/session/1/${p}`], ['POST', `/api/session/1/${p}`]])];
const request = (base, route, method = 'GET', origin = base, host) => fetch(base + route, { method, signal: AbortSignal.timeout(5000), headers: { origin, ...(host ? { host } : {}), ...(method === 'GET' ? {} : { 'content-type': 'application/json' }) }, ...(method === 'GET' ? {} : { body: '{}' }) });
async function fixture(body) {
  const home = tmpDir(path.join(os.tmpdir(), 'desk-retire-'));
  const apps = path.join(home, 'apps');
  fs.mkdirSync(apps);
  const sign = pathToFileURL(path.join(root, 'packages/nana-stage/lib/sign.mjs')).href;
  const stub = path.join(home, 'pi.cjs');
  fs.writeFileSync(stub, `#!/usr/bin/env node
const fs = require('node:fs');
const say = o => process.stdout.write(JSON.stringify(o)+'\n');
const ready = import(${JSON.stringify(sign)});
const block = {id:'signed-card',type:'card',title:'Signed fixture',scope:'fixture',fields:[{label:'value',value:7}],slot:'main',show:true,produced_by:{tool:'read',toolCallId:'call',args:{},at:'2026-11-07T00:00:00Z'}};
let entries = [];
setTimeout(()=>say({type:'extension_ui_request',method:'setStatus',statusKey:'nana-tools',statusText:'ready'}), 20);
require('node:readline').createInterface({input:process.stdin}).on('line', async line => {
 const cmd=JSON.parse(line); const ok=data=>say({type:'response',id:cmd.id,command:cmd.type,success:true,data});
 if(cmd.type==='get_state') ok({sessionId:'fixture',sessionFile:${JSON.stringify(path.join(home, 'fixture.jsonl'))}});
 else if(cmd.type==='get_entries') ok({entries,leafId:entries.at(-1)?.id});
 else if(cmd.type==='prompt') {
   const {signBlock}=await ready; block.produced_by.sig=signBlock(process.env.NANA_STAGE_KEY,block);
   entries=[{id:'entry',parentId:null,type:'custom',customType:'nana-block',data:block}];
   fs.writeFileSync(${JSON.stringify(path.join(home, 'prompt.txt'))},cmd.message);
   ok({}); say({type:'tool_execution_end',toolName:'read',toolCallId:'call',result:{content:[],details:{blocks:[block]}}});
   say({type:'extension_ui_request',id:'dialog',method:'confirm',title:'Continue?'}); say({type:'agent_settled'});
 } else if(cmd.type==='extension_ui_response') fs.writeFileSync(${JSON.stringify(path.join(home, 'answer.txt'))},JSON.stringify(cmd));
 else ok({});
});
`.replaceAll("+'\n'", "+'\\n'"), { mode: 0o755 });
  let bin = stub;
  if (process.platform === 'win32') {
    bin = path.join(home, 'pi.cmd');
    fs.writeFileSync(bin, `@echo off\r\n"${process.execPath}" "${stub}" %*\r\n`);
  }
  for (const [name, title] of [['alpha', '<Alpha & app>'], ['beta', 'Beta']]) fs.writeFileSync(path.join(apps, name + '.json'), JSON.stringify({ port: 0, cwd: home, tools: ['read'], title }));
  const server = spawn(process.execPath, [path.join(root, 'apps/desk/server.mjs')], { cwd: home, env: { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, 'agent'), DESK_STAGE_KEYS: path.join(home, 'keys'), DESK_APPS_DIR: apps, DESK_PI_BIN: bin, DESK_PI_ROOT: process.env.DESK_PI_ROOT, DESK_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', c => { log += c; }); server.stderr.on('data', c => { log += c; });
  try {
    let desk, listeners;
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const match = log.match(/nana code → http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        desk = `http://127.0.0.1:${match[1]}`;
        listeners = await request(desk, '/api/apps').then(r => r.json());
        if (listeners.length === 2 && listeners.every(a => a.port)) break;
      }
      if (server.exitCode !== null) throw new Error('server exited: ' + log);
      await new Promise(r => setTimeout(r, 30));
    }
    assert.ok(listeners?.length === 2 && listeners.every(a => a.port), log);
    await body({ desk, listeners, home, app: `http://127.0.0.1:${listeners.find(a => a.name === 'alpha').port}` });
  } finally {
    await stopServer(server);
  }
}

// req: R-3791
await test('R-3791: retired note links apps and removed files and API routes are gone', options, async () => {
  for (const file of removed) assert.equal(fs.existsSync(path.join(root, 'apps/desk', file)), false, file);
  await fixture(async ({ desk, listeners }) => {
    const response = await request(desk, '/'); assert.equal(response.status, 200);
    const text = await response.text(); assert.match(text, /desk page.*retired/i); assert.ok(text.length < 2000);
    assert.ok(text.includes('&lt;Alpha &amp; app&gt;'));
    for (const app of listeners) assert.ok(text.includes(`http://127.0.0.1:${app.port}`), app.name);
    for (const [method, route] of routes) assert.equal((await request(desk, route, method)).status, 404, `${method} ${route}`);
  });
});

// req: R-3792
await test('R-3792: manifest listener serves the stage and a prompt renders a signed block', browserOptions, async () => {
  await browserFixture(async ({ page, app, home }) => {
    await page.goto(app);
    await page.waitForFunction(() => window.stage && document.querySelector('#chip').textContent === 'idle');
    await page.evaluate(() => window.stage.compose('make fixture'));
    await page.locator('[data-id="signed-card"]').waitFor();
    assert.equal(await page.locator('[data-id="signed-card"] .blk-title').textContent(), 'Signed fixture');
    assert.equal(fs.readFileSync(path.join(home, 'prompt.txt'), 'utf8'), 'make fixture');
  });
});

// req: R-3793
await test('R-3793: desk and both app listeners reject foreign Host and Origin', options, async () => {
  await fixture(async ({ desk, listeners }) => {
    for (const base of [desk, ...listeners.map(a => `http://127.0.0.1:${a.port}`)]) {
      const status = await new Promise((resolve, reject) => { const req = http.get(base + '/', { headers: { host: 'foreign.example' }, timeout: 5000 }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.on('timeout', () => req.destroy(new Error('Host probe timeout'))); });
      assert.equal(status, 403);
      assert.equal((await request(base, '/api/session', 'POST', 'http://foreign.example')).status, 403);
      const other = base === desk ? `http://127.0.0.1:${listeners[0].port}` : desk;
      assert.equal((await request(base, '/api/session', 'POST', other)).status, 403);
      assert.equal((await request(base, '/')).status, 200);
    }
  });
});

// req: R-3795
await test('R-3795: retired rows, app-host README and repository checks agree', options, () => {
  const ledger = fs.readFileSync(path.join(root, 'REQUIREMENTS.md'), 'utf8');
  for (const id of ['R-406', 'R-414', 'R-422', 'R-457']) assert.match(ledger, new RegExp(`\\| ${id} \\|[^\\n]+\\| retired \\|`));
  const readme = fs.readFileSync(path.join(root, 'apps/desk/README.md'), 'utf8');
  assert.match(readme, /app host/i); assert.match(readme, /retired/i);
  assert.ok(!readme.includes('Default desk spawn'));
  for (const [script, args] of [['code-map.mjs', ['--check']], ['readme-check.mjs', []], ['requirements-tree.mjs', []], ['component-audit.mjs', []]]) {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8', timeout: 20000 });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});

async function browserFixture(body) {
  const browser = await browserTool.chromium.launch({ headless: true });
  try { await fixture(async f => { const page = await browser.newPage(); page.setDefaultTimeout(5000); await body({ ...f, page }); }); }
  finally { await browser.close(); }
}

// req: R-3796
await test('R-3796: stage assets, computed tokens and dialog controls survive retirement', browserOptions, async () => {
  await browserFixture(async ({ page, app, home }) => {
    const assets = [], errors = [];
    page.on('response', r => { if (['script', 'stylesheet'].includes(r.request().resourceType())) assets.push([r.url(), r.status()]); });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(app); await page.waitForFunction(() => window.stage && document.querySelector('#chip').textContent === 'idle');
    for (const theme of ['light', 'dark']) {
      const tokens = await page.evaluate(theme => { document.documentElement.dataset.theme = theme; const s = getComputedStyle(document.documentElement); return ['--bg-0','--fg-0','--accent','--sans','--mono','--warn'].map(k => s.getPropertyValue(k).trim()); }, theme);
      assert.ok(tokens.every(Boolean), `${theme}: ${tokens}`);
    }
    await page.evaluate(() => window.stage.compose('ask fixture'));
    const yes = page.locator('.dialog-opt', { hasText: 'Yes' });
    await yes.waitFor({ state: 'visible' }); assert.ok(await yes.isEnabled()); await yes.click();
    await page.waitForFunction(() => !document.querySelector('.dialog-card'));
    const answerFile = path.join(home, 'answer.txt');
    for (let i = 0; i < 100 && !fs.existsSync(answerFile); i++) await new Promise(r => setTimeout(r, 20));
    assert.equal(JSON.parse(fs.readFileSync(answerFile, 'utf8')).confirmed, true);
    assert.ok(assets.length >= 6, JSON.stringify(assets)); assert.ok(assets.every(([, status]) => status === 200), JSON.stringify(assets));
    assert.deepEqual(errors, []);
  });
});

// req: R-3798
await test('R-3798: Windows skips name existing tests and do not suppress surviving host tests', options, () => {
  for (const file of Object.keys(WINDOWS_SKIPS)) assert.ok(fs.existsSync(path.join(root, file)), file);
  for (const file of ['app-listener', 'host-rule', 'origin-rule', 'stage-key-persistence', 'page-retire']) assert.equal(WINDOWS_SKIPS[`apps/desk/test/${file}.test.mjs`], undefined, file);
});
