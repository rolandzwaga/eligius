# Data Model: EventBus Type-Safe Refactor

**Feature**: 003-eventbus-typing
**Date**: 2025-11-08

## Overview

This feature refactors the EventBus from untyped string-based events to a type-safe system where event names are strictly associated with their argument types through TypeScript's type system.

## Core Entities

### Event Definition

**Purpose**: Represents a single event type with its name and arguments structure

**Structure**:
```typescript
interface {EventName}Event {
  name: '{event-name}';  // String literal type
  args: [arg1: Type1, arg2: Type2, ...];  // Tuple type
}
```

**Properties**:
- `name`: String literal type representing the exact event name (e.g., `'timeline-seek-request'`)
- `args`: Tuple type defining the event's arguments with names and types (e.g., `[position: number]`)

**Constraints**:
- Event name must be unique across all events
- Event name must be kebab-case string
- Args must be a tuple type (even empty `[]` for no arguments)
- Args tuple elements should have descriptive names

**Examples**:
```typescript
// Event with arguments
export interface TimelineSeekRequestEvent {
  name: 'timeline-seek-request';
  args: [position: number];
}

// Event without arguments
export interface TimelinePlayRequestEvent {
  name: 'timeline-play-request';
  args: [];
}

// Event with multiple arguments
export interface DomMutationEvent {
  name: 'dom-mutation';
  args: [mutations: MutationRecord[], target: Element, timestamp: number];
}
```

### EventMap

**Purpose**: Type-level mapping from event name strings to their argument tuple types

**Structure**:
```typescript
type EventMap = {
  [K in AllEvents as K['name']]: K['args']
};
```

**Properties**:
- Keys: String literal types from all event `name` properties
- Values: Tuple types from corresponding event `args` properties

**Generation**: Auto-generated from event interface files by events metadata generator

**Constraints**:
- Must include ALL public events (non-@private)
- Keys must be unique (enforced by TypeScript)
- Updated whenever event files change

**Example**:
```typescript
type EventMap = {
  'timeline-play-request': [];
  'timeline-seek-request': [position: number];
  'timeline-pause-request': [];
  'dom-mutation': [mutations: MutationRecord[], target: Element, timestamp: number];
  // ... all other events
};
```

### EventName

**Purpose**: Union type of all valid event name strings

**Structure**:
```typescript
type EventName = keyof EventMap;
```

**Generation**: Derived from EventMap via `keyof`

**Usage**: Provides IDE autocomplete for event names

**Example**:
```typescript
type EventName =
  | 'timeline-play-request'
  | 'timeline-seek-request'
  | 'timeline-pause-request'
  | 'dom-mutation'
  // ... all other event names
```

### Event Metadata

**Purpose**: Runtime metadata describing an event for documentation and tooling

**Structure**:
```typescript
interface IEventMetadata<TArgs extends any[] = any[]> {
  description: string;
  category: string;
  args: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}
```

**Properties**:
- `description`: Human-readable description from JSDoc
- `category`: Event category from @category JSDoc tag
- `args`: Array of argument metadata (name, type as string, optional description)

**Generation**: Auto-generated from event interfaces by events metadata generator

**Constraints**:
- Only generated for public events (excludes @private)
- Description extracted from main JSDoc comment
- Category extracted from @category tag or defaults to 'unknown'
- Args extracted from tuple type properties

**Example**:
```typescript
export function timelineSeekRequest(): IEventMetadata<[position: number]> {
  return {
    description: 'Request to seek to a specific position in the timeline',
    category: 'Timeline Control',
    args: [
      { name: 'position', type: 'number' }
    ]
  };
}
```

## Type Relationships

### Event Definition → EventMap

Event interfaces are collected via mapped type transformation:

```typescript
// Input: Event interfaces
interface TimelinePlayRequestEvent {
  name: 'timeline-play-request';
  args: [];
}

interface TimelineSeekRequestEvent {
  name: 'timeline-seek-request';
  args: [position: number];
}

// Output: EventMap (generated)
type AllEvents = TimelinePlayRequestEvent | TimelineSeekRequestEvent | ...;

type EventMap = {
  [K in AllEvents as K['name']]: K['args']
};
// Result:
// {
//   'timeline-play-request': [];
//   'timeline-seek-request': [position: number];
// }
```

