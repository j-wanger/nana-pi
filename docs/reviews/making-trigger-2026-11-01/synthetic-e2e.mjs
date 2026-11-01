#!/usr/bin/env node
// Counts-only demonstration; no model and no real home/profile access.
import { memoryFixture, pair, ask } from '../../../packages/nana-pack/tests/memory-run-fixture.mjs';
const f=memoryFixture();
try {
 f.transcript([...pair('example-one'),...pair('example-two'),...ask()]);
 for(const command of ['enable','make','status']) {
  const result=await f.command([command]);
  process.stdout.write(result.output);
  if(result.code)process.exitCode=result.code;
 }
 console.log(`records ${f.states().length}`);
} finally {f.close();}
