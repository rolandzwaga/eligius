# Data Model: Engine API Redesign with Adapter Pattern

**Date**: 2025-12-06

## Core Utility Types

### TypedEventEmitter

```typescript
// src/util/typed-event-emitter.ts

/**
 * Generic event map type - maps event names to argument tuples
 */
type EventMap = Record<string, unknown[]>;

/**
 * Handler function for a specific event
 */
type EventHandler<T extends unknown[]> = (...args: T) => void;

/**
 * Interface for a type-safe event emitter
 */
interface ITypedEventEmitter<T extends EventMap> {
  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;

  /**
   * Subscribe to an event for one-time execution
   * @returns Unsubscribe function
   */
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof T>(event: K, ...args: T[K]): void;

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners(event?: keyof T): void;
}
```

## Engine Types

### EngineEvents

```typescript
// src/types.ts (or src/eligius-engine.ts)

/**
 * Event map for EligiusEngine
 */
interface EngineEvents {
  /** Playback started */
  'start': [];

  /** Playback paused */
  'pause': [];

  /** Playback stopped */
  'stop': [];

  /** Timeline position changed */
  'time': [position: number];

  /** Duration became available */
  'duration': [duration: number];

  /** Seek operation initiated */
  'seekStart': [target: number, current: number, duration: number];

  /** Seek operation completed */
  'seekComplete': [position: number, duration: number];

  /** Timeline switched to different URI */
  'timelineChange': [uri: string];

  /** Timeline playback completed */
  'timelineComplete': [];

  /** First frame of timeline rendered */
  'timelineFirstFrame': [];

  /** Timeline looped/restarted */
  'timelineRestart': [];

  /** Engine initialization completed */
  'initialized': [];

  /** Engine destroyed */
  'destroyed': [];
}
```

### IEligiusEngine

```typescript
// src/types.ts

import type { ITimelineProvider } from '@timelineproviders/types.ts';

/**
 * The Eligius timeline engine with explicit, testable API
 */
interface IEligiusEngine {
  // ═══════════════════════════════════════════════════════════════════
  // STATE (synchronous reads)
  // ═══════════════════════════════════════════════════════════════════

  /** Current timeline position in seconds */
  readonly position: number;

  /** Timeline duration in seconds, undefined if not yet available */
  readonly duration: number | undefined;

  /** Current playback state */
  readonly playState: 'playing' | 'paused' | 'stopped';

  /** URI of the currently active timeline */
  readonly currentTimelineUri: string;

  /** Container element for the active timeline provider */
  readonly container: JQuery<HTMLElement> | undefined;

  /** Root element of the engine (container selector) */
  readonly engineRoot: JQuery<HTMLElement>;

  // ═══════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Subscribe to engine events
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void
  ): () => void;

  // ═══════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Initialize the engine
   * Creates layout, initializes timeline provider, executes init actions
   * @returns The initialized timeline provider
   */
  init(): Promise<ITimelineProvider>;

  /**
   * Destroy the engine
   * Cleans up resources, ends actions, removes event listeners
   */
  destroy(): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════
  // PLAYBACK COMMANDS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start playback
   * @throws If autoplay is blocked (video provider)
   */
  start(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Stop playback and reset to beginning
   */
  stop(): void;

  /**
   * Seek to a specific position
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  seek(position: number): Promise<number>;

  // ═══════════════════════════════════════════════════════════════════
  // TIMELINE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Switch to a different timeline
   * @param uri - Timeline URI to switch to
   * @param position - Optional starting position
   */
  switchTimeline(uri: string, position?: number): Promise<void>;
}
```

## Language Manager Types

### LanguageEvents

```typescript
// src/types.ts (or src/language-manager.ts)

/**
 * Event map for LanguageManager
 */
interface LanguageEvents {
  /** Language changed */
  'change': [language: string, previousLanguage: string];
}
```

### ILanguageManager

