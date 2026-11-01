import type {TRegisteredResourceKind} from '../types.ts';

/**
 * Shape checks shared by `EligiusResourceImporter` and `createImporter`, so
 * both reject a resource of the wrong shape with the same message.
 */

/**
 * The kinds a resource importer can provide: the registrable kinds plus the
 * engine and timeline provider classes that only `createImporter` takes.
 */
export type TImporterResourceKind =
  | TRegisteredResourceKind
  | 'engine'
  | 'provider';

/**
 * Returns why `value` cannot be provided as a `kind`, or `undefined` when it
 * can. Operations are checked the way the configuration resolver checks
 * them: a function that is not a class.
 */
export function checkShape(
  kind: TImporterResourceKind,
  value: unknown
): string | undefined {
  switch (kind) {
    case 'operation':
    case 'function':
      if (typeof value !== 'function') {
        return `must be a function, got ${describeKind(value)}.`;
      }
      if (isClass(value)) {
        return kind === 'operation'
          ? 'is a class, an operation must be a function. Register controllers under registrations.controllers.'
          : 'is a class, a custom function must be a plain function.';
      }
      return undefined;
    case 'controller':
      if (typeof value !== 'function' || !isClass(value)) {
        return `must be a controller class, got ${describeKind(value)}.`;
      }
      for (const method of ['init', 'attach', 'detach']) {
        if (typeof value.prototype?.[method] !== 'function') {
          return `must implement IController: it has no '${method}' method.`;
        }
      }
      return undefined;
    case 'engine':
    case 'provider':
      return typeof value === 'function'
        ? undefined
        : `must be a class, got ${describeKind(value)}.`;
    case 'template':
      return typeof value === 'string'
        ? undefined
        : `must be a string, got ${describeKind(value)}.`;
    case 'json':
      switch (typeof value) {
        case 'undefined':
        case 'function':
        case 'symbol':
        case 'bigint':
          return `must be JSON data, got ${describeKind(value)}.`;
        default:
          return undefined;
      }
  }
}

export function isClass(value: unknown): boolean {
  return (
    typeof value === 'function' &&
    /^class[\s{]/.test(Function.prototype.toString.call(value))
  );
}

/**
 * Describes a value by its kind only, so registered data never ends up in a
 * message.
 */
export function describeKind(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  if (typeof value === 'function') {
    return isClass(value) ? 'a class' : 'a function';
  }
  const type = typeof value;
  return type === 'undefined'
    ? 'undefined'
    : `${/^[aeiou]/.test(type) ? 'an' : 'a'} ${type}`;
}
