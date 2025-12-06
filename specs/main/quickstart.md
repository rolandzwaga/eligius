# Quickstart: Engine API Redesign with Adapter Pattern

**Date**: 2025-12-06

## Overview

This document shows usage patterns for the redesigned Eligius Engine API.

## 1. Factory Usage (Recommended)

The factory creates everything and wires adapters automatically:

```typescript
import { EngineFactory } from 'eligius';
import type { IEngineConfiguration } from 'eligius';
import * as config from './my-config.json';

// Create factory
const factory = new EngineFactory(importer, window);

// Create engine (returns IEngineFactoryResult)
const result = factory.createEngine(config as IEngineConfiguration);

// Access components
const { engine, languageManager, eventbus, destroy } = result;

// Initialize and start
await engine.init();
await engine.start();

// Listen to engine events directly
const unsubscribe = engine.on('time', (position) => {
  console.log('Position:', position);
});

// Or use eventbus for cross-component communication
eventbus.on('timeline-time', (position) => {
  updateProgressBar(position);
});

// Clean up when done
await destroy();
```

## 2. Direct Engine Usage (Without Eventbus)

For testing or simplified use cases:

```typescript
import { EligiusEngine } from 'eligius';
import { RequestAnimationFrameTimelineProvider } from 'eligius';

// Create engine without eventbus
const engine = new EligiusEngine(
  resolvedConfig,
  timelineProviders,
  languageManager
);

// Initialize
await engine.init();

// Control playback
await engine.start();
console.log('Playing:', engine.playState); // 'playing'

engine.pause();
console.log('Paused:', engine.playState); // 'paused'

await engine.seek(30);
console.log('Position:', engine.position); // 30

engine.stop();

// Listen to events
engine.on('timelineComplete', () => {
  console.log('Timeline finished');
});

engine.on('seekComplete', (position, duration) => {
  console.log(`Seeked to ${position} of ${duration}`);
});

// Switch timelines
await engine.switchTimeline('intro-timeline');

// Clean up
await engine.destroy();
```

## 3. Language Manager Usage

```typescript
import { LanguageManager } from 'eligius';

// Create language manager
const languageManager = new LanguageManager('en-US', labels);

// Get current language
console.log(languageManager.language); // 'en-US'

// Change language
languageManager.setLanguage('nl-NL');

// Listen to changes
languageManager.on('change', (newLang, oldLang) => {
  console.log(`Language changed from ${oldLang} to ${newLang}`);
});

// Get labels
const introLabels = languageManager.getLabelCollection('intro');
const [titleLabels, subtitleLabels] = languageManager.getLabelCollections([
  'title',
  'subtitle'
]);

// Clean up
languageManager.destroy();
```

## 4. Testing Patterns

### Testing Engine (No Eventbus Mocking Needed)

```typescript
import { describe, test, expect, vi } from 'vitest';
import { EligiusEngine } from '../../eligius-engine';

describe('EligiusEngine', () => {
  test('should start playback', async () => {
    const mockProvider = createMockTimelineProvider();
    const engine = new EligiusEngine(config, { animation: mockProvider }, langMgr);

    await engine.init();
    await engine.start();

    expect(engine.playState).toBe('playing');
    expect(mockProvider.start).toHaveBeenCalled();
  });

  test('should emit time events', async () => {
    const engine = new EligiusEngine(config, providers, langMgr);
    const timeHandler = vi.fn();

    engine.on('time', timeHandler);
    await engine.init();

    // Simulate time update from provider
    triggerProviderTimeUpdate(5);

    expect(timeHandler).toHaveBeenCalledWith(5);
  });

  test('should emit seek events in order', async () => {
    const engine = new EligiusEngine(config, providers, langMgr);
    const events: string[] = [];

    engine.on('seekStart', () => events.push('seekStart'));
    engine.on('seekComplete', () => events.push('seekComplete'));

    await engine.init();
    await engine.seek(30);

    expect(events).toEqual(['seekStart', 'seekComplete']);
  });
});
```

### Testing Adapters

