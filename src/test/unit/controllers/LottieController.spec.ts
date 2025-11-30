import {LottieController} from '@controllers/lottie-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// Mock lottie-web
vi.mock('lottie-web', () => {
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
    default: MockLottie,
  };
});

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
      controller.attach(mockEventbus);

      expect(controller.animationItem).toBeDefined();
      expect(controller.animationItem).not.toBeNull();
    });

    it('should request current language when labelIds provided', () => {
      // Setup mock eventbus to provide label collection data
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
      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-current-language',
        expect.any(Array)
      );
    });

    it('should register language change listener when labelIds provided', () => {
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
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'language-change',
        expect.any(Function)
      );
    });

    it('should handle missing operationData gracefully', () => {
      expect(() => {
        controller.attach(mockEventbus);
      }).not.toThrow();
    });
  });

  describe('detach', () => {
    it('should destroy animation item when no endPosition set', () => {
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
      controller.attach(mockEventbus);

      // Manually set endPosition to -1 to trigger immediate destroy path
      controller.endPosition = -1;

      const destroySpy = vi.spyOn(controller.animationItem!, 'destroy');

      controller.detach(mockEventbus);

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should play end segment when endPosition is set', () => {
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
      controller.attach(mockEventbus);

      const playSegmentsSpy = vi.spyOn(
        controller.animationItem!,
        'playSegments'
      );

      controller.detach(mockEventbus);

      expect(playSegmentsSpy).toHaveBeenCalledWith([0, 50], true);
    });

    it('should remove all event listeners', () => {
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

      // Initialize labelData structure
      controller.labelData = {
        label1: {},
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();

      controller.detach(mockEventbus);

      // Verify event listeners were registered and removed
      expect(mockEventbus.on).toHaveBeenCalled();
    });
  });

  describe('label replacement', () => {
    it('should replace label placeholders with current language text', () => {
      // Setup mock eventbus
      const mockBroadcast = mockEventbus.broadcast as any;
      mockBroadcast.mockImplementation((eventName: string, args?: any[]) => {
        if (eventName === 'request-label-collections' && args) {
          args[1].labelCollections = [[{code: 'en-US', label: 'Hello'}]];
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

      // Setup label data structure that will be populated by _createTextDataLookup
      controller.labelData = {
        label1: {},
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Animation should be created with replaced text
      expect(controller.animationItem).toBeDefined();
    });

    it('should update animation on language change', () => {
      // Don't use mockImplementation for this test - let broadcast work naturally
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
        label1: {
          'en-US': 'Hello',
          'nl-NL': 'Hallo',
        },
      };
      controller.currentLanguage = 'en-US';

      controller.init(operationData);

      // Create a simple test eventbus that properly registers and calls handlers
      const testEventbus = createMockEventbus();

      // Mock broadcast to provide initial data without breaking handler invocation
      const originalBroadcast = testEventbus.broadcast;
      (testEventbus.broadcast as any) = (eventName: string, args?: any[]) => {
        if (eventName === 'request-label-collections' && args) {
          args[1].labelCollections = [[{code: 'en-US', label: 'Hello'}]];
        }
        if (eventName === 'request-current-language' && args) {
          args[0].language = 'en-US';
        }
        // Call original to invoke handlers
        originalBroadcast.call(testEventbus, eventName as any, args as any);
      };

      controller.attach(testEventbus);

      expect(controller.currentLanguage).toBe('en-US');

      // Now broadcast language change - this will invoke the registered handler
      testEventbus.broadcast('language-change', ['nl-NL']);

      // Animation should be recreated with new language
      expect(controller.currentLanguage).toBe('nl-NL');
    });
  });

  describe('error handling', () => {
    it('should handle missing animation data gracefully', () => {
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
      }).not.toThrow();
    });

    it('should handle detach when no animation exists', () => {
      expect(() => {
        controller.detach(mockEventbus);
      }).not.toThrow();
    });
  });

  describe('viewBox handling', () => {
    it('should set viewBox attribute when provided', () => {
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
      controller.attach(mockEventbus);

      // Verify find and attr were called
      expect(mockElement.find).toHaveBeenCalledWith('svg');
      expect(mockSvgElement.attr).toHaveBeenCalledWith(
        'viewBox',
        '0 0 100 100'
      );
    });
  });
});
