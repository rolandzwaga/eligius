/**
 * LocaleManager - Core locale management class wrapping rosetta
 * Feature: 005-rosetta-locale-manager
 *
 * Provides translation retrieval, locale switching, and event emission
 * for the Eligius timeline engine.
 */

import rosetta from 'rosetta';
import {
  type ILocaleManager,
  type ILocaleManagerOptions,
  isLocaleReference,
  type LocaleEvents,
  type TLanguageCode,
  type TLocaleData,
} from './types.ts';

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Returned by {@link resolveOwnPath} when the path does not exist. */
const MISSING: unique symbol = Symbol('missing');

/**
 * Walks `path` from `root` over own properties only, so inherited members
 * such as `constructor` or `toString` never count as present.
 */
function resolveOwnPath(
  root: unknown,
  path: readonly string[]
): unknown | typeof MISSING {
  let current = root;
  for (const segment of path) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.hasOwn(current, segment)
    ) {
      return MISSING;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function toKeyPath(key: string | string[]): string[] {
  return Array.isArray(key) ? key : key.split('.');
}

function keyToString(key: string | string[]): string {
  return Array.isArray(key) ? key.join('.') : key;
}

/** Matches rosetta's (templite) placeholder syntax: `{{ name }}`, `{{a.b}}`. */
const PLACEHOLDER_PATTERN = /\{\{(.*?)\}\}/g;

function isPlainDataObject(value: unknown): value is TLocaleData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merges `source` into a copy of `target`. Neither argument is
 * mutated. Keys that could pollute prototypes are skipped.
 */
function mergeLocaleData(
  target: TLocaleData | undefined,
  source: TLocaleData
): TLocaleData {
  const result: TLocaleData = {...target};
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }
    const sourceValue = source[key];
    const targetValue = result[key];
    result[key] =
      isPlainDataObject(sourceValue) && isPlainDataObject(targetValue)
        ? mergeLocaleData(targetValue, sourceValue)
        : sourceValue;
  }
  return result;
}

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
  private readonly _defaultLocale: TLanguageCode;
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
    this._defaultLocale = options.defaultLocale;
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
   * Loads translation data for a specific locale. Data loaded for a locale
   * that already has translations is deep-merged into the existing data.
   *
   * @param locale - The locale code (e.g., 'en-US', 'nl-NL')
   * @param data - The translation data object
   * @throws If `data` is an unresolved external reference (`{$ref: ...}`);
   * resolve it with `LocaleLoader` first.
   */
  loadLocale(locale: TLanguageCode, data: TLocaleData): void {
    if (isLocaleReference(data)) {
      throw new Error(
        `[LocaleManager] Locale '${locale}' is an unresolved external reference ($ref: '${data.$ref}'). Resolve it with LocaleLoader before calling loadLocale.`
      );
    }

    const merged = mergeLocaleData(
      this._rosetta.table(locale) as TLocaleData | undefined,
      data
    );
    this._rosetta.set(locale, merged);
    this._availableLocales.add(locale);

    // Store raw data for debug mode variable checking
    if (this._debug) {
      this._rawLocaleData.set(
        locale,
        mergeLocaleData(this._rawLocaleData.get(locale), data)
      );
      console.log(`[LocaleManager] Loaded locale: ${locale}`);
    }
  }

  /**
   * Retrieves a translation for the given key.
   *
   * The key must name a leaf translation: a string, or a function that
   * returns a string. Every other case returns an empty string (and logs a
   * warning in debug mode):
   * - the key does not exist as own properties of the locale data (inherited
   *   members such as `constructor` or `toString` do not count);
   * - the key names a namespace (a nested object) rather than a leaf;
   * - a function translation returns something other than a string.
   *
   * @param key - The translation key (string or array of strings for nested keys)
   * @param params - Optional parameters for interpolation
   * @param locale - Optional locale override (uses current locale if not specified)
   * @returns The translated string, or an empty string if the key does not
   * name a string translation
   * @throws Whatever a function translation throws
   *
   * @example
   * ```ts
   * localeManager.loadLocale('en-US', {nav: {home: 'Home'}});
   * localeManager.t('nav.home'); // 'Home'
   * localeManager.t('nav'); // '' (namespace, not a leaf)
   * ```
   */
  t(
    key: string | string[],
    params?: Record<string, unknown>,
    locale?: TLanguageCode
  ): string {
    const targetLocale = locale ?? this._locale;
    const keyPath = toKeyPath(key);

    // rosetta walks inherited properties too, so check the path first.
    if (
      resolveOwnPath(this._rosetta.table(targetLocale), keyPath) === MISSING
    ) {
      this._warnMissingTranslation(key);
      return '';
    }

    // In debug mode, check for missing interpolation variables before rosetta interpolates
    if (this._debug && params) {
      this._checkMissingInterpolationVars(key, params, targetLocale);
    }

    // Pass the locale to rosetta instead of switching its global locale, so a
    // throwing function translation cannot leave rosetta on the override.
    const result: unknown = this._rosetta.t(key, params, targetLocale);

    if (result === undefined || result === null || result === '') {
      this._warnMissingTranslation(key);
      return '';
    }

    if (typeof result !== 'string') {
      if (this._debug) {
        console.warn(
          `[LocaleManager] Translation key '${keyToString(key)}' does not name a string translation: it names a namespace, or a function translation returned a ${typeof result}. Returning an empty string.`
        );
      }
      return '';
    }

    return result;
  }

  private _warnMissingTranslation(key: string | string[]): void {
    if (this._debug) {
      console.warn(
        `[LocaleManager] Missing translation for key: ${keyToString(key)}`
      );
    }
  }

  /**
   * Checks for missing interpolation variables in debug mode.
   *
   * Uses rosetta's placeholder syntax: `{{name}}`, `{{ name }}` and dot paths
   * such as `{{user.name}}`. A placeholder is reported when its path does not
   * resolve, over own properties of `params`, to a value other than
   * `undefined` or `null`.
   */
  private _checkMissingInterpolationVars(
    key: string | string[],
    params: Record<string, unknown>,
    locale: TLanguageCode
  ): void {
    // Get raw translation from stored data (rosetta interpolates on access)
    const rawTranslation = this._getRawTranslation(key, locale);
    if (typeof rawTranslation !== 'string') {
      return;
    }

    const missingVars = new Set<string>();
    for (const match of rawTranslation.matchAll(PLACEHOLDER_PATTERN)) {
      const name = match[1].trim();
      if (name === '') {
        continue;
      }
      const value = resolveOwnPath(params, name.split('.'));
      if (value === MISSING || value === undefined || value === null) {
        missingVars.add(name);
      }
    }

    if (missingVars.size > 0) {
      console.warn(
        `[LocaleManager] Missing interpolation variable(s) for key '${keyToString(key)}': ${[...missingVars].join(', ')}`
      );
    }
  }

  /**
   * Gets raw translation value from stored locale data (without interpolation).
   */
  private _getRawTranslation(
    key: string | string[],
    locale: TLanguageCode
  ): unknown {
    const value = resolveOwnPath(
      this._rawLocaleData.get(locale),
      toKeyPath(key)
    );
    return value === MISSING ? undefined : value;
  }

  /**
   * Sets the current locale and emits a change event.
   *
   * If the requested locale has not been loaded (and at least one locale
   * has), a warning is logged and the default locale is used instead.
   *
   * Setting the locale that is already current (after any fallback) is a
   * no-op: no event is emitted, so listeners that react by switching the
   * locale again cannot cause a loop.
   *
   * @param locale - The new locale to set
   */
  setLocale(locale: TLanguageCode): void {
    const previousLocale = this._locale;
    if (
      this._availableLocales.size > 0 &&
      !this._availableLocales.has(locale)
    ) {
      console.warn(
        `[LocaleManager] Locale '${locale}' is not available, falling back to default locale '${this._defaultLocale}'. Available locales: ${this.availableLocales.join(', ')}`
      );
      locale = this._defaultLocale;
    }
    if (locale === previousLocale) {
      return;
    }
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
   * Iterates a snapshot, so a handler added during the emit is not called for
   * this event. Each handler is isolated: one that throws is logged (with the
   * event name, never the locale data) and the rest still run.
   *
   * @param event - The event name
   * @param args - The event arguments
   */
  private _emit<K extends keyof LocaleEvents>(
    event: K,
    ...args: LocaleEvents[K]
  ): void {
    const handlers = this._listeners.get(event);
    if (!handlers) {
      return;
    }
    for (const handler of [...handlers]) {
      try {
        (handler as (...args: LocaleEvents[K]) => void)(...args);
      } catch (error) {
        console.error(
          `[LocaleManager] Error in '${String(event)}' event handler:`,
          error
        );
      }
    }
  }
}
