export class BoundedAsyncCache<T> {
  private readonly values = new Map<string, T>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(private readonly maxEntries: number) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error('BoundedAsyncCache maxEntries must be a positive integer.');
    }
  }

  getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.values.has(key)) {
      const value = this.values.get(key);
      if (value !== undefined) {
        this.values.delete(key);
        this.values.set(key, value);
        return Promise.resolve(value);
      }
    }

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const pending = loader()
      .then((value) => {
        this.values.delete(key);
        this.values.set(key, value);

        while (this.values.size > this.maxEntries) {
          const oldestKey = this.values.keys().next().value;
          if (oldestKey === undefined) break;
          this.values.delete(oldestKey);
        }

        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, pending);
    return pending;
  }
}
