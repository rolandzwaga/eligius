/**
 * Maps the `ParameterType` names used in `@type=ParameterType:<name>` tags to
 * JSON Schema types. ParameterTypes are editor hints, several of them share one
 * JSON type.
 */
const parameterTypeMap: Readonly<Record<string, string>> = {
  // String-like types
  htmlElementName: 'string',
  className: 'string',
  selector: 'string',
  string: 'string',
  eventTopic: 'string',
  eventName: 'string',
  systemName: 'string',
  actionName: 'string',
  controllerName: 'string',
  url: 'string',
  htmlContent: 'string',
  labelId: 'string',
  ImagePath: 'string',
  QuadrantPosition: 'string',
  expression: 'string',
  mathfunction: 'string',
  languagecode: 'string',
  // Primitive types
  number: 'number',
  boolean: 'boolean',
  // Complex types
  object: 'object',
  array: 'array',
  dimensions: 'object',
  dimensionsModifier: 'object',
  jQuery: 'object',
  cssProperties: 'object',
  function: 'string', // Functions are typically passed as strings in JSON config
  Date: 'string', // Dates are typically passed as ISO strings in JSON config
};

/**
 * A union that contains all of these accepts any JSON value in practice, so it
 * gets no type constraint.
 */
const ANY_JSON_TYPES = ['object', 'string', 'number', 'boolean', 'array'];

/**
 * Converts the value of a `@type` tag into a JSON Schema `type`.
 *
 * The tag value may start with `=` (as ts-json-schema-generator reports it) and
 * may be a `|` delimited union, e.g. `ParameterType:array|ParameterType:string`.
 *
 * @param tagValue - The `@type` tag value
 * @returns A single type, an array of types for a union, or `undefined` when no
 * type should be enforced: for an unknown ParameterType (rather than guessing
 * 'string') or for a union that covers every JSON type.
 *
 * @example
 * parameterTypeTagToJsonSchemaType('= ParameterType:className'); // 'string'
 * parameterTypeTagToJsonSchemaType('ParameterType:array|ParameterType:string'); // ['array', 'string']
 */
export function parameterTypeTagToJsonSchemaType(
  tagValue: string
): string | string[] | undefined {
  const parts = tagValue
    .replace(/^\s*=?\s*/, '')
    .split('|')
    .map(part => part.trim().replace(/^ParameterType:/, ''))
    .filter(part => part.length > 0);
  if (parts.length === 0) {
    return undefined;
  }

  const types: string[] = [];
  for (const part of parts) {
    const type = Object.hasOwn(parameterTypeMap, part)
      ? parameterTypeMap[part]
      : undefined;
    if (!type) {
      return undefined;
    }
    if (!types.includes(type)) {
      types.push(type);
    }
  }

  if (ANY_JSON_TYPES.every(type => types.includes(type))) {
    return undefined;
  }
  return types.length === 1 ? types[0] : types;
}

/**
 * Returns whether a schema property value is a `@type` tag value that
 * ts-json-schema-generator copied into `type`.
 */
export function isParameterTypeTag(value: unknown): value is string {
  return typeof value === 'string' && /^\s*=?\s*ParameterType:/.test(value);
}
