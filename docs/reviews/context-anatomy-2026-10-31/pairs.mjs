/**
 * @module docs/reviews/context-anatomy-2026-10-31/pairs.mjs
 * @purpose Run the plan's wrong-code pairs in an OS-temp copy, never through the suite.
 * @inputs This checkout's implementation and the eleven context delivery tests.
 * @outputs Red/green pair log to stdout.
 * @effects disk (temporary code copy and mutations), process (bounded test children)
 * @errors Exits nonzero for a surviving mutation or failed green control.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'context-pairs-'));
for(const dir of ['packages/nana-pack','packages/nana-setup','scripts']) fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});
const worker='packages/nana-pack/bin/pi-worker.mjs',review='packages/nana-pack/bin/claude-review.mjs',pi='packages/nana-pack/bin/pi-review.mjs',carry='packages/nana-pack/lib/claude-settings-carry.mjs',digest='packages/nana-pack/lib/known-bug-digest.mjs',log='packages/nana-pack/lib/context-load-log.mjs',hook='packages/nana-setup/claude/hooks/nana-shared-memory.mjs';
const pairs=[];
const pair=(row,label,file,old,replacement)=>pairs.push({row,label,changes:[[file,old,replacement]]});
pair('R-3210','drop strict MCP',review,'settingsFile, CLAUDE_STRICT_MCP_FLAG,','settingsFile,');
pair('R-3210','drop effort',review,'...(carry.effort ? [CLAUDE_EFFORT_FLAG, carry.effort] : [])','...[]');
pair('R-3210','hard-code xhigh',review,'[CLAUDE_EFFORT_FLAG, carry.effort]','[CLAUDE_EFFORT_FLAG, "xhigh"]');
pair('R-3210','prefer top-level effort',carry,'parsed.modelSettings?.[model]?.effortLevel ?? parsed.effortLevel','parsed.effortLevel ?? parsed.modelSettings?.[model]?.effortLevel');
pair('R-3211','copy all user settings',carry,'const settings = { claudeMdExcludes };','const settings = { ...parsed, claudeMdExcludes };');
pair('R-3211','drop sealed auto-memory',review,'{ ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV }','{ ...REVIEWER_CHILD_ENV }');
pair('R-3211','retain settings on failed ledger',review,"process.once('exit', cleanup);","process.once('exit', code => { if (code === 0) cleanup(); });");
pair('R-3211','retain settings after SIGTERM',review,'() => { cleanup(); process.exit(','() => { process.removeListener("exit", cleanup); process.exit(');
pair('R-3211','wrong carry launcher label',review,"}, 'claude-review', reviewer.model, tree)","}, 'pi-worker', reviewer.model, tree)");
pair('R-3212','cut mid-line',digest,"if (text.length - header.length <= budget)","if (text.length > budget) return { text: text.slice(0,budget) };\n  if (text.length - header.length <= budget)");
pair('R-3212','fill from top',digest,'for (let i=bugs.length-1;i>=0;i--)','for (let i=0;i<bugs.length;i++)');
pair('R-3212','skip brief matches',digest,'if (terms.some(term => bugs[i].includes(term)))','if (false)');
pair('R-3212','cap pi only',worker,"if (digest) promptParts.push(Buffer.from('\\n\\n'), Buffer.from(digest.text));","if (digest) promptParts.push(Buffer.from('\\n\\n'), Buffer.from(bugText));");
pair('R-3212','cap Claude only',worker,"deliveredBugPath ? ['--append-system-prompt', deliveredBugPath]","knownBugPath ? ['--append-system-prompt', knownBugPath]");
pair('R-3212','count bytes',digest,'if (render().length - header.length > budget)','if (Buffer.byteLength(render()) - header.length > budget)');
pair('R-3212','drop header',digest,"let kept = header + bugs.filter","let kept = '' + bugs.filter");
pair('R-3213','always fold at cap',digest,'if (text.length - header.length <= budget)','if (text.length <= budget && text.length !== KNOWN_BUG_DIGEST_CHARS)' );
pair('R-3214','omit pi known bugs',pi,"...(knownBugPrompt === null ? [] : ['--append-system-prompt', knownBugPrompt])","...[]");
pair('R-3214','full cap per feature',digest,'Math.floor(remaining/(files.length-i))','KNOWN_BUG_DIGEST_CHARS');
pair('R-3214','drop brief fallback',digest,'if (!files.length) { const feature','if (false) { const feature');
pair('R-3214','drop section lead',digest,'${KNOWN_BUG_SECTION_LEAD}\\n\\n','');
pair('R-3215','log only successful child',worker,'appendContextLoad(contextLoad);',"child.once('exit', code => { if (code === 0) appendContextLoad(contextLoad); });");
pair('R-3215','log non-lane workers',worker,"} else r = await runWatchdog('pi-worker', { ...w, childEnv });","} else { appendContextLoad({launcher:'pi-worker'}); r = await runWatchdog('pi-worker', { ...w, childEnv }); }");
pair('R-3216','let log write throw',log,'const reason = String(error?.code',"throw error;\n    const reason = String(error?.code");
pairs.push({row:'R-3216',label:'write cwd-relative log inside worktree',changes:[[log,"if (relative) throw new Error('cwd-relative agent dir');",''],[log,"lstatSync(join(parent,'.git')); throw new Error('log path is inside a git worktree');","lstatSync(join(parent,'.git'));"]]});
pairs.push({row:'R-3216',label:'log import before hook stdout',changes:[[hook,'process.stdout.write(output);','// stdout moved after logging import'],[hook,"const { appendContextLoad } = await import('../../../nana-pack/lib/context-load-log.mjs');","const { appendContextLoad } = await import('../../../nana-pack/lib/context-load-log.mjs');\n        process.stdout.write(output);"]]});
pair('R-3216','static hook import',hook,'import * as fs from "node:fs";',"import { appendContextLoad as staticLog } from '../../../nana-pack/lib/context-load-log.mjs';\nimport * as fs from \"node:fs\";");
pair('R-3217','log counts not filenames',hook,'whole: files(whole), shortened: files(shortenedEntries), omitted: files(omitted)','whole: whole.length, shortened: shortenedEntries.length, omitted: omitted.length');
// The seal is a new test too: prove it rejects a changed limit.
pair('R-3218','retune sealed limit','packages/nana-pack/lib/known-bug-digest-config.mjs','KNOWN_BUG_DIGEST_CHARS = 6000','KNOWN_BUG_DIGEST_CHARS = 5999');
pair('R-3212','charge huge header against share',digest,'if (render().length - header.length > budget)','if (render().length > budget)');
pair('R-3219','omit ancestor exclusions',carry,'const settings = { claudeMdExcludes };','const settings = {};');
pair('R-3219','exclude only immediate parent',carry,'if (ancestor === path.dirname(ancestor)) break;','break;');
pair('R-3219','exclude tree instructions too',carry,'path.dirname(path.resolve(tree))','path.resolve(tree)');
pair('R-3219','retune ancestor path seal','packages/nana-pack/bin/worker-config.mjs',"'.claude/rules/**'","'.claude/rules/*.md'");
pair('R-3211: cloud','drop cloud credentials',carry,'if (allowed.has(name.toLowerCase()))','if (allowed.has(name.toLowerCase()) && !["AWS_BEARER_TOKEN_BEDROCK", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "GOOGLE_APPLICATION_CREDENTIALS"].includes(name))');
pair('R-3211: cloud','drop cloud endpoints',carry,'if (allowed.has(name.toLowerCase()))','if (allowed.has(name.toLowerCase()) && !name.endsWith("_BASE_URL"))');
pair('R-3211: cloud','drop cloud auth helpers',carry,'if (Object.hasOwn(parsed, key))','if (Object.hasOwn(parsed, key) && !["awsAuthRefresh", "awsCredentialExport", "gcpAuthRefresh"].includes(key))');
pair('R-3211: cloud','print private settings',carry,'detail = names.length ? names.join', 'detail = JSON.stringify(settings) + (names.length ? names.join');
// Close the expression added by the private-settings diagnostic mutation.
pairs.at(-1).changes.push([carry, "names.join(', ') : 'none';", "names.join(', ') : 'none');"]);
const run=row=>spawnSync(process.execPath,[path.join(temp,'packages/nana-pack/tests/context-anatomy.test.mjs')],{cwd:temp,env:{...process.env,HOME:path.join(temp,'home'),USERPROFILE:path.join(temp,'home'),PI_CODING_AGENT_DIR:path.join(temp,'agent'),CONTEXT_CASE:row},encoding:'utf8',timeout:120_000});
const clean=s=>String(s).replaceAll(temp,'<temp-copy>').replaceAll(root,'<checkout>');
let failures=0;
for(const p of pairs){
  const saved=new Map();
  for(const [file] of p.changes) if(!saved.has(file))saved.set(file,fs.readFileSync(path.join(temp,file),'utf8'));
  try{
    for(const [file,old,replacement]of p.changes){const name=path.join(temp,file),s=fs.readFileSync(name,'utf8');if(!s.includes(old))throw Error(`mutation target absent: ${p.label}`);fs.writeFileSync(name,s.replace(old,replacement));}
    const red=run(p.row);console.log(`PAIR ${p.row} ${p.label}: RED exit ${red.status}`);console.log(clean(red.stdout+red.stderr));if(red.status!==1||!red.stdout.includes(`FAIL ${p.row}`))failures++;
  }finally{for(const[file,s]of saved)fs.writeFileSync(path.join(temp,file),s);}
  const green=run(p.row);console.log(`PAIR ${p.row} ${p.label}: GREEN exit ${green.status}`);console.log(clean(green.stdout+green.stderr));if(green.status!==0)failures++;
}
console.log(`${pairs.length} pairs; ${failures} failed pairs`);
fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});
process.exitCode=failures?1:0;
