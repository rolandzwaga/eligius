/**
 * LocaleLoader - External locale file loading with $ref resolution
 * Feature: 005-rosetta-locale-manager
 *
 * Handles loading external JSON locale files referenced via $ref syntax.
 * Supports caching, parallel loading, and circular reference detection.
 */

import type {
  ILocaleLoader,
  ILocaleLoaderOptions,
  ILocaleLoadResult,
  ILocaleReference,
  TLanguageCode,
  TLocaleData,
} from './types.ts';

/**
 * LocaleLoader loads external locale files referenced via $ref syntax.
 *
 * Features:
 * - Fetches JSON locale files from URLs
 * - Caches results to avoid redundant fetches
 * - Detects circular references
 * - Supports baseUrl for relative path resolution
 */
export class LocaleLoader implements ILocaleLoader {
  private readonly _fetch: typeof globalThis.fetch;
  private readonly _baseUrl: string;
  private readonly _cache: Map<string, TLocaleData>;
  private readonly _loading: Map<string, Promise<TLocaleData>>;

  /**
   * Creates a new LocaleLoader instance.
   *
   * @param options - Configuration options
   */
  constructor(options: ILocaleLoaderOptions = {}) {
    this._fetch = options.fetch ?? globalThis.fetch;
    this._baseUrl = options.baseUrl ?? '';
    this._cache = new Map();
    this._loading = new Map();
  }

  /**
   * Loads a single locale from an external reference.
   *
   * @param locale - The locale code
   * @param reference - The external reference to load
   * @returns The loaded locale data
   * @throws If file cannot be loaded, parsed, or circular reference detected
   */
  async load(
    locale: TLanguageCode,
    reference: ILocaleReference
  ): Promise<ILocaleLoadResult> {
    // Use per-load-chain visited paths to detect circular refs
    const visitedPaths = new Set<string>();
    return this._loadWithVisited(locale, reference, visitedPaths);
  }

  /**
   * Internal load method with visited path tracking.
   */
  private async _loadWithVisited(
    locale: TLanguageCode,
    reference: ILocaleReference,
    visitedPaths: Set<string>
  ): Promise<ILocaleLoadResult> {
    const url = this._resolveUrl(reference.$ref);

    // Check for circular reference within this load chain
    if (visitedPaths.has(url)) {
      throw new Error(
        `[LocaleLoader] Circular reference detected: ${url} has already been visited`
      );
    }

    visitedPaths.add(url);

    const data = await this._fetchWithCache(url);

    // Check for nested $ref in loaded data (recursive references)
    await this._resolveNestedRefs(data, url, visitedPaths);

    return {locale, data};
  }

  /**
   * Loads multiple locales in parallel.
   *
   * @param entries - Map of locale codes to references
   * @returns Array of loaded locale data
   */
  async loadAll(
    entries: Map<TLanguageCode, ILocaleReference>
  ): Promise<ILocaleLoadResult[]> {
    // Each load gets its own visitedPaths set for circular detection
    // Cache handles deduplication of same URLs across different locales
    const promises: Promise<ILocaleLoadResult>[] = [];

    for (const [locale, reference] of entries) {
      promises.push(this.load(locale, reference));
    }

    return Promise.all(promises);
  }

  /**
   * Fetches URL with caching to avoid redundant requests.
   */
  private async _fetchWithCache(url: string): Promise<TLocaleData> {
    // Return from cache if available
    if (this._cache.has(url)) {
      return this._cache.get(url)!;
    }

    // Return existing promise if already loading
    if (this._loading.has(url)) {
      return this._loading.get(url)!;
    }

    // Start new fetch
    const promise = this._doFetch(url);
    this._loading.set(url, promise);

    try {
      const data = await promise;
      this._cache.set(url, data);
      return data;
    } finally {
      this._loading.delete(url);
    }
  }

  /**
   * Performs the actual fetch request.
   */
  private async _doFetch(url: string): Promise<TLocaleData> {
    try {
      const response = await this._fetch(url);

      if (!response.ok) {
        throw new Error(
          `[LocaleLoader] Failed to load locale file '${url}': ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data as TLocaleData;
    } catch (error) {
      if (error instanceof Error && error.message.includes('[LocaleLoader]')) {
        throw error;
      }
      throw new Error(
        `[LocaleLoader] Failed to load locale file '${url}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Resolves a potentially relative URL using the baseUrl.
   */
  private _resolveUrl(ref: string): string {
    if (!this._baseUrl) {
      return ref;
    }

    // If ref is already absolute, return as-is
    if (
      ref.startsWith('http://') ||
      ref.startsWith('https://') ||
      ref.startsWith('/')
    ) {
      return ref;
    }

    // Combine baseUrl and ref
    const base = this._baseUrl.endsWith('/')
      ? this._baseUrl
      : `${this._baseUrl}/`;
    return `${base}${ref}`;
  }

  /**
   * Recursively resolves nested $ref references in loaded data.
   */
  private async _resolveNestedRefs(
    data: TLocaleData,
    parentUrl: string,
    visitedPaths: Set<string>
  ): Promise<void> {
    for (const key of Object.keys(data)) {
      const value = data[key];

      if (this._isReference(value)) {
        const nestedUrl = this._resolveRelativeToParent(value.$ref, parentUrl);

        // Check for circular reference
        if (visitedPaths.has(nestedUrl)) {
          throw new Error(
            `[LocaleLoader] Circular reference detected: ${nestedUrl} has already been visited (referenced from ${parentUrl})`
          );
        }

        visitedPaths.add(nestedUrl);
        const nestedData = await this._fetchWithCache(nestedUrl);
        await this._resolveNestedRefs(nestedData, nestedUrl, visitedPaths);

        // Replace the $ref with actual data
        data[key] = nestedData;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Recurse into nested objects
        await this._resolveNestedRefs(
          value as TLocaleData,
          parentUrl,
          visitedPaths
        );
      }
    }
  }

  /**
   * Type guard for reference objects.
   */
  private _isReference(value: unknown): value is ILocaleReference {
    return (
      typeof value === 'object' &&
      value !== null &&
      '$ref' in value &&
      typeof (value as ILocaleReference).$ref === 'string'
    );
  }

  /**
   * Resolves a relative path relative to a parent URL.
   */
  private _resolveRelativeToParent(ref: string, parentUrl: string): string {
    // If ref is absolute, return as-is
    if (
      ref.startsWith('http://') ||
      ref.startsWith('https://') ||
      ref.startsWith('/')
    ) {
      return ref;
    }

    // Get directory of parent URL
    const lastSlash = parentUrl.lastIndexOf('/');
    if (lastSlash === -1) {
      return ref;
    }

    const parentDir = parentUrl.substring(0, lastSlash + 1);
    return `${parentDir}${ref}`;
  }
}
