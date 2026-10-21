/**
 * Locale Types
 * Feature: 005-rosetta-locale-manager
 *
 * These types define the public API for the locale management system.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * IETF language tag format (e.g., 'en-US', 'nl-NL')
 */
export type TLanguageCode = `${Lowercase<string>}-${Uppercase<string>}`;

/**
 * Recursive interface for nested translation data.
 * Compatible with rosetta's expected format.
 * Uses interface to support recursive definition.
 */
export interface TLocaleData {
  [key: string]:
    | string
    | ((params: Record<string, unknown>) => string)
    | TLocaleData;
}

/**
 * Valid values in locale data:
 * - string: Simple translation text (may contain {{interpolation}})
 * - function: Dynamic translation that receives params
 * - nested object: Nested translation keys
 */
export type TLocaleValue = TLocaleData[keyof TLocaleData];

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
   * @returns Translated string, or an empty string if the key does not name a
   * string translation: it is missing, only inherited (such as
   * `constructor`), names a namespace rather than a leaf, or names a function
   * translation that returned a non-string. Debug mode logs a warning for
   * each of these.
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
   * Falls back to default locale if requested locale is unavailable.
   *
   * @param locale - New locale to activate
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
   * Handlers are isolated: one that throws is logged with `console.error`
   * and the others still run, so `setLocale()` does not throw because of a
   * handler. A handler added while an event is being emitted is first called
   * for the next event.
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
  /**
   * Maximum time in milliseconds to wait for each locale file, including
   * reading its body. A file that takes longer makes the load reject with
   * `[LocaleLoader] Timed out loading locale file '<url>' after <n> ms`.
   * Must be a positive finite number. No timeout when omitted.
   */
  timeoutMs?: number;
  /**
   * Aborts all pending and future fetches of this loader when the signal
   * fires, for example when the engine is destroyed while locales are still
   * loading. Pending loads reject with
   * `[LocaleLoader] Loading locale file '<url>' was aborted`.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * const loader = new LocaleLoader({signal: controller.signal, timeoutMs: 10000});
   * const loading = loader.load('en-US', {$ref: './locales/en-US.json'});
   * controller.abort(); // loading rejects
   * ```
   */
  signal?: AbortSignal;
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
