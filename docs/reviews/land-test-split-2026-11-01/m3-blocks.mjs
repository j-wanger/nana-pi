import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base = execFileSync("git", ["show", "ac20e30a:packages/nana-pack/tests/land.test.mjs"], { encoding: "utf8" });
const files = ["land.test.mjs", "land-merge.test.mjs", "land-ci-read.test.mjs", "land-ci-edge.test.mjs"];
const working = files.map((file) => [`packages/nana-pack/tests/${file}`, readFileSync(`packages/nana-pack/tests/${file}`, "utf8")]);
working.push(["packages/nana-pack/tests/land-checks.mjs", readFileSync("packages/nana-pack/tests/land-checks.mjs", "utf8")]);
const checkBlocks = (text) => {
  const lines = text.split(/(?<=\n)/), blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("// req:") || lines[i].includes("R-2531")) continue;
    const start = i; let call = i;
    while (call < lines.length && !lines[call].startsWith("check(")) call++;
    if (call === lines.length) break;
    let end = call;
    while (end < lines.length && lines[end] !== "});\n" && lines[end] !== "});") end++;
    if (end === lines.length) throw new Error("unterminated check block");
    blocks.push(lines.slice(start, end + 1).join("")); i = end;
  }
  return blocks;
};
const normalize = (text) => text.replace(/ R-3490 R-3491/g, "");
const oldBlocks = checkBlocks(base);
const newBlocks = working.flatMap(([, text]) => checkBlocks(text));
const unmatched = [...newBlocks];
const lines = [];
for (const old of oldBlocks) {
  const index = unmatched.findIndex((next) => normalize(next) === old);
  if (index < 0) lines.push(`MISMATCH check: ${old.split("\n").find((line) => line.startsWith("check(")) ?? "unknown"}`);
  else {
    const found = unmatched.splice(index, 1)[0];
    const owner = working.find(([file, text]) => text.includes(found))?.[0] ?? "unknown";
    lines.push(`MATCH check ${owner}: ${old.split("\n").find((line) => line.startsWith("check("))?.slice(6) ?? "unknown"}`);
  }
}
if (unmatched.length) lines.push(`MISMATCH extra check blocks: ${unmatched.length}`);
const runtimeOld = base.slice(base.indexOf('if (process.platform === "win32") console.log("SKIP after a land'), base.indexOf("// req: R-977", base.indexOf('if (process.platform === "win32") console.log("SKIP after a land'))).trimEnd();
const merge = working.find(([file]) => file.endsWith("land-merge.test.mjs"))[1];
const runtimeNew = merge.slice(merge.indexOf('if (process.platform === "win32") console.log("SKIP after a land'), merge.indexOf("// req: R-977", merge.indexOf('if (process.platform === "win32") console.log("SKIP after a land'))).trimEnd();
lines.push(runtimeOld === runtimeNew ? "MATCH runtime-map guard and SKIP block" : "MISMATCH runtime-map guard and SKIP block");
const helperNames = ["check", "runLand", "recordTextReview", "tallyRows", "writeTallyRows", "assertCiRefused"];
const declarationText = (text, name, exported = false) => {
  const start = text.indexOf(`${exported ? "export " : ""}const ${name} =`);
  if (start < 0) return "";
  const lineEnd = text.indexOf("\n", start);
  const firstLine = lineEnd < 0 ? "" : text.slice(start, lineEnd).replace(/^export /, "");
  if (firstLine.includes("=>") && firstLine.endsWith(";")) return firstLine;
  const end = text.indexOf("\n};", start);
  return end < 0 ? "" : text.slice(start, end + 3).replace(/^export /, "");
};
for (const name of helperNames) {
  const old = declarationText(base, name);
  if (name === "check") {
    const matches = files.every((file) => declarationText(readFileSync(`packages/nana-pack/tests/${file}`, "utf8"), name) === old);
    lines.push(matches ? "MATCH helper check (kept local in every file)" : "MISMATCH helper check");
  } else {
    const actual = declarationText(working.at(-1)[1], name, true);
    lines.push(actual === old ? `MATCH helper ${name} (export added)` : `MISMATCH helper ${name}`);
  }
}
for (const name of ["TEST_LOCKED", "PI_REVIEW"]) {
  const original = base.match(new RegExp(`const ${name} = [^\\n]+`))?.[0];
  const actual = working.at(-1)[1].match(new RegExp(`export const ${name} = [^\\n]+`))?.[0]?.replace(/^export /, "");
  lines.push(original === actual ? `MATCH constant ${name} (export added)` : `MISMATCH constant ${name}`);
}
for (const file of files) {
  const text = readFileSync(`packages/nana-pack/tests/${file}`, "utf8");
  const tagged = text.split(/\r?\n/).find((line) => line.startsWith("// req:") && line.includes("R-3490 R-3491"));
  lines.push(tagged ? `ALLOWED req tag addition ${file}: ${tagged}` : `MISMATCH missing O3 tag in ${file}`);
}
const finalResult = `${lines.join("\n")}\n`;
writeFileSync("docs/reviews/land-test-split-2026-11-01/m3-blocks.txt", finalResult, "utf8");
process.stdout.write(finalResult);
if (lines.some((line) => line.startsWith("MISMATCH"))) process.exitCode = 1;
