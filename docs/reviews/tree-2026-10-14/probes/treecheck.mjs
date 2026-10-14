import { readFileSync } from "node:fs";
import { checkTree } from "/Users/jwang/nana-pi/scripts/requirements-tree.mjs";
for (const d of process.argv.slice(2)) {
  const { problems, parsed } = checkTree(readFileSync(`${d}/REQUIREMENTS.md`, "utf8"));
  console.log(d.split("/").at(-1), "rows:", parsed.tables.reduce((n, t) => n + t.rows.length, 0), "tree headings:", parsed.headings.length, "problems:", problems.length);
  console.log("  first:", problems[0]);
}
