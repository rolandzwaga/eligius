/**
 * LocaleManager Unit Tests
 * Feature: 005-rosetta-locale-manager
 *
 * Tests for the core LocaleManager class that wraps rosetta.
 */

import type {
  ILocaleManager,
  ILocaleManagerOptions,
  TLanguageCode,
  TLocaleData,
} from '@locale/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

// =============================================================================
// Test Context
// =============================================================================

type LocaleManagerTestContext = {
  manager: ILocaleManager;
  options: ILocaleManagerOptions;
  enUSData: TLocaleData;
  nlNLData: TLocaleData;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

// =============================================================================
// Foundation Tests (T007-T012)
// =============================================================================

describe<LocaleManagerTestContext>('LocaleManager', () => {
  beforeEach(async context => {
    withContext<LocaleManagerTestContext>(context);

    // Import LocaleManager dynamically to get fresh instance
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');

    context.enUSData = {
      greeting: 'Hello {{name}}!',
      nav: {
        home: 'Home',
        about: 'About Us',
      },
      simple: 'Simple text',
    };

    context.nlNLData = {
      greeting: 'Hallo {{name}}!',
      nav: {
        home: 'Thuis',
        about: 'Over Ons',
      },
      simple: 'Eenvoudige tekst',
    };

    context.options = {
      defaultLocale: 'en-US' as TLanguageCode,
    };

    context.manager = new LocaleManager(context.options);
  });

  // T008: given rosetta instance, when loadLocale called, then translations stored
  test<LocaleManagerTestContext>('given rosetta instance, when loadLocale called, then translations stored', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    expect(manager.availableLocales).toContain('en-US');
  });

  // T009: given loaded locale, when t() called with key, then returns translation
  test<LocaleManagerTestContext>('given loaded locale, when t() called with key, then returns translation', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    const result = manager.t('simple');

    expect(result).toBe('Simple text');
  });

  // T010: given locale with interpolation, when t() called with params, then placeholders replaced
  test<LocaleManagerTestContext>('given locale with interpolation, when t() called with params, then placeholders replaced', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    const result = manager.t('greeting', {name: 'John'});

    expect(result).toBe('Hello John!');
  });

  // T011: given nested keys, when t() called with dot notation, then traverses structure
  test<LocaleManagerTestContext>('given nested keys, when t() called with dot notation, then traverses structure', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    const result = manager.t('nav.home');

    expect(result).toBe('Home');
  });

  // T012: given LocaleManager, when setLocale called, then emits change event
  test<LocaleManagerTestContext>('given LocaleManager, when setLocale called, then emits change event', context => {
    const {manager, enUSData, nlNLData} = context;
    const handler = vi.fn();

    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);
    manager.on('change', handler);

    manager.setLocale('nl-NL' as TLanguageCode);

    expect(handler).toHaveBeenCalledWith('nl-NL', 'en-US');
  });

  // =============================================================================
  // User Story 1 Tests (T023-T025)
  // =============================================================================

  // T023: given missing key, when t() called, then returns empty string
  test<LocaleManagerTestContext>('given missing key, when t() called, then returns empty string', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    const result = manager.t('nonexistent.key');

    expect(result).toBe('');
  });

  // T024: given array key notation, when t() called, then resolves correctly
  test<LocaleManagerTestContext>('given array key notation, when t() called, then resolves correctly', context => {
    const {manager, enUSData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);

    const result = manager.t(['nav', 'about']);

    expect(result).toBe('About Us');
  });

  // T025: given function value translation, when t() called, then executes function
  test<LocaleManagerTestContext>('given function value translation, when t() called, then executes function', context => {
    const {manager} = context;

    const dataWithFunction: TLocaleData = {
      dynamic: (params: Record<string, unknown>) =>
        params.formal ? 'Good day, sir!' : 'Hey there!',
    };

    manager.loadLocale('en-US' as TLanguageCode, dataWithFunction);

    const formal = manager.t('dynamic', {formal: true});
    const informal = manager.t('dynamic', {formal: false});

    expect(formal).toBe('Good day, sir!');
    expect(informal).toBe('Hey there!');
  });

  // =============================================================================
  // Additional Tests
  // =============================================================================

  test<LocaleManagerTestContext>('given manager with locale, when destroy called, then cleans up listeners', context => {
    const {manager, enUSData} = context;
    const handler = vi.fn();

    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.on('change', handler);

    manager.destroy();

    // After destroy, handler should not be called
    // The manager should be in a clean state
    expect(manager.availableLocales).toHaveLength(0);
  });

  test<LocaleManagerTestContext>('given multiple locales loaded, when availableLocales queried, then returns all', context => {
    const {manager, enUSData, nlNLData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);

    expect(manager.availableLocales).toHaveLength(2);
    expect(manager.availableLocales).toContain('en-US');
    expect(manager.availableLocales).toContain('nl-NL');
  });

  test<LocaleManagerTestContext>('given on subscription, when returned unsubscribe called, then handler removed', context => {
    const {manager, enUSData, nlNLData} = context;
    const handler = vi.fn();

    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);

    const unsubscribe = manager.on('change', handler);
    unsubscribe();

    manager.setLocale('nl-NL' as TLanguageCode);

    expect(handler).not.toHaveBeenCalled();
  });

  test<LocaleManagerTestContext>('given locale override in t(), when called, then uses specified locale', context => {
    const {manager, enUSData, nlNLData} = context;

    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);

    // Current locale is en-US, but we ask for nl-NL translation
    const result = manager.t('simple', undefined, 'nl-NL' as TLanguageCode);

    expect(result).toBe('Eenvoudige tekst');
  });

  // =============================================================================
  // User Story 5 Tests (T074-T076): Debug Mode
  // =============================================================================

  // T074: given debug=true, when missing key requested, then console.warn called
  test('given debug=true, when missing key requested, then console.warn called', async () => {
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const debugManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
      debug: true,
    });

    debugManager.loadLocale('en-US' as TLanguageCode, {greeting: 'Hello'});

    debugManager.t('nonexistent.key');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/missing translation.*nonexistent\.key/i)
    );

    warnSpy.mockRestore();
  });

  // T075: given debug=false, when missing key requested, then no console output
  test('given debug=false, when missing key requested, then no console output', async () => {
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const nonDebugManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
      debug: false,
    });

    nonDebugManager.loadLocale('en-US' as TLanguageCode, {greeting: 'Hello'});

    nonDebugManager.t('nonexistent.key');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // T076: given debug=true and missing interpolation var, then warning logged
  test('given debug=true and missing interpolation var, then warning logged', async () => {
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const debugManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
      debug: true,
    });

    debugManager.loadLocale('en-US' as TLanguageCode, {
      greeting: 'Hello {{name}}! Welcome to {{place}}.',
    });

    // Only provide 'name', missing 'place'
    debugManager.t('greeting', {name: 'John'});

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/missing interpolation.*place/i)
    );

    warnSpy.mockRestore();
  });

  test<LocaleManagerTestContext>('given current locale nl-NL, when setLocale called with nl-NL again, then no change event is emitted', context => {
    const {manager, enUSData, nlNLData} = context;
    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);
    manager.setLocale('nl-NL' as TLanguageCode);
    const handler = vi.fn();
    manager.on('change', handler);

    manager.setLocale('nl-NL' as TLanguageCode);

    expect(handler).not.toHaveBeenCalled();
    expect(manager.locale).toBe('nl-NL');
  });

  test<LocaleManagerTestContext>('given defaultLocale en-US and only en-US and nl-NL loaded, when setLocale fr-FR is called from nl-NL, then it falls back to en-US', context => {
    const {manager, enUSData, nlNLData} = context;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, nlNLData);
    manager.setLocale('nl-NL' as TLanguageCode);
    const handler = vi.fn();
    manager.on('change', handler);

    manager.setLocale('fr-FR' as TLanguageCode);

    expect(manager.locale).toBe('en-US');
    expect(manager.t('simple')).toBe('Simple text');
    expect(handler).toHaveBeenCalledWith('en-US', 'nl-NL');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/fr-FR/));
  });

  test<LocaleManagerTestContext>('given current locale is the default, when setLocale is called with an unavailable locale, then the locale stays and no change event is emitted', context => {
    const {manager, enUSData} = context;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    const handler = vi.fn();
    manager.on('change', handler);

    manager.setLocale('fr-FR' as TLanguageCode);

    expect(manager.locale).toBe('en-US');
    expect(handler).not.toHaveBeenCalled();
  });

  test<LocaleManagerTestContext>('given current locale en-US and an nl-NL function translation that throws, when t() with an nl-NL override throws, then a later t() without override still returns the en-US string', context => {
    const {manager, enUSData} = context;
    manager.loadLocale('en-US' as TLanguageCode, enUSData);
    manager.loadLocale('nl-NL' as TLanguageCode, {
      simple: () => {
        throw new Error('missing params');
      },
    });

    expect(() =>
      manager.t('simple', undefined, 'nl-NL' as TLanguageCode)
    ).toThrow('missing params');

    expect(manager.t('simple')).toBe('Simple text');
    expect(manager.locale).toBe('en-US');
  });

  test<LocaleManagerTestContext>('given en-US loaded with {nav: {home}}, when loadLocale is called again with {nav: {about}}, then both nested keys are available', context => {
    const {manager} = context;
    manager.loadLocale('en-US' as TLanguageCode, {nav: {home: 'Home'}});

    manager.loadLocale('en-US' as TLanguageCode, {
      nav: {about: 'About'},
      footer: 'Footer',
    });

    expect(manager.t('nav.home')).toBe('Home');
    expect(manager.t('nav.about')).toBe('About');
    expect(manager.t('footer')).toBe('Footer');
  });

  test<LocaleManagerTestContext>('given locale data with a __proto__ key, when loadLocale merges it, then Object.prototype is not polluted', context => {
    const {manager} = context;
    manager.loadLocale('en-US' as TLanguageCode, {nav: {home: 'Home'}});

    manager.loadLocale(
      'en-US' as TLanguageCode,
      JSON.parse(
        '{"__proto__": {"polluted": "yes"}, "nav": {"about": "About"}}'
      )
    );

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(manager.t('nav.home')).toBe('Home');
    expect(manager.t('nav.about')).toBe('About');
  });

  test<LocaleManagerTestContext>('given an unresolved $ref locale entry, when loadLocale is called, then it throws an error naming the locale', context => {
    const {manager} = context;

    expect(() =>
      manager.loadLocale('en-US' as TLanguageCode, {
        $ref: './en-US.json',
      })
    ).toThrow(/en-US.*\$ref|\$ref.*en-US/);
    expect(manager.availableLocales).not.toContain('en-US');
  });

  test('given debug manager with current en-US hi=Hello and nl-NL hi=Hallo {{name}}, when t(hi, {}, nl-NL) is called, then the missing variable name is reported', async () => {
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const debugManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
      debug: true,
    });
    debugManager.loadLocale('en-US' as TLanguageCode, {hi: 'Hello'});
    debugManager.loadLocale('nl-NL' as TLanguageCode, {hi: 'Hallo {{name}}'});

    debugManager.t('hi', {}, 'nl-NL' as TLanguageCode);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/missing interpolation.*name/i)
    );
  });

  test('given debug manager with two chunks loaded for en-US sharing a namespace, when t() is called with missing params for the first chunk, then the missing variable is reported', async () => {
    const {LocaleManager} = await import('../../../locale/locale-manager.ts');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const debugManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
      debug: true,
    });
    debugManager.loadLocale('en-US' as TLanguageCode, {
      nav: {hi: 'Hello {{name}}'},
    });
    debugManager.loadLocale('en-US' as TLanguageCode, {nav: {bye: 'Bye'}});

    debugManager.t('nav.hi', {});

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/missing interpolation.*name/i)
    );
  });
});
