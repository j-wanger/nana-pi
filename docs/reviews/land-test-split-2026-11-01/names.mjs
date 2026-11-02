import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const outIndex = process.argv.indexOf("--out");
if (outIndex < 0 || !process.argv[outIndex + 1]) throw new Error("pass --out <path>");
const files = process.argv.slice(2, outIndex);
if (files.length === 0) throw new Error("pass one or more test files");
const result = spawnSync(process.execPath, ["scripts/test.mjs", ...files, "--verbose"], { encoding: "utf8" });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
const names = result.stdout.split(/\r?\n/)
  .filter((line) => /^(PASS |FAIL |SKIP )\S/.test(line))
  .map((line) => {
    let name = line.replace(/^(PASS |FAIL |SKIP )/, "");
    if (name.startsWith("after a land the runtime data names main's tip and is not stale — R-2526")) name = name.split(" — R-2526")[0];
    return name;
  })
  .sort((a, b) => a.localeCompare(b, "en"));
const label = files.length === 1 ? "before: land.test.mjs" : "after: the four split land test files";
writeFileSync(process.argv[outIndex + 1], `# ${label} · ${names.length} check names (PASS/FAIL/SKIP lines), sorted, UTF-8\n${names.join("\n")}\n`, "utf8");
