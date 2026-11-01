# Eligius Testing Guide

Comprehensive documentation for writing and maintaining tests in the Eligius project.

## Table of Contents

1. [Test Suite Overview](#test-suite-overview)
2. [Test Structure & Organization](#test-structure--organization)
3. [Test Fixtures](#test-fixtures)
4. [Mock Patterns](#mock-patterns)
   - [Basic vi.fn() Usage](#basic-vifn-usage)
   - [Inline Mock Objects](#inline-mock-objects)
   - [Mocking for Operations](#mocking-for-operations)
   - [Mocking Globals (window, document, fetch, timers)](#mocking-globals-window-document-fetch-timers)
   - [Module Mocking with vi.mock()](#module-mocking-with-vimock)
   - [Advanced: vi.hoisted() Pattern](#advanced-vihoisted-pattern)
   - [Native media elements (HTMLMediaElement) in jsdom](#native-media-elements-htmlmediaelement-in-jsdom)
5. [Timer Mocking](#timer-mocking)
   - [Using Fake Timers](#using-fake-timers)
   - [Timer API Reference](#timer-api-reference)
   - [Common Patterns](#common-patterns)
   - [Why Use advanceTimersByTimeAsync?](#why-use-advancetimersbyasync)
6. [Test Context Patterns](#test-context-patterns)
7. [Assertion Patterns](#assertion-patterns)
8. [Integration vs Unit Tests](#integration-vs-unit-tests)
9. [Helper Utilities](#helper-utilities)
10. [Best Practices](#best-practices)
11. [Running Tests](#running-tests)
    - [Test Pool & Performance](#test-pool--performance)
12. [Common Testing Patterns by Feature](#common-testing-patterns-by-feature)

---

## Test Suite Overview

The Eligius project uses **Vitest 5** as its testing framework with **jsdom** for browser API simulation.

**Test Statistics:**
- ~148 test files
- ~1100 tests
- 90% coverage requirement
- Full run ≈ 8–9s locally

**Key Configuration** (`src/vitest.config.ts`):
- Environment: jsdom (every spec gets a real `window`/`document` — never create your own `JSDOM`)
- Pool: `vmThreads` — jsdom is created once per worker, each spec file still gets a fresh window (see [Test Pool & Performance](#test-pool--performance))
- Setup file: `src/test/setup.ts`
- Automatic cleanup between tests: `clearMocks`, `restoreMocks`, `unstubGlobals`, `unstubEnvs`

---

## Test Structure & Organization

### Directory Structure

```
src/test/
├── setup.ts                          # Global test setup (mock lottie-web, etc.)
├── fixtures/                         # Reusable test factories and mocks
│   ├── action-factory.ts             # Mock action factory
│   ├── eventbus-factory.ts           # Mock eventbus factory
│   └── jquery-factory.ts             # Mock jQuery element factory
├── unit/                             # Unit tests (isolated component testing)
│   ├── action/
│   ├── configuration/
│   ├── controllers/
│   ├── eventbus/
│   ├── importer/
│   ├── operation/                    # ~92 operation tests
│   ├── performance/
│   ├── timelineproviders/
│   └── util/
└── integration/                      # Integration tests (multi-component workflows)
    ├── create-language-selector.spec.ts
    ├── end-in-correct-order.spec.ts
    ├── for-each-loop.spec.ts
    ├── re-use-image-action.spec.ts
    └── when-construction.spec.ts
```

### File Naming Convention

- Test files: `{feature-name}.spec.ts`
- Match source file structure: `src/operation/add-class.ts` → `src/test/unit/operation/add-class.spec.ts`

---

## Test Fixtures

All fixtures are in `src/test/fixtures/`. Use these instead of creating inline mocks.

### action-factory.ts

Creates mock action objects for testing controllers.

```typescript
import {createMockAction} from '../../fixtures/action-factory.ts';

const action = createMockAction('MyAction');

// Action has vi.fn() methods that track calls
action.start({data: 'value'});

expect(action.name).toBe('MyAction');
expect(action.startOperationData).toEqual({data: 'value'});
expect(action.start).toHaveBeenCalledWith({data: 'value'});
```

**Properties:**
- `name` - Action name string
- `startOperationData` - Tracks data passed to `start()`
- `endOperationData` - Tracks data passed to `end()`
- `start()` - vi.fn() returning Promise.resolve(operationData)
- `end()` - vi.fn() returning Promise.resolve(operationData)

### eventbus-factory.ts

Creates a functional mock eventbus with call tracking.

```typescript
import {createMockEventbus, getEventListenerCount} from '../../fixtures/eventbus-factory.ts';

const mockEventbus = createMockEventbus();

// Register handler
const handler = vi.fn();
mockEventbus.on('my-event', handler);

// Broadcast triggers registered handlers
mockEventbus.broadcast('my-event', [42]);

// Verify
expect(handler).toHaveBeenCalledWith(42);
expect(mockEventbus.broadcast).toHaveBeenCalledWith('my-event', [42]);

// Check listener count
expect(getEventListenerCount(mockEventbus, 'my-event')).toBe(1);
```

**Key Features:**
- All methods wrapped with `vi.fn()` for call verification
- Actually invokes registered handlers (not just tracking)
- Supports topics, interceptors, and event listeners
- `clear()` method for cleanup

### jquery-factory.ts

Creates mock jQuery elements implementing the chainable API.

```typescript
import {createMockJQueryElement, createMockJQuery} from '../../fixtures/jquery-factory.ts';

// Single element
const element = createMockJQueryElement();
element.addClass('active').css({color: 'red'});

expect(element.hasClass('active')).toBe(true);
expect(element.getCssProperties()).toEqual({color: 'red'});

// jQuery function
const $ = createMockJQuery();
const result = $('#selector');
```

**Supported Methods:**
- Class: `addClass`, `removeClass`, `toggleClass`, `hasClass`
- Content: `html`, `text`, `append`, `prepend`, `empty`
- Attributes: `attr`, `removeAttr`, `data`
- CSS: `css`, `width`, `height`, `show`, `hide`
- Events: `on`, `off`, `trigger`, `click`, `mouseup`, `mousedown`
- Traversal: `find`, `parent`, `children`, `eq`, `first`, `last`

**Test Helpers:**
- `getClassName()` - Get current class string
- `getListeners(event)` - Get handlers for event
- `getAttributes()` - Get all attributes
- `getCssProperties()` - Get all CSS properties

---

## Mock Patterns

### Basic vi.fn() Usage

```typescript
// Simple mock
const mockFn = vi.fn();
mockFn('arg');
expect(mockFn).toHaveBeenCalledWith('arg');

// With implementation
const mockAdd = vi.fn((a, b) => a + b);
expect(mockAdd(2, 3)).toBe(5);

// With return value
const mockGet = vi.fn().mockReturnValue({id: 1});

// With promise
const mockAsync = vi.fn().mockResolvedValue({success: true});
```

### Inline Mock Objects

For simple cases where fixtures are overkill:

```typescript
// Mock element with specific method
function createMockElement() {
  return {
    animate: vi.fn((props, duration, easing, callback) => {
      if (typeof callback === 'function') callback();
    }),
  };
}

// Mock eventbus with callback behavior
function createMockEventbusWithCallback(callback: Function) {
  return {
    broadcast: vi.fn((eventName, args) => {
      args[0](callback); // Invoke first arg as callback
    }),
  };
}
```

### Mocking for Operations

Operations often need elements with specific methods:

```typescript
// For addClass operation
const mockElement = {
  addClass: vi.fn(),
};

// For animate operation
const mockElement = {
  animate: vi.fn((props, duration, easing, callback) => {
    if (typeof easing === 'function') easing();
    else if (callback) callback();
  }),
};

// For select-element operation
function createMockElement(selectedElement: any) {
  return {
    find: vi.fn().mockReturnValue(selectedElement),
  };
}
```

### Mocking Globals (window, document, fetch, timers)

The jsdom environment already provides `window`, `document`, `history`, `location`, `fetch`, timers, etc. Mock them with **`vi.stubGlobal`** — never by assigning to `global`/`globalThis`/`window`.

```typescript
// GOOD: stubbed for this test only, restored automatically (`unstubGlobals: true`)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: async () => ({})}));
vi.stubGlobal('cancelAnimationFrame', () => {});
vi.stubGlobal('history', {state: null, pushState: vi.fn(), replaceState: vi.fn()});
vi.stubGlobal('pageXOffset', 150);

// BAD: throws under Vitest 5
(global as any).document = new JSDOM('...').window.document;
global.history = {pushState: vi.fn()};
delete (window as any).location;
```

**Why the assignment form breaks (Vitest 5):** assignments to `globalThis`/`window` properties are now propagated to the underlying jsdom `Window`. `document`, `history` and `location` are getter-only there, so the assignment throws `TypeError: Cannot set property document of [object Window] which has only a getter`. `vi.stubGlobal` uses `Object.defineProperty` and bypasses this.

Rules of thumb:

- **Stub inside `test`/`beforeEach`, not at `describe` level.** Stubs are removed after every test, so a describe-level stub only survives the first test.
- **No manual save/restore.** `unstubGlobals: true` and `restoreMocks: true` restore everything; drop `afterEach(() => { global.x = original })` plumbing.
- **Don't build a private `JSDOM`.** Use the environment's `document`; reset `document.body.innerHTML = ''` in `beforeEach` to isolate tests. This also keeps jQuery and the test on the same document.
- **Writable jsdom props can be assigned directly** (`window.scrollTo = vi.fn()`, `window.innerHeight = 800`) — but prefer `vi.stubGlobal` so they're restored.
- **Prototype getters:** spy on the accessor, e.g. `vi.spyOn(document, 'documentElement', 'get').mockReturnValue(el)`.
- **`window.location` cannot be replaced or deleted** (non-configurable on the jsdom window under the `vmThreads` pool). Set the URL through the real History API instead:

```typescript
// Capture before any test stubs `history`
const realHistory = window.history;
const setUrl = (url: string) => realHistory.replaceState(null, '', url);

beforeEach(() => {
  setUrl('/#/nav1');          // location.href / .hash now reflect this
  setUrl('/?test=true');      // location.search === '?test=true'
});
```

Reference specs: `unit/operation/get-scroll-position.spec.ts`, `unit/operation/get-query-params.spec.ts`, `unit/controllers/RoutingController.spec.ts`, `unit/operation/http-post.spec.ts`.

### Module Mocking with vi.mock()

Use `vi.mock()` to replace entire modules:

```typescript
// Basic module mock
vi.mock('some-module', () => ({
  someFunction: vi.fn().mockReturnValue('mocked'),
}));

// Mock with default export
vi.mock('hotkeys-js', () => ({
  default: vi.fn(),
}));
```

**Important**: `vi.mock()` is hoisted to the top of the file. This means:
- It runs before any imports
- It cannot access variables defined in the test file
- See "Advanced: vi.hoisted() Pattern" for sharing state with mocks

### Advanced: vi.hoisted() Pattern

When mocking modules that need shared state with tests, use `vi.hoisted()`. This pattern is essential for mocking libraries like hotkeys-js where you need to:
- Track handlers registered by the code under test
- Trigger those handlers from tests
- Reset mock state between tests

**The Problem:**
```typescript
// ❌ This DOESN'T work - records is not initialised yet inside vi.mock
const records: Array<{key: string; method: (event: KeyboardEvent) => void}> = [];

vi.mock('hotkeys-js', () => ({
  default: (key: string, method: (event: KeyboardEvent) => void) => {
    records.push({key, method}); // records is not available here!
  },
}));
```

**The Solution with vi.hoisted():**
```typescript
// ✓ This WORKS - vi.hoisted() runs before vi.mock() hoisting
const mocks = vi.hoisted(() => {
  // Define all mock state here - this runs BEFORE imports and vi.mock
  const records: Array<{key: string; method: (event: KeyboardEvent) => void}> = [];

  return {
    records,
    // Helper to trigger registered handlers from tests
    simulateKeyPress: (key: string) => {
      const event = {key, preventDefault: vi.fn()} as unknown as KeyboardEvent;
      for (const record of [...records]) {
        if (record.key === key) {
          record.method(event);
        }
      }
      return event;
    },
    handlerCount: () => records.length,
    // Reset function for beforeEach
    reset: () => {
      records.length = 0;
    },
  };
});

// Now vi.mock can access mocks.records
vi.mock('hotkeys-js', () => {
  const hotkeys = vi.fn(
    (keys: string, method: (event: KeyboardEvent) => void) => {
      for (const key of keys.split(',').map(k => k.trim())) {
        mocks.records.push({key, method});
      }
    }
  );
  return {default: hotkeys};
});

// In tests, use the helpers:
describe('KeyboardStepSource', () => {
  beforeEach(() => {
    mocks.reset();
  });

  test('given an active source, when the next key is pressed, then the position advances', async () => {
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
});
```

The real spec, `src/test/unit/timelineproviders/position-sources/keyboard-step-source.spec.ts`, models hotkeys-js scopes, elements and `unbind` the same way.

**When to use vi.hoisted():**
- Mocking libraries that use callbacks (hotkeys-js, lottie-web)
- When mock state needs to be shared between vi.mock and tests
- When you need to reset mocks between tests
- When the mocked module registers event handlers

**Key points:**
- `vi.hoisted()` callback runs before all imports
- Return an object with all mock state and helpers
- Use getter functions when the mock instance is replaced per test
- Always provide reset functions for `beforeEach`

### Native media elements (HTMLMediaElement) in jsdom

`VideoPositionSource` drives a real `<video>` element, so its spec mocks no library. jsdom (see the version in `package.json`) only stubs the media element:

- `play()`, `pause()` and `load()` log "Not implemented: HTMLMediaElement's play() method" through jsdom's virtual console (vitest forwards it to `console.error`) and return `undefined`; `play()` returns no promise. `canPlayType()` returns `''`.
- `readyState`, `networkState` and `currentTime` are plain values starting at 0 (`currentTime` is assignable and does not seek); `duration` is `NaN`; `seekable`, `buffered` and `played` are empty; there is no `error` property at all.
- No media event ever fires by itself (`canplay`, `playing`, `timeupdate`, `seeked`, `ended`, `error`, ...), and `<source>` children never load.

Use `src/test/fixtures/video-element-factory.ts`:

```typescript
import {
  emitMediaEvent,
  getSourceElements,
  getVideoElement,
  type IMediaElementStubs,
  installMediaElementStubs,
  makeReady,
  setMediaProperty,
  trackEventListeners,
} from '@test/fixtures/video-element-factory.ts';

let media: IMediaElementStubs;
beforeEach(() => {
  // play resolves, pause/load do nothing, canPlayType returns 'maybe';
  // restoreMocks restores the prototype after each test
  media = installMediaElementStubs();
  document.body.innerHTML = '<div id="video-container"></div>';
});

test('given a pending init, when the last source fails, then init() rejects', async () => {
  const source = new VideoPositionSource({selector: '#video-container', sources});
  const pending = source.init();
  const video = getVideoElement();

  // error does not bubble; dispatch it where the browser would
  emitMediaEvent(getSourceElements(video).at(-1)!, 'error');

  await expect(pending).rejects.toThrow(/none of the sources could be played/);
});
```

- `makeReady(video, {duration})` defines `readyState`, `networkState`, `duration` and `seekable`, then dispatches `canplay`.
- `setMediaProperty(video, name, value)` defines read-only members (`duration`, `readyState`, `networkState`, `error`, `currentTime`, `seekable`) per element with `Object.defineProperty`, shadowing the prototype getter.
- `trackEventListeners()` spies on `EventTarget.prototype.addEventListener`/`removeEventListener` (calling through); `activeOn(target)` lists the listeners still registered, to prove nothing leaks.
- Install the stubs in every describe that creates an element, including tests that only call `destroy()`, so no "Not implemented" line reaches the output. Do not stub the prototype globally in `src/test/setup.ts`: it would hide jsdom gaps from other specs.

See `src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts` for the full set.

---

## Timer Mocking

### Using Fake Timers

When testing code that uses `setTimeout`, `setInterval`, or other timer APIs, use Vitest's fake timers for deterministic tests.

**The Problem with Real Timers:**
```typescript
// ❌ Flaky - race conditions, slow, unpredictable
test('should handle timeout', async () => {
  const provider = new MyProvider();
  provider.init();

  // This is unreliable - the real setTimeout may not fire in time
  await new Promise(resolve => setTimeout(resolve, 10));

  expect(provider.isReady).toBe(true);
});
```

**The Solution with Fake Timers:**
```typescript
// ✓ Deterministic - precise control over time
describe('MyProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should handle timeout', async () => {
    const provider = new MyProvider();
    const initPromise = provider.init();

    // Advance time precisely
    await vi.advanceTimersByTimeAsync(1);

    // Now the setTimeout(0) has fired
    expect(provider.isReady).toBe(true);

    await initPromise;
  });
});
```

### Timer API Reference

```typescript
// Enable fake timers
vi.useFakeTimers();

// Restore real timers
vi.useRealTimers();

// Advance all timers by specified milliseconds
vi.advanceTimersByTime(100);

// Async version - also flushes promises
await vi.advanceTimersByTimeAsync(100);

// Run all pending timers
vi.runAllTimers();

// Run only currently pending timers (not ones scheduled by those)
vi.runOnlyPendingTimers();

// Get current fake time
vi.getMockedSystemTime();

// Set specific time
vi.setSystemTime(new Date('2024-01-01'));
```

### Common Patterns

**Pattern 1: Initialize provider with async ready callback**

```typescript
async function initProvider(provider: MyProvider): Promise<void> {
  const initPromise = provider.init();
  // Advance timers to fire setTimeout(0) in the implementation
  await vi.advanceTimersByTimeAsync(1);
  // Trigger any events needed to resolve the promise
  mocks.triggerOneEvent('ready');
  await initPromise;
}

test('should initialize', async () => {
  const provider = new MyProvider();
  await initProvider(provider);
  expect(provider.isReady).toBe(true);
});
```

**Pattern 2: Testing intervals**

```typescript
test('should tick every second', async () => {
  const callback = vi.fn();
  startInterval(callback, 1000);

  await vi.advanceTimersByTimeAsync(3000);

  expect(callback).toHaveBeenCalledTimes(3);
});
```

**Pattern 3: Testing debounced functions**

```typescript
test('should debounce calls', async () => {
  const callback = vi.fn();
  const debounced = debounce(callback, 100);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(100);

  expect(callback).toHaveBeenCalledTimes(1);
});
```

### Why Use advanceTimersByTimeAsync?

Always prefer `vi.advanceTimersByTimeAsync()` over `vi.advanceTimersByTime()` when:
- Your code uses Promises
- Your code uses async/await
- Timer callbacks trigger async operations

```typescript
// ❌ May not work - doesn't flush promise queue
vi.advanceTimersByTime(100);
expect(asyncResult).toBe(true); // May still be undefined!

// ✓ Works - advances time AND flushes promises
await vi.advanceTimersByTimeAsync(100);
expect(asyncResult).toBe(true);
```

### Timer Mocking Checklist

When adding fake timers to a test file:

- [ ] Add `vi.useFakeTimers()` in `beforeEach`
- [ ] Add `vi.useRealTimers()` in `afterEach`
- [ ] Replace `await new Promise(r => setTimeout(r, N))` with `await vi.advanceTimersByTimeAsync(N)`
- [ ] Use `advanceTimersByTimeAsync` (not sync version) for async code
- [ ] Create helper functions like `initProvider()` for common init patterns
- [ ] Test that timeouts actually work (not just that code doesn't crash)

### Real-World Example

See `src/test/unit/timelineproviders/position-sources/keyboard-step-source.spec.ts` for a complete example that combines:
- `vi.hoisted()` for shared mock state
- `vi.useFakeTimers()` for deterministic async testing
- Event handler tracking and triggering
- Helper functions for common initialization patterns

`src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts` shows the native media element pattern: prototype stubs from `video-element-factory.ts`, media events dispatched by the test, and a listener tracker instead of library mocks.

---

## Test Context Patterns

### Typed Test Context

Use TypeScript for type-safe test contexts:

```typescript
import {beforeEach, describe, type TestContext, test} from 'vitest';

// Define context type
type MyTestContext = {
  controller: MyController;
  mockEventbus: IEventbus;
  operationData: any;
} & TestContext;

// Type assertion helper
function withContext<T>(ctx: unknown): asserts ctx is T {}

// Use in describe block
describe<MyTestContext>('MyController', () => {
  beforeEach(context => {
    withContext<MyTestContext>(context);

    context.controller = new MyController();
    context.mockEventbus = createMockEventbus();
    context.operationData = {
      selectedElement: createMockJQueryElement(),
    };
  });

  test<MyTestContext>('should initialize', context => {
    const {controller, operationData} = context;
    controller.init(operationData);
    expect(controller.operationData).toBeDefined();
  });
});
```

### Setup with Event Handler Registration

For controllers that request data via eventbus:

```typescript
beforeEach(context => {
  withContext<MyTestContext>(context);

  context.mockEventbus = createMockEventbus();

  // Pre-register handlers that provide test data
  context.mockEventbus.on('request-current-language', (...args: any[]) => {
    args[0]('en-GB'); // Callback receives language
  });

  context.mockEventbus.on('request-label-collection', (...args: any[]) => {
    args[1]([{id: '1', label: 'Test'}]); // Second arg is callback
  });
});
```

---

## Assertion Patterns

### Basic Assertions

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);

// Collections
expect(array).toHaveLength(3);
expect(array).toContain(item);
```

### Mock Assertions

```typescript
const mockFn = vi.fn();

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledWith(expect.any(Function));
expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({key: 'value'}));
expect(mockFn).not.toHaveBeenCalled();
```

### Property Removal Assertions

Operations typically remove consumed properties:

```typescript
test('should remove className from operationData', () => {
  const operationData = {
    className: 'test',
    selectedElement: mockElement,
  };

  const result = applyOperation(addClass, operationData);

  expect('className' in result).toBe(false);
  expect('selectedElement' in result).toBe(true);
});
```

### Async Assertions

```typescript
test('should complete async operation', async () => {
  const result = await applyOperation(asyncOp, operationData);
  expect(result).toBeDefined();
});

test('should reject with error', async () => {
  await expect(failingOp()).rejects.toThrow('Expected error');
});
```

---

## Integration vs Unit Tests

### Unit Tests

**Location:** `src/test/unit/`

**Characteristics:**
- Test single function/class in isolation
- Mock all external dependencies
- Fast execution
- High isolation

```typescript
// Unit test example
describe('addClass', () => {
  test('should add class to element', () => {
    const mockElement = {addClass: vi.fn()};
    const operationData = {
      className: 'active',
      selectedElement: mockElement as any,
    };

    applyOperation(addClass, operationData);

    expect(mockElement.addClass).toHaveBeenCalledWith('active');
  });
});
```

### Integration Tests

**Location:** `src/test/integration/`

**Characteristics:**
- Test multiple components together
- Use real class instances
- Test complete workflows
- Slower but more realistic

```typescript
// Integration test example
describe('for-each loop', () => {
  beforeEach(context => {
    context.eventbus = new Eventbus(); // Real eventbus
    context.action = new Action('test', [], context.eventbus); // Real action
  });

  test('should iterate collection', async context => {
    const {action} = context;

    action.startOperations.push({
      instance: forEach, // Real operation
      operationData: {collection: ['a', 'b', 'c']},
    });

    const result = await action.start();

    expect(result.loopIndex).toBe(3);
  });
});
```

### When to Use Each

| Scenario | Unit Test | Integration Test |
|----------|-----------|------------------|
| Single operation logic | ✓ | |
| Controller initialization | ✓ | |
| Event handler behavior | ✓ | |
| Complete action workflow | | ✓ |
| Multi-operation sequences | | ✓ |
| for-each/when/otherwise flows | | ✓ |

---

## Helper Utilities

### applyOperation

Standard way to execute operations in tests:

```typescript
import {applyOperation} from '../../../util/apply-operation.ts';

// Basic usage (uses default scope)
const result = applyOperation(myOperation, operationData);

// With custom scope
const result = applyOperation(myOperation, operationData, {
  currentIndex: 0,
  eventbus: mockEventbus,
  operations: [op1, op2],
});

// Async operations
const result = await applyOperation(asyncOperation, operationData);
```

**Default Scope:**
```typescript
{
  currentIndex: -1,
  eventbus: {} as any,
  operations: [],
}
```

---

## Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
test('should add class to element', () => {
  // Arrange
  const mockElement = createMockJQueryElement();
  const operationData = {className: 'active', selectedElement: mockElement};

  // Act
  const result = applyOperation(addClass, operationData);

  // Assert
  expect(mockElement.hasClass('active')).toBe(true);
  expect('className' in result).toBe(false);
});
```

### 2. Test Isolation

Each test must be independent:

```typescript
beforeEach(context => {
  // Fresh instances every test
  context.controller = new MyController();
  context.mockEventbus = createMockEventbus();
});

// Tests run in any order
test('test 1', () => { /* independent */ });
test('test 2', () => { /* independent */ });
```

Shared state to watch for: the jsdom `document` is shared by all tests **in the same file** (reset `document.body.innerHTML` in `beforeEach`), and anything put on `window`/`globalThis` without `vi.stubGlobal` leaks into later tests in that file. See [Mocking Globals](#mocking-globals-window-document-fetch-timers).

### 3. Use Fixtures Over Inline Mocks

```typescript
// GOOD: Reusable, consistent
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';
const eventbus = createMockEventbus();

// AVOID: Inline classes for common mocks
class MockEventbus {
  broadcast = vi.fn();
}
```

### 4. Descriptive Test Names

```typescript
// GOOD: Describes behavior
test('should remove className property from operationData after adding class', () => {});

// AVOID: Vague
test('works correctly', () => {});
```

### 5. One Assertion Focus

```typescript
// GOOD: Focused assertion
test('should add class', () => {
  applyOperation(addClass, operationData);
  expect(element.hasClass('active')).toBe(true);
});

test('should remove className from operationData', () => {
  const result = applyOperation(addClass, operationData);
  expect('className' in result).toBe(false);
});

// AVOID: Testing multiple unrelated behaviors
test('should work', () => {
  const result = applyOperation(addClass, operationData);
  expect(element.hasClass('active')).toBe(true);
  expect('className' in result).toBe(false);
  expect(result.selectedElement).toBe(element);
  // ... many more assertions
});
```

### 6. Cleanup After Tests

```typescript
afterEach(context => {
  context.controller?.detach(context.eventbus);
  context.eventbus?.clear();
  $('[data-test]').remove(); // Clean DOM if needed
});
```

### 7. Async Test Patterns

```typescript
// Use async/await
test('should complete async', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// Avoid setTimeout in assertions
// BAD:
test('async test', () => {
  asyncOperation();
  setTimeout(() => {
    expect(result).toBe(true); // May not run!
  }, 100);
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific file
npm test -- src/test/unit/operation/add-class.spec.ts

# Run with pattern match
npm test -- --grep "should add class"

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage -- --run

# CI mode (verbose output)
npm run test:ci
```

### Test Pool & Performance

`src/vitest.config.ts` sets `pool: 'vmThreads'`. Vitest's default pool (`forks`) creates a fresh jsdom environment for every spec file, which accounted for ~93% of wall-clock time (~46s for the suite). With `vmThreads` the environment is created once per worker and each file runs in its own VM context with a fresh `window`, bringing the run to ~8s while keeping per-file isolation (`isolate: false` is not applicable to VM pools — they are always isolated).

Trade-offs to be aware of (from the Vitest docs, verified against this suite):

- **Memory:** the VM pool keeps imported ES modules cached for the worker's lifetime and Node's `vm` module can leak with ESM. Vitest restarts a worker when it exceeds `vmMemoryLimit` (default: 1/64 of system memory). This suite (~148 files) runs well within that; if CI ever OOMs or slows down late in the run, set `vmMemoryLimit` (e.g. `'512MB'`) or fall back to `pool: 'threads'`/`'forks'` (slower, no code changes required).
- **The test global *is* the jsdom window.** Non-configurable window properties (`location`) can't be redefined or deleted — use the History API, see [Mocking Globals](#mocking-globals-window-document-fetch-timers).
- **Native module globals differ from test globals** inside the VM (e.g. `instanceof` checks against Node built-ins across the boundary). Not currently an issue for this codebase.

If a new test only passes under `pool: 'forks'`, it is almost always mutating a global directly; fix the test rather than the pool.

### Viewing Coverage Reports

The coverage table is printed at the end of the test output, after all test results. On Windows with PowerShell, use `Select-Object` to extract the relevant portion:

```powershell
# View the coverage table (last 60 lines contain the table)
powershell.exe -Command "cd 'f:\projects\eligius\eligius' ; npm run test:coverage -- --run 2>&1 | Select-Object -Last 60"

# Search for a specific file's coverage
powershell.exe -Command "cd 'f:\projects\eligius\eligius' ; npm run test:coverage -- --run 2>&1 | Select-Object -Last 80" | Select-String "my-file"
```

**Coverage Table Columns:**
- `% Stmts` - Statement coverage
- `% Branch` - Branch coverage (if/else, ternary, etc.)
- `% Funcs` - Function coverage
- `% Lines` - Line coverage
- `Uncovered Line #s` - Specific lines not covered by tests

**Note:** The script is `npm run test:coverage`, not `npm run coverage`.

### Debugging

```typescript
// Focus single test
test.only('debug this test', () => {});

// Skip test
test.skip('skip this', () => {});

// Log in tests (visible with --reporter=verbose)
test('with logging', () => {
  console.log('Debug:', someValue);
});
```

---

## Common Testing Patterns by Feature

### Testing Operations

```typescript
import {applyOperation} from '../../../util/apply-operation.ts';
import {myOperation} from '../../../operation/my-operation.ts';

describe('myOperation', () => {
  test('should perform expected behavior', () => {
    const operationData = {
      requiredProp: 'value',
      selectedElement: createMockJQueryElement(),
    };

    const result = applyOperation(myOperation, operationData);

    expect(result.selectedElement).toBeDefined();
    expect('requiredProp' in result).toBe(false); // Consumed
  });
});
```

### Testing Controllers

```typescript
import {createMockEventbus} from '../../fixtures/eventbus-factory.ts';
import {createMockJQueryElement} from '../../fixtures/jquery-factory.ts';

describe('MyController', () => {
  let controller: MyController;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    controller = new MyController();
    mockEventbus = createMockEventbus();
  });

  test('should initialize with operationData', () => {
    const operationData = {selectedElement: createMockJQueryElement()};
    controller.init(operationData);
    expect(controller.operationData).toBe(operationData);
  });

  test('should register event handlers on attach', () => {
    controller.init({selectedElement: createMockJQueryElement()});
    controller.attach(mockEventbus);
    expect(mockEventbus.on).toHaveBeenCalled();
  });

  test('should cleanup on detach', () => {
    controller.init({selectedElement: createMockJQueryElement()});
    controller.attach(mockEventbus);
    controller.detach(mockEventbus);
    // Verify cleanup occurred
  });
});
```

### Testing Event-Driven Code

```typescript
test('should handle event broadcast', () => {
  const mockEventbus = createMockEventbus();
  const handler = vi.fn();

  mockEventbus.on('my-event', handler);
  mockEventbus.broadcast('my-event', ['data']);

  expect(handler).toHaveBeenCalledWith('data');
});
```

### Testing Async Operations

```typescript
test('should execute async operations in sequence', async () => {
  const action = new Action('test', [], new Eventbus());

  action.startOperations.push({
    instance: async (op) => {
      await delay(10);
      return {...op, step1: true};
    },
  });

  action.startOperations.push({
    instance: async (op) => {
      await delay(10);
      return {...op, step2: true};
    },
  });

  const result = await action.start();

  expect(result.step1).toBe(true);
  expect(result.step2).toBe(true);
});
```

---

## Test File Checklist

When creating a new test file:

- [ ] File uses `.spec.ts` extension
- [ ] Located in correct directory (`unit/` or `integration/`)
- [ ] Imports from `vitest` (describe, test, expect, vi, beforeEach)
- [ ] Uses typed TestContext if needed
- [ ] Uses fixture factories instead of inline mock classes
- [ ] Follows Arrange-Act-Assert pattern
- [ ] Each test is independent
- [ ] Globals mocked with `vi.stubGlobal` inside `test`/`beforeEach` — never assigned to `global`/`window`, no private `JSDOM`
- [ ] Async tests use async/await
- [ ] Test names describe expected behavior
- [ ] Runs successfully: `npm test -- path/to/test.spec.ts`

---

## Summary

1. **Use fixtures** from `src/test/fixtures/` for common mocks
2. **Type your contexts** with TestContext for TypeScript safety
3. **Unit tests mock dependencies**, integration tests use real instances
4. **applyOperation** is the standard way to test operations
5. **One behavior per test**, clear naming, AAA pattern
6. **Clean up** in afterEach if tests modify shared state
7. **90% coverage** is the project requirement
8. **`vi.stubGlobal` for globals** — direct assignment to `global`/`window` breaks under Vitest 5 and the `vmThreads` pool
