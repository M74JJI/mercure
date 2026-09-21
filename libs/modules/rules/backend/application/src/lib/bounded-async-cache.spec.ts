import { describe, expect, it } from 'vitest';

import { BoundedAsyncCache, BoundedAsyncCacheCapacityError } from './bounded-async-cache';

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

  it('rejects distinct excess in-flight work while preserving same-key coalescing', async () => {
    const cache = new BoundedAsyncCache<number>(2, 1);
    let release: ((value: number) => void) | undefined;

    const first = cache.getOrLoad(
      'first',
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );
    const same = cache.getOrLoad('first', async () => 99);

    await expect(cache.getOrLoad('second', async () => 2)).rejects.toBeInstanceOf(
      BoundedAsyncCacheCapacityError,
    );

    release?.(1);
    await expect(first).resolves.toBe(1);
    await expect(same).resolves.toBe(1);
  });

  it('supports single-flight work without retaining completed values', async () => {
    const cache = new BoundedAsyncCache<number>(1, 1, false);
    let loads = 0;
    const load = () =>
      cache.getOrLoad('large', async () => {
        loads += 1;
        return loads;
      });

    await expect(load()).resolves.toBe(1);
    await expect(load()).resolves.toBe(2);
  });
});
