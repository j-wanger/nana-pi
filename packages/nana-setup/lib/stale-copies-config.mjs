/**
 * @module packages/nana-setup/lib/stale-copies-config.mjs
 * @purpose Declare the stable installed-copy notice text and section key.
 * @inputs none.
 * @outputs installed-copy stale and unavailable prefixes and section key.
 * @effects none
 * @errors none.
 */
/** chosen: distinguish an actionable stale install from other install notices. */
export const STALE_PREFIX = "[nana:install] INSTALL STALE:";
/** chosen: distinguish a checker failure from a diagnosed stale install. */
export const STALE_UNAVAILABLE_PREFIX = "[nana:install] STALE-COPY CHECK UNAVAILABLE:";
/** chosen: keep stale-install guidance separate from the rulings text it diagnoses. */
export const STALE_SECTION = "nana-install-stale";
