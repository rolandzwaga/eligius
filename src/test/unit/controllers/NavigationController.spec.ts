import {NavigationController} from '@controllers/navigation-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// Mock jQuery globally
const mockJQueryElements = new Map<string, any>();

vi.mock('jquery', () => {
  return {
    default: (selector?: string) => {
      if (!selector) {
        // $() creates a new element
        return createMockJQueryElement();
      }

      if (selector.startsWith('<')) {
        // $('<tag/>') creates a new element
        const mockElement = createMockJQueryElement();
        mockElement._tagName = selector.match(/<(\w+)/)?.[1] || 'div';
        return mockElement;
      }

      // $('#id') or $('.class') returns existing or new mock
      if (!mockJQueryElements.has(selector)) {
        mockJQueryElements.set(selector, createMockJQueryElement());
      }
      return mockJQueryElements.get(selector);
    },
  };
});

describe('NavigationController', () => {
  let controller: NavigationController;
  let mockEventbus: IEventbus;
  let mockContainer: any;

  const createNavigationData = () => ({
    navigationData: [
      {
        id: 'nav1',
        labelId: 'label1',
        videoUrlIndex: 0,
        visible: true,
        autoNext: false,
      },
      {
        id: 'nav2',
        labelId: 'label2',
        videoUrlIndex: 1,
        visible: true,
        autoNext: true,
        nextId: 'nav3',
      },
      {
        id: 'nav3',
        labelId: 'label3',
        videoUrlIndex: 2,
        visible: false,
        autoNext: false,
      },
    ],
    roots: ['nav1', 'nav2'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockJQueryElements.clear();
    controller = new NavigationController();
    mockEventbus = createMockEventbus();
    mockContainer = createMockJQueryElement();
  });

  describe('init', () => {
    it('should initialize navigation data and build lookup tables', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);

      expect(controller.container).toBe(mockContainer);
      expect(controller.navigation).toHaveLength(2); // Only roots
      expect(controller.navLookup['nav1']).toBeDefined();
      expect(controller.navVidIdLookup[0]).toBeDefined();
    });

    it('should link navigation items with previous/next references', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);

      const nav1 = controller.navLookup['nav1'];
      const nav2 = controller.navLookup['nav2'];
      const nav3 = controller.navLookup['nav3'];

      expect(nav1.previous).toBeUndefined();
      expect(nav2.previous).toBe(nav1);
      expect(nav3.previous).toBe(nav2);
      expect(nav2.next).toBe(nav3); // nextId reference resolved
    });
  });

  describe('attach', () => {
    it('should register event listeners for navigation events', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'navigate-to-video-url',
        expect.any(Function)
      );
      expect(mockEventbus.on).toHaveBeenCalledWith(
        'highlight-navigation',
        expect.any(Function)
      );
      expect(mockEventbus.on).toHaveBeenCalledWith(
        'request-current-navigation',
        expect.any(Function)
      );
      expect(mockEventbus.on).toHaveBeenCalledWith(
        'video-complete',
        expect.any(Function)
      );
    });

    it('should not attach if container is missing', () => {
      controller.attach(mockEventbus);

      expect(mockEventbus.on).not.toHaveBeenCalled();
    });

    it('should build HTML navigation structure', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      // Spy on append to verify HTML building
      const appendSpy = vi.spyOn(mockContainer, 'append');

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Verify append was called (HTML structure was built)
      expect(appendSpy).toHaveBeenCalled();
    });
  });

  describe('detach', () => {
    it('should remove all event listeners', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();

      controller.detach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();
    });

    it('should detach all label controllers', () => {
      const mockLabelController = {
        init: vi.fn(),
        attach: vi.fn(),
        detach: vi.fn(),
        labelData: {'en-US': 'Test'},
        currentLanguage: 'en-US',
      };

      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      // Mock request to return the label controller when 'request-instance' is called
      (mockEventbus.request as any).mockImplementation(
        (topic: string, _arg: string) => {
          if (topic === 'request-instance') {
            return mockLabelController;
          }
          return undefined;
        }
      );

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(controller.labelControllers.length).toBeGreaterThan(0);

      controller.detach(mockEventbus);

      expect(mockLabelController.detach).toHaveBeenCalledWith(mockEventbus);
      expect(controller.labelControllers.length).toBe(0);
    });

    it('should clear container and eventbus references', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      controller.detach(mockEventbus);

      expect(controller.container).toBeNull();
      expect(controller.eventbus).toBeNull();
    });
  });

  describe('navigation event handling', () => {
    it('should handle navigate-to-video-url event', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Trigger navigate-to-video-url event
      mockEventbus.broadcast('navigate-to-video-url', [1, 0]);

      expect(controller.activeNavigationPoint).toBe(
        controller.navVidIdLookup[1]
      );
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-video-url',
        [1, 0]
      );
    });

    it('should handle request-current-navigation event', () => {
      const mockLabelController = {
        labelData: {'en-US': 'Test Label'},
        currentLanguage: 'en-US',
      };

      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.ctrlLookup['label1'] = mockLabelController as any;
      controller.activeNavigationPoint = controller.navLookup['nav1'];
      controller.attach(mockEventbus);

      const resultCallback = vi.fn();
      mockEventbus.broadcast('request-current-navigation', [resultCallback]);

      expect(resultCallback).toHaveBeenCalledWith({
        navigationData: controller.navLookup['nav1'],
        title: 'Test Label',
      });
    });

    it('should handle video-complete with autoNext enabled', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // nav2 (index 1) has autoNext: true and next reference to nav3
      mockEventbus.broadcast('video-complete', [1]);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        2, // nav3's videoUrlIndex
      ]);
    });

    it('should handle video-complete with autoNext disabled', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // nav1 (index 0) has autoNext: false
      mockEventbus.broadcast('video-complete', [0]);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-video-cleanup',
        []
      );
    });
  });
});
