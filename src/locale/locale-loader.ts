/**
 * LocaleLoader - External locale file loading with $ref resolution
 * Feature: 005-rosetta-locale-manager
 *
 * Handles loading external JSON locale files referenced via $ref syntax.
 * Supports caching, parallel loading, and circular reference detection.
 */

import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {
  ILocaleLoader,
  ILocaleLoaderOptions,
  ILocaleLoadResult,
  ILocaleReference,
  TLanguageCode,
  TLocaleData,
} from './types.ts';

const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

function hasScheme(url: string): boolean {
  return SCHEME_PATTERN.test(url);
}

function isRootRelative(url: string): boolean {
  return url.startsWith('/');
}

/**
 * Removes `.` segments and resolves `..` segments, so that one file always
 * gets the same URL however a reference spells it.
 *
 * URLs with a scheme go through `new URL()`. Other URLs stay relative (or
 * root-relative): `..` that would climb above the start of a relative path is
 * kept, `..` above the root of a root-relative path is dropped, and a leading
 * `./` is kept so the URL passed to fetch keeps its original form. The query
 * string and hash are left untouched.
 */
function normaliseUrl(url: string): string {
  if (hasScheme(url)) {
    try {
      return new URL(url).href;
    } catch {
      return url;
    }
  }

  const suffixIndex = url.search(/[?#]/);
  const path = suffixIndex === -1 ? url : url.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : url.slice(suffixIndex);

  let prefix = '';
  let rest = path;
  if (rest.startsWith('//')) {
    // Protocol-relative: keep the host, normalise the path after it.
    const hostEnd = rest.indexOf('/', 2);
    if (hostEnd === -1) {
      return url;
    }
    prefix = rest.slice(0, hostEnd + 1);
    rest = rest.slice(hostEnd + 1);
  } else if (isRootRelative(rest)) {
    prefix = '/';
    rest = rest.slice(1);
  } else if (rest.startsWith('./')) {
    prefix = './';
  }
  const rooted = prefix !== '' && prefix !== './';

  const output: string[] = [];
  for (const segment of rest.split('/')) {
    if (segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (output.length > 0 && output[output.length - 1] !== '..') {
        output.pop();
      } else if (!rooted) {
        output.push('..');
      }
      continue;
    }
    output.push(segment);
  }

  let normalised = output.join('/');
  if (prefix === './' && normalised.startsWith('..')) {
    prefix = '';
  }
  normalised = `${prefix}${normalised}`;
  return `${normalised}${suffix}`;
}

/**
 * The key under which a normalised URL is cached and tracked for cycles.
 * `./a.json` and `a.json` name the same file.
 */
function toKey(url: string): string {
  return url.startsWith('./') ? url.slice(2) : url;
}

function describeJsonType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  return Array.isArray(value) ? 'array' : typeof value;
}

/**
 * Applies the loader's timeout and abort signal to one fetch.
 */
interface IFetchGuard {
  /** Second argument for fetch, or undefined when no signal is needed. */
  init: RequestInit | undefined;
  /** Settles with `promise`, or rejects as soon as the fetch is aborted. */
  race<T>(promise: Promise<T>): Promise<T>;
  /** Clears the timer and the abort listener. */
  dispose(): void;
}

const UNGUARDED: IFetchGuard = {
  init: undefined,
  race: promise => promise,
  dispose: () => {},
};

/**
 * LocaleLoader loads external locale files referenced via $ref syntax.
 *
 * Features:
 * - Fetches JSON locale files from URLs
 * - Caches results to avoid redundant fetches
 * - Detects circular references
 * - Supports baseUrl for relative path resolution
 * - Normalises `./` and `../` segments, so cycle detection and the cache see
 *   one URL per file
 * - Optional per-file timeout and abort signal
 */
export class LocaleLoader implements ILocaleLoader {
  private readonly _fetch: typeof globalThis.fetch;
  private readonly _baseUrl: string;
  private readonly _timeoutMs: number | undefined;
  private readonly _signal: AbortSignal | undefined;
  private readonly _cache: Map<string, TLocaleData>;
  private readonly _loading: Map<string, Promise<TLocaleData>>;

  /**
   * Creates a new LocaleLoader instance.
   *
   * @param options - Configuration options
   * @throws If `timeoutMs` is given and is not a positive finite number
   */
  constructor(options: ILocaleLoaderOptions = {}) {
    const {timeoutMs} = options;
    if (
      timeoutMs !== undefined &&
      !(Number.isFinite(timeoutMs) && timeoutMs > 0)
    ) {
      throw new Error(
        `[LocaleLoader] timeoutMs must be a positive finite number, got ${timeoutMs}`
      );
    }
    // Bind the default: browsers throw 'Illegal invocation' when fetch is
    // called with a receiver other than the global object.
    this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this._baseUrl = options.baseUrl ?? '';
    this._timeoutMs = timeoutMs;
    this._signal = options.signal;
    this._cache = new Map();
    this._loading = new Map();
  }

  /**
   * Loads a single locale from an external reference.
   *
   * @param locale - The locale code
   * @param reference - The external reference to load
   * @returns The loaded locale data
   * @throws If a file cannot be loaded, does not contain a JSON object, times
   * out or is aborted, or if a circular reference is detected
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
    const key = toKey(url);

    // Check for circular reference within this load chain
    if (visitedPaths.has(key)) {
      throw new Error(
        `[LocaleLoader] Circular reference detected: ${url} has already been visited`
      );
    }

    visitedPaths.add(key);

    // Resolve nested refs on a copy so the cached data is never mutated
    const data = deepCopy(await this._fetchWithCache(url));

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
    const key = toKey(url);

    // Return from cache if available
    if (this._cache.has(key)) {
      return this._cache.get(key)!;
    }

    // Return existing promise if already loading
    if (this._loading.has(key)) {
      return this._loading.get(key)!;
    }

    // Start new fetch
    const promise = this._doFetch(url);
    this._loading.set(key, promise);

    try {
      const data = await promise;
      this._cache.set(key, data);
      return data;
    } finally {
      this._loading.delete(key);
    }
  }

  /**
   * Performs the actual fetch request.
   */
  private async _doFetch(url: string): Promise<TLocaleData> {
    const guard = this._createFetchGuard(url);
    try {
      const response = await guard.race(
        guard.init ? this._fetch(url, guard.init) : this._fetch(url)
      );

      if (!response.ok) {
        throw new Error(
          `[LocaleLoader] Failed to load locale file '${url}': ${response.status} ${response.statusText}`
        );
      }

      const data: unknown = await guard.race(response.json());
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(
          `[LocaleLoader] Locale file '${url}' must contain a JSON object, got ${describeJsonType(data)}`
        );
      }
      return data as TLocaleData;
    } catch (error) {
      if (error instanceof Error && error.message.includes('[LocaleLoader]')) {
        throw error;
      }
      throw new Error(
        `[LocaleLoader] Failed to load locale file '${url}': ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      guard.dispose();
    }
  }

  /**
   * Builds the abort signal for one fetch from the `timeoutMs` and `signal`
   * options. The fetch is also raced against the abort, so a custom fetch
   * that ignores the signal cannot keep the load pending.
   */
  private _createFetchGuard(url: string): IFetchGuard {
    const timeoutMs = this._timeoutMs;
    const external = this._signal;
    if (timeoutMs === undefined && !external) {
      return UNGUARDED;
    }

    const controller = new AbortController();
    let rejectAborted: (error: Error) => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAborted = reject;
    });
    // The fetch may finish first, leaving this promise unobserved.
    aborted.catch(() => {});

    const abortWith = (error: Error) => {
      rejectAborted(error);
      controller.abort(error);
    };
    const onExternalAbort = () =>
      abortWith(
        new Error(`[LocaleLoader] Loading locale file '${url}' was aborted`)
      );

    if (external?.aborted) {
      onExternalAbort();
    } else {
      external?.addEventListener('abort', onExternalAbort, {once: true});
    }

    const timer =
      timeoutMs === undefined
        ? undefined
        : setTimeout(
            () =>
              abortWith(
                new Error(
                  `[LocaleLoader] Timed out loading locale file '${url}' after ${timeoutMs} ms`
                )
              ),
            timeoutMs
          );

    return {
      init: {signal: controller.signal},
      race: promise => Promise.race([promise, aborted]),
      dispose: () => {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        external?.removeEventListener('abort', onExternalAbort);
      },
    };
  }

  /**
   * Resolves a potentially relative URL using the baseUrl, then normalises it.
   */
  private _resolveUrl(ref: string): string {
    if (!this._baseUrl || hasScheme(ref) || isRootRelative(ref)) {
      return normaliseUrl(ref);
    }

    // Combine baseUrl and ref
    const base = this._baseUrl.endsWith('/')
      ? this._baseUrl
      : `${this._baseUrl}/`;
    return normaliseUrl(`${base}${ref}`);
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
        const nestedKey = toKey(nestedUrl);

        // visitedPaths holds only the ancestors of the current branch, so a
        // file referenced from two places (a diamond) is not a cycle.
        if (visitedPaths.has(nestedKey)) {
          throw new Error(
            `[LocaleLoader] Circular reference detected: ${nestedUrl} has already been visited (referenced from ${parentUrl})`
          );
        }

        visitedPaths.add(nestedKey);
        try {
          const nestedData = deepCopy(await this._fetchWithCache(nestedUrl));
          await this._resolveNestedRefs(nestedData, nestedUrl, visitedPaths);

          // Replace the $ref with actual data
          data[key] = nestedData;
        } finally {
          visitedPaths.delete(nestedKey);
        }
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
   * Resolves a relative path relative to a parent URL, then normalises it.
   */
  private _resolveRelativeToParent(ref: string, parentUrl: string): string {
    // If ref is absolute, it does not depend on the parent
    if (hasScheme(ref) || isRootRelative(ref)) {
      return normaliseUrl(ref);
    }

    // Get directory of parent URL
    const lastSlash = parentUrl.lastIndexOf('/');
    if (lastSlash === -1) {
      return normaliseUrl(ref);
    }

    const parentDir = parentUrl.substring(0, lastSlash + 1);
    return normaliseUrl(`${parentDir}${ref}`);
  }
}
