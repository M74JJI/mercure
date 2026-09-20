import { describe, expect, it } from 'vitest';

import {
  boundedIntegerSearchParam,
  enumSearchParam,
  firstSearchParam,
  rulesHref,
  trimmedSearchParam,
} from './rules-search-params';

describe('Rules intelligence search-parameter helpers', () => {
  it('uses the first value for repeated query parameters', () => {
    expect(firstSearchParam({ q: ['first', 'second'] }, 'q')).toBe('first');
  });

  it('trims bounded text and rejects empty or oversized values', () => {
    expect(trimmedSearchParam({ q: '  source.ip  ' }, 'q', 32)).toBe('source.ip');
    expect(trimmedSearchParam({ q: '   ' }, 'q', 32)).toBeUndefined();
    expect(trimmedSearchParam({ q: 'x'.repeat(33) }, 'q', 32)).toBeUndefined();
  });

  it('bounds integer query state deterministically', () => {
    expect(boundedIntegerSearchParam({ offset: '50' }, 'offset', 0, 0, 100)).toBe(50);
    expect(boundedIntegerSearchParam({ offset: '-4' }, 'offset', 0, 0, 100)).toBe(0);
    expect(boundedIntegerSearchParam({ offset: '999' }, 'offset', 0, 0, 100)).toBe(100);
    expect(boundedIntegerSearchParam({ offset: '1.5' }, 'offset', 7, 0, 100)).toBe(7);
  });

  it('accepts only explicit enum members', () => {
    const allowed = ['system', 'custom'] as const;

    expect(enumSearchParam({ source: 'custom' }, 'source', allowed)).toBe('custom');
    expect(enumSearchParam({ source: 'admin' }, 'source', allowed)).toBeUndefined();
  });

  it('builds query links without undefined or empty values', () => {
    expect(
      rulesHref('/rules/use-cases', {
        q: 'auth',
        source: 'system',
        offset: 24,
        ignored: undefined,
        empty: '',
      }),
    ).toBe('/rules/use-cases?q=auth&source=system&offset=24');
  });
});
