export function pick(obj: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== '') return value;
  }
  return undefined;
}

export function extractApiList(payload: unknown, nestedKeys: string[] = []): unknown[] {
  if (Array.isArray(payload)) return payload;
  const data = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.content)) return obj.content;
    if (Array.isArray(obj.items)) return obj.items;
    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
}
