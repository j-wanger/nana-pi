/**
 * @module packages/nana-pack/lib/leak-scan.mjs
 * @purpose Scan each range commit's changed blobs and repository-relative names for identity words and literal machine paths.
 * @inputs Repository cwd, base/tip commit refs, optional digest config, home, temp root, platform and real-path resolver.
 * @outputs Counts-only hits, visible skips, and shared diagnostic lines without matched text.
 * @effects disk (checkout-relative config and machine-folder realpath), process (git history and bounded blob reads)
 * @errors Throws fixed unavailable reasons for config, refs or git failures without echoing inputs.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { countIdentityWords, validateConfig } from '../../../scripts/identity-scan.mjs';
import { LEAK_FILE_MAX_BYTES } from './leak-scan-config.mjs';
import { realPath } from './real-path.mjs';

function machineForms(value, platform) {
  if (!value) return [];
  const slash = value.replaceAll('\\', '/').replace(/\/+$/, '');
  const forms = [value.replace(/[\\/]+$/, ''), slash];
  if (platform === 'win32' && /^[a-z]:\//i.test(slash)) forms.push(`/${slash[0]}/${slash.slice(3)}`);
  return [...new Set(forms)].filter(Boolean);
}
export function machineCount(text, value, platform, resolveRealPath) {
  const spellings = value ? [value, resolveRealPath(value)] : [value];
  const forms = [...new Set(spellings.flatMap(spelling=>machineForms(spelling, platform)))];
  if (!forms.length) return 0;
  const escaped = forms.sort((a,b)=>b.length-a.length).map(form=>form.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const pattern = new RegExp(`(?:${escaped.join('|')})(?=[\\\\/"'\\s]|$)`, platform === 'win32' ? 'gi' : 'g');
  return [...text.matchAll(pattern)].length;
}

export function scanCommitRange({ cwd = process.cwd(), base, tip, config, home = homedir(), tmp = tmpdir(), platform = process.platform, realPath: resolveRealPath = realPath } = {}) {
  try {
    config ??= JSON.parse(readFileSync(new URL('../../../identity-scan.config.json', import.meta.url), 'utf8'));
    validateConfig(config);
  } catch { throw new Error('identity config unavailable'); }
  const git = (args, maxBuffer = Infinity) => {
    try { return execFileSync('git', args, { cwd, maxBuffer, stdio: ['ignore','pipe','pipe'] }); }
    catch { throw new Error('git range or blob unavailable'); }
  };
  const resolve = ref => {
    if (typeof ref !== 'string' || !ref || ref.startsWith('-')) throw new Error('commit ref unavailable');
    return git(['rev-parse','--verify','--end-of-options',`${ref}^{commit}`]).toString('utf8').trim();
  };
  const from = resolve(base), to = resolve(tip);
  const start = git(['merge-base',from,to]).toString('utf8').trim();
  const commits = git(['rev-list','--reverse',`${start}..${to}`]).toString('utf8').trim().split('\n').filter(Boolean);
  const hits = [], skipped = [];
  for (const revision of commits) {
    const commit = git(['rev-parse','--short',revision]).toString('utf8').trim();
    const files = git(['diff-tree','--root','--no-commit-id','-r','-m','--first-parent','--find-renames','--name-only','-z','--diff-filter=d',revision,'--']).toString('utf8').split('\0').filter(Boolean);
    for (const file of files) {
      // Inspect size before requesting bytes: an over-cap blob is never read, even partially.
      const object = `${revision}:${file}`;
      const size = Number(git(['cat-file','-s',object]).toString('utf8').trim());
      if (!Number.isSafeInteger(size) || size < 0) throw new Error('blob size unavailable');
      if (size > LEAK_FILE_MAX_BYTES) { skipped.push({path:file,commit,reason:`over ${LEAK_FILE_MAX_BYTES} byte cap`}); continue; }
      const content = git(['cat-file','blob',object], LEAK_FILE_MAX_BYTES).toString('utf8');
      const counts = countIdentityWords({path:file,content,config});
      counts.forEach((count,wordIndex)=> {if(count) hits.push({path:file,commit,kind:'identity',wordIndex,count});});
      const text = `${file}\n${content}`;
      for (const [kind,value] of [['home',home],['temp',tmp]]) {
        const count = machineCount(text,value,platform,resolveRealPath);
        if (count) hits.push({path:file,commit,kind,count});
      }
    }
  }
  return {hits,skipped};
}

/** Both launchers use these counts-only lines; a skip never reads as clean. */
export function leakScanLines(result) {
  if (result.unavailable) return [`leak scan unavailable: ${result.unavailable}`];
  return [
    ...result.hits.map(hit=>`leak: ${hit.path} (${hit.commit}): ${hit.kind === 'identity' ? `identity word ${hit.wordIndex}` : `${hit.kind} path`} ×${hit.count}`),
    ...result.skipped.map(skip=>`leak scan skipped: ${skip.path} (${skip.commit}): ${skip.reason}`),
    `leak scan summary: ${result.hits.length} hits, ${result.skipped.length} skipped`,
  ];
}
