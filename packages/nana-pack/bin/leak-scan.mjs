#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/leak-scan.mjs
 * @purpose Block a seat's push when its selected commit range has leaks or unread content.
 * @inputs --base/--tip refs or --pre-push remote and optional URL, git ref lines on stdin, cwd and injectable scanner options and output streams.
 * @outputs Shared counts-only diagnostics and exit 0 clean, 1 hit/skip, or 2 usage/unavailable.
 * @effects process (git through the scanner and stdout/stderr), disk (scanner config)
 * @errors Usage and scan failures print a fixed diagnostic and return 2.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanCommitRange, scanMetadata, leakScanLines } from '../lib/leak-scan.mjs';

/** Git supplies object IDs, not necessarily commits: annotated tags need their own scan. */
export function runPrePush(argv, {stdout = process.stdout, stderr = process.stderr, input, ...options} = {}) {
  if (argv.length < 1 || argv.length > 2 || !argv[0] || argv[0].startsWith('-')) {
    stderr.write('usage: leak-scan.mjs --pre-push <remote> [<url>]\n'); return 2;
  }
  const git = args => execFileSync('git', args, {cwd:options.cwd ?? process.cwd(),stdio:['ignore','pipe','pipe'],maxBuffer:Infinity}).toString('utf8').trimEnd();
  const isCommit = object => {
    try { return git(['cat-file','-t',object]) === 'commit'; } catch { return false; }
  };
  let exit = 0;
  try {
    const lines = (input ?? readFileSync(0,'utf8')).split(/\r?\n/);
    let index = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      index++;
      const fields = line.trimEnd().split(/[ \t]+/);
      if (fields.length !== 4 || !fields.every(Boolean) || ![fields[1],fields[3]].every(value=>/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value))) throw Error();
      const [,local,,remote] = fields;
      if (/^0+$/.test(local)) {
        stdout.write(`leak scan ref ${index}: deletion skipped\n`); continue;
      }
      const type = git(['cat-file','-t',local]);
      if (!['commit','tag'].includes(type)) {
        stderr.write('leak scan unavailable: unsupported pushed object type\n'); return 2;
      }
      const tip = git(['rev-parse','--verify',`${local}^{commit}`]);
      let base = remote;
      if (!isCommit(base)) {
        base = `refs/remotes/${argv[0]}/main`;
        if (!isCommit(base)) {
          stderr.write('leak scan unavailable: no local remote commit or remote main base\n'); return 2;
        }
      }
      const result = scanCommitRange({...options,base,tip,includeCommitCount:true});
      if (type === 'tag') {
        const tag = git(['cat-file','tag',local]);
        const boundary = tag.indexOf('\n\n');
        if (boundary < 0) throw Error();
        const tagger = tag.slice(0,boundary).split('\n').find(value=>value.startsWith('tagger ')) ?? '';
        result.hits.push(...scanMetadata({...options,content:`${tagger}\n${tag.slice(boundary+2)}`,commit:git(['rev-parse','--short',local]),path:'(tag metadata)'}));
      }
      for (const diagnostic of leakScanLines(result)) stdout.write(`${diagnostic}\n`);
      stdout.write(`leak scan ref ${index}: ${result.commitsScanned} commits scanned\n`);
      if (result.hits.length || result.skipped.length) exit = 1;
    }
    return exit;
  } catch {
    stderr.write('leak scan unavailable: cannot scan pushed refs\n'); return 2;
  }
}

export function runLeakScan(argv, {stdout = process.stdout, stderr = process.stderr, ...options} = {}) {
  if (argv[0] === '--pre-push') return runPrePush(argv.slice(1),{stdout,stderr,...options});
  const usage = 'usage: leak-scan.mjs --base <ref> --tip <ref> (scans from merge-base of base and tip)\n';
  const refs = {};
  for (let i=0; i<argv.length; i+=2) {
    const flag=argv[i], value=argv[i+1];
    if (!['--base','--tip'].includes(flag) || !value || value.startsWith('-') || refs[flag.slice(2)]) {
      stderr.write(usage); return 2;
    }
    refs[flag.slice(2)] = value;
  }
  if (!refs.base || !refs.tip) {stderr.write(usage);return 2;}
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
