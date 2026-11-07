/**
 * @module packages/nana-pack/lib/pi-context-measure.mjs
 * @purpose Measure pi context in a disposable Node process without emitting file content.
 * @inputs Child cwd and environment, and pi args encoded in argv.
 * @outputs One JSON result containing only version, paths, status names and character counts.
 * @effects disk (locates pi and calls its exported loader), process (imports pi only here and exits)
 * @errors Lookup, import, export and loader failures become content-free unavailable parts.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { piAgentDir } from './agent-dir.mjs';
import { contextPart } from './context-load-log.mjs';
import { locatePiPackage } from './pi-package.mjs';

// Pi's own diagnostics must never share the metadata channel or reach the launcher.
const emit = process.stdout.write.bind(process.stdout);
process.stdout.write = () => true;
async function measure() {
  let piVersion = null;
  const unavailable = reason => ({ piVersion, parts: [contextPart(`context files: unavailable (${reason})`, 'pi', '')] });
  try {
    const cwd = process.cwd(), env = process.env, args = JSON.parse(process.argv[2]);
    const located = locatePiPackage({ env, cwd });
    piVersion = located.packageJson?.version ?? null;
    if (args.some(arg => arg === '--no-context-files' || arg === '-nc')) return { piVersion, parts: [contextPart('context files: disabled (-nc)', 'argv', '')] };
    if (located.refused) return unavailable(located.refused);
    let pi;
    try { pi = await import(pathToFileURL(join(located.packageDir, 'dist', 'index.js')).href); }
    catch { return unavailable('pi entry import failed'); }
    if (typeof pi.loadProjectContextFiles !== 'function') return unavailable('missing loadProjectContextFiles export');
    try {
      const files = await pi.loadProjectContextFiles({ cwd, agentDir: piAgentDir({ env, cwd }) });
      return { piVersion, parts: files.map(file => contextPart('context file', file.path, file.content)) };
    } catch { return unavailable('loadProjectContextFiles failed'); }
  } catch { return unavailable('pi context lookup failed'); }
}
const result = await measure();
emit(JSON.stringify(result), () => process.exit(0));
