import type {IEventbus} from '@eventbus/types.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {LanguageEventbusAdapter} from '../../../adapters/language-eventbus-adapter.ts';
import type {IEligiusEngine, ILabel, ILanguageManager} from '../../../types.ts';
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';

type AdapterSuiteContext = {
  languageManager: ILanguageManager;
  engine: IEligiusEngine;
  eventbus: IEventbus;
  adapter: LanguageEventbusAdapter;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<AdapterSuiteContext>('LanguageEventbusAdapter', () => {
  beforeEach(context => {
    withContext<AdapterSuiteContext>(context);

    // Create mock language manager
    context.languageManager = {
      language: 'en-US',
      availableLanguages: ['en-US', 'nl-NL'],
      on: vi.fn(() => vi.fn()),
      setLanguage: vi.fn(),
      getLabelCollection: vi.fn((id: string) => {
        if (id === 'greeting') {
          return [{id: '1', languageCode: 'en-US', label: 'Hello'}] as ILabel[];
        }
        return undefined;
      }),
      getLabelCollections: vi.fn((ids: string[]) => {
        return ids.map(id => {
          if (id === 'greeting') {
            return [
              {id: '1', languageCode: 'en-US', label: 'Hello'},
            ] as ILabel[];
          }
          return undefined;
        });
      }),
      destroy: vi.fn(),
    };

    // Create mock engine (needed for engineRoot to set lang attribute)
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
    context.adapter = new LanguageEventbusAdapter(
      context.languageManager,
      context.eventbus,
      context.engine
    );
  });

  describe('constructor', () => {
    test<AdapterSuiteContext>('should create an instance', context => {
      expect(context.adapter).toBeDefined();
    });
  });

  describe('connect()', () => {
    test<AdapterSuiteContext>('should subscribe to language manager events', context => {
      const {adapter, languageManager} = context;

      adapter.connect();

      expect(languageManager.on).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test<AdapterSuiteContext>('should register eventbus listeners', context => {
      const {adapter, eventbus} = context;

      adapter.connect();

      // Command handlers use on()
      expect(eventbus.on).toHaveBeenCalledWith(
        'language-change',
        expect.any(Function)
      );
      // State query responders use onRequest()
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-current-language',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-label-collection',
        expect.any(Function)
      );
      expect(eventbus.onRequest).toHaveBeenCalledWith(
        'request-label-collections',
        expect.any(Function)
      );
    });
  });

  describe('disconnect()', () => {
    test<AdapterSuiteContext>('should remove all listeners', context => {
      const {adapter, languageManager} = context;
      const unsubscribers: Array<() => void> = [];
      (languageManager.on as any).mockImplementation(() => {
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

  describe('eventbus → languageManager command forwarding', () => {
    test<AdapterSuiteContext>('language-change should call languageManager.setLanguage()', context => {
      const {adapter, languageManager, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('language-change', ['nl-NL']);

      expect(languageManager.setLanguage).toHaveBeenCalledWith('nl-NL');
    });

    test<AdapterSuiteContext>('language-change should update DOM lang attribute', context => {
      const {adapter, engine, eventbus} = context;
      adapter.connect();

      eventbus.broadcast('language-change', ['nl-NL']);

      expect((engine.engineRoot as any).attr).toHaveBeenCalledWith(
        'lang',
        'nl'
      );
    });
  });

  describe('eventbus → languageManager state queries', () => {
    test<AdapterSuiteContext>('request-current-language should return languageManager.language', context => {
      const {adapter, eventbus} = context;
      adapter.connect();

      const result = eventbus.request<string>('request-current-language');

      expect(result).toBe('en-US');
    });

    test<AdapterSuiteContext>('request-label-collection should return label collection', context => {
      const {adapter, eventbus, languageManager} = context;
      adapter.connect();

      const result = eventbus.request<ILabel[]>(
        'request-label-collection',
        'greeting'
      );

      expect(languageManager.getLabelCollection).toHaveBeenCalledWith(
        'greeting'
      );
      expect(result).toEqual([
        {id: '1', languageCode: 'en-US', label: 'Hello'},
      ]);
    });

    test<AdapterSuiteContext>('request-label-collections should return multiple label collections', context => {
      const {adapter, eventbus, languageManager} = context;
      adapter.connect();

      const result = eventbus.request<(ILabel[] | undefined)[]>(
        'request-label-collections',
        ['greeting', 'other']
      );

      expect(languageManager.getLabelCollections).toHaveBeenCalledWith([
        'greeting',
        'other',
      ]);
      expect(result).toEqual([
        [{id: '1', languageCode: 'en-US', label: 'Hello'}],
        undefined,
      ]);
    });
  });

  describe('languageManager → eventbus event forwarding', () => {
    test<AdapterSuiteContext>('languageManager change event should broadcast language-change', context => {
      const {adapter, languageManager, eventbus} = context;
      let changeHandler: (language: string, previousLanguage: string) => void =
        () => {};
      (languageManager.on as any).mockImplementation(
        (event: string, handler: any) => {
          if (event === 'change') {
            changeHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      changeHandler('nl-NL', 'en-US');

      expect(eventbus.broadcast).toHaveBeenCalledWith('language-change', [
        'nl-NL',
      ]);
    });

    test<AdapterSuiteContext>('languageManager change event should update DOM lang attribute', context => {
      const {adapter, languageManager, engine} = context;
      let changeHandler: (language: string, previousLanguage: string) => void =
        () => {};
      (languageManager.on as any).mockImplementation(
        (event: string, handler: any) => {
          if (event === 'change') {
            changeHandler = handler;
          }
          return vi.fn();
        }
      );
      adapter.connect();

      changeHandler('de-DE', 'en-US');

      expect((engine.engineRoot as any).attr).toHaveBeenCalledWith(
        'lang',
        'de'
      );
    });
  });
});
