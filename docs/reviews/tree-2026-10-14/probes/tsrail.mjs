import { check } from "/Users/example/nana-pi/templates/typescript/template/tests/requirements-trace.ts";
for (const d of process.argv.slice(2)) { const r = check(d); console.log(d.split("/").at(-1), r.summary ?? "", JSON.stringify(Object.keys(r)), "problems:", r.problems.length, r.problems.slice(0,3)); }
