import {LottieController} from '@controllers/lottie-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import type {LottiePlayer} from 'lottie-web';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// One shared lottie-web module object, so a test that swaps the mock with
// vi.doMock can restore exactly the same module afterwards.
const lottieMock = vi.hoisted(() => {
  const mockAnimationItem = {
    destroy: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    goToAndStop: vi.fn(),
    playSegments: vi.fn(),
    addEventListener: vi.fn(),
    timeCompleted: 100,
  };

  const MockLottie = {
    loadAnimation: vi.fn(() => mockAnimationItem),
  };

  return {
    MockLottie,
    factory: () => ({default: MockLottie}),
  };
});

// LottieController loads lottie-web with a dynamic import(); vi.mock covers it
vi.mock('lottie-web', lottieMock.factory);

const lottie = lottieMock.MockLottie as unknown as LottiePlayer;

/**
 * Creates a mock eventbus with common request implementations for language and label handling.
 * This helper reduces setup duplication across tests that need label/language functionality.
 */
function createLottieTestEventbus(
  config: {
    language?: string;
    labelCollections?: Array<Array<{code: string; label: string}>>;
  } = {}
) {
  const mockEventbus = createMockEventbus();
  const {
    language = 'en-US',
    labelCollections = [[{code: 'en-US', label: 'Test'}]],
  } = config;

  (mockEventbus.broadcast as any).mockImplementation(
    (eventName: string, args?: any[]) => {
      if (eventName === 'request-label-collections' && args) {
        args[1].labelCollections = labelCollections;
      }
      if (eventName === 'request-current-language' && args) {
        args[0].language = language;
      }
    }
  );

  return mockEventbus;
}

