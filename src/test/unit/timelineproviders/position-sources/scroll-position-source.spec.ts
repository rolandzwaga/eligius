import type {TBoundary} from '@timelineproviders/types.ts';
import {
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// Mock jQuery with hoisted mocks
const mocks = vi.hoisted(() => {
  let mockElement: HTMLElement | null = null;
  let mockScrollHandler: ((event: Event) => void) | null = null;

  const createMockElement = (): HTMLElement => {
    const element = document.createElement('div');
    // Set up scrollable properties
    Object.defineProperty(element, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'scrollHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(element, 'clientHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });

    // Track scroll event listener
    const originalAddEventListener = element.addEventListener.bind(element);
    const originalRemoveEventListener =
      element.removeEventListener.bind(element);

    element.addEventListener = vi.fn(
      (
        type: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions | boolean
      ) => {
        if (type === 'scroll') {
          mockScrollHandler = handler as (event: Event) => void;
        }
        originalAddEventListener(type, handler, options);
      }
    ) as typeof element.addEventListener;

    element.removeEventListener = vi.fn(
      (
        type: string,
        handler: EventListenerOrEventListenerObject,
        options?: EventListenerOptions | boolean
      ) => {
        if (type === 'scroll' && handler === mockScrollHandler) {
          mockScrollHandler = null;
        }
        originalRemoveEventListener(type, handler, options);
      }
    ) as typeof element.removeEventListener;

    return element;
  };

  return {
    getMockElement: () => mockElement,
    setMockElement: (el: HTMLElement | null) => {
      mockElement = el;
    },
    getScrollHandler: () => mockScrollHandler,
    createMockElement,
  };
});

vi.mock('jquery', () => {
  const jQueryMock = vi.fn((selector: string | HTMLElement) => {
    const element =
      typeof selector === 'string' ? mocks.getMockElement() : selector;
    return {
      length: element ? 1 : 0,
      get: vi.fn().mockReturnValue(element),
      0: element,
    };
  });
  return {default: jQueryMock};
});

