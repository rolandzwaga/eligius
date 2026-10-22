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

  test<LocaleLoaderTestContext>('given root.json whose sibling keys a and b both $ref common.json, when load() is called, then both keys resolve to the common.json data instead of rejecting as circular', async context => {
    const {loader, mockFetch} = context;

    mockFetch.mockImplementation(url => {
      const urlStr = url as string;
      if (urlStr === '/locales/root.json') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              a: {$ref: '/locales/common.json'},
              b: {$ref: '/locales/common.json'},
            }),
        });
      }
      if (urlStr === '/locales/common.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ok: 'OK'}),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`));
    });

    const result = await loader.load('en-US' as TLanguageCode, {
      $ref: '/locales/root.json',
    });

    expect(result.data).toEqual({a: {ok: 'OK'}, b: {ok: 'OK'}});
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test<LocaleLoaderTestContext>('given a diamond where root refs left.json and right.json and both ref common.json, when load() is called, then it resolves without a circular reference error', async context => {
    const {loader, mockFetch} = context;

    const files: Record<string, TLocaleData> = {
      '/locales/root.json': {
        left: {$ref: '/locales/left.json'},
        right: {$ref: '/locales/right.json'},
      },
      '/locales/left.json': {shared: {$ref: '/locales/common.json'}},
      '/locales/right.json': {nested: {shared: {$ref: '/locales/common.json'}}},
      '/locales/common.json': {word: 'Common'},
    };
    mockFetch.mockImplementation(url => {
      const data = files[url as string];
      if (!data) {
        return Promise.reject(new Error(`Unknown URL: ${url}`));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      });
    });

    const result = await loader.load('en-US' as TLanguageCode, {
      $ref: '/locales/root.json',
    });

    expect(result.data).toEqual({
      left: {shared: {word: 'Common'}},
      right: {nested: {shared: {word: 'Common'}}},
    });
  });

  test<LocaleLoaderTestContext>('given a file with nested $refs, when load() is called, then the fetched data is not mutated by $ref resolution', async context => {
    const {loader, mockFetch} = context;

    const rootData = {child: {$ref: '/locales/child.json'}};
    mockFetch.mockImplementation(url => {
      const urlStr = url as string;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            urlStr === '/locales/root.json' ? rootData : {word: 'Child'}
          ),
      });
    });

    const result = await loader.load('en-US' as TLanguageCode, {
      $ref: '/locales/root.json',
    });

    expect(result.data).toEqual({child: {word: 'Child'}});
    expect(rootData).toEqual({child: {$ref: '/locales/child.json'}});
  });

  test('given LocaleLoader constructed without a fetch option and a global fetch that rejects non-global receivers, when load() is called, then it resolves with the fetched locale data', async () => {
    const globalFetch = vi.fn(function (this: unknown, _url: string) {
      if (this !== undefined && this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({greeting: 'Hello'}),
      });
    });
    vi.stubGlobal('fetch', globalFetch);
    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
    const defaultLoader = new LocaleLoader();

    const result = await defaultLoader.load('en-US' as TLanguageCode, {
      $ref: './en-US.json',
    });

    expect(result.data).toEqual({greeting: 'Hello'});
    expect(globalFetch).toHaveBeenCalledWith('./en-US.json');
  });

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

  // =========================================================================
  // URL normalisation: cycle detection and cache across spellings
  // =========================================================================

  /**
   * Serves `files` by exact URL. Stops after 20 fetches so a runaway
   * resolution fails the test instead of hanging it.
   */
  function serveFiles(mockFetch: MockFetch, files: Record<string, unknown>) {
    mockFetch.mockImplementation(requested => {
      const url = requested as string;
      if (mockFetch.mock.calls.length > 20) {
        return Promise.reject(new Error(`runaway fetching: ${url}`));
      }
      if (!Object.hasOwn(files, url)) {
        return Promise.resolve({ok: false, status: 404, statusText: url});
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(structuredClone(files[url])),
      });
    });
  }

  test<LocaleLoaderTestContext>("given locales/en/a.json refs '../shared/b.json' and locales/shared/b.json refs '../en/a.json', when load() is called, then it rejects with a circular reference error instead of fetching without end", async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {
      'locales/en/a.json': {x: {$ref: '../shared/b.json'}},
      'locales/shared/b.json': {y: {$ref: '../en/a.json'}},
    });

    await expect(
      loader.load('en-US' as TLanguageCode, {$ref: 'locales/en/a.json'})
    ).rejects.toThrow(/circular reference detected: locales\/en\/a\.json/i);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'locales/shared/b.json');
  });

  test<LocaleLoaderTestContext>("given a file that refs './self.json', when load() is called, then it rejects with a circular reference error", async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {
      './locales/self.json': {me: {$ref: './self.json'}},
    });

    await expect(
      loader.load('en-US' as TLanguageCode, {$ref: './locales/self.json'})
    ).rejects.toThrow(/circular reference detected/i);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test<LocaleLoaderTestContext>('given one file reached through two spellings, when load() is called, then it is fetched only once and both keys get its data', async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {
      '/locales/root.json': {
        a: {$ref: './shared/x.json'},
        b: {$ref: 'other/../shared/./x.json'},
      },
      '/locales/shared/x.json': {word: 'X'},
    });

    const result = await loader.load('en-US' as TLanguageCode, {
      $ref: '/locales/root.json',
    });

    expect(result.data).toEqual({a: {word: 'X'}, b: {word: 'X'}});
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith('/locales/shared/x.json');
  });

  test<LocaleLoaderTestContext>("given root refs './en.json' and 'en.json' for two locales, when loadAll() is called, then the file is fetched once", async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {'./en.json': {hi: 'Hi'}});

    const results = await loader.loadAll(
      new Map<TLanguageCode, ILocaleReference>([
        ['en-US' as TLanguageCode, {$ref: './en.json'}],
        ['en-GB' as TLanguageCode, {$ref: 'en.json'}],
      ])
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results.map(r => r.data)).toEqual([{hi: 'Hi'}, {hi: 'Hi'}]);
  });

  test<LocaleLoaderTestContext>("given an absolute parent URL and a '../' ref, when load() is called, then the nested URL is normalised", async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {
      'https://cdn.example.com/locales/en/a.json': {
        x: {$ref: '../shared/b.json'},
      },
      'https://cdn.example.com/locales/shared/b.json': {word: 'B'},
    });

    const result = await loader.load('en-US' as TLanguageCode, {
      $ref: 'https://cdn.example.com/locales/en/a.json',
    });

    expect(result.data).toEqual({x: {word: 'B'}});
  });

  test<LocaleLoaderTestContext>("given a baseUrl and a root ref starting with '../', when load() is called, then the URL is resolved against the baseUrl", async context => {
    const {mockFetch} = context;
    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
    const loaderWithBase = new LocaleLoader({
      fetch: mockFetch as typeof fetch,
      baseUrl: 'https://cdn.example.com/app/locales',
    });
    serveFiles(mockFetch, {
      'https://cdn.example.com/app/shared/en.json': {hi: 'Hi'},
    });

    const result = await loaderWithBase.load('en-US' as TLanguageCode, {
      $ref: '../shared/en.json',
    });

    expect(result.data).toEqual({hi: 'Hi'});
  });

  // =========================================================================
  // Payload shape
  // =========================================================================

  test.each([
    ['null', null],
    ['array', ['a', 'b']],
    ['string', 'oops'],
    ['number', 42],
  ])(
    'given a locale file whose JSON body is %s, when LocaleLoader.load() is called, then it rejects with an error naming the file and saying it must contain a JSON object',
    async (kind, body) => {
      const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
      const mockFetch: MockFetch = vi.fn();
      serveFiles(mockFetch, {'./en-US.json': body});
      const loader = new LocaleLoader({fetch: mockFetch as typeof fetch});

      await expect(
        loader.load('en-US' as TLanguageCode, {$ref: './en-US.json'})
      ).rejects.toThrow(
        new RegExp(
          `'\\./en-US\\.json' must contain a JSON object, got ${kind === 'null' ? 'null' : kind}`
        )
      );
    }
  );

  test<LocaleLoaderTestContext>('given a nested $ref file whose JSON body is null, when load() is called, then the error names the nested file', async context => {
    const {loader, mockFetch} = context;
    serveFiles(mockFetch, {
      '/locales/root.json': {nav: {$ref: './nav.json'}},
      '/locales/nav.json': null,
    });

    await expect(
      loader.load('en-US' as TLanguageCode, {$ref: '/locales/root.json'})
    ).rejects.toThrow(/'\/locales\/nav\.json' must contain a JSON object/);
  });

  // =========================================================================
  // Timeout and abort
  // =========================================================================

  test('given timeoutMs and a fetch that never settles, when load() is called, then it rejects with a timeout error naming the file', async () => {
    vi.useFakeTimers();
    try {
      const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
      const mockFetch: MockFetch = vi.fn(() => new Promise(() => {}));
      const loader = new LocaleLoader({
        fetch: mockFetch as typeof fetch,
        timeoutMs: 5000,
      });

      const loading = loader.load('en-US' as TLanguageCode, {
        $ref: './en-US.json',
      });
      const assertion = expect(loading).rejects.toThrow(
        "[LocaleLoader] Timed out loading locale file './en-US.json' after 5000 ms"
      );
      await vi.advanceTimersByTimeAsync(5000);
      await assertion;

      const init = mockFetch.mock.calls[0][1] as RequestInit;
      expect(init.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  test('given timeoutMs and a fetch that settles in time, when load() is called, then it resolves and the timer is cleared', async () => {
    vi.useFakeTimers();
    try {
      const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
      const mockFetch: MockFetch = vi.fn();
      serveFiles(mockFetch, {'./en-US.json': {hi: 'Hi'}});
      const loader = new LocaleLoader({
        fetch: mockFetch as typeof fetch,
        timeoutMs: 5000,
      });

      const result = await loader.load('en-US' as TLanguageCode, {
        $ref: './en-US.json',
      });

      expect(result.data).toEqual({hi: 'Hi'});
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('given a signal option, when the signal is aborted during a stalled fetch, then load() rejects naming the file and the fetch receives an aborted signal', async () => {
    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
    const mockFetch: MockFetch = vi.fn(() => new Promise(() => {}));
    const controller = new AbortController();
    const loader = new LocaleLoader({
      fetch: mockFetch as typeof fetch,
      signal: controller.signal,
    });

    const loading = loader.load('en-US' as TLanguageCode, {
      $ref: './en-US.json',
    });
    controller.abort();

    await expect(loading).rejects.toThrow(
      "[LocaleLoader] Loading locale file './en-US.json' was aborted"
    );
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.signal?.aborted).toBe(true);
  });

  test('given an already aborted signal, when load() is called, then it rejects without waiting for the fetch', async () => {
    const {LocaleLoader} = await import('../../../locale/locale-loader.ts');
    const mockFetch: MockFetch = vi.fn(() => new Promise(() => {}));
    const loader = new LocaleLoader({
      fetch: mockFetch as typeof fetch,
      signal: AbortSignal.abort(),
    });

    await expect(
      loader.load('en-US' as TLanguageCode, {$ref: './en-US.json'})
    ).rejects.toThrow(/was aborted/);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'given timeoutMs %s, when LocaleLoader is constructed, then it throws',
    async timeoutMs => {
      const {LocaleLoader} = await import('../../../locale/locale-loader.ts');

      expect(() => new LocaleLoader({fetch: vi.fn(), timeoutMs})).toThrow(
        /\[LocaleLoader\] timeoutMs/
      );
    }
  );
});

describe('LocaleLoader failed responses', () => {
  test('given a 500 response whose body is an HTML error page, when load() is called, then it rejects with the status and the file name without parsing the body', async () => {
    // given
    const {LocaleLoader} = await import('@locale/locale-loader.ts');
    const json = vi.fn(() =>
      Promise.reject(new SyntaxError("Unexpected token '<'"))
    );
    const mockFetch: MockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json,
      })
    );
    const loader = new LocaleLoader({fetch: mockFetch as typeof fetch});

    // test
    const result = loader.load('en-US' as TLanguageCode, {
      $ref: './en-US.json',
    });

    // expect
    await expect(result).rejects.toThrow(
      "[LocaleLoader] Failed to load locale file './en-US.json': 500 Internal Server Error"
    );
    expect(json).not.toHaveBeenCalled();
  });

  test('given two concurrent loads of the same file and a fetch that rejects, when both settle, then the file is fetched once, both reject naming it, and a later load fetches it again', async () => {
    // given
    const {LocaleLoader} = await import('@locale/locale-loader.ts');
    let rejectFetch: (error: Error) => void = () => {};
    const mockFetch: MockFetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFetch = reject;
          })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({greeting: 'Hello'}),
      });
    const loader = new LocaleLoader({fetch: mockFetch as typeof fetch});

    // test
    const first = loader.load('en-US' as TLanguageCode, {$ref: './en-US.json'});
    const second = loader.load('en-GB' as TLanguageCode, {
      $ref: 'en-US.json',
    });
    // Let both loads reach the shared fetch before it fails.
    await Promise.resolve();
    rejectFetch(new TypeError('Failed to fetch'));

    // expect
    await expect(first).rejects.toThrow(
      "[LocaleLoader] Failed to load locale file './en-US.json': Failed to fetch"
    );
    await expect(second).rejects.toThrow(
      "[LocaleLoader] Failed to load locale file './en-US.json': Failed to fetch"
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const retry = await loader.load('en-US' as TLanguageCode, {
      $ref: './en-US.json',
    });
    expect(retry.data).toEqual({greeting: 'Hello'});
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
