/**
 * @module packages/nana-pack/lib/credential-strip-config.mjs
 * @purpose Seal the git credential-dispatch resets and environment controls.
 * @inputs none
 * @outputs Named credential configuration constants.
 * @effects none
 * @errors none
 */
// contract: plan revision 2 O1, R-3666. Empty helpers reset the inherited list;
// empty askpass routes fall through to disabled terminal prompting on supported git.
export const CREDENTIAL_CONFIG_RESETS = Object.freeze([
  Object.freeze(['credential.helper', '']),
  Object.freeze(['core.askPass', '']),
]);
export const CREDENTIAL_ENV = Object.freeze({
  GIT_ASKPASS: '', SSH_ASKPASS: '', GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never',
});
export const GIT_CONFIG_ENV = Object.freeze({
  parameters: 'GIT_CONFIG_PARAMETERS', count: 'GIT_CONFIG_COUNT',
  key: 'GIT_CONFIG_KEY_', value: 'GIT_CONFIG_VALUE_',
});
