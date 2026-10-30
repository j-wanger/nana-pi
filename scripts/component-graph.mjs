#!/usr/bin/env node
/**
 * @module scripts/component-graph.mjs
 * @purpose Derives counted component relationships and published road geometry from shared parsers.
 * @inputs Repo root, loop source, component parts, ledger, import graph and injected git runner.
 * @outputs Graph document, named problems and counts in each source's units.
 * @effects disk (reads repository inputs and writes --out), process (read-only git and CLI output)
 * @errors Invalid sources exit 1 with named lines; malformed CLI exits 2.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoGraph } from './code-map.mjs';
import { contains } from './component-audit.mjs';
import { artifactRegistry, artifactReads, deliverableClaims } from './deliverables.mjs';
import { parseLedger } from './requirements-tree.mjs';
import { defaultGit, MAX_GIT_BUFFER } from './requirements-moved.mjs';
import { AUDIT_PATH } from './component-audit-config.mjs';
import { LOOP_PATH } from './component-graph-config.mjs';
import { footprint } from '../apps/hive/layout.mjs';
import { settle, roads, crossings } from './component-graph-layout.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const keys = (value, expected) => value && Object.keys(value).sort().join() === [...expected].sort().join();
export function checkLoop(loop, components) {
  const problems = [];
  if (!keys(loop, ['contract', 'version', 'spine', 'attachments']) || loop.contract !== 'nana-component-loop' || loop.version !== 1 || !Array.isArray(loop.spine) || !Array.isArray(loop.attachments)) return ['loop: invalid hand-source fields or contract'];
  if (loop.spine.length < 3) problems.push('spine: at least three stages required');
  const ids = new Set(components.map(c => c.id)), seen = new Set();
  for (const item of [...loop.spine.map(id => ({ id, role: 'spine', stage: id })), ...loop.attachments]) {
    const id = item?.id;
    if (!keys(item, ['id', 'role', 'stage'])) problems.push(`${id}: hand source accepts only id, role and stage; no edge, position or count`);
    if (!ids.has(id)) problems.push(`${id}: unknown component`);
    if (seen.has(id)) problems.push(`${id}: duplicate placement`); seen.add(id);
    if (!['spine', 'support', 'gate', 'outside'].includes(item.role) || (item.role === 'outside' ? item.stage !== 'outside' : !loop.spine.includes(item.stage))) problems.push(`${id}: stage must be a spine ID or outside for an outside role`);
  }
  for (const id of ids) if (!seen.has(id)) problems.push(`${id}: missing from loop`);
  return problems;
}
export async function buildGraph({ root = ROOT, source, loop, imports, ledgerText, trackedPaths, gitRunner = defaultGit } = {}) {
  try {
    source ??= JSON.parse(readFileSync(path.join(root, AUDIT_PATH), 'utf8'));
    loop ??= JSON.parse(readFileSync(path.join(root, LOOP_PATH), 'utf8'));
    const problems = checkLoop(loop, source.components);
    if (problems.length) return { document: null, problems, lines: [], exitCode: 1 };
    imports ??= repoGraph(root);
    ledgerText ??= readFileSync(path.join(root, 'REQUIREMENTS.md'), 'utf8');
    if (!trackedPaths) {
      const result = gitRunner(root, ['ls-tree', '-r', '-z', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8', maxBuffer: MAX_GIT_BUFFER });
      if (result.status !== 0) throw new Error('tracked tree could not be read');
      trackedPaths = String(result.stdout).split('\0').filter(Boolean);
    }
    const owners = file => source.components.filter(c => c.parts.some(p => contains(p, file))).map(c => c.id);
    const counts = new Map();
    const add = (from, to, source, token) => { if (from === to) return; const key = `${from}\0${to}\0${source}`; if (!counts.has(key)) counts.set(key, new Set()); counts.get(key).add(token); };
    const joinPaths = (a, b, kind, token) => { for (const from of owners(a)) for (const to of owners(b)) add(from, to, kind, token); };
    for (const [file, module] of imports.modules) for (const callee of module.callees) joinPaths(file, callee, 'import', `${file}\0${callee}`);
    const parsed = parseLedger(ledgerText), registry = artifactRegistry(parsed, trackedPaths);
    for (const read of artifactReads(parsed, trackedPaths, registry).reads.filter(r => r.valid)) {
      const artifact = registry.byId.get(read.id);
      if (!artifact?.live) continue;
      for (const writer of artifact.writers) for (const reader of read.readers) joinPaths(writer, reader, 'artifact', artifact.id);
    }
    for (const capability of parsed.headings.filter(h => h.id?.startsWith('CAP-'))) for (const [row, claims] of deliverableClaims(parsed, capability, registry)) {
      const makers = claims.filter(c => c.madeByCode).flatMap(c => c.paths);
      const readers = claims.filter(c => c.readByCode).flatMap(c => c.paths);
      for (const a of makers) for (const b of readers) joinPaths(a, b, 'join', row);
    }
    for (const [i, a] of source.components.entries()) for (const b of source.components.slice(i + 1)) {
      const ids = new Set(b.features.map(f => typeof f === 'string' ? f : f.id));
      for (const f of a.features.map(f => typeof f === 'string' ? f : f.id)) if (ids.has(f)) add(a.id, b.id, 'feature', f);
    }
    const recorded = [...counts.keys()].map(key => key.split('\0').slice(0, 2).sort().join('/'));
    for (const [i, from] of loop.spine.entries()) add(from, loop.spine[(i + 1) % loop.spine.length], 'loop', 'declared');
    const edges = [...counts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, values]) => {
      const [from, to, source] = key.split('\0'); return { from, to, source, count: values.size, ...(source === 'loop' ? { declared: !recorded.includes([from, to].sort().join('/')) } : {}) };
    });
    const placements = [...loop.spine.map(id => ({ id, role: 'spine', stage: id })), ...loop.attachments];
    const nodes = settle(placements.map(n => ({ ...n, radius: footprint(source.components.find(c => c.id === n.id)) })), edges, loop.spine);
    const document = { contract: 'nana-component-graph', version: 1, spine: loop.spine, nodes, edges, roads: roads(nodes, edges, loop.spine) };
    const units = { import: 'import links', artifact: 'artifacts', join: 'deliverable rows', feature: 'shared features', loop: 'declared steps' };
    const lines = Object.entries(units).map(([kind, unit]) => { const records = edges.filter(e => e.source === kind); return `${kind}: ${records.length} directed pairs; ${records.reduce((sum, e) => sum + e.count, 0)} ${unit}`; });
    lines.push(`roads: ${document.roads.filter(r => ['loop', 'spur'].includes(r.class)).length} overview streets including chapter ties; ${JSON.stringify(crossings(document.roads))} crossings`);
    return { document, problems: [], lines, exitCode: 0 };
  } catch (e) { return { document: null, problems: [`graph: ${String(e.message).replace(/[\r\n]+/g, ' ')}`], lines: [], exitCode: 1 }; }
}
export async function main(argv = process.argv.slice(2), { stdout = process.stdout, ...options } = {}) {
  let root = ROOT, out;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (argv[i] === '--out' && argv[i + 1]) out = argv[++i];
    else { stdout.write('Usage: component-graph.mjs [--root <dir>] [--out <file>]\n'); return 2; }
  }
  const result = await buildGraph({ root, ...options });
  for (const line of [...result.problems, ...result.lines]) stdout.write(`${line}\n`);
  if (out && result.document && !result.problems.length) writeFileSync(out, `${JSON.stringify(result.document, null, 2)}\n`);
  return result.exitCode;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
