#!/usr/bin/env node
/**
 * @module scripts/hive-page.mjs
 * @purpose Publishes the static hive atomically or serves a temporary copy on loopback.
 * @inputs CLI output directory, optional contract JSON data and port.
 * @outputs Static app plus components.json or a loopback URL.
 * @effects disk (reads app and data, stages and renames output), network (loopback server)
 * @errors Usage exits 2; incompatible data and IO failures exit 1 with one named line.
 */
import { existsSync, realpathSync } from 'node:fs';
import { readFile, writeFile, readdir, cp, mkdir, mkdtemp, rename, rm, realpath } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLE } from '../apps/hive/config.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildHivePage(out, dataFile = path.join(root, 'docs/components/fixture.json')) {
  let data;
  try { data = JSON.parse(await readFile(dataFile, 'utf8')); } catch { throw new Error('unreadable component data'); }
  const contract = JSON.parse(await readFile(path.join(root, 'docs/components/contract.json'), 'utf8'));
  if (data?.contract !== contract.contract || data?.version !== contract.version) throw new Error('incompatible component contract');
  const target = path.resolve(out);
  if (existsSync(target)) throw new Error('output folder already exists');
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = await mkdtemp(path.join(path.dirname(target), '.hive-stage-'));
  try {
    for (const name of await readdir(path.join(root, 'apps/hive'))) if (name !== 'README.md') await cp(path.join(root, 'apps/hive', name), path.join(temporary, name), { recursive: true });
    await writeFile(path.join(temporary, 'components.json'), JSON.stringify(data, null, 2) + '\n');
    await rename(temporary, target);
  } finally { await rm(temporary, { recursive: true, force: true }); }
  return target;
}
export async function serveHive(folder, port = STYLE.port, print = console.log) {
  const base = await realpath(folder);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host;
      if (host && host !== `127.0.0.1:${server.address().port}` && host !== `localhost:${server.address().port}`) { res.writeHead(403); return res.end('Forbidden'); }
      if (!['GET', 'HEAD'].includes(req.method)) throw new Error('not found');
      const raw = decodeURIComponent(req.url.split('?')[0]);
      if (raw.includes('\\') || raw.split('/').includes('..')) throw new Error('not found');
      const full = await realpath(path.join(base, raw === '/' ? 'index.html' : raw));
      if (!full.startsWith(base + path.sep)) throw new Error('not found');
      const bytes = await readFile(full);
      res.writeHead(200, { 'content-type': mime[path.extname(full)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  print(`hive-page: http://127.0.0.1:${server.address().port}`);
  return server;
}
export async function main(argv = process.argv.slice(2)) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--serve' && !opts.serve) opts.serve = true;
    else if (['--out', '--data', '--port'].includes(flag) && argv[i + 1] && opts[flag] === undefined) opts[flag] = argv[++i];
    else { console.error('Usage: hive-page --out <dir> [--data <file>] | --serve [--port <n>] [--data <file>]'); return 2; }
  }
  const port = opts['--port'] === undefined ? STYLE.port : Number(opts['--port']);
  if (!!opts['--out'] === !!opts.serve || (!opts.serve && opts['--port'] !== undefined) || !Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('Usage: hive-page --out <dir> [--data <file>] | --serve [--port <n>] [--data <file>]'); return 2;
  }
  let temp;
  try {
    if (opts.serve) { temp = await mkdtemp(path.join(os.tmpdir(), 'nana-hive-serve-')); }
    const out = await buildHivePage(opts['--out'] ?? path.join(temp, 'site'), opts['--data']);
    if (!opts.serve) { console.log(`hive-page: wrote ${out}`); return 0; }
    const server = await serveHive(out, port);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(async () => { await rm(temp, { recursive: true, force: true }); }); server.closeAllConnections(); });
    return 0;
  } catch (error) {
    if (temp) await rm(temp, { recursive: true, force: true });
    console.error(`hive-page: ${String(error.message).replace(/[\r\n]+/g, ' ')}`); return 1;
  }
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = await main();
