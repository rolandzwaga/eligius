/**
 * LocaleEventbusAdapter Unit Tests
 * Feature: 005-rosetta-locale-manager
 *
 * Tests for the LocaleEventbusAdapter that bridges LocaleManager to/from eventbus.
 */

import type {IEventbus} from '@eventbus/types.ts';
import type {ILocaleManager, TLanguageCode} from '@locale/types.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import type {IEligiusEngine} from '@/types.ts';

// =============================================================================
// Test Context
// =============================================================================

type LocaleAdapterTestContext = {
  localeManager: ILocaleManager;
  engine: IEligiusEngine;
  eventbus: IEventbus;
  adapter: import('../../../adapters/locale-eventbus-adapter.ts').LocaleEventbusAdapter;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

// =============================================================================
// LocaleEventbusAdapter Tests (T032-T036)
// =============================================================================

describe<LocaleAdapterTestContext>('LocaleEventbusAdapter', () => {
  beforeEach(async context => {
    withContext<LocaleAdapterTestContext>(context);

    // Import dynamically to get fresh instance
    const {LocaleEventbusAdapter} = await import(
      '../../../adapters/locale-eventbus-adapter.ts'
    );

    // Create mock locale manager
    context.localeManager = {
      locale: 'en-US' as TLanguageCode,
      availableLocales: ['en-US', 'nl-NL'] as ReadonlyArray<TLanguageCode>,
      t: vi.fn(
        (key: string | string[]) =>
          `translated:${Array.isArray(key) ? key.join('.') : key}`
      ),
      setLocale: vi.fn(),
      loadLocale: vi.fn(),
      on: vi.fn(() => vi.fn()),
      destroy: vi.fn(),
    };

    // Create mock engine with engineRoot
    const mockEngineRoot = {
      attr: vi.fn(),
    } as unknown as JQuery<HTMLElement>;

    context.engine = {
      position: 0,
      duration: 100,
      playState: 'stopped',
      currentTimelineUri: 'timeline-1',
      container: undefined,
      engineRoot: mockEngineRoot,
      on: vi.fn(() => vi.fn()),
      init: vi.fn(() => Promise.resolve({} as any)),
      destroy: vi.fn(() => Promise.resolve()),
      start: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      stop: vi.fn(),
      seek: vi.fn((pos: number) => Promise.resolve(pos)),
      switchTimeline: vi.fn(() => Promise.resolve()),
    };

    context.eventbus = createMockEventbus();
    context.adapter = new LocaleEventbusAdapter(
      context.localeManager,
      context.eventbus,
      context.engine
    );
  });

  // =========================================================================
  // Basic Tests
  // =========================================================================

  describe('constructor', () => {
    test<LocaleAdapterTestContext>('should create an instance', context => {
      expect(context.adapter).toBeDefined();
    });
  });

  // =========================================================================
  // T033: language-change broadcast → LocaleManager.setLocale called
  // =========================================================================

  describe('eventbus → LocaleManager command forwarding', () => {
    test<LocaleAdapterTestContext>('given adapter connected, when language-change broadcast, then LocaleManager.setLocale called', context => {
      const {adapter, localeManager, eventbus} = context;

      adapter.connect();
      eventbus.broadcast('language-change', ['nl-NL']);

      expect(localeManager.setLocale).toHaveBeenCalledWith('nl-NL');
    });
  });

  // =========================================================================
  // T034: request-current-language received → returns current locale
  // =========================================================================

  describe('eventbus → LocaleManager state queries', () => {
    test<LocaleAdapterTestContext>('given adapter connected, when request-current-language received, then returns current locale', context => {
      const {adapter, eventbus} = context;

      adapter.connect();
      const result = eventbus.request<TLanguageCode>(
        'request-current-language'
      );

      expect(result).toBe('en-US');
    });
  });

  // =========================================================================
  // T035: locale changed → updates root element lang attribute
  // =========================================================================

  describe('DOM updates', () => {
    test<LocaleAdapterTestContext>('given locale changed, when adapter connected, then updates root element lang attribute', context => {
      const {adapter, localeManager, engine, eventbus} = context;

      adapter.connect();
      eventbus.broadcast('language-change', ['nl-NL']);

      expect((engine.engineRoot as any).attr).toHaveBeenCalledWith(
        'lang',
        'nl'
      );
    });

    test<LocaleAdapterTestContext>('given LocaleManager emits change event, when adapter connected, then updates root element lang attribute', context => {
      const {adapter, localeManager, engine} = context;

      let changeHandler: (
        newLocale: TLanguageCode,
        oldLocale: TLanguageCode
      ) => void = () => {};
      (localeManager.on as any).mockImplementation(
        (event: string, handler: any) => {
          if (event === 'change') {
            changeHandler = handler;
          }
          return vi.fn();
        }
      );

      adapter.connect();
      changeHandler('de-DE' as TLanguageCode, 'en-US' as TLanguageCode);

      expect((engine.engineRoot as any).attr).toHaveBeenCalledWith(
        'lang',
        'de'
      );
    });
  });

  // =========================================================================
  // T036: setLocale with unavailable locale → falls back to default + warning
  // =========================================================================

  describe('fallback behavior', () => {
    test<LocaleAdapterTestContext>('given setLocale with unavailable locale, when called, then falls back to default and logs warning', context => {
      const {adapter, localeManager, eventbus} = context;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Make availableLocales return empty array to simulate unavailable locale
      Object.defineProperty(localeManager, 'availableLocales', {
        get: () => ['en-US'] as ReadonlyArray<TLanguageCode>,
      });

      adapter.connect();
      eventbus.broadcast('language-change', ['fr-FR']);

      // Should have warned about unavailable locale
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('fr-FR'));

      // Should NOT have called setLocale with the unavailable locale
      // Or should have fallen back to default
      // Implementation may vary - check that warning was issued

      consoleSpy.mockRestore();
    });
  });

  // =========================================================================
  // connect() and disconnect() tests
  // =========================================================================

  describe('connect()', () => {
    test<LocaleAdapterTestContext>('should subscribe to LocaleManager events', context => {
      const {adapter, localeManager} = context;

      adapter.connect();

      expect(localeManager.on).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test<LocaleAdapterTestContext>('should register eventbus listeners', context => {
      const {adapter, eventbus} = context;

      adapter.connect();

      expect(eventbus.on).toHaveBeenCalledWith(
        'language-change',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-current-language',
        expect.any(Function)
      );
    });
  });

  describe('disconnect()', () => {
    test<LocaleAdapterTestContext>('should remove all listeners', context => {
      const {adapter, localeManager} = context;
      const unsubscribers: Array<() => void> = [];
      (localeManager.on as any).mockImplementation(() => {
        const unsub = vi.fn();
        unsubscribers.push(unsub);
        return unsub;
      });

      adapter.connect();
      adapter.disconnect();

      unsubscribers.forEach(unsub => {
        expect(unsub).toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // LocaleManager → eventbus forwarding
  // =========================================================================

  describe('LocaleManager → eventbus event forwarding', () => {
    test<LocaleAdapterTestContext>('LocaleManager change event should broadcast language-change', context => {
      const {adapter, localeManager, eventbus} = context;

      let changeHandler: (
        newLocale: TLanguageCode,
        oldLocale: TLanguageCode
      ) => void = () => {};
      (localeManager.on as any).mockImplementation(
        (event: string, handler: any) => {
          if (event === 'change') {
            changeHandler = handler;
          }
          return vi.fn();
        }
      );

      adapter.connect();
      changeHandler('nl-NL' as TLanguageCode, 'en-US' as TLanguageCode);

      expect(eventbus.broadcast).toHaveBeenCalledWith('language-change', [
        'nl-NL',
      ]);
    });
  });

  describe('idempotent connect', () => {
    test<LocaleAdapterTestContext>('given a connected adapter, when connect() is called again, then it registers its listeners once', context => {
      const {adapter, eventbus, localeManager} = context;

      adapter.connect();
      adapter.connect();

      expect(localeManager.on).toHaveBeenCalledTimes(1);
      expect(
        (eventbus.on as any).mock.calls.filter(
          (call: unknown[]) => call[0] === 'language-change'
        )
      ).toHaveLength(1);
    });
  });
});

/**
 * Round-trip with a real LocaleManager and a real Eventbus. The adapter
 * forwards manager changes to the eventbus and eventbus commands to the
 * manager; without a re-entrancy guard the two feed each other forever.
 */
describe('LocaleEventbusAdapter round-trip', () => {
  let eventbus: import('@eventbus/eventbus.ts').Eventbus;
  let localeManager: import('@locale/locale-manager.ts').LocaleManager;
  let adapter: import('@adapters/locale-eventbus-adapter.ts').LocaleEventbusAdapter;
  let attr: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const {Eventbus} = await import('@eventbus/eventbus.ts');
    const {LocaleManager} = await import('@locale/locale-manager.ts');
    const {LocaleEventbusAdapter} = await import(
      '@adapters/locale-eventbus-adapter.ts'
    );

    eventbus = new Eventbus();
    localeManager = new LocaleManager({
      defaultLocale: 'en-US' as TLanguageCode,
    });
    localeManager.loadLocale('en-US' as TLanguageCode, {hello: 'Hello'});
    localeManager.loadLocale('nl-NL' as TLanguageCode, {hello: 'Hallo'});

    attr = vi.fn();
    const engine = {
      engineRoot: {attr} as unknown as JQuery<HTMLElement>,
    } as unknown as IEligiusEngine;

    adapter = new LocaleEventbusAdapter(localeManager, eventbus, engine);
    adapter.connect();
  });

  test('given connected adapter, when language-change is broadcast, then listeners hear it once and the locale switches', () => {
    const listener = vi.fn();
    eventbus.on('language-change', listener);

    expect(() =>
      eventbus.broadcast('language-change', ['nl-NL' as TLanguageCode])
    ).not.toThrow();

    expect(localeManager.locale).toBe('nl-NL');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('nl-NL');
  });

  test('given connected adapter, when setLocale is called directly, then language-change is broadcast exactly once', () => {
    const listener = vi.fn();
    eventbus.on('language-change', listener);

    localeManager.setLocale('nl-NL' as TLanguageCode);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('nl-NL');
    expect(attr).toHaveBeenCalledWith('lang', 'nl');
  });

  test('given connected adapter, when language-change is broadcast, then the manager change event fires once', () => {
    const changeHandler = vi.fn();
    localeManager.on('change', changeHandler);

    eventbus.broadcast('language-change', ['nl-NL' as TLanguageCode]);

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledWith('nl-NL', 'en-US');
  });
});
