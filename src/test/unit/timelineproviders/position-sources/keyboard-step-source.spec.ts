import type {TBoundary} from '@timelineproviders/types.ts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// Use vi.hoisted for shared mock state
const mocks = vi.hoisted(() => {
  // Scope-based handlers: scope -> key -> handler
  const scopeHandlers = new Map<
    string,
    Map<string, (event: KeyboardEvent) => void>
  >();
  // Track which scopes have element bindings
  const scopeElements = new Map<string, HTMLElement>();
  let currentScope = 'all';

  return {
    scopeHandlers,
    scopeElements,
    getCurrentScope: () => currentScope,
    setCurrentScope: (scope: string) => {
      currentScope = scope;
    },

    // Simulate key press (will look up handler in current scope, but skip element-bound handlers)
    simulateKeyPress: (key: string, modifiers: {shift?: boolean} = {}) => {
      // If the current scope has an element binding, don't trigger (global press doesn't reach element-bound handlers)
      if (scopeElements.has(currentScope)) {
        return;
      }
      const handlers = scopeHandlers.get(currentScope);
      if (handlers) {
        const handler = handlers.get(key);
        if (handler) {
          const event = {
            key,
            shiftKey: modifiers.shift ?? false,
            preventDefault: vi.fn(),
          } as unknown as KeyboardEvent;
          handler(event);
        }
      }
    },

    // Simulate key press (scoped to element - finds scope by element)
    simulateKeyPressOnElement: (
      element: HTMLElement,
      key: string,
      modifiers: {shift?: boolean} = {}
    ) => {
      // Find scope for this element
      for (const [scope, el] of scopeElements.entries()) {
        if (el === element) {
          const handlers = scopeHandlers.get(scope);
          if (handlers) {
            const handler = handlers.get(key);
            if (handler) {
              const event = {
                key,
                shiftKey: modifiers.shift ?? false,
                preventDefault: vi.fn(),
              } as unknown as KeyboardEvent;
              handler(event);
            }
          }
          return;
        }
      }
    },

    reset: () => {
      scopeHandlers.clear();
      scopeElements.clear();
      currentScope = 'all';
    },
  };
});

// Mock hotkeys-js
vi.mock('hotkeys-js', () => {
  // Create base mock function
  const hotkeysFn = vi.fn(
    (
      keys: string,
      optionsOrHandler:
        | {element?: HTMLElement; scope?: string}
        | ((event: KeyboardEvent) => void),
      handler?: (event: KeyboardEvent) => void
    ) => {
      const actualHandler =
        typeof optionsOrHandler === 'function' ? optionsOrHandler : handler!;
      const options =
        typeof optionsOrHandler === 'object' ? optionsOrHandler : {};

      // Parse comma-separated keys
      const keyList = keys.split(',').map(k => k.trim());

      // Determine scope (default to 'all')
      const scope = options.scope ?? 'all';

      // Ensure scope exists
      if (!mocks.scopeHandlers.has(scope)) {
        mocks.scopeHandlers.set(scope, new Map());
      }

      // Track element if provided
      if (options.element) {
        mocks.scopeElements.set(scope, options.element);
      }

      // Store handlers in scope
      const handlers = mocks.scopeHandlers.get(scope)!;
      for (const key of keyList) {
        handlers.set(key, actualHandler);
      }
    }
  );

  // Cast to add additional properties
  const hotkeys = hotkeysFn as typeof hotkeysFn & {
    setScope: ReturnType<typeof vi.fn>;
    getScope: ReturnType<typeof vi.fn>;
    deleteScope: ReturnType<typeof vi.fn>;
    unbind: ReturnType<typeof vi.fn>;
  };

  // Mock setScope
  hotkeys.setScope = vi.fn((scope: string) => {
    mocks.setCurrentScope(scope);
  });

  // Mock getScope
  hotkeys.getScope = vi.fn(() => mocks.getCurrentScope());

  // Mock deleteScope - removes all handlers for a scope
  hotkeys.deleteScope = vi.fn((scope: string) => {
    mocks.scopeHandlers.delete(scope);
    mocks.scopeElements.delete(scope);
  });

  // Mock unbind (kept for compatibility but not used by new implementation)
  hotkeys.unbind = vi.fn();

  return {default: hotkeys};
});

