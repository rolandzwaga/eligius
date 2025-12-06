# Feature Specification: Engine API Redesign with Adapter Pattern

**Version**: 1.0.0
**Date**: 2025-12-06
**Status**: Approved (via conversation)

## Problem Statement

The `EligiusEngine` API is largely invisible because it's controlled by events received through the eventbus. The engine's capabilities are discoverable only by reading the implementation code. This creates:

1. Poor discoverability - consumers don't know what the engine can do
2. Tight coupling - engine is directly dependent on eventbus
3. Testing difficulty - must mock eventbus to test engine behavior
4. Hidden semantics - event names don't reveal the underlying API

## Solution Overview

Introduce an **Adapter Pattern** that creates clean seams between:
- Core components (EligiusEngine, LanguageManager) with explicit, testable APIs
- Adapters that bridge these components to the eventbus
- Input adapters that handle external triggers (hotkeys, resize, devtools)

## Functional Requirements

### FR-1: TypedEventEmitter Utility
Create a reusable, type-safe event emitter:
- Generic type parameter for event map
- `on(event, handler)` returns unsubscribe function
- `once(event, handler)` for one-time listeners
- `off(event, handler)` for explicit removal
- `emit(event, ...args)` broadcasts to handlers
- `removeAllListeners(event?)` for cleanup
- Handler execution order preserved (registration order)
- Errors in handlers caught and logged (don't break other handlers)
- Copy handlers array during emit (safe removal during iteration)

### FR-2: EligiusEngine Pure API
Engine exposes explicit public API without eventbus dependency:

**State (synchronous reads)**:
- `position: number` - current timeline position
- `duration: number | undefined` - timeline duration
- `playState: 'playing' | 'paused' | 'stopped'` - current state
- `currentTimelineUri: string` - active timeline URI
- `container: JQuery<HTMLElement> | undefined` - timeline container
- `engineRoot: JQuery<HTMLElement>` - engine root element

**Events (via TypedEventEmitter)**:
- `start` - playback started
- `pause` - playback paused
- `stop` - playback stopped
- `time` - position changed (args: position)
- `duration` - duration available (args: duration)
- `seekStart` - seek initiated (args: target, current, duration)
- `seekComplete` - seek finished (args: position, duration)
- `timelineChange` - timeline switched (args: uri)
- `timelineComplete` - timeline ended
- `timelineFirstFrame` - first frame rendered
- `timelineRestart` - timeline looped
- `initialized` - engine initialized
- `destroyed` - engine destroyed

**Commands**:
- `init(): Promise<ITimelineProvider>` - initialize engine
- `destroy(): Promise<void>` - cleanup engine
- `start(): Promise<void>` - start playback (async for video autoplay)
- `pause(): void` - pause playback (sync)
- `stop(): void` - stop playback (sync)
- `seek(position: number): Promise<number>` - seek to position (async)
- `switchTimeline(uri: string, position?: number): Promise<void>` - switch timeline

### FR-3: ITimelineProvider Updates
Update provider interface for async consistency:
- `start(): Promise<void>` - async (video.play() can fail)
- `pause(): void` - sync
- `stop(): void` - sync
- `seek(position: number): Promise<number>` - async (already is)

### FR-4: LanguageManager Pure API
LanguageManager exposes explicit API without eventbus dependency:

**State**:
- `language: string` - current language
- `availableLanguages: string[]` - derived from unique languages in label collections

**Events**:
- `change` - language changed (args: language, previousLanguage)

**Commands**:
- `setLanguage(language: string): void` - change language
- `getLabelCollection(collectionId: string): ILabel[] | undefined` - get label collection by ID
- `getLabelCollections(collectionIds: string[]): (ILabel[] | undefined)[]` - get multiple collections
- `destroy(): void` - cleanup

### FR-5: EngineEventbusAdapter
Bridges engine events to/from eventbus:
- Subscribes to engine events, broadcasts to eventbus
- Listens to eventbus requests, calls engine methods
- Handles callback-style request/response patterns
- `connect()` / `disconnect()` lifecycle

### FR-6: LanguageEventbusAdapter
Bridges language manager to/from eventbus:
- Subscribes to language events, broadcasts to eventbus
- Listens to eventbus requests, calls language manager methods
- `connect()` / `disconnect()` lifecycle

### FR-7: EngineInputAdapter
Handles external input sources:
- Hotkeys (space → toggle play/pause via engine)
- Resize events (broadcasts to eventbus)
- Devtools integration (play/pause/stop/seek via engine)
- `connect()` / `disconnect()` lifecycle

### FR-8: EngineFactory Result Change
Factory returns comprehensive result object:
```typescript
interface IEngineFactoryResult {
  engine: IEligiusEngine;
  languageManager: ILanguageManager;
  eventbus: IEventbus;
  destroy: () => Promise<void>;
}
```

**Breaking Change**: `createEngine()` return type changes from `IEligiusEngine` to `IEngineFactoryResult`.

## Non-Functional Requirements

### NFR-1: Backward Compatibility (Eventbus)
All existing eventbus events must continue to work. Adapters ensure external consumers using eventbus are unaffected.

### NFR-2: Performance
- Event emission overhead must be negligible (<1ms)
- Adapter pattern must not introduce measurable latency

### NFR-3: Testability
- Engine testable without eventbus mocking
- LanguageManager testable without eventbus mocking
- Adapters testable with mock engine/languageManager and mock eventbus

## Technical Decisions Made

1. **No RxJS** - use simple TypedEventEmitter, no new dependencies
2. **Naming**: `start()` not `play()` for consistency with providers
3. **No `toggle()`** on engine - adapter handles toggle logic
4. **Async `start()`** - video autoplay can fail
5. **Sync `pause()`/`stop()`** - these don't fail
6. **Array for handlers** - preserves registration order (not Set)
7. **Error isolation** - handler errors logged, don't break others

## Out of Scope

- Changing the eventbus implementation itself
- Modifying the event names (backward compatibility)
- Adding new events beyond what's needed for the API
