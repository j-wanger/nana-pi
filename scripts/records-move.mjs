/**
 * @module scripts/records-move.mjs
 * @purpose Derive and check the folders retained by the old review records move.
 * @inputs Tracked repository text, review blob IDs, git history and records-move.config.json.
 * @outputs Protection reasons and missing, changed or excess folder diagnostics.
 * @effects disk, process
 * @errors Git failures throw; check failures exit one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultGit } from './git-runner.mjs';

export const POLICY=JSON.parse(fs.readFileSync(new URL('./records-move.config.json',import.meta.url),'utf8'));
const prefix='docs/reviews/';
const folderOf=file=>file.startsWith(prefix)&&file.slice(prefix.length).includes('/')?file.slice(prefix.length).split('/')[0]:null;
function git(root,args) {
 const r=defaultGit(root,args);if(r.status!==0)throw Error(`records: git ${args[0]} failed`);return r.stdout;
}
function tree(root,ref) {
 return new Map(git(root,['ls-tree','-r','-z',ref,'--','docs/reviews/']).split('\0').filter(Boolean).map(row=>{const [meta,file]=row.split('\t');return [file,meta.split(' ')[2]];}));
}
/** Expand comma brace alternatives, including multiple braces, without shell evaluation. */
export function expandReferences(text) {
 const brace=/([^\s`"'<>]*?)\{([^{}\s]+)\}([^\s`"'<>]*)/gu;
 let expanded=text;
 while(brace.test(expanded)) {brace.lastIndex=0;expanded=expanded.replace(brace,(_,a,b,c)=>b.split(',').map(v=>a+v+c).join(' '));brace.lastIndex=0;}
 return expanded.replaceAll('\\','/');
}
/** Baseline candidates survive deletion, so removing a folder cannot erase its protection. */
export function deriveProtected(root,policy=POLICY) {
 const original=tree(root,policy.baseline),folders=new Set([...original.keys()].map(folderOf).filter(Boolean));
 const protectedFolders=new Map(),basenames=new Map();
 const keep=(folder,reason)=>{if(!protectedFolders.has(folder))protectedFolders.set(folder,new Set());protectedFolders.get(folder).add(reason);};
 for(const file of original.keys()) {const folder=folderOf(file);if(!folder)continue;const name=path.posix.basename(file);if(!basenames.has(name))basenames.set(name,new Set());basenames.get(name).add(folder);}
 const files=git(root,['ls-files','-z']).split('\0').filter(file=>file&&!file.startsWith(prefix)&&!file.startsWith('docs/sessions/'));
 for(const file of files) {
  let text;try{text=expandReferences(fs.readFileSync(path.join(root,file),'utf8'));}catch(e){if(e.code==='ENOENT')continue;throw e;}
  // Tokens preserve full paths and bare names while ignoring markdown punctuation.
  const tokens=new Set(text.split(/[^\w./-]+/u));
  for(const raw of tokens) {
   const token=raw.replace(/[./]+$/u,'');
   const folder=token.startsWith(prefix)?token.slice(prefix.length).split('/')[0]:token;
   if(folders.has(folder))keep(folder,`reference: ${file}`);
   const owners=basenames.get(token);if(owners?.size===1)keep([...owners][0],`basename: ${file}`);
  }
 }
 const history=git(root,['log','--format=@%cI','--name-only',policy.baseline,'--','docs/reviews/']);
 const visited=new Set();let date='';
 for(const line of history.split(/\r?\n/u).map(s=>s.trim())) {
  if(line.startsWith('@')){date=line.slice(1,11);continue;}
  const folder=folderOf(line);if(folder&&!visited.has(folder)){visited.add(folder);if(date>=policy.since)keep(folder,'recent');}
 }
 return {protected:protectedFolders,original,folders};
}
export function openLane(folder,policy=POLICY) {
 return policy.openLanes.some(lane=>folder===lane||folder.replace(/-\d{4}-\d{2}-\d{2}$/u,'')===lane);
}
/** Compare the index's tracked blobs (including staged moves) and the checkout's bytes. */
export function checkRecords(root,policy=POLICY) {
 const derived=deriveProtected(root,policy),current=new Map();
 for(const row of git(root,['ls-files','-s','-z','--','docs/reviews/']).split('\0').filter(Boolean)) {const [meta,file]=row.split('\t');current.set(file,meta.split(' ')[1]);}
 const present=new Set([...current.keys()].map(folderOf).filter(Boolean)),problems=[];
 for(const [folder] of derived.protected) {
  if(!present.has(folder)){problems.push(`missing protected folder: ${folder}`);continue;}
  const entries=map=>[...map].filter(([file])=>folderOf(file)===folder).sort(([a],[b])=>a.localeCompare(b));
  if(JSON.stringify(entries(current))!==JSON.stringify(entries(derived.original)))problems.push(`changed protected folder: ${folder}`);
  else for(const [file,blob] of entries(current)) {
   if(!fs.existsSync(path.join(root,file))||git(root,['hash-object','--path',file,'--',file]).trim()!==blob){problems.push(`changed protected file: ${file}`);break;}
  }
 }
 for(const folder of present)if(!derived.protected.has(folder)&&!openLane(folder,policy))problems.push(`unprotected folder remains: ${folder}`);
 return {...derived,present,problems};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {const result=checkRecords(path.resolve(fileURLToPath(new URL('..',import.meta.url))));console.log(`records: ${result.protected.size} protected, ${result.problems.length} problems`);for(const problem of result.problems)console.log(problem);process.exitCode=Number(result.problems.length>0);}catch(e){console.error(e.message);process.exitCode=1;}
}
