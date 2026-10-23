/**
 * @module packages/nana-pack/lib/pi-usage.mjs
 * @purpose Construct and field-wise sum pi-ai Usage values without recomputing pi's token or cost totals.
 * @inputs pi-ai Usage-shaped objects.
 * @outputs emptyUsage, addUsage, totalTokens, costTotal, and the numeric/cost helpers used by bench parsing.
 * @effects none
 * @errors none; absent and non-finite fields contribute zero.
 */
const usageNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const emptyCost = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 });

/** An empty pi-ai Usage value with every optional field retained. */
export const emptyUsage = () => ({
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	cacheWrite1h: 0,
	reasoning: 0,
	totalTokens: 0,
	cost: emptyCost(),
});

/** Add pi's own Usage fields into acc. Returns false when usage is absent or not an object. */
export function addUsage(acc, usage) {
	if (!usage || typeof usage !== "object") return false;
	acc.input += usageNumber(usage.input);
	acc.output += usageNumber(usage.output);
	acc.cacheRead += usageNumber(usage.cacheRead);
	acc.cacheWrite += usageNumber(usage.cacheWrite);
	acc.cacheWrite1h = usageNumber(acc.cacheWrite1h) + usageNumber(usage.cacheWrite1h);
	acc.reasoning = usageNumber(acc.reasoning) + usageNumber(usage.reasoning);
	acc.totalTokens += usageNumber(usage.totalTokens);
	for (const key of ["input", "output", "cacheRead", "cacheWrite", "total"]) acc.cost[key] += usageNumber(usage.cost?.[key]);
	return true;
}

/** pi's totalTokens field, never recomputed from buckets. */
export const totalTokens = (usage) => usageNumber(usage?.totalTokens);
/** pi's cost.total field, never recomputed from tokens. */
export const costTotal = (usage) => usageNumber(usage?.cost?.total);
