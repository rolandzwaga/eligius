/**
 * Locale Module
 * Feature: 005-rosetta-locale-manager
 *
 * Provides internationalization and localization support using rosetta.
 */

// Types
export type {
	TLanguageCode,
	TLocaleValue,
	TLocaleData,
	TLocaleEntry,
	ILocaleReference,
	ILocalesConfiguration,
	ILocaleManagerOptions,
	LocaleEvents,
	ILocaleManager,
	ILocaleLoaderOptions,
	ILocaleLoadResult,
	ILocaleLoader,
} from './types.ts';

// Type guards
export { isLocaleReference } from './types.ts';

// Classes
export { LocaleManager } from './locale-manager.ts';
