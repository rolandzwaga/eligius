/**
 * Locale Types Contract
 * Feature: 005-rosetta-locale-manager
 *
 * These types define the public API for the new locale management system.
 * Implementation MUST conform to these interfaces.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * IETF language tag format (e.g., 'en-US', 'nl-NL')
 * Reuses existing type from src/types.ts
 */
export type TLanguageCode = `${Lowercase<string>}-${Uppercase<string>}`;

/**
 * Valid values in locale data:
 * - string: Simple translation text (may contain {{interpolation}})
 * - function: Dynamic translation that receives params
 * - nested object: Nested translation keys
 */
export type TLocaleValue =
  | string
  | ((params: Record<string, unknown>) => string)
  | TLocaleData;

/**
 * Recursive type for nested translation data.
 * Compatible with rosetta's expected format.
 */
export type TLocaleData = Record<string, TLocaleValue>;

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * External locale file reference using JSON Reference syntax.
 * The loader resolves these to TLocaleData at initialization.
 */
export interface ILocaleReference {
  /** URL or relative path to JSON locale file */
  $ref: string;
}

/**
 * Type guard for ILocaleReference
 */
export function isLocaleReference(
  value: TLocaleData | ILocaleReference
): value is ILocaleReference {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$ref' in value &&
    typeof (value as ILocaleReference).$ref === 'string'
  );
}

/**
 * A single locale entry can be inline data or an external reference.
 */
export type TLocaleEntry = TLocaleData | ILocaleReference;

/**
 * Top-level configuration object for all locales.
 * Keys are language codes, values are inline data or external references.
 */
export interface ILocalesConfiguration {
  [locale: TLanguageCode]: TLocaleEntry;
}

// =============================================================================
// LocaleManager Types
// =============================================================================

/**
 * Options for LocaleManager initialization.
 */
export interface ILocaleManagerOptions {
  /** Default locale to use at startup */
  defaultLocale: TLanguageCode;
  /** Enable debug mode (logs missing translation keys) */
  debug?: boolean;
}

/**
 * Events emitted by LocaleManager.
 */
export type LocaleEvents = {
  /** Emitted when locale changes: [newLocale, previousLocale] */
  change: [locale: TLanguageCode, previousLocale: TLanguageCode];
};

/**
 * Main LocaleManager interface.
 * Wraps rosetta with type safety and event emission.
 */
export interface ILocaleManager {
  // =========================================================================
  // State (read-only)
  // =========================================================================

  /** Current active locale */
  readonly locale: TLanguageCode;

  /** List of all loaded locale codes */
  readonly availableLocales: ReadonlyArray<TLanguageCode>;

  // =========================================================================
  // Translation
  // =========================================================================

  /**
   * Get translated string for key.
   *
   * @param key - Dot-notation key (e.g., 'nav.home') or array (['nav', 'home'])
   * @param params - Optional interpolation parameters
   * @param locale - Optional locale override (defaults to current locale)
   * @returns Translated string, or empty string if key not found
   */
  t(
    key: string | string[],
    params?: Record<string, unknown>,
    locale?: TLanguageCode
  ): string;

  // =========================================================================
  // Locale Management
  // =========================================================================

  /**
   * Change the active locale.
   * Emits 'change' event if locale differs from current.
   *
   * @param locale - New locale to activate
   * @throws If locale is not in availableLocales
   */
  setLocale(locale: TLanguageCode): void;

  /**
   * Load or merge locale data.
   * Can be called after initialization to add translations.
   *
   * @param locale - Locale code to load data for
   * @param data - Translation data to merge
   */
  loadLocale(locale: TLanguageCode, data: TLocaleData): void;

  // =========================================================================
  // Events
  // =========================================================================

  /**
   * Subscribe to locale events.
   *
   * @param event - Event name ('change')
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on<K extends keyof LocaleEvents>(
    event: K,
    handler: (...args: LocaleEvents[K]) => void
  ): () => void;

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * Clean up resources and remove all listeners.
   */
  destroy(): void;
}

// =============================================================================
// LocaleLoader Types
// =============================================================================

/**
 * Options for LocaleLoader.
 */
export interface ILocaleLoaderOptions {
  /** Base URL for resolving relative paths */
  baseUrl?: string;
  /** Custom fetch function (for testing or SSR) */
  fetch?: typeof globalThis.fetch;
}

/**
 * Result of loading a locale file.
 */
export interface ILocaleLoadResult {
  locale: TLanguageCode;
  data: TLocaleData;
}

/**
 * LocaleLoader interface for resolving external locale references.
 */
export interface ILocaleLoader {
  /**
   * Load a single locale from external reference.
   *
   * @param locale - Locale code
   * @param reference - External reference to resolve
   * @returns Resolved locale data
   * @throws If file cannot be loaded or parsed
   */
  load(
    locale: TLanguageCode,
    reference: ILocaleReference
  ): Promise<ILocaleLoadResult>;

  /**
   * Load multiple locales in parallel.
   *
   * @param entries - Map of locale codes to references
   * @returns Array of resolved locale data
   */
  loadAll(
    entries: Map<TLanguageCode, ILocaleReference>
  ): Promise<ILocaleLoadResult[]>;
}

// =============================================================================
// Legacy Converter Types
// =============================================================================

/**
 * Legacy ILabel interface (from existing system).
 */
export interface ILegacyLabel {
  id: string;
  languageCode: TLanguageCode;
  label: string;
}

/**
 * Legacy ILanguageLabel interface (from existing system).
 */
export interface ILegacyLanguageLabel {
  id: string;
  labels: ILegacyLabel[];
}

/**
 * LegacyConverter interface for migrating old format.
 */
export interface ILegacyConverter {
  /**
   * Convert legacy ILanguageLabel[] format to ILocalesConfiguration.
   *
   * @param labels - Legacy labels array
   * @returns Converted locales configuration
   */
  convert(labels: ILegacyLanguageLabel[]): ILocalesConfiguration;

  /**
   * Detect if configuration uses legacy format.
   *
   * @param config - Configuration object
   * @returns True if legacy format detected
   */
  isLegacyFormat(config: unknown): config is {labels: ILegacyLanguageLabel[]};
}
