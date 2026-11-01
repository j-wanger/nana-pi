/**
 * @module packages/nana-pack/tests/memory-run-fixture.mjs
 * @purpose Supply synthetic automatic-memory fixtures with local-only git transport.
 * @inputs OS temporary directories and injected runners.
 * @outputs Temporary homes, profile clones, transcript builders and command adapters.
 * @effects disk, process
 * @errors Fixture failures throw.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture } from './profile-fixture.mjs';
import { projectKey } from '../../nana-setup/lib/project-key.mjs';
import { runProfile } from '../bin/nana-profile.mjs';
import { runMemory } from '../bin/nana-memory.mjs';
import { readMemoryStore } from '../lib/memory-store.mjs';
export const now = () => new Date('2026-11-02T12:00:00Z');
export const entry = (type, uuid, content, extra={}) => ({type,uuid,sessionId:'session-a',isSidechain:false,timestamp:'2026-11-01T12:00:00Z',message:{role:type,content},...extra});
export const pair = (id, text=`Synthetic claim ${id}.`,extra={}) => [entry('assistant',`seat-${id}`,'A synthetic seat message gives sufficient context to pair the next owner choice with a concrete preceding discussion.',extra),entry('user',id,text,extra)];
export const ask = () => [entry('assistant','ask',[{type:'tool_use',id:'call',name:'AskUserQuestion',input:{questions:[{question:'Which synthetic size?'}]}}]),entry('user','answer',[{type:'tool_result',tool_use_id:'call',content:'"Which synthetic size?"="Small"'}])];
export function runner(calls=[], {usage={tokens:100,cost:0.01},kind='correction'}={}) {
 return async input => {const units=JSON.parse(input.prompt.slice(input.prompt.indexOf('[')));calls.push(units);return {ok:true,usage,text:JSON.stringify({units:units.map(u=>({id:u.id,kind:('title' in u)?'lesson':kind,claim:kind==='none'?'':u.owner??u.title}))})};};
}
export function memoryFixture() {
 const f=fixture(); const a=f.clone('profile');
 const runGit=(cwd,args)=>spawnSync('git',args,{cwd,env:f.env,encoding:'utf8',timeout:20000});
 const projectsRoot=path.join(f.temp,'transcripts');fs.mkdirSync(projectsRoot);
 const deps={agentDir:a.agent,env:a.env,cwd:f.main,runGit,now,projectsRoot,runModel:runner(),spawn:()=>{throw Error('unexpected spawn');}};
 const profile=(args,over={})=>{let output='';const code=runProfile(args,{...deps,log:s=>output+=s+'\n',error:s=>output+=s+'\n',...over});return {code,output};};
 const initialized=profile(['init','--dir',a.dir,'--save','--unverified-remote']);if(initialized.code) throw Error(initialized.output);
 const command=async(args,over={})=>{let output='';const code=await runMemory(args,{...deps,stdout:s=>output+=s,stderr:s=>output+=s,...over});return {code,output};};
 const transcript=(entries,name='a',repo=f.main,{eol='\n',final=true}={})=>{const dir=path.join(projectsRoot,projectKey(repo));fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${name}.jsonl`);fs.writeFileSync(file,entries.map(e=>JSON.stringify(e)+' \t').join(eol)+(final?eol:''));return file;};
 const review=(folder,title='Keep synthetic review evidence',repo=f.main)=>{const dir=path.join(repo,'docs','reviews',folder);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'r1.md'),`VERDICT: SEND-BACK\r\n## MUST — ${title} \t`);return dir;};
 return {...f,a,deps,runGit,profile,command,transcript,review,states:()=>readMemoryStore(a.dir).filter(r=>r.live)};
}
export function allText(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?allText(path.join(dir,e.name)):[fs.readFileSync(path.join(dir,e.name),'utf8')]).join('\n');}
export async function using(fn) {const f=memoryFixture();try{return await fn(f);}finally{f.close();}}
