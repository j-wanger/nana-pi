#!/usr/bin/env node
/**
 * @module scripts/readme-check.mjs
 * @purpose Run the project template's README checker over this repo, so every command, path, flag and script name nana-pi's READMEs state is checked against the repo (G-012).
 * @inputs argv (--check | --list), readme-check.config.json at the repo root, the READMEs it names, package.json and the files under scripts/
 * @outputs the claim list on --list, the summary line plus problem list on either mode
 * @effects disk (reads the READMEs, the files they name and the package metadata), process (exits non-zero when a README claim does not hold)
 * @errors exit 1 with the problem list naming each README line whose claim fails; bad CLI arguments print usage to stderr and return status 2; a thrown Error for a bad config
 */
// A shim, not a copy — the checker is ONE source, the template's
// `templates/typescript/template/scripts/readme-check.mjs`. Not a symlink: a win32
// checkout does not keep one.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultGit } from './git-runner.mjs';

import {
	checkProject as checkProjectAt,
	loadConfig,
	main as mainAt,
} from "../templates/typescript/template/scripts/readme-check.mjs";

/** This repo's root, resolved through symlinks, whatever the cwd. */
export const REPO_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

export { loadConfig };

/** Execute only the documented read-only Git object command, never README shell text. */
export function checkReviewArchive(root=REPO_ROOT) {
 const file=resolve(root,'docs/reviews/README.md');
 if(!existsSync(file))return ['review archive README is missing'];
 const text=readFileSync(file,'utf8');
 const command=text.split(/\r?\n/u).map(line=>line.trim()).find(line=>line.startsWith('git show '));
 const match=/^git show ([a-f0-9]{40}):(docs\/reviews\/[^\s/]+) \1:(\2\/[^\s]+)$/u.exec(command??'');
 if(!match||!text.includes(`\`${match[1]}\``))return ['review archive command or commit is missing'];
 const result=defaultGit(root,['show',`${match[1]}:${match[2]}`,`${match[1]}:${match[3]}`]);
 return result.status===0&&result.stdout.includes(`tree ${match[1]}:${match[2]}`)&&result.stdout.trim().length>0
  ? [] : ['review archive command cannot list and read the removed folder'];
}

/** Every configured README plus the executable historical-record pointer, checked. */
export const checkProject = () => {
 const result=checkProjectAt(REPO_ROOT),problems=[...result.problems,...checkReviewArchive()];
 return {...result,problems,line:`readme: ${result.claims.length} claims checked; ${problems.length} problem(s)`};
};

export function main(argv,root=REPO_ROOT) {
 const status=mainAt(argv,root);
 if(status===2)return status;
 const problems=checkReviewArchive(root);
 console.log(`review archive: ${problems.length} problems`);
 for(const problem of problems)console.log(problem);
 return status||Number(problems.length>0);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	process.exit(main(process.argv.slice(2), REPO_ROOT));
}
