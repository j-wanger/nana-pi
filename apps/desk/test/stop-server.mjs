/**
 * @module apps/desk/test/stop-server.mjs
 * @purpose Stop a fixture host and await closed stdio, including its Windows process tree.
 * @inputs A spawned ChildProcess.
 * @outputs An awaited shutdown promise.
 * @effects process (signals the host or runs taskkill).
 * @errors Rejects kill failures for a live host and bounded shutdown timeouts.
 */
import { execFile } from 'node:child_process';
import { pidAlive } from '../../../packages/nana-pack/lib/process-tree.mjs';

// Windows does not deliver Node's SIGTERM handlers. Await the tree kill and
// closed stdio before callers remove the fixture's working directory.
export async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  let timer, onClose;
  const closed = new Promise((resolve, reject) => {
    onClose = resolve;
    child.once('close', onClose);
    timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('host shutdown timeout'));
    }, 10000);
  });
  try {
    const stopped = process.platform === 'win32'
      ? new Promise((resolve, reject) => execFile('taskkill', ['/pid', String(child.pid), '/t', '/f'], { timeout: 10000 }, error => {
        // The host can exit after the guard above but before taskkill runs.
        if (error && error.code !== 128 && pidAlive(child.pid)) reject(error);
        else resolve();
      }))
      : Promise.resolve(child.kill());
    await Promise.all([closed, stopped]);
    if (process.platform === 'win32' && pidAlive(child.pid)) throw new Error('host still alive after taskkill');
  } finally {
    clearTimeout(timer);
    child.removeListener('close', onClose);
  }
}
