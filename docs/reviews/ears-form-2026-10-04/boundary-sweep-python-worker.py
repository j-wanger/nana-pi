"""Exhaustive boundary-rule sweep -- Python half (astra r3 item 3).

Not a suite test: a disposable evidence script for this lane only. For every codepoint
0..0x10FFFF, excluding the UTF-16 surrogate range (0xD800-0xDFFF, not valid standalone
scalar values), place the character both AFTER "shall" and BEFORE it, and record whether
conftest.py's real SHALL_RE (imported, not re-implemented) counts a match. Writes one byte
pair (suffixMatch, prefixMatch) per codepoint, in codepoint order, to the path given as
argv[1], for the orchestrator (boundary-sweep.mjs) to diff against the TypeScript side.
Surrogate codepoints are written as (2, 2) -- a sentinel both sides agree to skip.

Run via `uv run --with pytest python3 boundary-sweep-python-worker.py <out-path>`, since
conftest.py imports pytest at module load time.
"""

from __future__ import annotations

import sys
from pathlib import Path

CONFTEST_DIR = Path(__file__).resolve().parents[3] / "templates" / "python" / "template" / "tests"
sys.path.insert(0, str(CONFTEST_DIR))
import conftest  # noqa: E402

SURROGATE_LO = 0xD800
SURROGATE_HI = 0xDFFF


def main() -> None:
    out_path = Path(sys.argv[1])
    out = bytearray(0x110000 * 2)
    for cp in range(0, 0x110000):
        if SURROGATE_LO <= cp <= SURROGATE_HI:
            out[cp * 2] = 2
            out[cp * 2 + 1] = 2
            continue
        ch = chr(cp)
        suffix = 1 if conftest.SHALL_RE.search("shall" + ch) else 0
        prefix = 1 if conftest.SHALL_RE.search(ch + "shall") else 0
        out[cp * 2] = suffix
        out[cp * 2 + 1] = prefix
    out_path.write_bytes(bytes(out))


if __name__ == "__main__":
    main()
