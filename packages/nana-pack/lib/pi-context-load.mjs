/**
 * @module packages/nana-pack/lib/pi-context-load.mjs
 * @purpose Measure the context files pi would load for a child without changing its delivery.
 * @inputs Actual child cwd, environment and pi arguments, plus an optional package locator and module importer.
 * @outputs Ordered contextPart measurements and piVersion, or one disabled/unavailable part.
 * @effects disk (locates pi, imports its public entry and calls its context file loader)
 * @errors Never throws; lookup, import, export and loader failures become content-free unavailable parts.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { piAgentDir } from './agent-dir.mjs';
import { contextPart } from './context-load-log.mjs';
import { locatePiPackage } from './pi-package.mjs';

export async function piContextLoad({ cwd, env, args, locate = locatePiPackage, importModule = url => import(url) }) {
  let piVersion = null;
  const unavailable = reason => ({ piVersion, parts: [contextPart(`context files: unavailable (${reason})`, 'pi', '')] });
  try {
    const located = locate({ env, cwd });
    piVersion = located.packageJson?.version ?? null;
    if (args.some(arg => arg === '--no-context-files' || arg === '-nc')) return { piVersion, parts: [contextPart('context files: disabled (-nc)', 'argv', '')] };
    if (located.refused) return unavailable(located.refused);
    let pi;
    try { pi = await importModule(pathToFileURL(join(located.packageDir, 'dist', 'index.js')).href); }
    catch { return unavailable('pi entry import failed'); }
    if (typeof pi.loadProjectContextFiles !== 'function') return unavailable('missing loadProjectContextFiles export');
    try {
      const files = await pi.loadProjectContextFiles({ cwd, agentDir: piAgentDir({ env, cwd }) });
      return { piVersion, parts: files.map(file => contextPart('context file', file.path, file.content)) };
    } catch { return unavailable('loadProjectContextFiles failed'); }
  } catch { return unavailable('pi context lookup failed'); }
}
