import {
  effectiveContainerProvider,
  effectivePositionSource,
  mergeProviderConfig,
  overridesContainerProvider,
  overridesPositionSource,
  providerConfigKey,
} from '@configuration/timeline-provider-overrides.ts';
import type {
  IPositionSourceConfig,
  ITimelineProviderSettings,
} from '@configuration/types.ts';
import {describe, expect, test} from 'vitest';

const scrollSettings: ITimelineProviderSettings = {
  positionSource: {systemName: 'ScrollPositionSource', selector: '#a'},
  container: {systemName: 'DomContainerProvider', selector: '#stage'},
};

describe('mergeProviderConfig', () => {
  test('given no override, when merged, then the base is returned as it is', () => {
    const base = {systemName: 'RafPositionSource', tickInterval: 50};

    expect(mergeProviderConfig(base, undefined)).toBe(base);
  });

  test('given an override without systemName, when merged, then it is merged over the base property by property', () => {
    expect(
      mergeProviderConfig(
        {systemName: 'ScrollPositionSource', selector: '#a', extra: 1},
        {selector: '#b'}
      )
    ).toEqual({systemName: 'ScrollPositionSource', selector: '#b', extra: 1});
  });

  test('given an override with the same systemName, when merged, then it is merged over the base', () => {
    expect(
      mergeProviderConfig(
        {systemName: 'RafPositionSource', tickInterval: 50, other: true},
        {systemName: 'RafPositionSource', tickInterval: 20}
      )
    ).toEqual({systemName: 'RafPositionSource', tickInterval: 20, other: true});
  });

  test('given an override with another systemName, when merged, then the base settings are not used', () => {
    expect(
      mergeProviderConfig(
        {
          systemName: 'RafPositionSource',
          tickInterval: 50,
        } as IPositionSourceConfig,
        {systemName: 'ScrollPositionSource', selector: '#b'}
      )
    ).toEqual({systemName: 'ScrollPositionSource', selector: '#b'});
  });

  test('given an override and no base, when merged, then a copy of the override is returned', () => {
    const override = {systemName: 'RafPositionSource'};

    const merged = mergeProviderConfig(undefined, override);

    expect(merged).toEqual(override);
    expect(merged).not.toBe(override);
  });

  test('given neither a base nor an override, when merged, then the result is undefined', () => {
    expect(mergeProviderConfig(undefined, undefined)).toBeUndefined();
  });
});

describe('effective settings of a timeline', () => {
  test('given a positionSource override, when the effective position source is asked, then it is merged over the type settings', () => {
    expect(
      effectivePositionSource(
        {positionSource: {selector: '#b'}},
        scrollSettings
      )
    ).toEqual({systemName: 'ScrollPositionSource', selector: '#b'});
  });

  test('given a containerProvider override, when the effective container provider is asked, then it is merged over the type container settings', () => {
    expect(
      effectiveContainerProvider(
        {containerProvider: {selector: '#chapter'}},
        scrollSettings
      )
    ).toEqual({systemName: 'DomContainerProvider', selector: '#chapter'});
  });
});

describe('overridesPositionSource and overridesContainerProvider', () => {
  test('given no override, when checked, then the type settings are not overridden', () => {
    expect(overridesPositionSource({}, scrollSettings)).toBe(false);
    expect(overridesContainerProvider({}, scrollSettings)).toBe(false);
  });

  test('given an override that repeats the type settings, when checked, then the type settings are not overridden', () => {
    expect(
      overridesPositionSource(
        {positionSource: {selector: '#a'}},
        scrollSettings
      )
    ).toBe(false);
    expect(
      overridesContainerProvider(
        {containerProvider: {systemName: 'DomContainerProvider'}},
        scrollSettings
      )
    ).toBe(false);
  });

  test('given an override that changes one setting, when checked, then the type settings are overridden', () => {
    expect(
      overridesPositionSource(
        {positionSource: {selector: '#b'}},
        scrollSettings
      )
    ).toBe(true);
    expect(
      overridesContainerProvider(
        {containerProvider: {selector: '#other'}},
        scrollSettings
      )
    ).toBe(true);
  });

  test('given an override and no type settings, when checked, then the type settings are overridden', () => {
    expect(
      overridesPositionSource(
        {positionSource: {systemName: 'RafPositionSource'}},
        undefined
      )
    ).toBe(true);
  });
});

describe('providerConfigKey', () => {
  test('given equal settings in a different property order, when keyed, then the keys are equal', () => {
    expect(
      providerConfigKey({
        systemName: 'VideoPositionSource',
        sources: [{type: 'video/mp4', src: 'a.mp4'}],
      })
    ).toBe(
      providerConfigKey({
        sources: [{src: 'a.mp4', type: 'video/mp4'}],
        systemName: 'VideoPositionSource',
      })
    );
  });

  test('given settings that differ in a nested value, when keyed, then the keys differ', () => {
    expect(providerConfigKey({sources: [{src: 'a.mp4'}]})).not.toBe(
      providerConfigKey({sources: [{src: 'b.mp4'}]})
    );
  });
});
