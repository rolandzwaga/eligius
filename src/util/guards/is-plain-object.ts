/**
 * Returns true for plain data objects: object literals, parsed JSON objects
 * and `Object.create(null)` objects. Returns false for arrays, class
 * instances, `Date`, `Map`, DOM nodes and jQuery objects. Objects created in
 * another realm (such as an iframe) also return false, because their
 * prototype is that realm's `Object.prototype`.
 *
 * @param value - Any value
 * @returns Whether the prototype of `value` is `Object.prototype` or `null`
 */
export function isPlainObject(
  value: unknown
): value is Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
