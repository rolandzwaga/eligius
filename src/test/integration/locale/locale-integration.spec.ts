/**
 * Locale Integration Tests
 * Feature: 005-rosetta-locale-manager
 *
 * Tests for inline locale configuration in engine configuration.
 */

import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {LocaleManager} from '../../../locale/locale-manager.ts';
import type {
  ILocalesConfiguration,
  TLanguageCode,
  TLocaleData,
} from '../../../locale/types.ts';

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
