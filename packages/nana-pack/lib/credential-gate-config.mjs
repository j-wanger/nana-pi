/**
 * @module packages/nana-pack/lib/credential-gate-config.mjs
 * @purpose Seal the direct credential and GitHub API command floor patterns.
 * @inputs none
 * @outputs Credential command regex sources, applied to a normalized command word and preserved argument words.
 * @effects none
 * @errors none
 */
// contract: credential-gate-variants plan revision 2, R-3667. U+0001 is chosen
// as a non-whitespace placeholder so quoted whitespace cannot invent argument words.
export const CREDENTIAL_WORD_PLACEHOLDER = '\u0001';
// Anchoring at the executable keeps quoted
// documentation mentions out; command segmentation and wrapper handling stay shared.
export const CREDENTIAL_PATTERNS = Object.freeze([
  String.raw`^git(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*\s+credential\s+(?:fill|get|approve|reject)(?:\s|$)`,
  String.raw`^git(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*\s+credential-[\w.-]+\s+(?:\S+\s+)*get(?:\s|$)`,
  String.raw`^git-credential-[\w.-]+\s+(?:\S+\s+)*get(?:\s|$)`,
  String.raw`^gh\s+auth\s+token(?:\s|$)`,
  String.raw`^gh\s+auth\s+status\s+(?:\S+\s+)*--show-token(?:\s|$)`,
  String.raw`^gh\s+auth\s+status\s+(?:\S+\s+)*-t(?:\s|$)`,
  String.raw`^security\s+find-(?:generic|internet)-password(?:\s|$)`,
  String.raw`^(?:cmdkey\s+/list(?:\s|$)|vaultcmd(?:\s|$)|get-storedcredential(?:\s|$))`,
  String.raw`^(?:curl|wget|invoke-restmethod|invoke-webrequest|irm|iwr)\s+.*(?:https?://)api\.github\.com(?=[:/?#\s]|$)`,
]);
