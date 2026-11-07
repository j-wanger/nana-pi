/**
 * @module packages/nana-pack/lib/pi-package.mjs
 * @purpose Locate the pi package belonging to the executable selected on the child's PATH.
 * @inputs Platform, child environment/cwd, optional selected executable and injected filesystem probes.
 * @outputs Package directory and parsed metadata, or a named refusal.
 * @effects disk (PATH probes, realpath and package.json reads)
 * @errors Lookup and metadata failures return refusals rather than throwing.
 */
import { accessSync, constants, readFileSync, realpathSync, statSync } from 'node:fs';
import * as path from 'node:path';
import { findPi } from './win-command.mjs';
import { PI_PACKAGE, NPM_DIRS } from '../bin/worker-config.mjs';

export function locatePiPackage({ platform = process.platform, env = process.env, cwd = process.cwd(), found, exists, readText = p => readFileSync(p, 'utf8'), realpath = realpathSync } = {}) {
  try {
    const p = platform === 'win32' ? path.win32 : path.posix;
    if (!found && platform === 'win32') found = findPi({ env, cwd, exists });
    if (!found && platform !== 'win32') {
      for (const dir of String(env.PATH ?? '').split(path.delimiter)) {
        const candidate = p.resolve(cwd, dir, 'pi');
        try { accessSync(candidate, constants.X_OK); if (statSync(candidate).isFile()) { found = candidate; break; } } catch {}
      }
    }
    if (!found) return { refused: 'pi is not on PATH' };
    let packageDir;
    if (platform === 'win32') {
      // Moved from piLaunch: npm global and local node_modules/.bin layouts.
      const shimDir = p.dirname(found);
      const lastTwo = shimDir.split(/[\\/]/).filter(Boolean).slice(-2).map(part => part.toLowerCase());
      const isDotBinLayout = lastTwo.length === 2 && lastTwo[0] === NPM_DIRS[0] && lastTwo[1] === NPM_DIRS[1];
      const packageRoot = isDotBinLayout ? p.dirname(shimDir) : p.join(shimDir, NPM_DIRS[0]);
      packageDir = p.join(packageRoot, ...PI_PACKAGE.split('/'));
    } else {
      // Follow the executable symlink, then ascend to its owning, name-checked package.
      packageDir = p.dirname(realpath(found));
      for (;;) {
        try {
          const metadata = JSON.parse(readText(p.join(packageDir, 'package.json')));
          if (metadata?.name === PI_PACKAGE) return { packageDir, packageJson: metadata };
        } catch {}
        const parent = p.dirname(packageDir);
        if (parent === packageDir) return { refused: `pi at ${found} has no ${PI_PACKAGE} package` };
        packageDir = parent;
      }
    }
    const packageJsonPath = p.join(packageDir, 'package.json');
    let text;
    try { text = readText(packageJsonPath); }
    catch { return { refused: `pi at ${found} is not an npm global install: no ${PI_PACKAGE} package beside it; install pi with npm (pnpm, Volta and the pi.dev installer are not supported by the launchers)` }; }
    let packageJson;
    try { packageJson = JSON.parse(text); }
    catch { return { refused: `${packageJsonPath} is not valid JSON` }; }
    if (typeof packageJson !== 'object' || packageJson === null || packageJson.name !== PI_PACKAGE) return { refused: `${packageJsonPath} is not the ${PI_PACKAGE} package` };
    return { packageDir, packageJson };
  } catch { return { refused: 'pi package lookup failed' }; }
}
