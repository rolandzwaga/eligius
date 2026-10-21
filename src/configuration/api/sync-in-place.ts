/**
 * Makes `target` structurally equal to `source` while keeping the identity of
 * the objects and arrays inside `target` wherever possible.
 *
 * The fluent configuration API hands out editors that hold references to
 * objects inside the factory's configuration (an action, an operation, the
 * timeline provider settings). Replacing those objects with copies would
 * detach the editors, so updates are applied in place instead:
 *
 * - Plain objects are updated key by key; keys missing from `source` are removed.
 * - Array entries are matched by their string `id` when both sides have one,
 *   otherwise by position. Matched entries are synced recursively and reused.
 * - Everything else is assigned from `source`.
 *
 * `source` should be a value the caller owns (for example a deep copy), because
 * unmatched values from it are inserted into `target` as they are.
 *
 * @param target - The object to update in place
 * @param source - The desired state
 */
export function syncInPlace<T extends object>(target: T, source: T): void {
  if (target === source) {
    return;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    syncArray(target, source);
    return;
  }
  syncObject(
    target as Record<string, unknown>,
    source as Record<string, unknown>
  );
}

function syncObject(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  for (const key of Object.keys(target)) {
    if (!Object.hasOwn(source, key)) {
      delete target[key];
    }
  }
  for (const key of Object.keys(source)) {
    target[key] = syncValue(target[key], source[key]);
  }
}

function syncArray(target: unknown[], source: unknown[]): void {
  const byId = new Map<string, unknown>();
  for (const item of target) {
    const id = idOf(item);
    if (id !== undefined) {
      byId.set(id, item);
    }
  }

  const next = source.map((item, index) => {
    const id = idOf(item);
    const match = id !== undefined ? byId.get(id) : target[index];
    if (id !== undefined && match !== undefined) {
      byId.delete(id);
    }
    return syncValue(match, item);
  });

  target.length = 0;
  target.push(...next);
}

function syncValue(existing: unknown, incoming: unknown): unknown {
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    syncArray(existing, incoming);
    return existing;
  }
  if (isPlainObject(existing) && isPlainObject(incoming)) {
    // Do not merge two different identified entities into one object
    const existingId = idOf(existing);
    const incomingId = idOf(incoming);
    if (existingId !== incomingId) {
      return incoming;
    }
    syncObject(existing, incoming);
    return existing;
  }
  return incoming;
}

function idOf(value: unknown): string | undefined {
  if (isPlainObject(value) && typeof value.id === 'string') {
    return value.id;
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
