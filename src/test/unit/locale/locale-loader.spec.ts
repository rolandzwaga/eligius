/**
 * LocaleLoader Unit Tests
 * Feature: 005-rosetta-locale-manager
 *
 * Tests for the LocaleLoader class that handles external locale file loading.
 */

import type {
  ILocaleLoader,
  ILocaleReference,
  TLanguageCode,
  TLocaleData,
} from '@locale/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

// =============================================================================
// Test Context
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFetch = ReturnType<typeof vi.fn<any>>;

type LocaleLoaderTestContext = {
  loader: ILocaleLoader;
  mockFetch: MockFetch;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

// =============================================================================
// US4 Tests (T055-T061): External Locale File Loading
// =============================================================================

describe<LocaleLoaderTestContext>('LocaleLoader', () => {
  beforeEach(async context => {
    withContext<LocaleLoaderTestContext>(context);

    // Import dynamically to get fresh instance
    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');

    // Create mock fetch - typed loosely to allow partial Response mocks
    context.mockFetch = vi.fn();

    context.loader = new LocaleLoader({
      fetch: context.mockFetch as typeof fetch,
    });
  });

  // =========================================================================
  // T056: given $ref config, when load() called, then fetches URL
  // =========================================================================

  test<LocaleLoaderTestContext>('given $ref config, when load() called, then fetches URL', async context => {
    const {loader, mockFetch} = context;

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({greeting: 'Hello'}),
    });

    const reference: ILocaleReference = {$ref: './locales/en-US.json'};
    await loader.load('en-US' as TLanguageCode, reference);

    expect(mockFetch).toHaveBeenCalledWith('./locales/en-US.json');
  });

  // =========================================================================
  // T057: given fetch returns JSON, when load() called, then returns parsed data
  // =========================================================================

  test<LocaleLoaderTestContext>('given fetch returns JSON, when load() called, then returns parsed data', async context => {
    const {loader, mockFetch} = context;

    const expectedData: TLocaleData = {
      greeting: 'Hello {{name}}!',
      nav: {home: 'Home'},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(expectedData),
    });

    const reference: ILocaleReference = {$ref: './en-US.json'};
    const result = await loader.load('en-US' as TLanguageCode, reference);

    expect(result.locale).toBe('en-US');
    expect(result.data).toEqual(expectedData);
  });

  // =========================================================================
  // T058: given fetch fails, when load() called, then throws with file path in error
  // =========================================================================

  test<LocaleLoaderTestContext>('given fetch fails, when load() called, then throws with file path in error', async context => {
    const {loader, mockFetch} = context;

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const reference: ILocaleReference = {$ref: './missing.json'};

    await expect(
      loader.load('en-US' as TLanguageCode, reference)
    ).rejects.toThrow(/missing\.json/);
  });

  // =========================================================================
  // T059: given multiple refs, when loadAll() called, then loads in parallel
  // =========================================================================

  test<LocaleLoaderTestContext>('given multiple refs, when loadAll() called, then loads in parallel', async context => {
    const {loader, mockFetch} = context;

    const enData = {greeting: 'Hello'};
    const nlData = {greeting: 'Hallo'};

    mockFetch.mockImplementation(url => {
      const urlStr = url as string;
      if (urlStr.includes('en-US')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(enData),
        });
      }
      if (urlStr.includes('nl-NL')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(nlData),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`));
    });

    const entries = new Map<TLanguageCode, ILocaleReference>([
      ['en-US' as TLanguageCode, {$ref: './en-US.json'}],
      ['nl-NL' as TLanguageCode, {$ref: './nl-NL.json'}],
    ]);

    const results = await loader.loadAll(entries);

    expect(results).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(results.find(r => r.locale === 'en-US')?.data).toEqual(enData);
    expect(results.find(r => r.locale === 'nl-NL')?.data).toEqual(nlData);
  });

  // =========================================================================
  // T060: given circular $ref, when load() called, then detects cycle and throws error
  // =========================================================================

  test<LocaleLoaderTestContext>('given circular $ref (A refs B refs A), when load() called, then detects cycle and throws error', async context => {
    const {loader, mockFetch} = context;

    // Simulate circular reference: A references B which references A
    // Use absolute paths to avoid relative path resolution issues
    mockFetch.mockImplementation(url => {
      const urlStr = url as string;
      if (urlStr === '/locales/a.json') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              nested: {$ref: '/locales/b.json'},
            }),
        });
      }
      if (urlStr === '/locales/b.json') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              back: {$ref: '/locales/a.json'},
            }),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`));
    });

    const reference: ILocaleReference = {$ref: '/locales/a.json'};

    // The loader should detect circular refs during deep resolution
    await expect(
      loader.load('en-US' as TLanguageCode, reference)
    ).rejects.toThrow(/circular|cycle/i);
  });

  // =========================================================================
  // T061: given $ref with already-visited path, when loading, then returns cached result
  // =========================================================================

  test<LocaleLoaderTestContext>('given $ref with already-visited path, when loading, then returns cached result (deduplication)', async context => {
    const {loader, mockFetch} = context;

    const sharedData = {greeting: 'Hello'};

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sharedData),
    });

    const entries = new Map<TLanguageCode, ILocaleReference>([
      ['en-US' as TLanguageCode, {$ref: './shared.json'}],
      ['en-GB' as TLanguageCode, {$ref: './shared.json'}], // Same file
    ]);

    const results = await loader.loadAll(entries);

    // Should only fetch once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0].data).toEqual(sharedData);
    expect(results[1].data).toEqual(sharedData);
  });

  // =========================================================================
  // Additional tests
  // =========================================================================

  test<LocaleLoaderTestContext>('given baseUrl option, when load() called, then resolves relative paths', async context => {
    const {mockFetch} = context;

    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');

    const loaderWithBase = new LocaleLoader({
      fetch: mockFetch as typeof fetch,
      baseUrl: 'https://cdn.example.com/locales/',
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({greeting: 'Hello'}),
    });

    const reference: ILocaleReference = {$ref: 'en-US.json'};
    await loaderWithBase.load('en-US' as TLanguageCode, reference);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cdn.example.com/locales/en-US.json'
    );
  });

  test<LocaleLoaderTestContext>('given network error, when load() called, then throws descriptive error', async context => {
    const {loader, mockFetch} = context;

    mockFetch.mockRejectedValue(new Error('Network error'));

    const reference: ILocaleReference = {$ref: './en-US.json'};

    await expect(
      loader.load('en-US' as TLanguageCode, reference)
    ).rejects.toThrow(/network|failed|en-US\.json/i);
  });
});
