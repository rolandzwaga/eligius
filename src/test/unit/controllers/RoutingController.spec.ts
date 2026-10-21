import {RoutingController} from '@controllers/routing-controller.js';
import {Eventbus} from '@eventbus/eventbus.js';
import {RequestVideoUriInterceptor} from '@eventbus/request-video-uri-interceptor.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// `window.location` cannot be replaced (non-configurable on the jsdom window),
// so the URL is set through the real History API. Captured before any test
// stubs `history`.
const realHistory = window.history;
const setUrl = (url: string) => realHistory.replaceState(null, '', url);

describe('RoutingController', () => {
  let controller: RoutingController;
  let mockEventbus: IEventbus;

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

    setUrl('/#/nav1');

    // Mock window.history (restored by `unstubGlobals`)
    vi.stubGlobal('history', {
      state: null,
      pushState: vi.fn(),
      replaceState: vi.fn(),
    });

    // Mock window.document.title
    Object.defineProperty(window.document, 'title', {
      writable: true,
      value: '',
    });

    window.onpopstate = null;
  });

  afterEach(() => {
    // Remove the controller's popstate listener so tests stay independent
    controller.detach(mockEventbus);
    window.onpopstate = null;
  });

  function firePopstate(state: unknown) {
    window.dispatchEvent(new PopStateEvent('popstate', {state}));
  }

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

    it('given an attached controller, when a popstate event fires, then it is handled without touching window.onpopstate', () => {
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);

      firePopstate({navigationId: 'nav2', position: 3});

      expect(window.onpopstate).toBeNull();
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1,
        3,
        true,
      ]);
    });

    it('given a detached controller, when a popstate event fires, then nothing is broadcast', () => {
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);
      controller.detach(mockEventbus);
      vi.mocked(mockEventbus.broadcast).mockClear();

      firePopstate({navigationId: 'nav2', position: 3});

      expect(mockEventbus.broadcast).not.toHaveBeenCalled();
    });

    it('should handle URL with navigation ID', () => {
      // Set location with navId in hash
      setUrl('/#/nav2/10');

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

    it('given URL hash #/unknown-id and valid navigation data, when RoutingController.attach is called, then it does not throw and broadcasts request-video-url for the first navigation entry with position 0', () => {
      setUrl('/#/unknown-id');
      controller.init({json: createNavigationData()});

      expect(() => controller.attach(mockEventbus)).not.toThrow();
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        0,
        0,
        true,
      ]);
    });

    it('given RoutingController initialised with navigation data and location hash #/doesnotexist/5, when attach is called, then it broadcasts request-video-url for the first navigation entry at the requested position', () => {
      setUrl('/#/doesnotexist/5');
      controller.init({json: createNavigationData()});

      expect(() => controller.attach(mockEventbus)).not.toThrow();
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        0,
        5,
        true,
      ]);
    });

    it('given a URL hash without a position segment, when attach is called, then the requested position is 0 rather than NaN', () => {
      setUrl('/#/nav2');
      controller.init({json: createNavigationData()});

      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1,
        0,
        true,
      ]);
    });

    it('given a URL hash naming an Object.prototype property, when attach is called, then it falls back to the first navigation entry', () => {
      setUrl('/#/constructor/3');
      controller.init({json: createNavigationData()});

      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        0,
        3,
        true,
      ]);
    });

    it('given another script owns window.onpopstate, when the controller attaches and detaches, then that handler is never replaced and still fires', () => {
      const otherHandler = vi.fn();
      window.onpopstate = otherHandler;
      controller.init({json: createNavigationData()});

      controller.attach(mockEventbus);
      expect(window.onpopstate).toBe(otherHandler);
      controller.detach(mockEventbus);
      firePopstate({navigationId: 'nav1'});

      expect(window.onpopstate).toBe(otherHandler);
      expect(otherHandler).toHaveBeenCalledTimes(1);
    });

    it('given a URL without a hash and non-empty navigation data, when RoutingController.attach is called, then history.replaceState is called with {navigationId: nav1} and #/nav1 and history.pushState is not called', () => {
      setUrl('/');
      controller.init({json: createNavigationData()});

      controller.attach(mockEventbus);

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {navigationId: 'nav1'},
        '',
        '#/nav1'
      );
      expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('given a URL hash with a negative position, when attach is called, then the requested position is 0', () => {
      setUrl('/#/nav2/-1');
      controller.init({json: createNavigationData()});

      controller.attach(mockEventbus);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1,
        0,
        true,
      ]);
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
    it('given push-history-state with position -1 and an engine at position 10, when it is handled, then the URL and state use the rewound position 7', () => {
      mockEventbus.onRequest('request-current-timeline-position', () => 10);
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);

      mockEventbus.broadcast('push-history-state', [
        {
          navigationData: controller.navLookup.nav2,
          title: 'Test Title',
          position: -1,
        },
      ]);

      expect(window.history.pushState).toHaveBeenCalledWith(
        {navigationId: 'nav2', position: 7},
        'Test Title',
        '#/nav2/7'
      );
      expect(window.document.title).toBe('Test Title');
    });

    it('given no engine position responder but a legacy request-current-video-position handler, when push-history-state has no position, then the legacy position is used', () => {
      mockEventbus.on(
        'request-current-video-position',
        (callback: (position: number) => void) => callback(2)
      );
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);

      mockEventbus.broadcast('push-history-state', [
        {navigationData: controller.navLookup.nav2, title: 'T'},
      ]);

      expect(window.history.pushState).toHaveBeenCalledWith(
        {navigationId: 'nav2', position: 0},
        'T',
        '#/nav2/0'
      );
    });

    it('given a RoutingController and a responder for request-current-navigation that returns visible navigation data without a position on a real Eventbus, when before-request-video-url is broadcast with [1, 0, false], then window.history.pushState is not called with a URL ending in /-1 and the pushed state position is not negative', () => {
      const eventbus = new Eventbus();
      controller.init({json: createNavigationData()});
      controller.attach(eventbus);
      eventbus.on('request-current-navigation', callback =>
        callback({navigationData: controller.navLookup.nav2, title: 'Nav 2'})
      );

      eventbus.broadcast('before-request-video-url', [1, 0, false]);

      const calls = vi.mocked(window.history.pushState).mock.calls;
      expect(calls).toEqual([[{navigationId: 'nav2'}, 'Nav 2', '#/nav2']]);
      controller.detach(eventbus);
    });

    it('should handle popstate event', () => {
      const operationData = {
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      firePopstate({navigationId: 'nav2', position: 15});

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

      firePopstate(null);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'highlight-navigation',
        [0] // nav1's videoUrlIndex (first navigation)
      );
    });

    it('given the URL hash is #/nav2/10 and an attached RoutingController, when a popstate event fires with null state, then request-video-url is broadcast for nav2 at position 10 instead of the first navigation entry', () => {
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);
      setUrl('/#/nav2/10');
      vi.mocked(mockEventbus.broadcast).mockClear();

      firePopstate(null);

      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'highlight-navigation',
        [1]
      );
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        1,
        10,
        true,
      ]);
    });

    it('given a popstate event with a state object that the host page created, when it is handled, then nothing is broadcast', () => {
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);
      vi.mocked(mockEventbus.broadcast).mockClear();

      firePopstate({foo: 1});

      expect(mockEventbus.broadcast).not.toHaveBeenCalled();
    });

    it('given a popstate event whose state names an unknown navigation id, when it is handled, then it falls back to the first navigation entry', () => {
      controller.init({json: createNavigationData()});
      controller.attach(mockEventbus);

      // A throwing listener would stop before the broadcast below
      firePopstate({navigationId: 'gone', position: 4});
      expect(mockEventbus.broadcast).toHaveBeenCalledWith('request-video-url', [
        0,
        4,
        true,
      ]);
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

  describe('timeline navigation', () => {
    const createTimelineNavigationData = () => ({
      navigationData: [
        {id: 'nav1', videoUrlIndex: 0, timelineUri: 'intro', visible: true},
        {id: 'nav2', videoUrlIndex: 1, timelineUri: 'chapter-1', visible: true},
      ],
      roots: ['nav1', 'nav2'],
    });

    /**
     * A real Eventbus with the interceptor EngineFactory registers, so
     * 'request-timeline-uri' produces 'before-request-timeline-uri'.
     */
    const createEngineLikeEventbus = () => {
      const eventbus = new Eventbus();
      eventbus.registerInterceptor(
        'request-timeline-uri',
        new RequestVideoUriInterceptor(eventbus)
      );
      const requests: unknown[][] = [];
      eventbus.on('request-timeline-uri', (...args) => requests.push(args));
      const navigationRequests = vi.fn();
      eventbus.on('request-current-navigation', navigationRequests);
      return {eventbus, requests, navigationRequests};
    };

    it('given navigation items with a timelineUri, when attach reads #/nav2/4 from the URL, then request-timeline-uri is broadcast and no history entry is saved for it', () => {
      setUrl('/#/nav2/4');
      const {eventbus, requests, navigationRequests} =
        createEngineLikeEventbus();
      controller.init({json: createTimelineNavigationData()});

      controller.attach(eventbus);

      expect(requests).toEqual([['chapter-1', 4]]);
      expect(navigationRequests).not.toHaveBeenCalled();
      controller.detach(eventbus);
    });

    it('given navigation items with a timelineUri, when a popstate event fires, then request-timeline-uri is broadcast without saving the current entry', () => {
      const {eventbus, requests, navigationRequests} =
        createEngineLikeEventbus();
      controller.init({json: createTimelineNavigationData()});
      controller.attach(eventbus);
      requests.length = 0;

      firePopstate({navigationId: 'nav2', position: 3});

      expect(requests).toEqual([['chapter-1', 3]]);
      expect(navigationRequests).not.toHaveBeenCalled();
      controller.detach(eventbus);
    });

    it('given another component requests a timeline, when before-request-timeline-uri is broadcast, then the current navigation entry is saved', () => {
      const {eventbus, navigationRequests} = createEngineLikeEventbus();
      controller.init({json: createTimelineNavigationData()});
      controller.attach(eventbus);

      eventbus.broadcast('request-timeline-uri', ['chapter-1', 0]);

      expect(navigationRequests).toHaveBeenCalledTimes(1);
      controller.detach(eventbus);
    });
  });
});