describe('LottieController', () => {
  let controller: LottieController;
  let mockEventbus: IEventbus;
  let mockElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new LottieController();
    mockEventbus = createMockEventbus();
    mockElement = createMockJQueryElement();
  });

  const createOperationData = () => ({
    selectedElement: mockElement,
    renderer: {className: 'svg'},
    loop: false,
    autoplay: true,
    animationData: {v: '5.0.0'},
    json: null,
    labelIds: [] as string[],
    viewBox: '',
    iefallback: null,
    url: 'animation.json',
  });

  describe('init', () => {
    it('should initialize with animation data', () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', fr: 30},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);

      expect(controller.operationData).toBeDefined();
      expect(controller.serializedData).toContain('5.0.0');
    });

    it('should parse URL with freeze and end positions', () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation[freeze=10,end=50].json',
      };

      controller.init(operationData);

      expect(controller.freezePosition).toBe(10);
      expect(controller.endPosition).toBe(50);
    });

    it('should serialize JSON data when provided', () => {
      const jsonData = {v: '5.0.0', layers: []};
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: null,
        json: jsonData,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);

      expect(controller.serializedData).toBe(JSON.stringify(jsonData));
    });

    it('should serialize IE fallback data when provided', () => {
      const ieFallbackData = {v: '4.0.0', layers: []};
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: ieFallbackData,
        url: 'animation.json',
      };

      controller.init(operationData);

      expect(controller.serializedIEData).toBe(JSON.stringify(ieFallbackData));
    });
  });

  describe('attach', () => {
    it('should load animation via lottie-web', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', fr: 30},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      expect(controller.animationItem).toBeDefined();
      expect(controller.animationItem).not.toBeNull();
    });

    it('should request current language when labelIds provided', async () => {
      // Setup mock eventbus to provide request responses
      (mockEventbus.request as any).mockImplementation((eventName: string) => {
        if (eventName === 'request-current-language') {
          return 'en-US';
        }
        if (eventName === 'request-label-collections') {
          return [[{languageCode: 'en-US', label: 'Test'}]];
        }
        return undefined;
      });

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      // Pre-initialize labelData structure
      controller.labelData = {label1: {}};

      controller.init(operationData);
      await controller.attach(mockEventbus);

      expect(mockEventbus.request).toHaveBeenCalledWith(
        'request-current-language'
      );
    });

    it('should register language change listener when labelIds provided', async () => {
      // Setup mock eventbus
      const mockBroadcast = mockEventbus.broadcast as any;
      mockBroadcast.mockImplementation((eventName: string, args?: any[]) => {
        if (eventName === 'request-label-collections' && args) {
          args[1].labelCollections = [[{code: 'en-US', label: 'Test'}]];
        }
        if (eventName === 'request-current-language' && args) {
          args[0].language = 'en-US';
        }
      });

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      // Pre-initialize labelData structure
      controller.labelData = {label1: {}};

      controller.init(operationData);
      await controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'language-change',
        expect.any(Function)
      );
    });

    it('should handle missing operationData gracefully', async () => {
      await expect(controller.attach(mockEventbus)).resolves.toBeUndefined();
      expect(lottie.loadAnimation).not.toHaveBeenCalled();
    });

    it('given an initialised controller, when attach is called, then it returns a promise and the animation exists once it resolves', async () => {
      controller.init(createOperationData());

      const result = controller.attach(mockEventbus);

      expect(result).toBeInstanceOf(Promise);
      await result;
      expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
      expect(controller.animationItem).not.toBeNull();
    });

    it('given attach has not resolved yet, when detach is called, then no animation is created and no listeners are registered', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      controller.init({
        ...createOperationData(),
        labelIds: ['title'],
      });

      const pending = controller.attach(mockEventbus);
      controller.detach(mockEventbus);
      await pending;

      expect(lottie.loadAnimation).not.toHaveBeenCalled();
      expect(controller.animationItem).toBeNull();
      expect((controller as any).eventListeners).toHaveLength(0);
    });
  });

  describe('lazy lottie-web loading', () => {
    const importFreshController = async () => {
      vi.resetModules();
      const module = await import('@controllers/lottie-controller.ts');
      return module.LottieController;
    };

    const restoreLottieMock = () => {
      vi.doMock('lottie-web', lottieMock.factory);
      vi.resetModules();
    };

    it('given the lottie-controller module is imported, when no controller has attached, then lottie-web is not loaded', async () => {
      const factory = vi.fn(lottieMock.factory);
      vi.doMock('lottie-web', factory);
      try {
        const FreshController = await importFreshController();
        expect(factory).not.toHaveBeenCalled();

        const freshController = new FreshController();
        freshController.init(createOperationData());
        await freshController.attach(mockEventbus);

        expect(factory).toHaveBeenCalledTimes(1);
        expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
      } finally {
        restoreLottieMock();
      }
    });

    it('given lottie-web was loaded once, when a second controller attaches, then lottie-web is not imported again', async () => {
      const factory = vi.fn(lottieMock.factory);
      vi.doMock('lottie-web', factory);
      try {
        const FreshController = await importFreshController();
        const first = new FreshController();
        first.init(createOperationData());
        await first.attach(mockEventbus);
        vi.doMock('lottie-web', () => {
          throw new Error('lottie-web must not be imported twice');
        });

        const second = new FreshController();
        second.init(createOperationData());
        await second.attach(mockEventbus);

        expect(factory).toHaveBeenCalledTimes(1);
        expect(lottie.loadAnimation).toHaveBeenCalledTimes(2);
      } finally {
        restoreLottieMock();
      }
    });

    it('given lottie-web is not installed, when attach is called, then it rejects with an error naming the lottie-web peer dependency', async () => {
      vi.doMock('lottie-web', () => {
        throw new Error("Cannot find package 'lottie-web'");
      });
      try {
        const FreshController = await importFreshController();
        const freshController = new FreshController();
        freshController.init(createOperationData());

        await expect(freshController.attach(mockEventbus)).rejects.toThrow(
          /LottieController requires the optional peer dependency 'lottie-web'/
        );
        expect(freshController.animationItem).toBeNull();
      } finally {
        restoreLottieMock();
      }
    });

    it('given an initialised LottieController with animationData, when attach is called, then lottie.loadAnimation is called exactly once and the created animation item is not destroyed', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation[freeze=10,end=50].json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
      expect(controller.animationItem!.destroy).not.toHaveBeenCalled();
      expect(controller.animationItem!.playSegments).toHaveBeenCalledTimes(1);
    });

    it('given a controller that was detached, when attach is called again, then a new animation is loaded', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: true,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);
      controller.detach(mockEventbus);
      await controller.attach(mockEventbus);

      expect(lottie.loadAnimation).toHaveBeenCalledTimes(2);
      expect(controller.animationItem).not.toBeNull();
    });
  });

  describe('detach', () => {
    it('should destroy animation item when no endPosition set', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      const animationItem = controller.animationItem!;
      const destroySpy = vi.spyOn(animationItem, 'destroy');
      const playSegmentsSpy = vi.spyOn(animationItem, 'playSegments');

      controller.detach(mockEventbus);

      expect(destroySpy).toHaveBeenCalled();
      expect(playSegmentsSpy).not.toHaveBeenCalled();
      expect(controller.animationItem).toBeNull();
    });

    it('given a looping animation with a url without [freeze,end], when attach then detach are called, then the animation item is destroyed immediately', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: true,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      const animationItem = controller.animationItem!;
      const destroySpy = vi.spyOn(animationItem, 'destroy');
      const playSegmentsSpy = vi.spyOn(animationItem, 'playSegments');

      controller.detach(mockEventbus);

      expect(controller.endPosition).toBe(-1);
      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(playSegmentsSpy).not.toHaveBeenCalled();
      expect(controller.animationItem).toBeNull();
    });

    it('given a looping animation with [freeze,end] in the url, when detach is called, then the animation item is destroyed immediately because it would never complete', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: true,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation[freeze=10,end=50].json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      const animationItem = controller.animationItem!;
      const destroySpy = vi.spyOn(animationItem, 'destroy');
      const playSegmentsSpy = vi.spyOn(animationItem, 'playSegments');
      // attach plays the [0, freeze] segment; only detach's calls matter here
      playSegmentsSpy.mockClear();

      controller.detach(mockEventbus);

      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(playSegmentsSpy).not.toHaveBeenCalled();
    });

    it('given a url with only a freeze position, when detach is called, then the animation plays out to its natural end and is destroyed on complete', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation[freeze=10].json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      const animationItem = controller.animationItem!;
      const destroySpy = vi.spyOn(animationItem, 'destroy');
      const playSegmentsSpy = vi.spyOn(animationItem, 'playSegments');
      const addEventListenerSpy = vi.spyOn(animationItem, 'addEventListener');

      controller.detach(mockEventbus);

      // timeCompleted of the mocked animation item is 100
      expect(playSegmentsSpy).toHaveBeenCalledWith([10, 100], true);
      expect(destroySpy).not.toHaveBeenCalled();

      const completeHandler = addEventListenerSpy.mock.calls.find(
        ([name]) => name === 'complete'
      )?.[1] as () => void;
      completeHandler();

      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(controller.animationItem).toBeNull();
    });

    it('should play end segment when endPosition is set', async () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation[freeze=0,end=50].json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      const playSegmentsSpy = vi.spyOn(
        controller.animationItem!,
        'playSegments'
      );

      controller.detach(mockEventbus);

      expect(playSegmentsSpy).toHaveBeenCalledWith([0, 50], true);
    });

    it('should call unsubscribe functions returned from event registration', async () => {
      // Use helper for eventbus setup
      const testEventbus = createLottieTestEventbus();

      // Track unsubscribe functions returned from on() calls
      const unsubscribeFns: Array<ReturnType<typeof vi.fn>> = [];
      (testEventbus.on as any).mockImplementation(() => {
        const unsubscribe = vi.fn();
        unsubscribeFns.push(unsubscribe);
        return unsubscribe;
      });

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.labelData = {label1: {}};
      controller.init(operationData);
      await controller.attach(testEventbus);

      // Verify event listeners were registered
      expect(testEventbus.on).toHaveBeenCalled();
      const registeredCount = unsubscribeFns.length;
      expect(registeredCount).toBeGreaterThan(0);

      controller.detach(testEventbus);

      // Verify all unsubscribe functions were called during detach
      const calledUnsubscribes = unsubscribeFns.filter(
        fn => fn.mock.calls.length > 0
      );
      expect(calledUnsubscribes.length).toBe(registeredCount);
    });
  });

  describe('label replacement', () => {
    it('should replace label placeholders with current language text', async () => {
      const testEventbus = createLottieTestEventbus({
        language: 'en-US',
        labelCollections: [[{code: 'en-US', label: 'Hello'}]],
      });

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.labelData = {label1: {}};
      controller.init(operationData);
      await controller.attach(testEventbus);

      // Animation should be created with replaced text
      expect(controller.animationItem).toBeDefined();
    });

    it('should set currentLanguage on attach when labelIds provided', async () => {
      const testEventbus = createLottieTestEventbus({language: 'en-US'});

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.labelData = {label1: {'en-US': 'Hello'}};
      controller.init(operationData);
      await controller.attach(testEventbus);

      expect(controller.currentLanguage).toBe('en-US');
    });

    it('should update currentLanguage when language-change event fires', async () => {
      // Capture the language-change handler when registered
      let languageChangeHandler: ((newLanguage: string) => void) | null = null;
      const testEventbus = createLottieTestEventbus({language: 'en-US'});
      (testEventbus.on as any).mockImplementation(
        (eventName: string, handler: any) => {
          if (eventName === 'language-change') {
            languageChangeHandler = handler;
          }
          return vi.fn(); // Return unsubscribe function
        }
      );

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0', text: '!!label1!!'},
        json: null,
        labelIds: ['label1'],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      controller.labelData = {
        label1: {'en-US': 'Hello', 'nl-NL': 'Hallo'},
      };
      controller.init(operationData);
      await controller.attach(testEventbus);

      // Verify handler was captured
      expect(languageChangeHandler).not.toBeNull();

      // Simulate language change event
      languageChangeHandler!('nl-NL');

      expect(controller.currentLanguage).toBe('nl-NL');
    });

    const createLabelOperationData = (labelIds: string[], text: string) => ({
      selectedElement: mockElement,
      renderer: {className: 'svg'},
      loop: false,
      autoplay: true,
      animationData: {v: '5.0.0', text},
      json: null,
      labelIds,
      viewBox: '',
      iefallback: null,
      url: 'animation.json',
    });

    const lastAnimationData = () =>
      vi.mocked(lottie.loadAnimation).mock.calls.at(-1)?.[0] as any;

    it('given a request-label-collections responder and no pre-seeded labelData, when attach is called, then it does not throw and the placeholder is replaced', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      mockEventbus.onRequest('request-label-collections', () => [
        [{code: 'en-US', label: 'Hi'}],
      ]);

      controller.init(createLabelOperationData(['title'], '!!title!!'));

      await expect(controller.attach(mockEventbus)).resolves.toBeUndefined();
      expect(lastAnimationData().animationData.text).toBe('Hi');
    });

    it('given no label collections but a request-translation responder, when attach is called, then the placeholder is replaced with the translation', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      mockEventbus.onRequest('request-translation', (key: string) =>
        key === 'title' ? 'Hallo' : ''
      );

      controller.init(
        createLabelOperationData(['title', 'missing'], '!!title!! !!missing!!')
      );
      await controller.attach(mockEventbus);

      expect(lastAnimationData().animationData.text).toBe('Hallo !!missing!!');
    });

    it('given a translation that contains quotes and backslashes, when attach is called, then the animation data stays valid JSON', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      mockEventbus.onRequest('request-translation', () => 'Say "hi" \\o/');

      controller.init(createLabelOperationData(['title'], '!!title!!'));
      await controller.attach(mockEventbus);

      expect(lastAnimationData().animationData.text).toBe('Say "hi" \\o/');
    });

    it('given a language-change, when the animation is recreated, then the translation for the new language is used', async () => {
      let language = 'en-US';
      mockEventbus.onRequest('request-current-language', () => language);
      mockEventbus.onRequest('request-translation', () =>
        language === 'en-US' ? 'Hello' : 'Hallo'
      );

      controller.init(createLabelOperationData(['title'], '!!title!!'));
      await controller.attach(mockEventbus);
      expect(lastAnimationData().animationData.text).toBe('Hello');

      language = 'nl-NL';
      mockEventbus.broadcast('language-change', ['nl-NL']);

      expect(lastAnimationData().animationData.text).toBe('Hallo');
    });

    it('given a label collection for a __proto__ label id, when attach is called, then Object.prototype is not polluted', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      mockEventbus.onRequest('request-label-collections', () => [
        [{code: 'polluted', label: 'yes'}],
      ]);

      controller.init(createLabelOperationData(['__proto__'], 'x'));
      await controller.attach(mockEventbus);

      expect(({} as any).polluted).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('given neither json nor animationData, when init is called, then it throws an error naming the controller and both options', () => {
      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: null,
        json: null,
        labelIds: [],
        viewBox: '',
        iefallback: null,
        url: 'animation.json',
      };

      expect(() => {
        controller.init(operationData);
      }).toThrow(
        "LottieController: provide the animation as 'json' or 'animationData'"
      );
    });

    it('given only animationData and no url, when init and attach are called, then the animation is created', async () => {
      const {url: _url, ...operationData} = createOperationData();

      expect(() => controller.init(operationData)).not.toThrow();
      await controller.attach(mockEventbus);

      expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
    });

    it('should handle detach when no animation exists', () => {
      expect(() => {
        controller.detach(mockEventbus);
      }).not.toThrow();
    });
  });

  describe('viewBox handling', () => {
    it('should set viewBox attribute when provided', async () => {
      const mockSvgElement = createMockJQueryElement();
      mockSvgElement.attr = vi.fn().mockReturnValue(mockSvgElement);
      mockElement.find = vi.fn().mockReturnValue(mockSvgElement);

      const operationData = {
        selectedElement: mockElement,
        renderer: {className: 'svg'},
        loop: false,
        autoplay: true,
        animationData: {v: '5.0.0'},
        json: null,
        labelIds: [],
        viewBox: '0 0 100 100',
        iefallback: null,
        url: 'animation.json',
      };

      controller.init(operationData);
      await controller.attach(mockEventbus);

      // Verify find and attr were called
      expect(mockElement.find).toHaveBeenCalledWith('svg');
      expect(mockSvgElement.attr).toHaveBeenCalledWith(
        'viewBox',
        '0 0 100 100'
      );
    });
  });

  describe('language change keeps the playhead', () => {
    const createItem = (currentFrame: number, isPaused: boolean) => ({
      destroy: vi.fn(),
      playSegments: vi.fn(),
      goToAndPlay: vi.fn(),
      goToAndStop: vi.fn(),
      addEventListener: vi.fn(),
      currentFrame,
      isPaused,
    });

    const attachWithLabels = async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      controller.init({...createOperationData(), labelIds: ['title']});
      await controller.attach(mockEventbus);
    };

    it.each([
      [false, 'goToAndPlay'],
      [true, 'goToAndStop'],
    ] as const)(
      'given an animation at frame 42 with isPaused %s, when the language changes, then the new animation resumes at frame 42 with %s',
      async (isPaused, method) => {
        const first = createItem(42, isPaused);
        const second = createItem(0, false);
        vi.mocked(lottie.loadAnimation)
          .mockReturnValueOnce(first as any)
          .mockReturnValueOnce(second as any);
        await attachWithLabels();

        mockEventbus.broadcast('language-change', ['nl-NL']);

        expect(first.destroy).toHaveBeenCalled();
        expect(second[method]).toHaveBeenCalledWith(42, true);
      }
    );

    it('given a frozen animation, when the language changes, then the freeze segment is replayed and the frame restored', async () => {
      const first = createItem(10, true);
      const second = createItem(0, false);
      vi.mocked(lottie.loadAnimation)
        .mockReturnValueOnce(first as any)
        .mockReturnValueOnce(second as any);
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      controller.init({
        ...createOperationData(),
        labelIds: ['title'],
        url: 'animation[freeze=10].json',
      });
      await controller.attach(mockEventbus);

      mockEventbus.broadcast('language-change', ['nl-NL']);

      expect(second.playSegments).toHaveBeenCalledWith([0, 10], true);
      expect(second.goToAndStop).toHaveBeenCalledWith(10, true);
    });
  });

  describe('lifecycle', () => {
    it('given two attach calls before lottie-web has loaded, when both resolve, then one animation and one language listener exist', async () => {
      mockEventbus.onRequest('request-current-language', () => 'en-US');
      controller.init({...createOperationData(), labelIds: ['title']});

      await Promise.all([
        controller.attach(mockEventbus),
        controller.attach(mockEventbus),
      ]);

      expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
      expect(
        vi
          .mocked(mockEventbus.on)
          .mock.calls.filter(([name]) => name === 'language-change')
      ).toHaveLength(1);
    });

    it('given a browser that looks like legacy IE or Edge and an iefallback, when attach is called, then the regular animation data is used', async () => {
      vi.stubGlobal('StyleMedia', {});
      controller.init({
        ...createOperationData(),
        animationData: {v: 'regular'},
        iefallback: {v: 'ie'},
      });

      await controller.attach(mockEventbus);

      expect(
        (vi.mocked(lottie.loadAnimation).mock.calls[0][0] as any).animationData
      ).toEqual({v: 'regular'});
    });
  });
});
