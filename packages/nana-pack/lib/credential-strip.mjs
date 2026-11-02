/**
 * @module packages/nana-pack/lib/credential-strip.mjs
 * @purpose Return environment additions that stop git's normal credential dispatch without dropping unrelated inherited config.
 * @inputs Base environment with optional parameter and counted git configuration.
 * @outputs Credential controls and appended resets in both git environment forms.
 * @effects none
 * @errors Throws for an invalid inherited config count rather than launching an ambiguously configured child.
 */
import { CREDENTIAL_CONFIG_RESETS, CREDENTIAL_ENV, GIT_CONFIG_ENV } from './credential-strip-config.mjs';

export function credentialStripEnv(baseEnv) {
  const names = GIT_CONFIG_ENV;
  const raw = baseEnv[names.count];
  const count = raw === undefined || raw === '' ? 0 : Number(raw);
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(count + CREDENTIAL_CONFIG_RESETS.length)) {
    throw new Error('credential strip: invalid inherited git config count');
  }
  const parameters = baseEnv[names.parameters] ?? '';
  const env = {
    ...CREDENTIAL_ENV,
    [names.parameters]: [parameters, ...CREDENTIAL_CONFIG_RESETS.map(([key, value]) => `'${key}=${value}'`)].filter(Boolean).join(' '),
    [names.count]: String(count + CREDENTIAL_CONFIG_RESETS.length),
  };
  // Seal inherited slots too: Claude's project settings env must not replace an
  // unrelated counted entry when flag settings reapply this count to tool shells.
  for (let index = 0; index < count; index++) {
    for (const prefix of [names.key, names.value]) {
      const name = `${prefix}${index}`;
      if (baseEnv[name] !== undefined) env[name] = baseEnv[name];
    }
  }
  for (const [offset, [key, value]] of CREDENTIAL_CONFIG_RESETS.entries()) {
    env[`${names.key}${count + offset}`] = key;
    env[`${names.value}${count + offset}`] = value;
  }
  return env;
}
