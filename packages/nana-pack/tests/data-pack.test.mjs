/**
 * @module packages/nana-pack/tests/data-pack.test.mjs
 * @purpose Exercise data-pack release acceptance and expose its bounded Python fixture runner.
 * @inputs Current template sources, Copier, uv and the acceptance runner.
 * @outputs Eight PASS/FAIL verdicts and the public py fixture runner.
 * @effects disk (temporary fixtures), process (bounded synchronous Python and Copier children).
 * @errors Any failed assertion sets exit status 1.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { runAcceptance, ACCEPTANCE_COMMANDS } from "../../../scripts/template-acceptance.mjs";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const root = tmpDir(path.join(os.tmpdir(), "data-pack-"));
let failures = 0;
const run = (cmd, args, cwd = root) => {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 180_000, env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" } });
  assert.equal(r.status, 0, `${cmd}: ${r.stdout ?? ""}${r.stderr ?? ""} ${r.error ?? ""}`);
  return r.stdout;
};
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (e) { failures++; console.log("FAIL", title, e.message); } };
export const py = (mode) => run("uvx", ["--with", "pytest", "python", "-B", path.join(repo, "packages/nana-pack/tests/data-pack-fixtures.py"), repo, root, mode]);
let source;
function snapshot() {
  if (source) return source;
  source = path.join(root, "source"); fs.mkdirSync(source);
  for (const rel of ["copier.yml", "templates"]) fs.cpSync(path.join(repo, rel), path.join(source, rel), { recursive: true });
  run("git", ["init"], source);
  run("git", ["add", "."], source);
  run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture"], source);
  return source;
}
function render(name, data = []) {
  const dest = path.join(root, name);
  run("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", "HEAD", "-d", "language=python", "-d", "project_name=Fixture", ...data.flatMap((d) => ["-d", d]), snapshot(), dest]);
  return dest;
}
const packFiles = ["scripts/data_checks.py", "data-checks.json", "tests/test_data_checks.py"];
// Importing py for the fast land guard must not run release acceptance.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
// req: R-3840
check("M1 optional Python scaffold ships exactly the opt-in pack", () => {
  const off = render("off"); const on = render("on", ["data_checks=true"]);
  for (const rel of packFiles) { assert(!fs.existsSync(path.join(off, rel)), rel); assert(fs.existsSync(path.join(on, rel)), rel); }
  const before = fs.readFileSync(path.join(off, "tests/test_smoke.py"), "utf8");
  assert.equal(fs.readFileSync(path.join(on, "tests/test_smoke.py"), "utf8"), before);
});
// req: R-3843
check("configured absent store skips by filename while a present duplicate store fails", () => {
  const dest = render("absent-store", ["data_checks=true"]);
  fs.writeFileSync(path.join(dest, "data-checks.json"), JSON.stringify({
    project_root: ".", source_globs: ["src/**/*.py"], databases: [{ label: "fixture", path: "fixture.sqlite" }],
    identifiers: { item_id: "INTEGER" }, keys: [{ db: "fixture", table: "items", columns: ["item_id"] }],
    normalizer: {}, connectors: { network_patterns: [], network_modules: [], db_modules: [] },
    lineage: { report_dirs: [], extensions: [], provenance_key: "provenance", required_fields: ["input_db"] },
  }));
  const pytest = () => spawnSync("uvx", ["--with", "pytest", "pytest", "-o", "addopts=", "-rs", "tests/test_data_checks.py"], {
    cwd: dest, encoding: "utf8", timeout: 180_000, env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  const absent = pytest();
  assert.equal(absent.status, 0, `${absent.stdout}${absent.stderr}`);
  assert.match(absent.stdout, /1 skipped/);
  assert.match(absent.stdout, /Data checks require missing database: fixture\.sqlite/);
  assert(!fs.existsSync(path.join(dest, "fixture.sqlite")));
  run("uvx", ["--with", "pytest", "python", "-c", "import sqlite3; c=sqlite3.connect('fixture.sqlite'); c.execute('CREATE TABLE items(item_id INTEGER)'); c.executemany('INSERT INTO items VALUES (?)', [(1,), (1,)]); c.commit(); c.close()"], dest);
  const present = pytest();
  assert.equal(present.status, 1, `${present.stdout}${present.stderr}`);
  assert.match(present.stdout, /1 duplicated key values/);
  assert.doesNotMatch(present.stdout, /1 skipped/);
});
// req: R-3842
check("M3 unsafe normalizer never changes project bytes", () => { py("readonly"); });
// req: R-3843
check("M4 pytest prints errors and warnings and skips absent settings", () => { py("pytest"); });
// req: R-3844
check("M5 real-run false-positive patterns stay clean without suppressions", () => { py("real-patterns"); });
// req: R-3845
check("M6 adoption preserves pack files and previous release updates cleanly", () => {
  const dest = path.join(root, "adopt"); fs.mkdirSync(path.join(dest, "scripts"), { recursive: true }); fs.mkdirSync(path.join(dest, "tests"));
  for (const rel of packFiles) fs.writeFileSync(path.join(dest, rel), "owner bytes\n");
  run("uvx", ["copier", "copy", "--trust", "--defaults", "--overwrite", "--skip", "scripts/data_checks.py", "--skip", "tests/test_data_checks.py", "--vcs-ref", "HEAD", "-d", "language=python", "-d", "project_name=Fixture", "-d", "adopt=true", "-d", "data_checks=true", snapshot(), dest]);
  for (const rel of packFiles) assert.equal(fs.readFileSync(path.join(dest, rel), "utf8"), "owner bytes\n");
  const old = path.join(root, "old-source");
  run("git", ["-c", "core.longpaths=true", "clone", "--local", "--no-hardlinks", repo, old]);
  const previous = run("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"], old).trim();
  run("git", ["checkout", previous], old);
  // Advance the same source repository so Copier retains its update relationship.
  for (const rel of ["copier.yml", "templates"]) fs.cpSync(path.join(snapshot(), rel), path.join(old, rel), { recursive: true });
  // A merge can make the current template release reachable; still advance the fixture ref.
  run("git", ["add", "."], old); run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "next"], old);
  for (const adopt of [false, true]) {
    const updated = path.join(root, `updated-${adopt}`);
    run("uvx", ["copier", "copy", "--trust", "--defaults", "--vcs-ref", previous, "-d", "language=python", "-d", "project_name=Fixture", "-d", `adopt=${adopt}`, old, updated]);
    run("git", ["init"], updated); run("git", ["add", "."], updated);
    run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "old"], updated);
    run("uvx", ["copier", "update", "--trust", "--defaults", "--vcs-ref", "HEAD", "--conflict", "inline", "-d", "data_checks=true"], updated);
    for (const rel of packFiles) { assert(fs.existsSync(path.join(updated, rel)), rel); assert(!fs.readFileSync(path.join(updated, rel), "utf8").includes("<<<<<<<")); }
    run("git", ["add", "."], updated);
    run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "pack added"], updated);
  }
  fs.appendFileSync(path.join(old, "templates/python/data_checks.py"), "\n# pack update fixture\n");
  run("git", ["add", "."], old); run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "pack revision"], old);
  for (const adopt of [false, true]) {
    const updated = path.join(root, `updated-${adopt}`);
    run("uvx", ["copier", "update", "--trust", "--defaults", "--vcs-ref", "HEAD", "--conflict", "inline"], updated);
    assert(fs.readFileSync(path.join(updated, "scripts/data_checks.py"), "utf8").includes("# pack update fixture"), "later pack revision reaches both update modes");
  }
});
// req: R-3846
check("M7 live WAL cannot produce a clean keys verdict", () => { py("wal"); });
// req: R-3847
check("M8 release acceptance runs native opt-in scaffold and adoption gates", () => {
  const commands = []; const sha = "a".repeat(40);
  const stub = (cmd, args, options) => {
    if (cmd === "git") return { status: 0, stdout: sha };
    if (cmd === "uvx") {
      const dest = args.at(-1); fs.mkdirSync(dest, { recursive: true });
      if (!args.includes("adopt=true")) {
        for (const rel of ["README.md", "tests/AGENTS.md", "tests/test_smoke.py", "tests/smoke.test.ts", "pnpm-workspace.yaml"]) { fs.mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true }); fs.writeFileSync(path.join(dest, rel), "fixture\n"); }
        fs.mkdirSync(path.join(dest, "src"));
      }
      if (args.includes("data_checks=true")) { fs.mkdirSync(path.join(dest, "scripts"), { recursive: true }); fs.writeFileSync(path.join(dest, "scripts/data_checks.py"), ""); fs.writeFileSync(path.join(dest, "tests/test_data_checks.py"), ""); }
    } else commands.push([path.basename(options.cwd), [cmd, ...args].join(" ")]);
    return { status: 0, stdout: "" };
  };
  const modes = ["python", "python-data"];
  assert.equal(runAcceptance({ src: repo, ref: "HEAD", tmpRoot: root, modes, run: stub, log: () => {} }), 0);
  assert.deepEqual([...new Set(commands.map(([dir]) => dir))], ["python-scaffold", "python-adopt", "python-data-scaffold", "python-data-adopt"], "M8 runs only the default-off and opted-in Python modes");
  for (const mode of ["python-data-scaffold", "python-data-adopt"]) {
    for (const [cmd, args] of ACCEPTANCE_COMMANDS.python) assert(commands.some(([dir, text]) => dir === mode && text === [cmd, ...args].join(" ")), `${mode}: ${cmd} ${args}`);
    assert(commands.some(([dir, text]) => dir === mode && text.includes("tests/test_data_checks.py")), "explicit discovery proof");
  }
  const skipped = (cmd, args, options) => {
    if (cmd === "uv" && args.includes("tests/test_data_checks.py")) return { status: 0, stdout: "1 skipped" };
    return stub(cmd, args, options);
  };
  assert.equal(runAcceptance({ src: repo, ref: "HEAD", tmpRoot: root, modes, run: skipped, log: () => {} }), 1, "a skipped data test is not acceptance");
});
if (failures) process.exitCode = 1;
}