```typescript
// src/types.ts

import type { ILabel } from './types.ts';

/**
 * Manages multi-language labels with explicit, testable API
 */
interface ILanguageManager {
  // ═══════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════

  /** Current language code (e.g., 'en-US', 'nl-NL') */
  readonly language: string;

  /** List of available language codes */
  readonly availableLanguages: string[];

  // ═══════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Subscribe to language manager events
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof LanguageEvents>(
    event: K,
    handler: (...args: LanguageEvents[K]) => void
  ): () => void;

  // ═══════════════════════════════════════════════════════════════════
  // COMMANDS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Change the current language
   * @param language - New language code
   * @throws If language code is empty or null
   */
  setLanguage(language: string): void;

  /**
   * Get a label collection by ID
   * @param collectionId - Label collection ID
   * @returns Label array or undefined if not found
   */
  getLabelCollection(collectionId: string): ILabel[] | undefined;

  /**
   * Get multiple label collections by IDs
   * @param collectionIds - Array of label collection IDs
   * @returns Array of label arrays
   */
  getLabelCollections(collectionIds: string[]): (ILabel[] | undefined)[];

  // ═══════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Clean up resources
   */
  destroy(): void;
}
```

## Timeline Provider Types

### ITimelineProvider (Updated)

```typescript
// src/timelineproviders/types.ts

type TPlayState = 'stopped' | 'running';

/**
 * Timeline provider interface with async start
 */
interface ITimelineProvider {
  /** Current playback state */
  readonly playState: TPlayState;

  /** Whether timeline should loop */
  loop: boolean;

  // ═══════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════

  /** Initialize the provider */
  init(): Promise<void>;

  /** Destroy and clean up the provider */
  destroy(): void;

  // ═══════════════════════════════════════════════════════════════════
  // PLAYBACK
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start playback
   * @throws If playback cannot start (e.g., autoplay blocked)
   */
  start(): Promise<void>;  // Changed from void to Promise<void>

  /** Pause playback */
  pause(): void;

  /** Stop playback and reset position */
  stop(): void;

  /**
   * Seek to position
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  seek(position: number): Promise<number>;

  // ═══════════════════════════════════════════════════════════════════
  // PLAYLIST
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Switch to a playlist item by URI
   * @param uri - Timeline URI
   */
  playlistItem(uri: string): void;

  // ═══════════════════════════════════════════════════════════════════
  // STATE QUERIES
  // ═══════════════════════════════════════════════════════════════════

  /** Get current position in seconds */
  getPosition(): number;

  /** Get duration in seconds */
  getDuration(): number;

  /** Get container element */
  getContainer(): JQuery<HTMLElement> | undefined;

  // ═══════════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════════

  /** Register time update callback */
  onTime(callback: (position: number) => void): void;

  /** Register playback complete callback */
  onComplete(callback: () => void): void;

  /** Register restart/loop callback */
  onRestart(callback: () => void): void;

  /** Register first frame callback */
  onFirstFrame(callback: () => void): void;
}
```

## Adapter Types

### IEngineEventbusAdapter

```typescript
// src/adapters/engine-eventbus-adapter.ts

import type { IEligiusEngine } from '../types.ts';
import type { IEventbus } from '@eventbus/types.ts';

/**
 * Bridges EligiusEngine to/from the eventbus
 */
interface IEngineEventbusAdapter {
  /** Connect adapter - start listening and forwarding */
  connect(): void;

  /** Disconnect adapter - stop all listeners */
  disconnect(): void;
}

/**
 * Constructor signature
 */
class EngineEventbusAdapter implements IEngineEventbusAdapter {
  constructor(
    private engine: IEligiusEngine,
    private eventbus: IEventbus
  ) {}
  // ...
}
```

### ILanguageEventbusAdapter

```typescript
// src/adapters/language-eventbus-adapter.ts

import type { ILanguageManager, IEligiusEngine } from '../types.ts';
import type { IEventbus } from '@eventbus/types.ts';

/**
 * Bridges LanguageManager to/from the eventbus
 *
 * Note: Requires engine reference to update DOM lang attribute on language change
 */
interface ILanguageEventbusAdapter {
  /** Connect adapter - start listening and forwarding */
  connect(): void;

  /** Disconnect adapter - stop all listeners */
  disconnect(): void;
}

/**
 * Constructor signature
 */
class LanguageEventbusAdapter implements ILanguageEventbusAdapter {
  constructor(
    private languageManager: ILanguageManager,
    private eventbus: IEventbus,
    private engine: IEligiusEngine  // Needed for engineRoot to set lang attribute
  ) {}
  // ...
}
```

