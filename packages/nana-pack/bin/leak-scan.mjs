#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/leak-scan.mjs
 * @purpose Block a seat's push when its selected commit range has leaks or unread content.
 * @inputs --base and --tip refs, cwd and injectable scanner options and output streams.
 * @outputs Shared counts-only diagnostics and exit 0 clean, 1 hit/skip, or 2 usage/unavailable.
 * @effects process (git through the scanner and stdout/stderr), disk (scanner config)
 * @errors Usage and scan failures print a fixed diagnostic and return 2.
 */
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scanCommitRange, leakScanLines } from '../lib/leak-scan.mjs';

export function runLeakScan(argv, {stdout = process.stdout, stderr = process.stderr, ...options} = {}) {
  const refs = {};
  for (let i=0; i<argv.length; i+=2) {
    const flag=argv[i], value=argv[i+1];
    if (!['--base','--tip'].includes(flag) || !value || value.startsWith('-') || refs[flag.slice(2)]) {
      stderr.write('usage: leak-scan.mjs --base <ref> --tip <ref>\n'); return 2;
    }
    refs[flag.slice(2)] = value;
  }
  if (!refs.base || !refs.tip) {stderr.write('usage: leak-scan.mjs --base <ref> --tip <ref>\n');return 2;}
  try {
    const result = scanCommitRange({...options,...refs});
    for (const line of leakScanLines(result)) stdout.write(`${line}\n`);
    return result.hits.length || result.skipped.length ? 1 : 0;
  } catch {
    stderr.write('leak scan unavailable: cannot scan commit range\n'); return 2;
  }
}
// Resolve both paths so invoking the gate through a symlink cannot silently skip it.
if (process.argv[1] && realpathSync.native(process.argv[1]) === realpathSync.native(fileURLToPath(import.meta.url))) {
  process.exitCode = runLeakScan(process.argv.slice(2));
}
