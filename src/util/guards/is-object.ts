/**
 * Returns true for any non-null, non-array object: plain objects, but also
 * class instances, `Date`, `Map`, DOM nodes and jQuery objects.
 *
 * The narrowed type is a loose record. When the value must be a plain data
 * object (an object literal or parsed JSON), use `isPlainObject` instead.
 *
 * @param value - Any value
 * @returns Whether `value` is a non-null, non-array object
 */
export function isObject(
  value: unknown
): value is Record<PropertyKey, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
