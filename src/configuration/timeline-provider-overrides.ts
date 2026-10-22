import type {
  IContainerProviderConfig,
  IPositionSourceConfig,
  ITimelineProviderSettings,
} from '@configuration/types.ts';

/**
 * The part of a timeline configuration that can override the provider
 * settings of its type.
 */
export interface ITimelineProviderOverrides {
  positionSource?: Partial<IPositionSourceConfig>;
  containerProvider?: Partial<IContainerProviderConfig>;
}

type TProviderConfig = {systemName: string; [key: string]: unknown};

/**
 * Merges a per-timeline override over the settings of the timeline's type.
 *
 * - Without an override the type's settings are returned as they are.
 * - An override that leaves out `systemName`, or names the same class as the
 *   type's settings, is merged over them property by property (shallow).
 * - An override that names a different class replaces the type's settings,
 *   so options meant for one class never reach another.
 *
 * @param base - The settings of the timeline's type, if any
 * @param override - The timeline's override, if any
 * @returns The effective settings, or undefined when neither is given
 */
export function mergeProviderConfig<T extends TProviderConfig>(
  base: T | undefined,
  override: Partial<T> | undefined
): Partial<T> | undefined {
  if (!override) {
    return base;
  }
  if (!base) {
    return {...override};
  }
  if (
    override.systemName !== undefined &&
    override.systemName !== base.systemName
  ) {
    return {...override};
  }
  return {...base, ...override};
}

/**
 * The effective position source settings of a timeline: its
 * `positionSource` override merged over the settings of its type (see
 * {@link mergeProviderConfig}).
 */
export function effectivePositionSource(
  timeline: ITimelineProviderOverrides,
  typeSettings: ITimelineProviderSettings | undefined
): Partial<IPositionSourceConfig> | undefined {
  return mergeProviderConfig(
    typeSettings?.positionSource,
    timeline.positionSource
  );
}

/**
 * The effective container provider settings of a timeline: its
 * `containerProvider` override merged over the `container` settings of its
 * type (see {@link mergeProviderConfig}).
 */
export function effectiveContainerProvider(
  timeline: ITimelineProviderOverrides,
  typeSettings: ITimelineProviderSettings | undefined
): Partial<IContainerProviderConfig> | undefined {
  return mergeProviderConfig(
    typeSettings?.container,
    timeline.containerProvider
  );
}

/**
 * True when the timeline's `positionSource` override changes the settings
 * of its type, so the timeline needs a position source of its own.
 */
export function overridesPositionSource(
  timeline: ITimelineProviderOverrides,
  typeSettings: ITimelineProviderSettings | undefined
): boolean {
  return (
    timeline.positionSource !== undefined &&
    !isSameProviderConfig(
      effectivePositionSource(timeline, typeSettings),
      typeSettings?.positionSource
    )
  );
}

/**
 * True when the timeline's `containerProvider` override changes the
 * `container` settings of its type.
 */
export function overridesContainerProvider(
  timeline: ITimelineProviderOverrides,
  typeSettings: ITimelineProviderSettings | undefined
): boolean {
  return (
    timeline.containerProvider !== undefined &&
    !isSameProviderConfig(
      effectiveContainerProvider(timeline, typeSettings),
      typeSettings?.container
    )
  );
}

/**
 * A key that is equal for equal provider settings, whatever the order of
 * their properties.
 */
export function providerConfigKey(config: unknown): string {
  return JSON.stringify(sortKeys(config)) ?? 'undefined';
}

function isSameProviderConfig(a: unknown, b: unknown): boolean {
  return providerConfigKey(a) === providerConfigKey(b);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortKeys(source[key]);
        return sorted;
      }, {});
  }
  return value;
}
