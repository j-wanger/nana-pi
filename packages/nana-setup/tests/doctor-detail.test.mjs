// Gate: `doctor`'s detail text for rules/nana-personal.md agrees with its ✓/✗.
// Four layouts, each in a throwaway --home; nothing touches the real machine.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { diagnose } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
/** A temp home whose rules dir holds nana-personal.md in the given shape (or not at all). */
function layoutWith(shape) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-doctor-detail-"));
	tmps.push(home);
	const layout = resolveLayout({ home });
	fs.mkdirSync(layout.rulesDir, { recursive: true });
	const personal = path.join(layout.rulesDir, "nana-personal.md");
	if (shape === "file") fs.writeFileSync(personal, "# private\n");
	if (shape === "dir") fs.mkdirSync(personal);
	if (shape === "symlink") {
		const elsewhere = path.join(home, "private-notes.md");
		fs.writeFileSync(elsewhere, "# private\n");
		fs.symlinkSync(elsewhere, personal);
	}
	return layout;
}
const personalCheck = (layout) => diagnose(layout, { projectDir: layout.base }).find((c) => c.label === "rule nana-personal.md");

try {
	{
		const c = personalCheck(layoutWith("file"));
		check("regular file: ✓", c?.status === "ok", JSON.stringify(c));
		check("regular file: detail does NOT say 'not a regular file'", !/not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
		check("regular file: detail does not ask for a replacement", !/replace/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("symlink"));
		check("symlink: ✗", c?.status === "fail", JSON.stringify(c));
		// exact string pinned by install.test.mjs (doctor + install share it)
		check("symlink: the exact existing message", c?.detail === "private rule is a symlink — replace with a regular file", JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("dir"));
		check("directory: ✗", c?.status === "fail", JSON.stringify(c));
		check("directory: detail says 'not a regular file'", /not a regular file/.test(c?.detail ?? ""), JSON.stringify(c));
	}
	{
		const c = personalCheck(layoutWith("absent"));
		check("absent: ✗", c?.status === "fail", JSON.stringify(c));
		check("absent: detail says it is missing", /missing/.test(c?.detail ?? ""), JSON.stringify(c));
		check("absent: detail names the fix (`nana-setup install`)", /nana-setup install/.test(c?.detail ?? ""), JSON.stringify(c));
	}
} finally {
	for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
}

console.log(fails ? `FAILED ${fails}` : "ALL PASS");
process.exit(fails ? 1 : 0);
