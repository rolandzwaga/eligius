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
   - [Module Mocking with vi.mock()](#module-mocking-with-vimock)
   - [Advanced: vi.hoisted() Pattern](#advanced-vihoisted-pattern)
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
12. [Common Testing Patterns by Feature](#common-testing-patterns-by-feature)

---

## Test Suite Overview

The Eligius project uses **Vitest** as its testing framework with **jsdom** for browser API simulation.

**Test Statistics:**
- ~129 test files
- ~565 tests
- 90% coverage requirement

**Key Configuration** (`src/vitest.config.ts`):
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Single-threaded execution for determinism
- Automatic mock cleanup between tests

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

### Module Mocking with vi.mock()

Use `vi.mock()` to replace entire modules:

```typescript
// Basic module mock
vi.mock('some-module', () => ({
  someFunction: vi.fn().mockReturnValue('mocked'),
}));

// Mock with default export
vi.mock('video.js', () => ({
  default: vi.fn(),
}));
```

**Important**: `vi.mock()` is hoisted to the top of the file. This means:
- It runs before any imports
- It cannot access variables defined in the test file
- See "Advanced: vi.hoisted() Pattern" for sharing state with mocks

### Advanced: vi.hoisted() Pattern

When mocking modules that need shared state with tests, use `vi.hoisted()`. This pattern is essential for mocking libraries like video.js where you need to:
- Track event handlers registered by the code under test
- Trigger those handlers from tests
- Reset mock state between tests

**The Problem:**
```typescript
// ❌ This DOESN'T work - mockPlayer is undefined inside vi.mock
let mockPlayer = { play: vi.fn() };

vi.mock('video.js', () => ({
  default: () => mockPlayer  // mockPlayer is undefined here!
}));
```

**The Solution with vi.hoisted():**
```typescript
// ✓ This WORKS - vi.hoisted() runs before vi.mock() hoisting
const mocks = vi.hoisted(() => {
  // Define all mock state here - this runs BEFORE imports and vi.mock
  const eventHandlers = new Map<string, Array<(...args: any[]) => void>>();
  const oneHandlers = new Map<string, Array<(...args: any[]) => void>>();

  // Helper to trigger registered event handlers from tests
  const triggerEvent = (event: string, ...args: any[]) => {
    const handlers = eventHandlers.get(event) || [];
    handlers.forEach(h => h(...args));
  };

  // Helper for one-time handlers (like video.js .one())
  const triggerOneEvent = (event: string, ...args: any[]) => {
    const handlers = oneHandlers.get(event) || [];
    handlers.forEach(h => h(...args));
    oneHandlers.set(event, []); // Clear after firing
  };

  // Reset function for beforeEach
  const resetHandlers = () => {
    eventHandlers.clear();
    oneHandlers.clear();
  };

  // Mock player factory
  const createMockPlayer = () => ({
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(60),
    load: vi.fn(),
    loop: false,
    one: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!oneHandlers.has(event)) oneHandlers.set(event, []);
      oneHandlers.get(event)!.push(handler);
    }),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers.has(event)) eventHandlers.set(event, []);
      eventHandlers.get(event)!.push(handler);
    }),
    off: vi.fn(),
  });

  let mockPlayer = createMockPlayer();

  return {
    eventHandlers,
    oneHandlers,
    triggerEvent,
    triggerOneEvent,
    resetHandlers,
    createMockPlayer,
    getMockPlayer: () => mockPlayer,
    resetMockPlayer: () => {
      mockPlayer = createMockPlayer();
      return mockPlayer;
    },
  };
});

// Now vi.mock can access mocks.getMockPlayer()
vi.mock('video.js', () => {
  const videojsFn = (_id: string, _options: any, readyCallback: () => void) => {
    const player = mocks.getMockPlayer();
    setTimeout(() => readyCallback.call(player), 0);
    return player;
  };
  videojsFn.log = { level: vi.fn() };
  return { default: videojsFn };
});

// In tests, use the helpers:
describe('VideoJsTimelineProvider', () => {
  beforeEach(context => {
    context.mockPlayer = mocks.resetMockPlayer();
    mocks.resetHandlers();
  });

  test('should handle timeupdate event', async context => {
    const { provider, mockPlayer } = context;
    await initProvider(provider);

    const callback = vi.fn();
    provider.onTime(callback);

    // Trigger the event that was registered internally
    mockPlayer.currentTime.mockReturnValue(5.5);
    mocks.triggerEvent('timeupdate');

    expect(callback).toHaveBeenCalledWith(5.5);
  });
});
```

**When to use vi.hoisted():**
- Mocking libraries that use callbacks (video.js, lottie-web)
- When mock state needs to be shared between vi.mock and tests
- When you need to reset mocks between tests
- When the mocked module registers event handlers

**Key points:**
- `vi.hoisted()` callback runs before all imports
- Return an object with all mock state and helpers
- Use getter functions (`getMockPlayer()`) to get current mock instance
- Always provide reset functions for `beforeEach`

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

See `src/test/unit/timelineproviders/video-js-timeline-provider.spec.ts` for a complete example that combines:
- `vi.hoisted()` for shared mock state
- `vi.useFakeTimers()` for deterministic async testing
- Event handler tracking and triggering
- Helper functions for common initialization patterns

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
