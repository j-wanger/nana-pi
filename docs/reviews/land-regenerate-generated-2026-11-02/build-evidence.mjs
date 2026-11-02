// Standalone build evidence, not a suite test or a seat mutation script.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(), lane='docs/reviews/land-regenerate-generated-2026-11-02';
const mode=process.argv[2];
const clean=text=>String(text).replaceAll(root.replaceAll('\\','/'),'<checkout>').replaceAll(root,'<checkout>').replaceAll(os.tmpdir().replaceAll('\\','/'),'<temp>').replaceAll(os.tmpdir(),'<temp>').replace(/\(node:\d+\)/g,'(node:<pid>)').replace(/[ \t]+\r?$/gm,'').trimEnd()+'\n';
const run=(cwd,program,args,extra={})=>spawnSync(program,args,{cwd,encoding:'utf8',timeout:600000,maxBuffer:32*1024*1024,...extra});
const files=['land-regenerate','land-clean-merge','land-clean-merge-race','land','land-merge','land-records','test-runner'].map(name=>`packages/nana-pack/tests/${name}.test.mjs`);
function tests(cwd,selected){
 let text='',failed=0,checks=0;
 for(const file of selected){console.log(`running ${file}`);const r=run(cwd,process.execPath,[file]);text+=`COMMAND node ${file}\n${clean(r.stdout)}${clean(r.stderr)}EXIT ${r.status}\n`;if(r.status!==0)failed++;checks+=(r.stdout?.match(/^PASS /gm)??[]).length;}
 text+=`SUMMARY ${selected.length} files, ${checks} passing checks, ${failed} failed files\n`;return {text,failed};
}
function copyTree(temp){
 const listed=run(root,'git',['ls-files','-z']);if(listed.status!==0)throw Error('ls-files failed');
 const paths=new Set([...listed.stdout.split('\0').filter(Boolean),files[0]]);
 for(const rel of paths){const dest=path.join(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);}
}
if(mode==='tests'){
 const r=tests(root,files);fs.writeFileSync(`${lane}/build-1-green.txt`,r.text);console.log(r.text.split('\n').filter(line=>line.startsWith('EXIT')||line.startsWith('SUMMARY')).join('\n'));process.exitCode=r.failed?1:0;
}else if(mode==='wrong-base'){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'land base proof '));
 try{
  console.log('copying base proof tree');copyTree(temp);console.log('base proof tree copied');
  for(const rel of ['packages/nana-pack/bin/nana-land.mjs','packages/nana-pack/lib/land-config.mjs','templates/_shared/working-under-nana-pi.md','AGENTS.md','packages/nana-pack/README.md','packages/nana-pack/rules/nana-rulings.md']){
   const r=run(root,'git',['show',`1af2d93a:${rel}`]);if(r.status!==0)throw Error('base read failed');fs.writeFileSync(path.join(temp,rel),r.stdout);
  }
  const before=tests(temp,files.slice(0,2));
  const after=tests(root,files.slice(0,2));
  fs.writeFileSync(`${lane}/wrong-code.txt`,`Branch-base code: 1af2d93a (final tests and corrected Windows clone fixture).\n${before.text}\nBuilder code:\n${after.text}`);
  console.log(`base failed files ${before.failed}; builder failed files ${after.failed}`);
  const redTitles=['M1: generated-only','M2: non-contract','M3: failed timed-out','M4: scope guard','M5: sealed Node','M6: generator contract','M9: shared guidance'];
  if(before.failed!==2||after.failed!==0||redTitles.some(title=>!before.text.includes(`FAIL ${title}`)))process.exitCode=1;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}else if(mode==='determinism'){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'land determinism space '));let text='Generator determinism on a disposable copy of the build tree; path contains spaces.\n',failed=false;
 try{
  copyTree(temp);
  for(const args of [['init','-b','main'],['config','user.name','Synthetic'],['config','user.email','synthetic@example.invalid'],['add','.'],['commit','-m','determinism tree']]){const r=run(temp,'git',args);if(r.status!==0)throw Error('fixture git failed');}
  const hashes=new Map();
  for(const autocrlf of ['false','true']){
   const config=run(temp,'git',['config','core.autocrlf',autocrlf]);if(config.status!==0)throw Error('config failed');
   const checkout=run(temp,'git',['-c','core.autocrlf='+autocrlf,'checkout-index','--all','--force']);if(checkout.status!==0)throw Error('checkout failed');
   for(let repeat=1;repeat<=2;repeat++)for(const [script,output] of [['code-map','docs/code-map.md'],['requirements-tree','docs/requirements-tree.md']]){
    const r=run(temp,process.execPath,[`scripts/${script}.mjs`,'--write']);const hash=createHash('sha256').update(fs.readFileSync(path.join(temp,output))).digest('hex');
    text+=`core.autocrlf=${autocrlf} run=${repeat} node scripts/${script}.mjs --write EXIT ${r.status} SHA-256 ${hash}\n`;
    if(r.status!==0){failed=true;text+=clean(r.stderr);}
    if(hashes.has(output)&&hashes.get(output)!==hash)failed=true;hashes.set(output,hash);
   }
  }
  text+=`SUMMARY ${failed?'FAIL':'PASS'}: both outputs identical across both runs and both settings\n`;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 fs.writeFileSync(`${lane}/determinism.txt`,text);console.log(text);process.exitCode=failed?1:0;
}else if(mode==='sanitize'){
 for(const name of fs.readdirSync(lane).filter(name=>name.endsWith('.txt'))){const file=path.join(lane,name);fs.writeFileSync(file,clean(fs.readFileSync(file,'utf8')));}
}else throw Error('expected tests, wrong-base, determinism or sanitize');
