#!/usr/bin/env node
/**
 * @module scripts/readme-check.mjs
 * @purpose Run the project template's README checker over this repo, so every command, path, flag and script name nana-pi's READMEs state is checked against the repo (G-012).
 * @inputs argv (--check | --list), readme-check.config.json at the repo root, the READMEs it names, package.json and the files under scripts/
 * @outputs the claim list on --list, the summary line plus problem list on either mode
 * @effects disk (reads the READMEs, the files they name and the package metadata), process (exits non-zero when a README claim does not hold)
 * @errors exit 1 with the problem list naming each README line whose claim fails; a thrown Error for a bad config or an unknown mode
 */
// A shim, not a copy — the checker is ONE source, the template's
// `templates/typescript/template/scripts/readme-check.mjs`. Not a symlink: a win32
// checkout does not keep one.
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	checkProject as checkProjectAt,
	loadConfig,
	main,
} from "../templates/typescript/template/scripts/readme-check.mjs";

/** This repo's root, resolved through symlinks, whatever the cwd. */
export const REPO_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

export { loadConfig };

/** Every configured README of THIS repo, checked. */
export const checkProject = () => checkProjectAt(REPO_ROOT);

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	process.exit(main(process.argv.slice(2), REPO_ROOT));
}