```typescript
import { describe, test, expect, vi } from 'vitest';
import { EngineEventbusAdapter } from '../../adapters/engine-eventbus-adapter';

describe('EngineEventbusAdapter', () => {
  test('should call engine.start() on timeline-play-request', () => {
    const mockEngine = {
      start: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnValue(() => {}),
    };
    const mockEventbus = createMockEventbus();

    const adapter = new EngineEventbusAdapter(mockEngine, mockEventbus);
    adapter.connect();

    // Simulate eventbus event
    mockEventbus.broadcast('timeline-play-request', []);

    expect(mockEngine.start).toHaveBeenCalled();
  });

  test('should broadcast timeline-time when engine emits time', () => {
    const mockEngine = createMockEngine();
    const mockEventbus = createMockEventbus();

    const adapter = new EngineEventbusAdapter(mockEngine, mockEventbus);
    adapter.connect();

    // Trigger engine event
    const timeHandler = mockEngine.on.mock.calls.find(
      ([event]) => event === 'time'
    )[1];
    timeHandler(42);

    expect(mockEventbus.broadcast).toHaveBeenCalledWith('timeline-time', [42]);
  });

  test('should disconnect all listeners', () => {
    const unsubscribes = [];
    const mockEngine = {
      on: vi.fn().mockImplementation(() => {
        const unsub = vi.fn();
        unsubscribes.push(unsub);
        return unsub;
      }),
    };
    const mockEventbus = createMockEventbus();

    const adapter = new EngineEventbusAdapter(mockEngine, mockEventbus);
    adapter.connect();
    adapter.disconnect();

    unsubscribes.forEach(unsub => {
      expect(unsub).toHaveBeenCalled();
    });
  });
});
```

### Testing TypedEventEmitter

```typescript
import { describe, test, expect, vi } from 'vitest';
import { TypedEventEmitter } from '../../util/typed-event-emitter';

interface TestEvents {
  'greeting': [name: string];
  'count': [value: number];
  'empty': [];
}

describe('TypedEventEmitter', () => {
  test('should call handlers with correct arguments', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter.on('greeting', handler);
    emitter.emit('greeting', 'World');

    expect(handler).toHaveBeenCalledWith('World');
  });

  test('should return unsubscribe function', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    const unsubscribe = emitter.on('count', handler);
    emitter.emit('count', 1);
    unsubscribe();
    emitter.emit('count', 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  test('should handle errors in handlers without breaking others', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const badHandler = vi.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });
    const goodHandler = vi.fn();

    emitter.on('empty', badHandler);
    emitter.on('empty', goodHandler);
    emitter.emit('empty');

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  test('should preserve registration order', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const order: number[] = [];

    emitter.on('empty', () => order.push(1));
    emitter.on('empty', () => order.push(2));
    emitter.on('empty', () => order.push(3));
    emitter.emit('empty');

    expect(order).toEqual([1, 2, 3]);
  });

  test('once should only fire once', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter.once('count', handler);
    emitter.emit('count', 1);
    emitter.emit('count', 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });
});
```

## 5. Migration from Old API

### Before (v1.x)

```typescript
// Old: Factory returns engine directly
const engine = factory.createEngine(config);

// Old: Control via eventbus
eventbus.broadcast('timeline-play-request', []);
eventbus.broadcast('timeline-seek-request', [30]);

// Old: Query state via callback
eventbus.broadcast('request-current-timeline-position', [(pos) => {
  console.log('Position:', pos);
}]);
```

### After (v2.x)

```typescript
// New: Factory returns result object
const { engine, eventbus, destroy } = factory.createEngine(config);

// New: Control via engine methods
await engine.start();
await engine.seek(30);

// New: Query state directly
console.log('Position:', engine.position);

// New: Eventbus still works (via adapters)
eventbus.broadcast('timeline-play-request', []); // Still works!
```

## 6. Backward Compatibility

The eventbus API remains fully functional through adapters:

```typescript
const { eventbus } = factory.createEngine(config);

// All existing eventbus patterns still work:
eventbus.broadcast('timeline-play-request', []);
eventbus.broadcast('timeline-pause-request', []);
eventbus.broadcast('timeline-seek-request', [50]);

eventbus.on('timeline-time', (position) => {
  // Still receives events
});

eventbus.on('timeline-complete', () => {
  // Still receives events
});
```

The only breaking change is the factory return type - consumers must destructure the result.
