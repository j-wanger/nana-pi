/**
 * @module packages/nana-setup/lib/stale-copies-config.mjs
 * @purpose Declare the stable install-copy and project-working-section notice text and section keys.
 * @inputs none.
 * @outputs install and project stale prefixes, labels, section keys and fallback phrase.
 * @effects none
 * @errors none.
 */
/** chosen: distinguish an actionable stale install from other install notices. */
export const STALE_PREFIX = "[nana:install] INSTALL STALE:";
/** chosen: distinguish a checker failure from a diagnosed stale install. */
export const STALE_UNAVAILABLE_PREFIX = "[nana:install] STALE-COPY CHECK UNAVAILABLE:";
/** chosen: keep stale-install guidance separate from the rulings text it diagnoses. */
export const STALE_SECTION = "nana-install-stale";
/** chosen: STALE_PREFIX's shape with a distinct tag keeps install-stale scans separate (R-2623). */
export const PROJECT_STALE_PREFIX = "[nana:project] PROJECT STALE:";
/** chosen: parallel the installed-copy section without merging independent remedies (R-2625). */
export const PROJECT_STALE_SECTION = "nana-project-stale";
/** chosen: double quote ends the quote; POSIX sh expands dollar and backtick in double quotes; cmd.exe expands percent. */
export const PROJECT_STALE_NO_PATH_CHARS = '"$`%';
/** chosen: staleNotice's label-then-remedy sentence names the exact marker-owned surface. */
export const PROJECT_STALE_LABEL = "AGENTS.md working section";
/** chosen: the safe fallback tells the user where a path-free command applies. */
export const PROJECT_STALE_ROOT_PHRASE = "in the project root";
