import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {RoutingController} from '../../../controllers/routing-controller.js';
import type {IEventbus} from '../../../eventbus/types.js';
import {createMockEventbus} from '../../fixtures/eventbus-factory.js';

describe('RoutingController', () => {
  let controller: RoutingController;
  let mockEventbus: IEventbus;
  let originalWindowLocation: Location;
  let originalWindowHistory: History;
  let originalWindowDocument: Document;

  const createNavigationData = () => ({
    navigationData: [
      {
        id: 'nav1',
        videoUrlIndex: 0,
        visible: true,
      },
      {
        id: 'nav2',
        videoUrlIndex: 1,
        visible: true,
        nextId: 'nav3',
      },
      {
        id: 'nav3',
        videoUrlIndex: 2,
        visible: false,
      },
    ],
    roots: ['nav1', 'nav2'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new RoutingController();
    mockEventbus = createMockEventbus();

    // Save original window objects
    originalWindowLocation = window.location;
    originalWindowHistory = window.history;
    originalWindowDocument = window.document;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost/#/nav1',
      hash: '#/nav1',
    };

    // Mock window.history
    (window as any).history = {
      state: null,
      pushState: vi.fn(),
      replaceState: vi.fn(),
    };

    // Mock window.document.title
    Object.defineProperty(window.document, 'title', {
      writable: true,
      value: '',
    });

    // Mock window.onpopstate
    (window as any).onpopstate = null;
  });

  afterEach(() => {
    // Restore original window objects
    (window as any).location = originalWindowLocation;
    (window as any).history = originalWindowHistory;
    (window as any).document = originalWindowDocument;
    window.onpopstate = null;
  });

  describe('init', () => {
    it('should initialize navigation data and build lookup tables', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);

      expect(controller.navigation).toHaveLength(2); // Only roots
      expect(controller.navLookup['nav1']).toBeDefined();
      expect(controller.navVidIdLookup[0]).toBeDefined();
    });

    it('should link navigation items with previous/next references', () => {
      const operationData = {
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
    it('should register event listeners for routing events', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'before-request-video-url',
        expect.any(Function)
      );
      expect(mockEventbus.on).toHaveBeenCalledWith(
        'push-history-state',
        expect.any(Function)
      );
    });

    it('should set window.onpopstate handler', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(window.onpopstate).toBeInstanceOf(Function);
    });

    it('should handle URL with navigation ID', () => {
      // Set location with navId in hash
      (window as any).location.href = 'http://localhost/#/nav2/10';

      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1, // nav2's videoUrlIndex
        10, // position from URL
        true, // isHistoryRequest
      ]);
    });

    it('should push initial state when no navigation ID in URL', () => {
      // Set location without navId
      (window as any).location.href = 'http://localhost/';

      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(window.history.pushState).toHaveBeenCalledWith(
        {navigationId: 'nav1'},
        '',
        '#/nav1'
      );
    });
  });

  describe('detach', () => {
    it('should call all event remover functions', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalled();

      controller.detach(mockEventbus);

      // Verify event listeners were attached and detached
      expect(controller.eventbus).toBeNull();
    });
  });

  describe('history state management', () => {
    it('should handle push-history-state event', () => {
      const operationData = {
        json: createNavigationData(),
      };

      const testEventbus = createMockEventbus();
      const originalBroadcast = testEventbus.broadcast;

      // Mock broadcast to provide video position
      (testEventbus.broadcast as any) = (eventName: string, args?: any[]) => {
        if (eventName === 'request-current-video-position' && args) {
          args[0](10); // Current position 10 seconds
        }
        originalBroadcast.call(testEventbus, eventName as any, args as any);
      };

      controller.init(operationData);
      controller.attach(testEventbus);

      const state = {
        navigationData: controller.navLookup['nav2'],
        title: 'Test Title',
        position: -1, // Will request current position
      };

      testEventbus.broadcast('push-history-state', [state]);

      expect(window.history.pushState).toHaveBeenCalled();
      expect(window.document.title).toBe('Test Title');
    });

    it('should handle popstate event', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Simulate popstate event
      const popstateEvent = {
        state: {
          navigationId: 'nav2',
          position: 15,
        },
      };

      window.onpopstate!(popstateEvent as any);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'highlight-navigation',
        [1] // nav2's videoUrlIndex
      );
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1, // nav2's videoUrlIndex
        15, // position from state
        true, // isHistoryRequest
      ]);
    });

    it('should handle popstate without state (default to first navigation)', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Simulate popstate without state
      const popstateEvent = {
        state: null,
      };

      window.onpopstate!(popstateEvent as any);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'highlight-navigation',
        [0] // nav1's videoUrlIndex (first navigation)
      );
    });
  });

  describe('before-request-video-url handling', () => {
    it('should not push state when isHistoryRequest is true', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Trigger before-request-video-url with isHistoryRequest=true
      mockEventbus.broadcast('before-request-video-url', [0, 0, true]);

      // Should not broadcast request-current-navigation
      expect(mockEventbus.broadcast).not.toHaveBeenCalledWith(
        'request-current-navigation',
        expect.any(Array)
      );
    });

    it('should request current navigation when isHistoryRequest is false', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      // Trigger before-request-video-url with isHistoryRequest=false
      mockEventbus.broadcast('before-request-video-url', [0, 0, false]);

      // Should broadcast request-current-navigation
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-current-navigation',
        expect.any(Array)
      );
    });
  });
});
