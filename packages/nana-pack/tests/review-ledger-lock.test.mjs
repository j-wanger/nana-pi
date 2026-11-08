/**
 * @module packages/nana-pack/tests/review-ledger-lock.test.mjs
 * @purpose Pin exclusive ledger lock contention and immediate errors with injected opens and time.
 * @inputs withLock, temporary lock paths and injected filesystem errors
 * @outputs Awaited bounded PASS/FAIL cases
 * @effects disk (OS temporary folders only)
 * @errors Failed assertions set exit 1
 */
import assert from 'node:assert/strict';
import { openSync, readFileSync, existsSync, constants as C } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { withLock } from '../bin/review-round.mjs';
import { tmpDir } from "./tmp-dir.mjs";

async function check(name, fn) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('case timeout')), 2000);
    })]);
    console.log('PASS', name);
  } catch (error) {
    console.log('FAIL', name, error.message);
    process.exitCode = 1;
  } finally { clearTimeout(timer); }
}
const paths = () => {
  const dir = tmpDir(join(tmpdir(), 'review-lock-'));
  return { dir, lock: join(dir, 'review-ledger.lock') };
};

// req: R-3925
await check('M1: Windows contention waits then runs the locked step once', () => {
  for (const code of ['EPERM', 'EACCES', 'EBUSY']) {
    const p = paths();
    let attempts = 0, steps = 0, elapsed = 0, waits = 0;
    const result = withLock(p, () => {
      steps++;
      assert.equal(readFileSync(p.lock, 'utf8'), String(process.pid));
      return 'locked';
    }, {
      open: (file, flags, mode) => {
        assert.equal(file, p.lock);
        assert.ok(flags & C.O_EXCL);
        if (++attempts <= 2) throw Object.assign(new Error('pending delete'), { code });
        return openSync(file, flags, mode);
      },
      now: () => elapsed,
      sleep: ms => { waits++; elapsed += ms; },
    });
    assert.equal(result, 'locked');
    assert.equal(attempts, 3);
    assert.equal(waits, 2);
    assert.equal(steps, 1);
    assert.equal(existsSync(p.lock), false);
  }
});

// req: R-3926
await check('M2: persistent Windows contention times out naming path and last code', () => {
  for (const code of ['EPERM', 'EACCES', 'EBUSY']) {
    const p = paths();
    let attempts = 0, steps = 0, elapsed = 0, waits = 0;
    assert.throws(() => withLock(p, () => { steps++; }, {
      open: () => {
        // Bound a broken loop independently of its deadline.
        assert.ok(++attempts < 10, 'lock retry never reached its deadline');
        throw Object.assign(new Error('pending delete'), { code: attempts === 1 ? 'EACCES' : code });
      },
      now: () => elapsed,
      sleep: () => { waits++; elapsed += 10000; },
    }), error => error.message.includes(p.lock) && error.message.includes(code));
    assert.ok(attempts > 1);
    assert.ok(waits > 0);
    assert.equal(steps, 0);
    assert.equal(existsSync(p.lock), false);
  }
});

// req: R-3927
await check('M3: unrelated open errors throw immediately unchanged', () => {
  for (const code of ['ENOENT', 'ELOOP']) {
    const p = paths();
    const original = Object.assign(new Error('original open failure'), { code });
    let attempts = 0, steps = 0, waits = 0;
    assert.throws(() => withLock(p, () => { steps++; }, {
      open: () => { attempts++; throw original; },
      now: () => 0,
      sleep: () => { waits++; throw new Error('unexpected retry'); },
    }), error => error === original);
    assert.equal(attempts, 1);
    assert.equal(waits, 0);
    assert.equal(steps, 0);
    assert.equal(existsSync(p.lock), false);
  }
});