// Import after mocking
const {ScrollPositionSource} = await import(
  '@timelineproviders/position-sources/scroll-position-source.ts'
);

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type ScrollPositionSourceTestContext = {
  source: InstanceType<typeof ScrollPositionSource>;
  mockElement: HTMLElement;
  positionCallback: Mock<(position: number) => void>;
  boundaryCallback: Mock<(boundary: TBoundary) => void>;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ScrollPositionSource', () => {
  beforeEach<ScrollPositionSourceTestContext>(context => {
    vi.clearAllMocks();

    // Create mock element
    const mockElement = mocks.createMockElement();
    mocks.setMockElement(mockElement);
    context.mockElement = mockElement;

    // Create source with 100 second duration
    context.source = new ScrollPositionSource({
      selector: '#scroll-container',
      duration: 100,
    });

    // Create callbacks
    context.positionCallback = vi.fn();
    context.boundaryCallback = vi.fn();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Initialization Tests (T026)
  // ───────────────────────────────────────────────────────────────────────────

  describe('initialization', () => {
    test<ScrollPositionSourceTestContext>('given valid selector, when init called, then resolves successfully', async ({
      source,
    }) => {
      await expect(source.init()).resolves.toBeUndefined();
    });

    test<ScrollPositionSourceTestContext>('given valid selector, when init called, then element is found via jQuery', async ({
      source,
    }) => {
      await source.init();
      // jQuery should have been called with the selector
      const $ = (await import('jquery')).default;
      expect($).toHaveBeenCalledWith('#scroll-container');
    });

    test<ScrollPositionSourceTestContext>('given config with duration, when getDuration called, then returns configured duration', async ({
      source,
    }) => {
      await source.init();
      expect(source.getDuration()).toBe(100);
    });

    test<ScrollPositionSourceTestContext>('given new source, when state checked, then is inactive', ({
      source,
    }) => {
      expect(source.state).toBe('inactive');
    });

    test<ScrollPositionSourceTestContext>('given new source, when position checked, then is zero', ({
      source,
    }) => {
      expect(source.getPosition()).toBe(0);
    });

    test<ScrollPositionSourceTestContext>('given invalid selector, when init called, then rejects with error', async () => {
      mocks.setMockElement(null);
      const source = new ScrollPositionSource({
        selector: '#nonexistent',
        duration: 100,
      });

      await expect(source.init()).rejects.toThrow('Element not found');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Position Calculation Tests (T027)
  // ───────────────────────────────────────────────────────────────────────────

  describe('position calculation', () => {
    test<ScrollPositionSourceTestContext>('given scrollTop at 0, when scroll event fired, then position is 0', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      await source.init();
      source.onPosition(positionCallback);
      await source.activate();

      // Scroll at top
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 0,
        writable: true,
        configurable: true,
      });

      // Trigger scroll event
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(positionCallback).toHaveBeenCalledWith(0);
    });

    test<ScrollPositionSourceTestContext>('given scrollTop at 50%, when scroll event fired, then position is half of duration', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      await source.init();
      source.onPosition(positionCallback);
      await source.activate();

      // scrollableHeight = scrollHeight - clientHeight = 1000 - 200 = 800
      // 50% of 800 = 400
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 400,
        writable: true,
        configurable: true,
      });

      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(positionCallback).toHaveBeenCalledWith(50);
    });

    test<ScrollPositionSourceTestContext>('given scrollTop at 100%, when scroll event fired, then position equals duration', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      await source.init();
      source.onPosition(positionCallback);
      await source.activate();

      // scrollableHeight = 800, 100% = 800
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 800,
        writable: true,
        configurable: true,
      });

      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(positionCallback).toHaveBeenCalledWith(100);
    });

    test<ScrollPositionSourceTestContext>('given scroll updates, when getPosition called, then returns current position', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Scroll to 25%
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 200,
        writable: true,
        configurable: true,
      });

      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(source.getPosition()).toBe(25);
    });

    test<ScrollPositionSourceTestContext>('given source not active, when scroll event fired, then position callback not called', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      await source.init();
      source.onPosition(positionCallback);
      // Not activated

      Object.defineProperty(mockElement, 'scrollTop', {
        value: 400,
        writable: true,
        configurable: true,
      });

      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(positionCallback).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // State Transition Tests (T028)
  // ───────────────────────────────────────────────────────────────────────────

  describe('state transitions', () => {
    test<ScrollPositionSourceTestContext>('given inactive source, when activate called, then state becomes active', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      expect(source.state).toBe('active');
    });

    test<ScrollPositionSourceTestContext>('given active source, when suspend called, then state becomes suspended', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.suspend();
      expect(source.state).toBe('suspended');
    });

    test<ScrollPositionSourceTestContext>('given active source, when deactivate called, then state becomes inactive', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.deactivate();
      expect(source.state).toBe('inactive');
    });

    test<ScrollPositionSourceTestContext>('given suspended source, when activate called, then state becomes active', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.suspend();
      await source.activate();
      expect(source.state).toBe('active');
    });

    test<ScrollPositionSourceTestContext>('given suspended source, when deactivate called, then state becomes inactive', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.suspend();
      source.deactivate();
      expect(source.state).toBe('inactive');
    });

    test<ScrollPositionSourceTestContext>('given suspended source, when position checked, then position is preserved', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Scroll to position
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 200,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      source.suspend();
      expect(source.getPosition()).toBe(25);
    });

    test<ScrollPositionSourceTestContext>('given inactive source after deactivate, when position checked, then position is zero', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Scroll to position
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 200,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      source.deactivate();
      expect(source.getPosition()).toBe(0);
    });

    test<ScrollPositionSourceTestContext>('given suspended source, when scroll event fired, then position callback not called', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      await source.init();
      source.onPosition(positionCallback);
      await source.activate();
      positionCallback.mockClear();

      source.suspend();

      Object.defineProperty(mockElement, 'scrollTop', {
        value: 400,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(positionCallback).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Seek Tests (T029)
  // ───────────────────────────────────────────────────────────────────────────

  describe('seek', () => {
    test<ScrollPositionSourceTestContext>('given active source, when seek called with position, then scrollTop is set', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Create a spy for scrollTo
      const scrollToSpy = vi.fn();
      mockElement.scrollTo = scrollToSpy;

      await source.seek(50);

      // 50% of 800 = 400
      expect(scrollToSpy).toHaveBeenCalledWith({top: 400, behavior: 'smooth'});
    });

    test<ScrollPositionSourceTestContext>('given active source, when seek called, then returns actual position after scroll', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Mock scrollTo and simulate scroll event
      mockElement.scrollTo = vi.fn((_options?: ScrollToOptions | number) => {
        Object.defineProperty(mockElement, 'scrollTop', {
          value: 400,
          writable: true,
          configurable: true,
        });
        const scrollHandler = mocks.getScrollHandler();
        scrollHandler?.(new Event('scroll'));
      }) as typeof mockElement.scrollTo;

      const result = await source.seek(50);
      expect(result).toBe(50);
    });

    test<ScrollPositionSourceTestContext>('given seek to start, when at end, then scrollTop becomes 0', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      // Start at end
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 800,
        writable: true,
        configurable: true,
      });

      const scrollToSpy = vi.fn();
      mockElement.scrollTo = scrollToSpy;

      await source.seek(0);

      expect(scrollToSpy).toHaveBeenCalledWith({top: 0, behavior: 'smooth'});
    });

    test<ScrollPositionSourceTestContext>('given seek to end, when at start, then scrollTop becomes max', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      const scrollToSpy = vi.fn();
      mockElement.scrollTo = scrollToSpy;

      await source.seek(100);

      // 100% of 800 = 800
      expect(scrollToSpy).toHaveBeenCalledWith({top: 800, behavior: 'smooth'});
    });

    test<ScrollPositionSourceTestContext>('given inactive source, when seek called, then returns current position without scrolling', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      // Not activated

      const scrollToSpy = vi.fn();
      mockElement.scrollTo = scrollToSpy;

      const result = await source.seek(50);

      expect(scrollToSpy).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Boundary Detection Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('boundary detection', () => {
    test<ScrollPositionSourceTestContext>('given scroll reaches end, when boundary callback registered, then end boundary emitted', async ({
      source,
      mockElement,
      boundaryCallback,
    }) => {
      await source.init();
      source.onBoundaryReached(boundaryCallback);
      await source.activate();

      // Scroll to end
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 800,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test<ScrollPositionSourceTestContext>('given scroll reaches start, when boundary callback registered, then start boundary emitted', async ({
      source,
      mockElement,
      boundaryCallback,
    }) => {
      await source.init();
      source.onBoundaryReached(boundaryCallback);
      await source.activate();

      // First scroll away from start
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 200,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      // Then scroll back to start
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 0,
        writable: true,
        configurable: true,
      });
      scrollHandler?.(new Event('scroll'));

      expect(boundaryCallback).toHaveBeenCalledWith('start');
    });

    test<ScrollPositionSourceTestContext>('given loop enabled and scroll reaches end, when scrolled, then position resets to start', async ({
      source,
      mockElement,
      positionCallback,
    }) => {
      source.loop = true;
      await source.init();
      source.onPosition(positionCallback);
      await source.activate();

      // Mock scrollTo for loop reset
      mockElement.scrollTo = vi.fn((_options?: ScrollToOptions | number) => {
        Object.defineProperty(mockElement, 'scrollTop', {
          value: 0,
          writable: true,
          configurable: true,
        });
        const scrollHandler = mocks.getScrollHandler();
        scrollHandler?.(new Event('scroll'));
      }) as typeof mockElement.scrollTo;

      // Scroll to end
      Object.defineProperty(mockElement, 'scrollTop', {
        value: 800,
        writable: true,
        configurable: true,
      });
      const scrollHandler = mocks.getScrollHandler();
      scrollHandler?.(new Event('scroll'));

      // Position should have reset to 0 after loop
      expect(source.getPosition()).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Cleanup Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('cleanup', () => {
    test<ScrollPositionSourceTestContext>('given active source, when destroy called, then scroll listener removed', async ({
      source,
      mockElement,
    }) => {
      await source.init();
      await source.activate();

      source.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        expect.any(Object)
      );
    });

    test<ScrollPositionSourceTestContext>('given destroyed source, when state checked, then is inactive', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.destroy();
      expect(source.state).toBe('inactive');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Loop Property Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('loop property', () => {
    test<ScrollPositionSourceTestContext>('given new source, when loop checked, then is false by default', ({
      source,
    }) => {
      expect(source.loop).toBe(false);
    });

    test<ScrollPositionSourceTestContext>('given source, when loop set to true, then loop is true', ({
      source,
    }) => {
      source.loop = true;
      expect(source.loop).toBe(true);
    });
  });
});
