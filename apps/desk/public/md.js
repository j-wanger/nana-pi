/**
 * Minimal, escape-first markdown → HTML. Enough for agent replies:
 * fenced code, headings, lists, blockquotes, hr, inline code/bold/italic/links.
 * Everything is HTML-escaped before any transform; inline code is carved out
 * first so other inline patterns never fire inside it.
 */

const esc = (s) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s) {
	const codes = [];
	let out = esc(s).replace(/`([^`]+)`/g, (_, c) => {
		codes.push(c);
		return `\u0000${codes.length - 1}\u0000`;
	});
	out = out
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
		.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
	return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

export function mdToHtml(text) {
	const lines = String(text ?? "").split("\n");
	const out = [];
	let i = 0;
	let para = [];
	const flush = () => {
		if (para.length) {
			out.push(`<p>${para.map(inline).join("<br>")}</p>`);
			para = [];
		}
	};
	while (i < lines.length) {
		const line = lines[i];
		const fence = line.match(/^\s*```(\w*)/);
		if (fence) {
			flush();
			const body = [];
			i++;
			while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
			i++; // closing fence
			const cls = fence[1] ? ` class="lang-${esc(fence[1])}"` : "";
			out.push(`<pre><code${cls}>${esc(body.join("\n"))}</code></pre>`);
			continue;
		}
		const h = line.match(/^(#{1,6})\s+(.*)/);
		if (h) {
			flush();
			const lvl = Math.min(h[1].length + 2, 6); // demote: chat headings stay small
			out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
			i++;
			continue;
		}
		if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
			flush();
			const ordered = /^\s*\d+\./.test(line);
			const items = [];
			while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
				let item = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, "");
				i++;
				// continuation lines indented under the item
				while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
					item += ` ${lines[i].trim()}`;
					i++;
				}
				items.push(`<li>${inline(item)}</li>`);
			}
			out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
			continue;
		}
		if (/^\s*>/.test(line)) {
			flush();
			const q = [];
			while (i < lines.length && /^\s*>/.test(lines[i])) {
				q.push(lines[i].replace(/^\s*>\s?/, ""));
				i++;
			}
			out.push(`<blockquote>${q.map(inline).join("<br>")}</blockquote>`);
			continue;
		}
		if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
			flush();
			out.push("<hr>");
			i++;
			continue;
		}
		if (!line.trim()) {
			flush();
			i++;
			continue;
		}
		para.push(line);
		i++;
	}
	flush();
	return out.join("\n");
}
