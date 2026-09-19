export type RulesSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export function firstSearchParam(
  params: RulesSearchParams,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === 'string' ? value : value?.[0];
}

export function boundedIntegerSearchParam(
  params: RulesSearchParams,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = firstSearchParam(params, key);
  if (raw === undefined) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, value));
}

export function enumSearchParam<const T extends readonly string[]>(
  params: RulesSearchParams,
  key: string,
  allowed: T,
): T[number] | undefined {
  const value = firstSearchParam(params, key);
  return value !== undefined && allowed.includes(value) ? (value as T[number]) : undefined;
}

export function rulesHref(
  path: string,
  values: Readonly<Record<string, string | number | undefined>>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? path + '?' + query : path;
}
