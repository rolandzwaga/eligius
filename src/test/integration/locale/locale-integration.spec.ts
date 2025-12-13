/**
 * Locale Integration Tests
 * Feature: 005-rosetta-locale-manager
 *
 * Tests for inline locale configuration and eventbus integration.
 */

import {LocaleEventbusAdapter} from '@adapters/locale-eventbus-adapter.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {LocaleManager} from '@locale/locale-manager.ts';
import type {
  ILocalesConfiguration,
  TLanguageCode,
  TLocaleData,
} from '@locale/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import type {IEligiusEngine} from '@/types.ts';

// =============================================================================
// Test Context
// =============================================================================

type LocaleIntegrationTestContext = {
  localesConfig: ILocalesConfiguration;
  enUSData: TLocaleData;
  nlNLData: TLocaleData;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

// =============================================================================
// US3 Tests (T047-T048): Inline Locale Configuration
// =============================================================================

describe<LocaleIntegrationTestContext>('US3: Inline Locale Configuration', () => {
  beforeEach(context => {
    withContext<LocaleIntegrationTestContext>(context);

    context.enUSData = {
      greeting: 'Hello {{name}}!',
      nav: {
        home: 'Home',
        about: 'About Us',
      },
    };

    context.nlNLData = {
      greeting: 'Hallo {{name}}!',
      nav: {
        home: 'Thuis',
        about: 'Over Ons',
      },
    };

    context.localesConfig = {
      'en-US': context.enUSData,
      'nl-NL': context.nlNLData,
    } as ILocalesConfiguration;
  });

  // T047: given config with locales object, when parsed, then LocaleManager receives data
  test<LocaleIntegrationTestContext>('given config with locales object, when parsed, then LocaleManager receives data', context => {
    const {localesConfig} = context;

    // Create LocaleManager with default locale
    const manager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });

    // Initialize LocaleManager with inline locales config
    // This is the pattern that engine initialization will use
    for (const [locale, data] of Object.entries(localesConfig)) {
      manager.loadLocale(locale as TLanguageCode, data as TLocaleData);
    }

    // Verify translations are available
    expect(manager.t('greeting', {name: 'John'})).toBe('Hello John!');
    expect(manager.t('nav.home')).toBe('Home');
  });

  // T048: given multiple inline locales, when availableLocales queried, then all codes returned
  test<LocaleIntegrationTestContext>('given multiple inline locales, when availableLocales queried, then all codes returned', context => {
    const {localesConfig} = context;

    const manager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });

    // Load all locales from config
    for (const [locale, data] of Object.entries(localesConfig)) {
      manager.loadLocale(locale as TLanguageCode, data as TLocaleData);
    }

    // Verify all locale codes are available
    expect(manager.availableLocales).toHaveLength(2);
    expect(manager.availableLocales).toContain('en-US');
    expect(manager.availableLocales).toContain('nl-NL');
  });

  // Additional integration test: verify switching between inline locales
  test<LocaleIntegrationTestContext>('given multiple inline locales, when setLocale called, then translations change', context => {
    const {localesConfig} = context;

    const manager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });

    // Load all locales
    for (const [locale, data] of Object.entries(localesConfig)) {
      manager.loadLocale(locale as TLanguageCode, data as TLocaleData);
    }

    // Verify English
    expect(manager.t('nav.home')).toBe('Home');

    // Switch to Dutch
    manager.setLocale('nl-NL' as TLanguageCode);

    // Verify Dutch
    expect(manager.t('nav.home')).toBe('Thuis');
  });
});

// =============================================================================
// Phase 8 Integration Tests (T084, T088): Eventbus Integration
// =============================================================================

describe('Phase 8: Eventbus Integration', () => {
  // T084: given LocaleManager + eventbus adapter, when language changed, then event propagates
  test('given LocaleManager + eventbus adapter, when language changed via eventbus, then LocaleManager updates', () => {
    const manager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });

    manager.loadLocale('en-US' as TLanguageCode, {greeting: 'Hello'});
    manager.loadLocale('nl-NL' as TLanguageCode, {greeting: 'Hallo'});

    // Create mock eventbus
    const eventHandlers = new Map<string, (...args: unknown[]) => void>();
    const requestHandlers = new Map<string, (...args: unknown[]) => unknown>();

    const mockEventbus: IEventbus = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers.set(event, handler);
        return () => eventHandlers.delete(event);
      }),
      onRequest: vi.fn(
        (event: string, handler: (...args: unknown[]) => unknown) => {
          requestHandlers.set(event, handler);
          return () => requestHandlers.delete(event);
        }
      ),
      broadcast: vi.fn(),
      request: vi.fn((event: string, ...args: unknown[]) => {
        const handler = requestHandlers.get(event);
        return handler ? handler(...args) : undefined;
      }),
    } as unknown as IEventbus;

    // Create mock engine
    const mockEngine = {
      engineRoot: {
        attr: vi.fn(),
      },
    } as unknown as IEligiusEngine;

    // Connect adapter
    const adapter = new LocaleEventbusAdapter(
      manager,
      mockEventbus,
      mockEngine
    );
    adapter.connect();

    // Simulate language change via eventbus
    const languageChangeHandler = eventHandlers.get('language-change');
    expect(languageChangeHandler).toBeDefined();
    languageChangeHandler!('nl-NL');

    // Verify LocaleManager was updated
    expect(manager.locale).toBe('nl-NL');
    expect(manager.t('greeting')).toBe('Hallo');

    adapter.disconnect();
  });

  // T088: given adapter connected, when request-translation called, then returns translation
  test('given adapter connected, when request-translation called, then returns translation', () => {
    const manager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });

    manager.loadLocale('en-US' as TLanguageCode, {
      greeting: 'Hello {{name}}!',
      nav: {home: 'Home'},
    });

    // Create mock eventbus
    const requestHandlers = new Map<string, (...args: unknown[]) => unknown>();

    const mockEventbus: IEventbus = {
      on: vi.fn(() => () => {}),
      onRequest: vi.fn(
        (event: string, handler: (...args: unknown[]) => unknown) => {
          requestHandlers.set(event, handler);
          return () => requestHandlers.delete(event);
        }
      ),
      broadcast: vi.fn(),
      request: vi.fn((event: string, ...args: unknown[]) => {
        const handler = requestHandlers.get(event);
        return handler ? handler(...args) : undefined;
      }),
    } as unknown as IEventbus;

    const mockEngine = {
      engineRoot: {attr: vi.fn()},
    } as unknown as IEligiusEngine;

    // Connect adapter
    const adapter = new LocaleEventbusAdapter(
      manager,
      mockEventbus,
      mockEngine
    );
    adapter.connect();

    // Call request-translation via eventbus
    const result = mockEventbus.request('request-translation', 'greeting', {
      name: 'World',
    });

    expect(result).toBe('Hello World!');

    // Test nested key
    const navResult = mockEventbus.request('request-translation', 'nav.home');
    expect(navResult).toBe('Home');

    adapter.disconnect();
  });
});
