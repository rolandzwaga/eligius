/**
 * Locale Module
 * Feature: 005-rosetta-locale-manager
 *
 * Provides internationalization and localization support using rosetta.
 */

// Classes
export {LocaleLoader} from './locale-loader.ts';
export {LocaleManager} from './locale-manager.ts';
// Types
export type {
  ILocaleLoader,
  ILocaleLoaderOptions,
  ILocaleLoadResult,
  ILocaleManager,
  ILocaleManagerOptions,
  ILocaleReference,
  ILocalesConfiguration,
  LocaleEvents,
  TLanguageCode,
  TLocaleData,
  TLocaleEntry,
  TLocaleValue,
} from './types.ts';
// Type guards
export {isLocaleReference} from './types.ts';