### EventMap → EventName

EventName derived from EventMap keys:

```typescript
type EventName = keyof EventMap;
// Result: 'timeline-play-request' | 'timeline-seek-request' | ...
```

### EventBus Type Safety

EventBus methods use EventMap for type safety:

```typescript
interface IEventbus {
  // Event name E constrains handler args via EventMap[E]
  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  // Event name E constrains broadcast args via EventMap[E]
  broadcast<E extends EventName>(
    eventName: E,
    args: EventMap[E]
  ): void;
}
```

**Type Flow**:
1. User calls `eventbus.on('timeline-seek-request', handler)`
2. TypeScript infers `E = 'timeline-seek-request'`
3. TypeScript looks up `EventMap['timeline-seek-request']` = `[position: number]`
4. Handler signature becomes `(position: number) => void`
5. Compiler enforces handler parameter matches

## State Transitions

Events have no state transitions - they are stateless type definitions.

EventBus state management (play/pause/stop) remains unchanged from current implementation.

## Validation Rules

### Event Definition Validation

- Event name MUST be unique across all events (TypeScript enforces via duplicate object key error)
- Event name MUST be valid identifier string (kebab-case recommended)
- Args MUST be tuple type (use `[]` for no arguments, never `void`)
- Args tuple elements SHOULD have descriptive names (`position: number` not `arg0: number`)

### Metadata Generation Validation

- @private events MUST NOT appear in generated metadata
- @category tag value MUST be non-empty string (default to 'unknown' if missing)
- Generated metadata MUST export function returning `IEventMetadata<TArgs>`
- Generated types.ts MUST export `EventMap` and `EventName`

### EventBus Type Validation (Compile-Time)

- Event name passed to `on()`/`broadcast()` MUST be in `EventName` union
- Handler args MUST match `EventMap[E]` for event name `E`
- Broadcast args MUST match `EventMap[E]` for event name `E`
- Topics remain untyped string (no validation)

## File Organization

```
src/eventbus/events/
├── timeline-play-request.ts       # Event definition
├── timeline-seek-request.ts       # Event definition
├── dom-mutation.ts                 # Event definition (@private)
├── ... (all events)
├── types.ts                        # GENERATED: EventMap, EventName
├── metadata/
│   ├── timeline-play-request.ts   # GENERATED: Event metadata
│   ├── timeline-seek-request.ts   # GENERATED: Event metadata
│   ├── ... (public events only)
│   ├── types.ts                   # IEventMetadata interface
│   └── index.ts                   # Barrel export
└── index.ts                        # Barrel export
```

## Migration from TimelineEventNames

Current state:
```typescript
// src/timeline-event-names.ts
export class TimelineEventNames {
  static PLAY_REQUEST = 'timeline-play-request';
  static SEEK_REQUEST = 'timeline-seek-request';
  // ... ~40 events
}

// Usage
eventbus.broadcast(TimelineEventNames.PLAY_REQUEST);
```

Target state:
```typescript
// src/eventbus/events/timeline-play-request.ts
export interface TimelinePlayRequestEvent {
  name: 'timeline-play-request';
  args: [];
}

// src/eventbus/events/types.ts (GENERATED)
type EventName = 'timeline-play-request' | 'timeline-seek-request' | ...;

// Usage
eventbus.broadcast('timeline-play-request', []); // Type-safe with autocomplete
```

Migration steps:
1. Create event interface for each TimelineEventNames entry
2. Generate EventMap and EventName types
3. Update EventBus interface
4. Find/replace all `TimelineEventNames.X` with corresponding string literal
5. Delete `src/timeline-event-names.ts`
6. Verify tests pass

## Summary

This data model defines:
- **Event Definition**: Interface with string literal name and tuple args
- **EventMap**: Type-level mapping of event names to argument types
- **EventName**: Union of all event name strings
- **Event Metadata**: Runtime description of events for tooling
- **Type Safety**: Compile-time enforcement of event name-argument association
- **Migration**: Clear path from TimelineEventNames to type-safe string literals
