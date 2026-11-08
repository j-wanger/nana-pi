/**
 * @module packages/nana-pack/lib/pi-context-load.mjs
 * @purpose Bound pi context measurement in a disposable child without changing launch delivery.
 * @inputs Actual child cwd, environment and pi arguments, plus optional process and timer boundaries.
 * @outputs Ordered contextPart measurements and piVersion, one disabled/unavailable part, or a cancellation signal.
 * @effects process (spawns Node, discards diagnostics, kills measurement on deadline)
 * @errors Never throws; process, protocol and deadline failures become content-free unavailable parts.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contextPart, promptSectionParts } from './context-load-log.mjs';
import { killProcessTreeNoWait } from './process-tree.mjs';
import { PI_CONTEXT_TIMEOUT_MS, PI_CONTEXT_OUTPUT_MAX_BYTES } from '../bin/worker-config.mjs';

export async function piContextLoad({ cwd, env, args, sections = false, start = spawn, schedule = setTimeout, cancel = clearTimeout }) {
  const unavailable = reason => ({ piVersion: null, parts: [contextPart(`context files: unavailable (${reason})`, 'pi', '')], ...(sections ? { sections: promptSectionParts() } : {}) });
  try {
    return await new Promise(resolve => {
      let settled = false, bytes = 0;
      const chunks = [];
      const child = start(process.execPath, [fileURLToPath(new URL('./pi-context-measure.mjs', import.meta.url)), JSON.stringify(args), ...(sections ? ['sections'] : [])], { cwd, env, detached: true, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
      const finish = result => {
        if (settled) return;
        settled = true;
        cancel(timer);
        for (const [name, handler] of handlers) process.removeListener(name, handler);
        resolve(result);
      };
      const stop = result => {
        killProcessTreeNoWait(child.pid, { fallback: signal => child.kill(signal) });
        // Direct kill also covers Windows without waiting for taskkill to finish.
        try { child.kill('SIGKILL'); } catch { /* already dead */ }
        child.stdout.destroy();
        child.unref();
        finish(result);
      };
      const handlers = ['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => [signal, () => stop({ piVersion: null, parts: [], ...(sections ? { sections: promptSectionParts() } : {}), signal })]);
      const timer = schedule(() => stop(unavailable('timed out')), PI_CONTEXT_TIMEOUT_MS);
      for (const [name, handler] of handlers) process.on(name, handler);
      child.stdout.on('data', chunk => {
        if (settled) return;
        bytes += chunk.length;
        if (bytes > PI_CONTEXT_OUTPUT_MAX_BYTES) return stop(unavailable('output too large'));
        chunks.push(chunk);
      });
      child.once('error', () => finish(unavailable('pi context process failed')));
      child.once('close', code => {
        if (settled) return;
        try {
          if (code !== 0) throw new Error('child failed');
          const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (!(result.piVersion === null || typeof result.piVersion === 'string') || !Array.isArray(result.parts) || !result.parts.every(part => typeof part.name === 'string' && typeof part.source === 'string' && Number.isInteger(part.fullChars) && part.fullChars >= 0 && part.deliveredChars === part.fullChars)) throw new Error('bad metadata');
          const measuredSections = sections ? promptSectionParts().map(expected => {
            const part = result.sections?.find(part => part.name === expected.name);
            return part && part.source === expected.source && (part.deliveredChars === 'unavailable' || Number.isInteger(part.deliveredChars) && part.deliveredChars >= 0) && part.fullChars === part.deliveredChars
              ? { ...expected, fullChars: part.fullChars, deliveredChars: part.deliveredChars } : expected;
          }) : null;
          finish({ piVersion: result.piVersion, parts: result.parts.map(({ name, source, fullChars, deliveredChars }) => ({ name, source, fullChars, deliveredChars })), ...(sections ? { sections: measuredSections } : {}) });
        } catch { finish(unavailable('pi context process failed')); }
      });
    });
  } catch { return unavailable('pi context lookup failed'); }
}
