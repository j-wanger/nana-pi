/**
 * @module packages/nana-setup/lib/stale-copies-config.mjs
 * @purpose Declare the stable stale-copy notice prefixes and pi prompt-section key.
 * @inputs none.
 * @outputs STALE_PREFIX, STALE_UNAVAILABLE_PREFIX and STALE_SECTION.
 * @effects none
 * @errors none.
 */
/** chosen: distinguish an actionable stale install from other install notices. */
export const STALE_PREFIX = "[nana:install] INSTALL STALE:";
/** chosen: distinguish a checker failure from a diagnosed stale install. */
export const STALE_UNAVAILABLE_PREFIX = "[nana:install] STALE-COPY CHECK UNAVAILABLE:";
/** chosen: keep stale-install guidance separate from the rulings text it diagnoses. */
export const STALE_SECTION = "nana-install-stale";
