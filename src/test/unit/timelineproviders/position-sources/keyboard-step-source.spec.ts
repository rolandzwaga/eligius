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

// Use vi.hoisted for shared mock state. The mock models hotkeys-js 4: one
// global current scope, handler records with a key, scope, element and
// method, dispatch to records whose scope is the current scope or 'all', and
// unbind by key, scope and method.
const mocks = vi.hoisted(() => {
  type THandlerRecord = {
    key: string;
    scope: string;
    element: unknown;
    method: (event: KeyboardEvent) => void;
  };
  const records: THandlerRecord[] = [];
  let currentScope = 'all';

  const dispatch = (
    element: unknown,
    key: string,
    modifiers: {shift?: boolean}
  ): KeyboardEvent => {
    const event = {
      key,
      shiftKey: modifiers.shift ?? false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    for (const record of [...records]) {
      if (
        record.key === key &&
        record.element === element &&
        (record.scope === currentScope || record.scope === 'all')
      ) {
        record.method(event);
      }
    }
    return event;
  };

  return {
    records,
    getCurrentScope: () => currentScope,
    setCurrentScope: (scope: string) => {
      currentScope = scope || 'all';
    },

    // Key press on the document (reaches only handlers bound without an element)
    simulateKeyPress: (key: string, modifiers: {shift?: boolean} = {}) =>
      dispatch(document, key, modifiers),

    // Key press on an element (reaches only handlers bound to that element)
    simulateKeyPressOnElement: (
      element: HTMLElement,
      key: string,
      modifiers: {shift?: boolean} = {}
    ) => dispatch(element, key, modifiers),

    handlerCount: () => records.length,

    reset: () => {
      records.length = 0;
      currentScope = 'all';
    },
  };
});

// Mock hotkeys-js
vi.mock('hotkeys-js', () => {
  const hotkeysFn = vi.fn(
    (
      keys: string,
      optionsOrHandler:
        | string
        | {element?: HTMLElement; scope?: string}
        | ((event: KeyboardEvent) => void),
      handler?: (event: KeyboardEvent) => void
    ) => {
      const method =
        typeof optionsOrHandler === 'function' ? optionsOrHandler : handler!;
      let scope = 'all';
      let element: unknown = document;
      if (typeof optionsOrHandler === 'string') {
        scope = optionsOrHandler;
      } else if (typeof optionsOrHandler === 'object') {
        scope = optionsOrHandler.scope ?? 'all';
        element = optionsOrHandler.element ?? document;
      }
      for (const key of keys.split(',').map(k => k.trim())) {
        mocks.records.push({key, scope, element, method});
      }
    }
  );

  const hotkeys = hotkeysFn as typeof hotkeysFn & {
    setScope: ReturnType<typeof vi.fn>;
    getScope: ReturnType<typeof vi.fn>;
    deleteScope: ReturnType<typeof vi.fn>;
    unbind: ReturnType<typeof vi.fn>;
  };

  hotkeys.setScope = vi.fn((scope: string) => {
    mocks.setCurrentScope(scope);
  });

  hotkeys.getScope = vi.fn(() => mocks.getCurrentScope());

  // Removes the scope's handlers; resets the current scope only when it is
  // the deleted one
  hotkeys.deleteScope = vi.fn((scope: string, newScope?: string) => {
    for (let i = mocks.records.length - 1; i >= 0; i--) {
      if (mocks.records[i].scope === scope) {
        mocks.records.splice(i, 1);
      }
    }
    if (mocks.getCurrentScope() === scope) {
      mocks.setCurrentScope(newScope || 'all');
    }
  });

  hotkeys.unbind = vi.fn(
    (
      key: string,
      scopeOrMethod?: string | ((event: KeyboardEvent) => void),
      method?: (event: KeyboardEvent) => void
    ) => {
      let scope = typeof scopeOrMethod === 'string' ? scopeOrMethod : '';
      const handler =
        typeof scopeOrMethod === 'function' ? scopeOrMethod : method;
      if (!scope) {
        scope = mocks.getCurrentScope();
      }
      for (let i = mocks.records.length - 1; i >= 0; i--) {
        const record = mocks.records[i];
        if (
          record.key === key &&
          record.scope === scope &&
          (!handler || record.method === handler)
        ) {
          mocks.records.splice(i, 1);
        }
      }
    }
  );

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

    test('given position 0 and wrap, when left arrow pressed, then no boundary is emitted', async () => {
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

      expect(source.getPosition()).toBe(60);
      expect(boundaryCallback).not.toHaveBeenCalled();
    });

    test('given position 0 and wrap, when shift+left pressed, then it wraps to the end without emitting a boundary', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('shift+left');

      expect(source.getPosition()).toBe(60);
      expect(boundaryCallback).not.toHaveBeenCalled();
    });

    test('given position one step before the end, when right arrow pressed, then end boundary is emitted', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: true,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      await source.seek(59);

      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(60);
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

    test('given wrap off and position 59.5 of 60, when right arrow pressed, then position clamps to 60 and end is emitted once', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: false,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      await source.seek(59.5);

      mocks.simulateKeyPress('right');
      mocks.simulateKeyPress('right');

      expect(source.getPosition()).toBe(60);
      expect(boundaryCallback).toHaveBeenCalledTimes(1);
      expect(boundaryCallback).toHaveBeenCalledWith('end');
    });

    test('given wrap off and position 55 of 60, when shift+right pressed, then end boundary is emitted', async () => {
      const boundaryCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'disabled',
        wrapNavigation: false,
      });
      source.onBoundaryReached(boundaryCallback);
      await source.init();
      await source.activate();
      await source.seek(55);

      mocks.simulateKeyPress('shift+right');

      expect(source.getPosition()).toBe(60);
      expect(boundaryCallback).toHaveBeenCalledWith('end');
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

    test('given markers [5, 10, 20] at position 0, when down arrow pressed, then position is 5 and onMarkerJump is called with (0, 5)', async () => {
      const markerJumpCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [5, 10, 20],
      });
      source.onMarkerJump(markerJumpCallback);
      await source.init();
      await source.activate();

      mocks.simulateKeyPress('down');

      expect(source.getPosition()).toBe(5);
      expect(markerJumpCallback).toHaveBeenCalledWith(0, 5);
    });

    test('given markers [5, 10, 20] at position 2 with wrap, when up arrow pressed, then it wraps to the last marker', async () => {
      const markerJumpCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [5, 10, 20],
      });
      source.onMarkerJump(markerJumpCallback);
      await source.init();
      await source.activate();
      await source.seek(2);

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(20);
      expect(markerJumpCallback).toHaveBeenCalledWith(2, 20);
    });

    test('given markers [5, 10, 20] at position 2 without wrap, when up arrow pressed, then position does not move', async () => {
      const markerJumpCallback = vi.fn();
      const source = new KeyboardStepSource({
        duration: 60,
        verticalMode: 'chapter-navigation',
        markers: [5, 10, 20],
        wrapNavigation: false,
      });
      source.onMarkerJump(markerJumpCallback);
      await source.init();
      await source.activate();
      await source.seek(2);

      mocks.simulateKeyPress('up');

      expect(source.getPosition()).toBe(2);
      expect(markerJumpCallback).not.toHaveBeenCalled();
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
    const getTotalHandlerCount = () => mocks.handlerCount();

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

describe('KeyboardStepSource fractional steps', () => {
  beforeEach(() => {
    mocks.reset();
  });

  test('given KeyboardStepSource with duration 1 and stepSize 0.1, when right arrow is pressed ten times, then position is exactly 1 and the end boundary is emitted', async () => {
    const source = new KeyboardStepSource({
      duration: 1,
      verticalMode: 'disabled',
      stepSize: 0.1,
    });
    const positions: number[] = [];
    const boundaries: TBoundary[] = [];
    source.onPosition(p => positions.push(p));
    source.onBoundaryReached(b => boundaries.push(b));
    await source.init();
    await source.activate();
    positions.length = 0;

    for (let i = 0; i < 10; i++) {
      mocks.simulateKeyPress('right');
    }

    expect(positions).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    expect(source.getPosition()).toBe(1);
    expect(boundaries).toEqual(['end']);
  });

  test('given position 1 of 1 after ten 0.1 steps, when right arrow is pressed again with wrap on, then it wraps to 0', async () => {
    const source = new KeyboardStepSource({
      duration: 1,
      verticalMode: 'disabled',
      stepSize: 0.1,
    });
    const boundaries: TBoundary[] = [];
    source.onBoundaryReached(b => boundaries.push(b));
    await source.init();
    await source.activate();

    for (let i = 0; i < 11; i++) {
      mocks.simulateKeyPress('right');
    }

    expect(source.getPosition()).toBe(0);
    expect(boundaries).toEqual(['end', 'start']);
  });

  test('given position 1 with stepSize 0.1, when left arrow is pressed ten times, then every position is exact and it lands on 0', async () => {
    const source = new KeyboardStepSource({
      duration: 1,
      verticalMode: 'disabled',
      stepSize: 0.1,
      wrapNavigation: false,
    });
    const positions: number[] = [];
    source.onPosition(p => positions.push(p));
    await source.init();
    await source.activate();
    await source.seek(1);
    positions.length = 0;

    for (let i = 0; i < 10; i++) {
      mocks.simulateKeyPress('left');
    }

    expect(positions).toEqual([0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0]);
  });
});

describe('KeyboardStepSource and the global hotkeys-js scope', () => {
  beforeEach(() => {
    mocks.reset();
  });

  test("given host set hotkeys scope to 'editor', when KeyboardStepSource is activated and then deactivated, then hotkeys.getScope() returns 'editor'", async () => {
    const hotkeys = (await import('hotkeys-js')).default;
    hotkeys.setScope('editor');
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    await source.init();

    await source.activate();
    expect(hotkeys.getScope()).toBe('editor');

    source.deactivate();
    expect(hotkeys.getScope()).toBe('editor');
  });

  test("given a host handler bound in the 'editor' scope, when the source is active, then both the host handler and the source's keys still work", async () => {
    const hotkeys = (await import('hotkeys-js')).default;
    const hostSave = vi.fn();
    hotkeys('ctrl+s', {scope: 'editor'}, hostSave);
    hotkeys.setScope('editor');
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    await source.init();
    await source.activate();

    mocks.simulateKeyPress('ctrl+s');
    mocks.simulateKeyPress('right');

    expect(hostSave).toHaveBeenCalledTimes(1);
    expect(source.getPosition()).toBe(1);
  });

  test('given two active keyboard sources, when one is deactivated, then the other keeps its key bindings', async () => {
    const first = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    const second = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    await first.init();
    await second.init();
    await first.activate();
    await second.activate();

    first.deactivate();
    mocks.simulateKeyPress('right');

    expect(first.getPosition()).toBe(0);
    expect(second.getPosition()).toBe(1);
  });
});

describe('KeyboardStepSource target element and vertical keys', () => {
  beforeEach(() => {
    mocks.reset();
  });

  test('given a targetElement selector that matches nothing, when init is called, then it rejects naming the selector', async () => {
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
      targetElement: '#does-not-exist',
    });

    await expect(source.init()).rejects.toThrow(
      "KeyboardStepSource: target element not found for selector '#does-not-exist'"
    );
  });

  test('given timeline-switch mode without a change request listener, when Down is pressed, then the default page scroll is not prevented', async () => {
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'timeline-switch',
    });
    await source.init();
    await source.activate();

    const event = mocks.simulateKeyPress('down');

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('given timeline-switch mode with a change request listener, when Down is pressed, then the default is prevented and the listener is called', async () => {
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'timeline-switch',
    });
    const listener = vi.fn();
    source.onTimelineChangeRequest(listener);
    await source.init();
    await source.activate();

    const event = mocks.simulateKeyPress('down');

    expect(event.preventDefault).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith('next');
  });

  test('given registered change request and marker listeners, when the returned unsubscribe functions are called, then they no longer fire', async () => {
    const switchSource = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'timeline-switch',
    });
    const changeListener = vi.fn();
    switchSource.onTimelineChangeRequest(changeListener)();
    await switchSource.init();
    await switchSource.activate();
    mocks.simulateKeyPress('down');
    switchSource.destroy();

    const chapterSource = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'chapter-navigation',
      markers: [10, 20],
    });
    const markerListener = vi.fn();
    chapterSource.onMarkerJump(markerListener)();
    await chapterSource.init();
    await chapterSource.activate();
    mocks.simulateKeyPress('down');

    expect(changeListener).not.toHaveBeenCalled();
    expect(markerListener).not.toHaveBeenCalled();
    expect(chapterSource.getPosition()).toBe(10);
  });

  test('given a destroyed source, when activate is called, then it rejects and binds no keys', async () => {
    const source = new KeyboardStepSource({
      duration: 60,
      verticalMode: 'disabled',
    });
    await source.init();
    source.destroy();

    await expect(source.activate()).rejects.toThrow(/destroyed/);
    expect(mocks.handlerCount()).toBe(0);
  });
});
