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
import { contextPart, promptSectionParts } from './context-load-log.mjs';
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
if (process.argv[3] === 'sections') {
  result.sections = promptSectionParts();
  try {
    const cwd = process.cwd(), args = JSON.parse(process.argv[2]);
    const located = locatePiPackage({ env: process.env, cwd });
    if (located.refused) throw new Error('pi unavailable');
    const pi = await import(pathToFileURL(join(located.packageDir, 'dist', 'index.js')).href);
    const additionalExtensionPaths = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-e' || args[i] === '--extension') additionalExtensionPaths.push(args[++i]);
      else if (args[i].startsWith('--extension=')) additionalExtensionPaths.push(args[i].slice('--extension='.length));
    }
    const loader = new pi.DefaultResourceLoader({ cwd, agentDir: piAgentDir(),
      noExtensions: args.includes('-ne') || args.includes('--no-extensions'), additionalExtensionPaths,
      noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true });
    await loader.reload();
    const loaded = loader.getExtensions();
    if (loaded.errors.length) throw new Error('extension discovery failed');
    const extensions = loaded.extensions.filter(ext => /(?:^|[/\\])nana-(?:objective|rulings|writing)\.[cm]?[jt]s$/.test(ext.resolvedPath));
    const ctx = { cwd, hasUI: false, isProjectTrusted: () => false };
    const event = { systemPromptOptions: { sections: {} } };
    for (const ext of extensions) for (const handler of ext.handlers.get('session_start') ?? []) await handler({ reason: 'startup' }, ctx);
    for (const ext of extensions) for (const handler of ext.handlers.get('before_agent_start') ?? []) await handler(event, ctx);
    result.sections = promptSectionParts(event.systemPromptOptions.sections);
  } catch { /* Unknown is never reported as a skipped section. */ }
}
emit(JSON.stringify(result), () => process.exit(0));
