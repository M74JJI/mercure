import { describe, expect, it } from 'vitest';

import { BoundedAsyncCache } from './bounded-async-cache';

describe('BoundedAsyncCache', () => {
  it('coalesces concurrent loads for the same immutable key', async () => {
    const cache = new BoundedAsyncCache<number>(2);
    let loads = 0;
    const loader = async () => {
      loads += 1;
      await Promise.resolve();
      return 42;
    };

    const [first, second] = await Promise.all([
      cache.getOrLoad('snapshot', loader),
      cache.getOrLoad('snapshot', loader),
    ]);

    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(loads).toBe(1);
  });

  it('evicts the least recently used entry at the configured bound', async () => {
    const cache = new BoundedAsyncCache<number>(2);
    let loads = 0;
    const load = (value: number) =>
      cache.getOrLoad(String(value), async () => {
        loads += 1;
        return value;
      });

    await load(1);
    await load(2);
    await load(1);
    await load(3);
    await load(2);

    expect(loads).toBe(4);
  });
});
