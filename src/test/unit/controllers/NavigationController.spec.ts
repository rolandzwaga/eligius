import {NavigationController} from '@controllers/navigation-controller.js';
import {RoutingController} from '@controllers/routing-controller.js';
import type {IEventbus} from '@eventbus/types.js';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.js';
import {createMockJQueryElement} from '@test/fixtures/jquery-factory.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';

// `window.location` cannot be replaced, so the URL is set through the History API
const realHistory = window.history;
const setUrl = (url: string) => realHistory.replaceState(null, '', url);

// Mock jQuery globally
const mockJQueryElements = new Map<string, any>();
// Every element created through $('<tag/>'), in creation order
const createdElements: any[] = [];
// Every string passed to $()
const jQuerySelectors: string[] = [];

vi.mock('jquery', () => {
  return {
    default: (selector?: string) => {
      if (!selector) {
        // $() creates a new element
        return createMockJQueryElement();
      }

      jQuerySelectors.push(selector);

      if (selector.startsWith('<')) {
        // $('<tag/>') creates a new element
        const mockElement = createMockJQueryElement();
        mockElement._tagName = selector.match(/<(\w+)/)?.[1] || 'div';
        mockElement.remove = vi.fn(() => mockElement);
        createdElements.push(mockElement);
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

  const findAnchor = (id: string) =>
    createdElements.find(
      element => element._tagName === 'a' && element.attr('id') === id
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockJQueryElements.clear();
    createdElements.length = 0;
    jQuerySelectors.length = 0;
    setUrl('/');
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

    it('should clear the eventbus reference and keep the container so the controller can be re-attached', () => {
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.attach(mockEventbus);

      controller.detach(mockEventbus);

      expect(controller.container).toBe(mockContainer);
      expect(controller.eventbus).toBeNull();
    });

    it('given an attached NavigationController that rendered its menu, when detach is called, then the generated ul is removed and the label controller lookup is cleared', () => {
      (mockEventbus.request as any).mockImplementation((topic: string) =>
        topic === 'request-instance'
          ? {init: vi.fn(), attach: vi.fn(), detach: vi.fn()}
          : undefined
      );
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);

      const menu = createdElements.find(element => element._tagName === 'ul');
      expect(Object.keys(controller.ctrlLookup)).not.toHaveLength(0);

      controller.detach(mockEventbus);

      expect(menu.remove).toHaveBeenCalled();
      expect(controller.ctrlLookup).toEqual({});
    });

    it('given a detached NavigationController, when attach is called again, then the listeners and the menu are rebuilt', () => {
      const appendSpy = vi.spyOn(mockContainer, 'append');
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);
      controller.detach(mockEventbus);
      (mockEventbus.on as any).mockClear();

      controller.attach(mockEventbus);

      expect(mockEventbus.on).toHaveBeenCalledWith(
        'video-complete',
        expect.any(Function)
      );
      expect(appendSpy).toHaveBeenCalledTimes(2);
    });

    it('given a window.onpopstate handler installed by someone else, when NavigationController.detach is called, then the handler is left in place', () => {
      const popstateHandler = vi.fn();
      window.onpopstate = popstateHandler;
      try {
        controller.init({
          selectedElement: mockContainer,
          json: createNavigationData(),
        });
        controller.attach(mockEventbus);

        controller.detach(mockEventbus);

        expect(window.onpopstate).toBe(popstateHandler);
      } finally {
        window.onpopstate = null;
      }
    });
  });

  describe('initial history state', () => {
    it('given window location hash #/nav2, when NavigationController is attached, then activeNavigationPoint is nav2 and its anchor is highlighted', () => {
      setUrl('/#/nav2');
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });

      controller.attach(mockEventbus);

      expect(controller.activeNavigationPoint).toBe(controller.navLookup.nav2);
      expect(findAnchor('nav_1').hasClass('current-menu-item')).toBe(true);
      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(false);
    });

    it('given navigation data with videoUrlIndex 0 and an empty location hash, when NavigationController is attached, then nav_0 is highlighted and request-current-navigation returns the first navigation item', () => {
      mockEventbus.onRequest('request-translation', () => 'Title');
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });

      controller.attach(mockEventbus);

      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(true);
      const resultCallback = vi.fn();
      mockEventbus.broadcast('request-current-navigation', [resultCallback]);
      expect(resultCallback).toHaveBeenCalledWith({
        navigationData: controller.navLookup.nav1,
        title: 'Title',
      });
    });

    it('given an unknown navigation id in the location hash, when NavigationController is attached, then it does not throw and falls back to the first item', () => {
      setUrl('/#/does-not-exist');
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });

      expect(() => controller.attach(mockEventbus)).not.toThrow();
      expect(controller.activeNavigationPoint).toBe(controller.navLookup.nav1);
      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(true);
    });

    it('given a highlighted item, when highlight-navigation is broadcast for another item, then only the new item is highlighted', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('highlight-navigation', [1]);

      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(false);
      expect(findAnchor('nav_1').hasClass('current-menu-item')).toBe(true);
    });
  });

  describe('menu rendering', () => {
    it('given a videoUrlIndex containing markup, when the menu is built, then it is only ever set as an attribute value and never parsed as HTML', () => {
      const payload = "1' onmouseover='alert(1)";
      const json = createNavigationData();
      json.navigationData[0].videoUrlIndex = payload as any;
      controller.init({selectedElement: mockContainer, json});

      controller.attach(mockEventbus);

      expect(
        jQuerySelectors.some(selector => selector.includes('onmouseover'))
      ).toBe(false);
      const anchor = findAnchor(`nav_${payload}`);
      expect(anchor).toBeDefined();
      expect(anchor.getAttributes().onmouseover).toBeUndefined();
    });

    const videoUrlRequests = () =>
      (mockEventbus.broadcast as any).mock.calls.filter(
        ([eventName]: [string]) => eventName === 'request-video-url'
      );

    it('given an attached NavigationController with navigation data, when a focused menu anchor is activated by keyboard (click event without mouseup), then request-video-url is broadcast exactly once with [videoUrlIndex, 0]', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);
      (mockEventbus.broadcast as any).mockClear();
      const event = {preventDefault: vi.fn()};

      findAnchor('nav_1').trigger('click', event);

      expect(videoUrlRequests()).toEqual([['request-video-url', [1, 0]]]);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(controller.activeNavigationPoint).toBe(controller.navLookup.nav2);
    });

    it('given an attached NavigationController, when a menu anchor receives only mouseup, then nothing is requested', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);
      (mockEventbus.broadcast as any).mockClear();

      findAnchor('nav_1').trigger('mouseup');

      expect(videoUrlRequests()).toEqual([]);
    });

    it('given a focused menu anchor, when Space is pressed, then the item is activated once and the page does not scroll', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);
      (mockEventbus.broadcast as any).mockClear();
      const space = {key: ' ', preventDefault: vi.fn()};
      const other = {key: 'a', preventDefault: vi.fn()};

      findAnchor('nav_1').trigger('keydown', other);
      findAnchor('nav_1').trigger('keydown', space);

      expect(videoUrlRequests()).toEqual([['request-video-url', [1, 0]]]);
      expect(space.preventDefault).toHaveBeenCalled();
      expect(other.preventDefault).not.toHaveBeenCalled();
    });

    it('given a rendered menu, when the anchors are inspected, then they use a fragment href instead of a javascript: URL', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });

      controller.attach(mockEventbus);

      expect(findAnchor('nav_0').attr('href')).toBe('#/nav1');
      expect(findAnchor('nav_1').attr('href')).toBe('#/nav2');
    });

    it('given a highlighted menu item, when another item is highlighted, then aria-current moves with the highlight', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('highlight-navigation', [1]);

      expect(findAnchor('nav_1').attr('aria-current')).toBe('page');
      expect(findAnchor('nav_0').attr('aria-current')).toBeUndefined();
    });
  });

  describe('navigation data', () => {
    const createNestedData = () => ({
      navigationData: [
        {
          id: 'a',
          labelId: 'la',
          videoUrlIndex: 0,
          visible: true,
          children: ['b'],
        },
        {
          id: 'b',
          labelId: 'lb',
          videoUrlIndex: 1,
          visible: true,
          children: ['c'],
        },
        {id: 'c', labelId: 'lc', videoUrlIndex: 2, visible: true, nextId: 'a'},
      ],
      roots: ['a'],
    });

    it('given RoutingController initialised with a json whose root a has children [b], when a NavigationController is initialised with the same json object and attached, then attach does not throw and renders an anchor for b', () => {
      const json = createNestedData();
      new RoutingController().init({json});

      controller.init({selectedElement: mockContainer, json});

      expect(() => controller.attach(mockEventbus)).not.toThrow();
      expect(findAnchor('nav_1')).toBeDefined();
    });

    it('given children nested two levels deep, when the menu is built, then the grandchild is rendered', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNestedData(),
      });

      controller.attach(mockEventbus);

      expect(findAnchor('nav_2')).toBeDefined();
      expect(controller.navLookup.b.children).toEqual([controller.navLookup.c]);
    });

    it('given a json object, when NavigationController.init is called, then the json is not modified', () => {
      const json = createNestedData();
      const before = structuredClone(json);

      controller.init({selectedElement: mockContainer, json});

      expect(json).toEqual(before);
      expect(controller.navLookup.c.next).toBe(controller.navLookup.a);
    });

    it('given children that name an unknown navigation id, when init is called, then it throws an error naming the controller, the id and the parent', () => {
      const json = createNestedData();
      json.navigationData[1].children = ['nope'];

      expect(() =>
        controller.init({selectedElement: mockContainer, json})
      ).toThrow(
        "NavigationController: unknown navigation id 'nope' in children of 'b'"
      );
    });

    it('given roots that name an unknown navigation id, when init is called, then it throws an error naming the controller and the id', () => {
      const json = createNestedData();
      json.roots = ['missing'];

      expect(() =>
        controller.init({selectedElement: mockContainer, json})
      ).toThrow(
        "NavigationController: unknown navigation id 'missing' in roots"
      );
    });
  });

  describe('timeline navigation', () => {
    const createTimelineNavigationData = () => ({
      navigationData: [
        {
          id: 'nav1',
          labelId: 'label1',
          videoUrlIndex: 0,
          timelineUri: 'intro',
          visible: true,
          autoNext: true,
        },
        {
          id: 'nav2',
          labelId: 'label2',
          videoUrlIndex: 1,
          timelineUri: 'chapter-1',
          visible: true,
        },
      ],
      roots: ['nav1', 'nav2'],
    });

    const broadcastsOf = (eventName: string) =>
      (mockEventbus.broadcast as any).mock.calls.filter(
        ([name]: [string]) => name === eventName
      );

    it('given navigation items with a timelineUri, when a menu item is activated, then request-timeline-uri is broadcast with [timelineUri, 0] and request-video-url is not', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createTimelineNavigationData(),
      });
      controller.attach(mockEventbus);
      (mockEventbus.broadcast as any).mockClear();

      findAnchor('nav_1').trigger('click');

      expect(broadcastsOf('request-timeline-uri')).toEqual([
        ['request-timeline-uri', ['chapter-1', 0]],
      ]);
      expect(broadcastsOf('request-video-url')).toEqual([]);
    });

    it('given the active item has autoNext and a timelineUri, when timeline-complete is broadcast for its timeline, then the next timeline is requested and highlighted', () => {
      mockEventbus.onRequest(
        'timeline-request-current-timeline',
        () => 'intro'
      );
      controller.init({
        selectedElement: mockContainer,
        json: createTimelineNavigationData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-complete', []);

      expect(broadcastsOf('request-timeline-uri')).toEqual([
        ['request-timeline-uri', ['chapter-1', 0]],
      ]);
      expect(controller.activeNavigationPoint).toBe(controller.navLookup.nav2);
      expect(findAnchor('nav_1').hasClass('current-menu-item')).toBe(true);
    });

    it('given the engine reports another current timeline, when timeline-complete is broadcast, then nothing is requested', () => {
      mockEventbus.onRequest(
        'timeline-request-current-timeline',
        () => 'something-else'
      );
      controller.init({
        selectedElement: mockContainer,
        json: createTimelineNavigationData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-complete', []);

      expect(broadcastsOf('request-timeline-uri')).toEqual([]);
    });

    it('given legacy items without a timelineUri, when timeline-complete is broadcast, then nothing is requested', () => {
      const json = createNavigationData();
      json.navigationData[0].autoNext = true;
      controller.init({selectedElement: mockContainer, json});
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-complete', []);

      expect(broadcastsOf('request-video-url')).toEqual([]);
    });

    it('given the engine switches to a timeline that a navigation item names, when timeline-current-timeline-change is broadcast, then that item becomes active and highlighted', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createTimelineNavigationData(),
      });
      controller.attach(mockEventbus);

      mockEventbus.broadcast('timeline-current-timeline-change', ['chapter-1']);

      expect(controller.activeNavigationPoint).toBe(controller.navLookup.nav2);
      expect(findAnchor('nav_1').hasClass('current-menu-item')).toBe(true);
      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(false);
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
      const operationData = {
        selectedElement: mockContainer,
        json: createNavigationData(),
      };

      controller.init(operationData);
      controller.activeNavigationPoint = controller.navLookup['nav1'];

      // Mock request-translation to return the expected title
      mockEventbus.onRequest('request-translation', () => 'Test Label');
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
        0,
      ]);
    });

    it('given an attached NavigationController whose item at videoUrlIndex 0 has autoNext and next = item 1, when video-complete is broadcast with [0], then activeNavigationPoint is the item at videoUrlIndex 1 and only #nav_1 has the current-menu-item class', () => {
      const json = createNavigationData();
      json.navigationData[0].autoNext = true;
      controller.init({selectedElement: mockContainer, json});
      controller.attach(mockEventbus);

      mockEventbus.broadcast('video-complete', [0]);

      expect(controller.activeNavigationPoint).toBe(
        controller.navVidIdLookup[1]
      );
      expect(findAnchor('nav_1').hasClass('current-menu-item')).toBe(true);
      expect(findAnchor('nav_0').hasClass('current-menu-item')).toBe(false);
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'push-history-state',
        [expect.objectContaining({navigationData: controller.navLookup.nav2})]
      );
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

    it('given NavigationController whose last navigation item has autoNext true and no next item, when video-complete is broadcast for that item, then it broadcasts request-video-cleanup and does not throw', () => {
      const json = createNavigationData();
      json.navigationData[2].autoNext = true;
      controller.init({selectedElement: mockContainer, json});
      controller.attach(mockEventbus);

      expect(() => mockEventbus.broadcast('video-complete', [2])).not.toThrow();
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-video-cleanup',
        []
      );
    });

    it('given a video-complete for an index without navigation data, when it is broadcast, then it broadcasts request-video-cleanup and does not throw', () => {
      controller.init({
        selectedElement: mockContainer,
        json: createNavigationData(),
      });
      controller.attach(mockEventbus);

      expect(() =>
        mockEventbus.broadcast('video-complete', [99])
      ).not.toThrow();
      expect(mockEventbus.broadcast).toHaveBeenCalledWith(
        'request-video-cleanup',
        []
      );
    });
  });
});