// Import after mock setup
import {KeyboardStepSource} from '@timelineproviders/position-sources/keyboard-step-source.ts';

type KeyboardStepSourceTestContext = {
  source: KeyboardStepSource;
  positionCallback: Mock<(position: number) => void>;
  boundaryCallback: Mock<(boundary: TBoundary) => void>;
  activatedCallback: Mock<() => void>;
  timelineChangeCallback: Mock<(direction: 'prev' | 'next') => void>;
  markerJumpCallback: Mock<(markerIndex: number, position: number) => void>;
} & TestContext;

describe('KeyboardStepSource', () => {
  beforeEach<KeyboardStepSourceTestContext>(context => {
    mocks.reset();

    context.source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    context.positionCallback = vi.fn();
    context.boundaryCallback = vi.fn();
    context.activatedCallback = vi.fn();
    context.timelineChangeCallback = vi.fn();
    context.markerJumpCallback = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor and configuration tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('constructor and configuration', () => {
    test<KeyboardStepSourceTestContext>('should start in inactive state', ({
      source,
    }) => {
      expect(source.state).toBe('inactive');
    });

    test<KeyboardStepSourceTestContext>('should have position 0 initially', ({
      source,
    }) => {
      expect(source.getPosition()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should return configured duration', ({
      source,
    }) => {
      expect(source.getDuration()).toBe(60);
    });

    test('should use default stepSize of 1', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(1);
    });

    test('should use configured stepSize', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        stepSize: 5,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(5);
    });

    test('should use default largeStepSize of 10', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('shift+right');

      expect(source.getPosition()).toBe(10);
    });

    test('should use configured largeStepSize', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        largeStepSize: 15,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('shift+right');

      expect(source.getPosition()).toBe(15);
    });

    test('should default wrapNavigation to true', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
      });
      await source.init();
      await source.activate();

      // At position 0, left should wrap to duration
      mocks.simulateKeyPress('left');

      expect(source.getPosition()).toBe(60);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Horizontal navigation (left/right arrows) tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('horizontal navigation', () => {
    test<KeyboardStepSourceTestContext>('should step forward on right arrow', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('right');
      expect(source.getPosition()).toBe(1);

      mocks.simulateKeyPress('right');
      expect(source.getPosition()).toBe(2);
    });

    test<KeyboardStepSourceTestContext>('should step backward on left arrow', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(10);

      mocks.simulateKeyPress('left');
      expect(source.getPosition()).toBe(9);

      mocks.simulateKeyPress('left');
      expect(source.getPosition()).toBe(8);
    });

    test<KeyboardStepSourceTestContext>('should emit position callback on navigation', async ({
      source,
      positionCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();
      positionCallback.mockClear();

      mocks.simulateKeyPress('right');

      expect(positionCallback).toHaveBeenCalledWith(1);
    });

    test<KeyboardStepSourceTestContext>('should not respond to keys when inactive', async ({
      source,
    }) => {
      await source.init();
      // Not activated

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should not respond to keys when suspended', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(5);
      source.suspend();

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Shift modifier tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('shift modifier (large step)', () => {
    test<KeyboardStepSourceTestContext>('should large step forward on shift+right', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('shift+right');

      expect(source.getPosition()).toBe(10);
    });

    test<KeyboardStepSourceTestContext>('should large step backward on shift+left', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('shift+left');

      expect(source.getPosition()).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Home/End key tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Home/End navigation', () => {
    test<KeyboardStepSourceTestContext>('should jump to start on Home key', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('home');

      expect(source.getPosition()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should jump to end on End key', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('end');

      expect(source.getPosition()).toBe(60);
    });

    test<KeyboardStepSourceTestContext>('should emit boundary callback on Home', async ({
      source,
      boundaryCallback,
    }) => {
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('home');

      expect(boundaryCallback).toHaveBeenCalledWith('start');
    });

    test<KeyboardStepSourceTestContext>('should emit boundary callback on End', async ({
      source,
      boundaryCallback,
    }) => {
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('end');

      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Wrap vs clamp boundary behavior tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('boundary behavior: wrap (default)', () => {
    test('should wrap from start to end on left arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('left');

      expect(source.getPosition()).toBe(60);
    });

    test('should wrap from end to start on right arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      await source.init();
      await source.activate();
      await source.seek(60);

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(0);
    });

    test('should emit both boundaries on wrap from start', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('left');

      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test('should emit both boundaries on wrap from end', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      await source.seek(60);

      mocks.simulateKeyPress('right');

      expect(boundaryCallback).toHaveBeenCalledWith('start');
    });
  });

  describe('boundary behavior: clamp', () => {
    test('should clamp at start on left arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: false,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('left');

      expect(source.getPosition()).toBe(0);
    });

    test('should clamp at end on right arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: false,
      });
      await source.init();
      await source.activate();
      await source.seek(60);

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(60);
    });

    test('should not emit boundary when clamped at start', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: false,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('left');

      expect(boundaryCallback).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical mode: timeline-switch tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('vertical mode: timeline-switch', () => {
    test('should emit timeline change request on up arrow', async () => {
      const timelineChangeCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'timeline-switch',
      });
      source.onTimelineChangeRequest(timelineChangeCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('up');

      expect(timelineChangeCallback).toHaveBeenCalledWith('prev');
    });

    test('should emit timeline change request on down arrow', async () => {
      const timelineChangeCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'timeline-switch',
      });
      source.onTimelineChangeRequest(timelineChangeCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('down');

      expect(timelineChangeCallback).toHaveBeenCalledWith('next');
    });

    test('should support multiple timeline change callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'timeline-switch',
      });
      source.onTimelineChangeRequest(callback1);
      source.onTimelineChangeRequest(callback2);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('up');

      expect(callback1).toHaveBeenCalledWith('prev');
      expect(callback2).toHaveBeenCalledWith('prev');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical mode: chapter-navigation tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('vertical mode: chapter-navigation', () => {
    test('should seek to next marker on down arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('down');

      expect(source.getPosition()).toBe(10);
    });

    test('should seek to previous marker on up arrow', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
      });
      await source.init();
      await source.activate();
      await source.seek(15);

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(10);
    });

    test('should find previous marker when between markers', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
      });
      await source.init();
      await source.activate();
      await source.seek(25);

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(20);
    });

    test('should wrap to last marker on up when at first marker', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
        wrapNavigation: true,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(30);
    });

    test('should wrap to first marker on down when at last marker', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
        wrapNavigation: true,
      });
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('down');

      expect(source.getPosition()).toBe(0);
    });

    test('should clamp at first marker when wrapNavigation is false', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
        wrapNavigation: false,
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(0);
    });

    test('should clamp at last marker when wrapNavigation is false', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
        wrapNavigation: false,
      });
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('down');

      expect(source.getPosition()).toBe(30);
    });

    test('should emit marker jump callback', async () => {
      const markerJumpCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [0, 10, 20, 30],
      });
      source.onMarkerJump(markerJumpCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('down');

      expect(markerJumpCallback).toHaveBeenCalledWith(1, 10);
    });

    test('should auto-sort markers on init', async () => {
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [30, 10, 0, 20], // Unsorted
      });
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('down');
      expect(source.getPosition()).toBe(10); // Should be second marker after sort
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Vertical mode: disabled tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('vertical mode: disabled', () => {
    test<KeyboardStepSourceTestContext>('should not respond to up arrow', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(30);
    });

    test<KeyboardStepSourceTestContext>('should not respond to down arrow', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      await source.seek(30);

      mocks.simulateKeyPress('down');

      expect(source.getPosition()).toBe(30);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Target element scoping tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('targetElement scoping', () => {
    test('should bind to specific element when provided', async () => {
      const element = document.createElement('div');
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        targetElement: element,
      });
      await source.init();
      await source.activate();

      // Global key press should not work
      mocks.simulateKeyPress('right');
      expect(source.getPosition()).toBe(0);

      // Element-scoped key press should work
      mocks.simulateKeyPressOnElement(element, 'right');
      expect(source.getPosition()).toBe(1);
    });

    test('should resolve selector string to element', async () => {
      const element = document.createElement('div');
      element.id = 'test-container';
      document.body.appendChild(element);

      try {
        const source = new KeyboardStepSource({
          duration: 60,
          verticalMode: 'disabled',
          targetElement: '#test-container',
        });
        await source.init();
        await source.activate();

        mocks.simulateKeyPressOnElement(element, 'right');
        expect(source.getPosition()).toBe(1);
      } finally {
        document.body.removeChild(element);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard binding lifecycle tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('keyboard binding lifecycle', () => {
    // Helper to count total handlers across all scopes
    const getTotalHandlerCount = () => {
      let count = 0;
      for (const handlers of mocks.scopeHandlers.values()) {
        count += handlers.size;
      }
      return count;
    };

    test<KeyboardStepSourceTestContext>('should bind keys on activate', async ({
      source,
    }) => {
      await source.init();

      // Keys should not be bound yet
      expect(getTotalHandlerCount()).toBe(0);

      await source.activate();

      // Keys should now be bound
      expect(getTotalHandlerCount()).toBeGreaterThan(0);
    });

    test<KeyboardStepSourceTestContext>('should unbind keys on deactivate', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      expect(getTotalHandlerCount()).toBeGreaterThan(0);

      source.deactivate();

      expect(getTotalHandlerCount()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should unbind keys on suspend', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      expect(getTotalHandlerCount()).toBeGreaterThan(0);

      source.suspend();

      expect(getTotalHandlerCount()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should rebind keys on resume from suspend', async ({
      source,
    }) => {
      await source.init();
      await source.activate();
      source.suspend();

      expect(getTotalHandlerCount()).toBe(0);

      await source.activate();

      expect(getTotalHandlerCount()).toBeGreaterThan(0);
    });

    test<KeyboardStepSourceTestContext>('should unbind keys on destroy', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      source.destroy();

      expect(getTotalHandlerCount()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Seek functionality tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('seek functionality', () => {
    test<KeyboardStepSourceTestContext>('should implement ISeekable interface', ({
      source,
    }) => {
      expect(typeof source.seek).toBe('function');
    });

    test<KeyboardStepSourceTestContext>('should seek to specified position', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(30);

      expect(result).toBe(30);
      expect(source.getPosition()).toBe(30);
    });

    test<KeyboardStepSourceTestContext>('should clamp seek to 0 when negative', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(-10);

      expect(result).toBe(0);
      expect(source.getPosition()).toBe(0);
    });

    test<KeyboardStepSourceTestContext>('should clamp seek to duration when exceeding', async ({
      source,
    }) => {
      await source.init();
      await source.activate();

      const result = await source.seek(100);

      expect(result).toBe(60);
      expect(source.getPosition()).toBe(60);
    });

    test<KeyboardStepSourceTestContext>('should emit position callback after seek', async ({
      source,
      positionCallback,
    }) => {
      source.onPosition(positionCallback);
      await source.init();
      await source.activate();
      positionCallback.mockClear();

      await source.seek(25);

      expect(positionCallback).toHaveBeenCalledWith(25);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // onActivated callback tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('onActivated callback', () => {
    test<KeyboardStepSourceTestContext>('should emit activated callback when transitioning to active', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();
      await source.activate();

      expect(activatedCallback).toHaveBeenCalledTimes(1);
    });

    test<KeyboardStepSourceTestContext>('should not emit activated callback when already active', async ({
      source,
      activatedCallback,
    }) => {
      source.onActivated(activatedCallback);
      await source.init();
      await source.activate();
      activatedCallback.mockClear();

      await source.activate();

      expect(activatedCallback).not.toHaveBeenCalled();
    });
  });
});