### IEngineInputAdapter

```typescript
// src/adapters/engine-input-adapter.ts

import type { IEligiusEngine } from '../types.ts';
import type { IEventbus } from '@eventbus/types.ts';

/**
 * Handles external input sources (hotkeys, resize, devtools)
 */
interface IEngineInputAdapter {
  /** Connect adapter - start listening to inputs */
  connect(): void;

  /** Disconnect adapter - stop all listeners */
  disconnect(): void;
}

interface EngineInputAdapterOptions {
  /** Enable devtools integration */
  devtools?: boolean;
}

/**
 * Constructor signature
 */
class EngineInputAdapter implements IEngineInputAdapter {
  constructor(
    private engine: IEligiusEngine,
    private eventbus: IEventbus,
    private windowRef: Window,
    private options?: EngineInputAdapterOptions
  ) {}
  // ...
}
```

## Factory Types

### IEngineFactoryResult

```typescript
// src/types.ts

import type { IEventbus } from '@eventbus/types.ts';

/**
 * Result of creating an engine via the factory
 */
interface IEngineFactoryResult {
  /** The engine instance */
  engine: IEligiusEngine;

  /** The language manager instance */
  languageManager: ILanguageManager;

  /** The eventbus for external consumers */
  eventbus: IEventbus;

  /**
   * Destroy everything - engine, adapters, and cleanup
   */
  destroy: () => Promise<void>;
}
```

### IEngineFactory (Updated)

```typescript
// src/types.ts

/**
 * Factory for creating Eligius engine instances
 */
interface IEngineFactory {
  /**
   * Create a fully wired engine with adapters
   * @param configuration - Engine configuration
   * @param resolver - Optional custom configuration resolver
   * @returns Engine result with engine, language manager, eventbus, and destroy function
   */
  createEngine(
    configuration: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEngineFactoryResult;

  /**
   * Destroy the factory and its resources
   */
  destroy(): void;
}
```

## Event Mappings

### Engine Events → Eventbus Events

| Engine Event | Eventbus Event | Args Mapping |
|--------------|----------------|--------------|
| `start` | `timeline-play` | `[]` |
| `pause` | `timeline-pause` | `[]` |
| `stop` | `timeline-stop` | `[]` |
| `time` | `timeline-time` | `[position]` |
| `duration` | `timeline-duration` | `[duration]` |
| `seekStart` | `timeline-seek` | `[target, current, duration]` |
| `seekComplete` | `timeline-seeked` | `[position, duration]` |
| `timelineChange` | `timeline-current-timeline-change` | `[uri]` |
| `timelineComplete` | `timeline-complete` | `[]` |
| `timelineFirstFrame` | `timeline-firstframe` | `[]` |
| `timelineRestart` | `timeline-restart` | `[]` |

### Eventbus Events → Engine Methods

| Eventbus Event | Engine Method |
|----------------|---------------|
| `timeline-play-request` | `start()` |
| `timeline-pause-request` | `pause()` |
| `timeline-stop-request` | `stop()` |
| `timeline-seek-request` | `seek(position)` |
| `timeline-play-toggle-request` | `playState === 'playing' ? pause() : start()` |
| `request-timeline-uri` | `switchTimeline(uri, position)` |
| `request-timeline-cleanup` | internal cleanup (end active actions) |

### Eventbus Events → Engine State

| Eventbus Event | Engine Property |
|----------------|-----------------|
| `request-current-timeline-position` | `position` |
| `timeline-duration-request` | `duration` |
| `timeline-container-request` | `container` |
| `request-engine-root` | `engineRoot` |
| `timeline-request-current-timeline` | `currentTimelineUri` |

### Language Events → Eventbus Events

| LanguageManager Event | Eventbus Event |
|-----------------------|----------------|
| `change` | `language-change` (broadcast) |

### Eventbus Events → LanguageManager Methods

| Eventbus Event | LanguageManager Method |
|----------------|------------------------|
| `request-current-language` | `language` (property) |
| `request-label-collection` | `getLabelCollection(id)` |
| `request-label-collections` | `getLabelCollections(ids)` |
| `language-change` | `setLanguage(language)` |
