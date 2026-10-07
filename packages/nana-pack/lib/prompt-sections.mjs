/**
 * @module packages/nana-pack/lib/prompt-sections.mjs
 * @purpose Rebuild prompt section order so Nana sections compose consistently regardless of extension load order.
 * @inputs a pi before_agent_start event whose sections contain Nana and other named sections
 * @outputs the same sections object with canonical Nana keys and foreign keys kept relatively ordered
 * @effects none
 * @errors none
 */
const NANA_ORDER = ["nana-objective", "nana-handoff", "nana-writing"];
const NANA_KEYS = new Set(NANA_ORDER);

export function orderNanaSections(event) {
	const sections = event.systemPromptOptions.sections;
	const entries = Object.entries(sections);
	const firstNana = entries.findIndex(([key]) => NANA_KEYS.has(key));
	if (firstNana < 0) return;
	const nana = new Map(entries.filter(([key]) => NANA_KEYS.has(key)));
	const rebuilt = [];
	let inserted = false;
	for (const [key, value] of entries) {
		if (NANA_KEYS.has(key)) {
			if (!inserted) {
				for (const ordered of NANA_ORDER) if (nana.has(ordered)) rebuilt.push([ordered, nana.get(ordered)]);
				inserted = true;
			}
		} else {
			rebuilt.push([key, value]);
		}
	}
	for (const key of Object.keys(sections)) delete sections[key];
	for (const [key, value] of rebuilt) sections[key] = value;
}
