/**
 * VideoPositionSource lost its `options` key in 4.0.0. IPositionSourceConfig keeps an index
 * signature for custom position sources, so the rule cannot come from the TypeScript type.
 * It is added to the type settings definition and to the per-timeline override definition.
 * A per-timeline override without a systemName that inherits VideoPositionSource cannot be
 * recognised by the schema; ConfigurationResolver rejects it.
 */
export const VIDEO_OPTIONS_REMOVED = {
  if: {
    properties: {systemName: {const: 'VideoPositionSource'}},
    required: ['systemName'],
  },
  // biome-ignore lint/suspicious/noThenProperty: 'then' is the JSON Schema keyword; this object is never awaited
  then: {
    properties: {
      options: {
        not: {},
        description:
          "Removed in 4.0.0. Put 'sources' and 'poster' directly in the position source settings.",
      },
    },
  },
};

/**
 * The generated definitions that describe position source settings.
 */
export const POSITION_SOURCE_DEFINITIONS = [
  'IPositionSourceConfig',
  'Partial<IPositionSourceConfig>',
] as const;

/**
 * Adds {@link VIDEO_OPTIONS_REMOVED} to the position source definitions of a
 * generated configuration schema.
 *
 * @param definitions - The `definitions` of the generated schema, changed in place
 * @throws When a position source definition is missing or already has `if`/`then`
 */
export function forbidVideoOptions(definitions: Record<string, any>): void {
  for (const name of POSITION_SOURCE_DEFINITIONS) {
    const definition = definitions[name];
    if (!definition) {
      throw new Error(
        `Definition '${name}' not found; update forbidVideoOptions in video-options-rule.ts`
      );
    }
    if ('if' in definition || 'then' in definition) {
      throw new Error(
        `Definition '${name}' already has if/then; merge forbidVideoOptions by hand`
      );
    }
    Object.assign(definition, structuredClone(VIDEO_OPTIONS_REMOVED));
  }
}
