/**
 * @module packages/nana-pack/lib/blast-radius-config.mjs
 * @purpose Declare the blast-radius page's tunables with their provenance, so no inline literal at a point of use in scripts/blast-radius.mjs or its test drifts from these names.
 * @inputs none
 * @outputs COLUMN_IDS, COLUMN_TITLES, DATA_PATH_ATTR, DATA_COLUMN_ATTR, DATA_FROM_ATTR, DATA_TO_ATTR,
 *  DATA_UNMAPPED_ATTR, DATA_NO_LINKED_TEST_ATTR, NO_LINKED_TEST_LABEL, UNMAPPED_HEADING, MARGIN,
 *  NODE_HEIGHT, ROW_GAP, COLUMN_GUTTER, NODE_H_PADDING, MIN_NODE_WIDTH, CHAR_WIDTH, FONT_SIZE,
 *  HEADING_GAP, BG_LIGHT, BG_DARK, TEXT_LIGHT, TEXT_DARK, EDGE_LIGHT, EDGE_DARK, COLUMN_COLORS_LIGHT,
 *  COLUMN_COLORS_DARK, NO_LINKED_TEST_COLOR_LIGHT, NO_LINKED_TEST_COLOR_DARK
 * @effects none
 * @errors none
 */
// Plan of record: docs/reviews/blast-radius-2026-10-19/must-meet.md, rows R-1550 to R-1557.
// A value that tunes the page's shape or meaning is named here once and imported by name —
// never an inline literal at scripts/blast-radius.mjs's or the test's point of use.

// contract (R-1551): the four columns, left to right, in the order the row fixes.
export const COLUMN_IDS = ["tests", "upstream", "changed", "downstream"];

// contract (R-1551): the heading text drawn above each column.
export const COLUMN_TITLES = {
	tests: "Tests",
	upstream: "Upstream",
	changed: "Changed",
	downstream: "Downstream",
};

// contract (R-1550): the attribute a node's <g> carries, holding its map path.
export const DATA_PATH_ATTR = "data-path";

// contract (R-1551): the attribute a node's <g> carries, holding its column id.
export const DATA_COLUMN_ATTR = "data-column";

// contract (R-1552): the attribute an edge's <path> carries, holding the importing module's path.
export const DATA_FROM_ATTR = "data-from";

// contract (R-1552): the attribute an edge's <path> carries, holding the imported module's path.
export const DATA_TO_ATTR = "data-to";

// contract (R-1554): the bare attribute an unmapped changed file's <li> carries.
export const DATA_UNMAPPED_ATTR = "data-unmapped";

// contract (R-1555): the bare attribute a no-linked-test node's <g> carries.
export const DATA_NO_LINKED_TEST_ATTR = "data-no-linked-test";

// contract (R-1555): the row requires the label to say a process-only start is not linked.
export const NO_LINKED_TEST_LABEL = "no linked test (a test that only starts a module as a process is not linked)";

// contract (R-1554): the unmapped list's heading names the three reasons a changed
// module-extension file can be outside the map.
export const UNMAPPED_HEADING = "Changed outside the map (deleted, map-ignored or outside the roots)";

// chosen: page margin in px, giving the SVG and the unmapped list room to breathe against the
// browser edge with no stylesheet to do it for them.
export const MARGIN = 16;

// chosen: a node rect's height in px, tall enough at FONT_SIZE below for one line of text with
// visible padding above and below the baseline.
export const NODE_HEIGHT = 22;

// chosen: the vertical gap in px between two node rows in the same column.
export const ROW_GAP = 10;

// chosen: the horizontal gap in px between two columns — also the gutter a same-column or
// leftward edge's control points are pulled into, per the design's routing rule.
export const COLUMN_GUTTER = 48;

// chosen: the horizontal padding in px inside a node rect, between its left edge and its label.
export const NODE_H_PADDING = 8;

// chosen: the narrowest a node rect may be, so a one-character label still reads as a node.
export const MIN_NODE_WIDTH = 40;

// chosen: a monospace-ish per-character width estimate in px at FONT_SIZE, used only to size a
// column to its longest label — never to lay out glyphs themselves.
export const CHAR_WIDTH = 7;

// chosen: the label font size in px.
export const FONT_SIZE = 12;

// chosen: the vertical gap in px between a column's heading text and its first node row.
export const HEADING_GAP = 28;

// chosen: light-mode page background and text, plain and legible with no theme dependency.
export const BG_LIGHT = "#ffffff";
export const TEXT_LIGHT = "#1a1a1a";

// chosen: dark-mode page background and text, under prefers-color-scheme.
export const BG_DARK = "#1e1e1e";
export const TEXT_DARK = "#e6e6e6";

// chosen: edge stroke colour, light and dark — muted so it never competes with node fills.
export const EDGE_LIGHT = "#888888";
export const EDGE_DARK = "#999999";

// chosen: one muted, colour-blind-tolerant fill per column, light and dark — never red or green
// alone, so the no-linked-test highlight below reads as its own signal.
export const COLUMN_COLORS_LIGHT = {
	tests: "#cfe8d8",
	upstream: "#cfe0f5",
	changed: "#f7d9a0",
	downstream: "#e6d4f0",
};
export const COLUMN_COLORS_DARK = {
	tests: "#2f4a3c",
	upstream: "#2c4258",
	changed: "#5a4726",
	downstream: "#473956",
};

// chosen: the no-linked-test node's rect stroke, light and dark — a colour no column fill uses.
export const NO_LINKED_TEST_COLOR_LIGHT = "#c0392b";
export const NO_LINKED_TEST_COLOR_DARK = "#e57373";
