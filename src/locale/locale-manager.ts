/**
 * LocaleManager - Core locale management class wrapping rosetta
 * Feature: 005-rosetta-locale-manager
 *
 * Provides translation retrieval, locale switching, and event emission
 * for the Eligius timeline engine.
 */

import rosetta from 'rosetta';
import type {
  ILocaleManager,
  ILocaleManagerOptions,
  LocaleEvents,
  TLanguageCode,
  TLocaleData,
} from './types.ts';

/**
 * LocaleManager wraps the rosetta library to provide translation management
 * with event-based locale switching support.
 */
export class LocaleManager implements ILocaleManager {
  private readonly _rosetta: ReturnType<typeof rosetta>;
  private readonly _listeners: Map<
    keyof LocaleEvents,
    Set<(...args: LocaleEvents[keyof LocaleEvents]) => void>
  >;
  private _locale: TLanguageCode;
  private _availableLocales: Set<TLanguageCode>;
  private readonly _debug: boolean;
  /** Raw locale data for debug mode variable checking (rosetta interpolates on access) */
  private readonly _rawLocaleData: Map<TLanguageCode, TLocaleData>;

  /**
   * Creates a new LocaleManager instance.
   *
   * @param options - Configuration options for the locale manager
   */
  constructor(options: ILocaleManagerOptions) {
    this._rosetta = rosetta();
    this._listeners = new Map();
    this._locale = options.defaultLocale;
    this._availableLocales = new Set();
    this._debug = options.debug ?? false;
    this._rawLocaleData = new Map();

    // Set initial locale in rosetta
    this._rosetta.locale(this._locale);
  }

  /**
   * Gets the current locale.
   */
  get locale(): TLanguageCode {
    return this._locale;
  }

  /**
   * Gets the list of available locales.
   */
  get availableLocales(): ReadonlyArray<TLanguageCode> {
    return Array.from(this._availableLocales);
  }

  /**
   * Loads translation data for a specific locale.
   *
   * @param locale - The locale code (e.g., 'en-US', 'nl-NL')
   * @param data - The translation data object
   */
  loadLocale(locale: TLanguageCode, data: TLocaleData): void {
    this._rosetta.set(locale, data);
    this._availableLocales.add(locale);

    // Store raw data for debug mode variable checking
    if (this._debug) {
      this._rawLocaleData.set(locale, data);
      console.log(`[LocaleManager] Loaded locale: ${locale}`);
    }
  }

  /**
   * Retrieves a translation for the given key.
   *
   * @param key - The translation key (string or array of strings for nested keys)
   * @param params - Optional parameters for interpolation
   * @param locale - Optional locale override (uses current locale if not specified)
   * @returns The translated string, or empty string if key not found
   */
  t(
    key: string | string[],
    params?: Record<string, unknown>,
    locale?: TLanguageCode
  ): string {
    const targetLocale = locale ?? this._locale;

    // Temporarily switch locale if override provided
    if (locale && locale !== this._locale) {
      this._rosetta.locale(targetLocale);
    }

    // In debug mode, check for missing interpolation variables before rosetta interpolates
    if (this._debug && params) {
      this._checkMissingInterpolationVars(key, params);
    }

    const result = this._rosetta.t(key, params) ?? '';

    // Switch back to current locale if we temporarily changed it
    if (locale && locale !== this._locale) {
      this._rosetta.locale(this._locale);
    }

    if (this._debug && result === '') {
      console.warn(
        `[LocaleManager] Missing translation for key: ${Array.isArray(key) ? key.join('.') : key}`
      );
    }

    return result;
  }

  /**
   * Checks for missing interpolation variables in debug mode.
   * Extracts {{variable}} patterns from raw translation and compares with provided params.
   */
  private _checkMissingInterpolationVars(
    key: string | string[],
    params: Record<string, unknown>
  ): void {
    // Get raw translation from stored data (rosetta interpolates on access)
    const rawTranslation = this._getRawTranslation(key);
    if (typeof rawTranslation !== 'string') {
      return;
    }

    // Extract all {{variable}} patterns
    const variablePattern = /\{\{(\w+)\}\}/g;
    const requiredVars: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = variablePattern.exec(rawTranslation)) !== null) {
      requiredVars.push(match[1]);
    }

    // Check which variables are missing from params
    const missingVars = requiredVars.filter(varName => !(varName in params));

    if (missingVars.length > 0) {
      const keyStr = Array.isArray(key) ? key.join('.') : key;
      console.warn(
        `[LocaleManager] Missing interpolation variable(s) for key '${keyStr}': ${missingVars.join(', ')}`
      );
    }
  }

  /**
   * Gets raw translation value from stored locale data (without interpolation).
   */
  private _getRawTranslation(key: string | string[]): unknown {
    const localeData = this._rawLocaleData.get(this._locale);
    if (!localeData) {
      return undefined;
    }

    // Navigate through nested keys
    const keyPath = Array.isArray(key) ? key : key.split('.');
    let current: unknown = localeData;

    for (const segment of keyPath) {
      if (current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  /**
   * Sets the current locale and emits a change event.
   *
   * @param locale - The new locale to set
   */
  setLocale(locale: TLanguageCode): void {
    const previousLocale = this._locale;
    this._locale = locale;
    this._rosetta.locale(locale);

    this._emit('change', locale, previousLocale);

    if (this._debug) {
      console.log(
        `[LocaleManager] Locale changed: ${previousLocale} -> ${locale}`
      );
    }
  }

  /**
   * Subscribes to a locale event.
   *
   * @param event - The event name to subscribe to
   * @param handler - The event handler function
   * @returns An unsubscribe function
   */
  on<K extends keyof LocaleEvents>(
    event: K,
    handler: (...args: LocaleEvents[K]) => void
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }

    const handlers = this._listeners.get(event)!;
    handlers.add(
      handler as (...args: LocaleEvents[keyof LocaleEvents]) => void
    );

    // Return unsubscribe function
    return () => {
      handlers.delete(
        handler as (...args: LocaleEvents[keyof LocaleEvents]) => void
      );
    };
  }

  /**
   * Destroys the LocaleManager, cleaning up all listeners and data.
   */
  destroy(): void {
    this._listeners.clear();
    this._availableLocales.clear();
    this._rawLocaleData.clear();

    if (this._debug) {
      console.log('[LocaleManager] Destroyed');
    }
  }

  /**
   * Emits an event to all registered listeners.
   *
   * @param event - The event name
   * @param args - The event arguments
   */
  private _emit<K extends keyof LocaleEvents>(
    event: K,
    ...args: LocaleEvents[K]
  ): void {
    const handlers = this._listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        (handler as (...args: LocaleEvents[K]) => void)(...args);
      }
    }
  }
}
