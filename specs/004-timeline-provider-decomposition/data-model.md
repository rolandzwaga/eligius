# Data Model: Timeline Provider Decomposition

**Date**: 2025-12-07
**Feature**: 004-timeline-provider-decomposition

## Core Types

### TSourceState

Position source lifecycle state.

| Value | Description |
|-------|-------------|
| `'active'` | Source is emitting position updates |
| `'suspended'` | Source is paused, position preserved |
| `'inactive'` | Source is stopped, position reset to initial |

### TBoundary

Boundary event type.

| Value | Description |
|-------|-------------|
| `'start'` | Position reached beginning (after reverse/loop) |
| `'end'` | Position reached end of duration |

---

## Interfaces

### IPositionSource

Core interface for all position sources.

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `state` | `TSourceState` (readonly) | Current lifecycle state |
| `loop` | `boolean` | Whether to loop at end boundary |
| `init()` | `Promise<void>` | Initialize the source |
| `destroy()` | `void` | Release all resources |
| `activate()` | `Promise<void>` | Begin emitting position updates |
| `suspend()` | `void` | Pause, preserving position |
| `deactivate()` | `void` | Stop and reset position |
| `getPosition()` | `number` | Current position |
| `getDuration()` | `number` | Total duration (or `Infinity`) |
| `onPosition(cb)` | `void` | Register position update callback |
| `onBoundaryReached(cb)` | `void` | Register boundary event callback |

**State Transitions**:
- `inactive` → `active`: via `activate()`
- `active` → `suspended`: via `suspend()`
- `active` → `inactive`: via `deactivate()`
- `suspended` → `active`: via `activate()`
- `suspended` → `inactive`: via `deactivate()`

### ISeekable

Optional interface for seekable position sources.

| Method | Type | Description |
|--------|------|-------------|
| `seek(position)` | `Promise<number>` | Seek to position, returns actual position |

### IPlaylist\<TItem\>

Interface for managing timeline item collections.

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `currentItem` | `TItem` (readonly) | Currently active item |
| `items` | `readonly TItem[]` | All playlist items |
| `selectItem(id)` | `void` | Switch to item by identifier |
| `onItemChange(cb)` | `void` | Register item change callback |

### IContainerProvider

Interface for DOM container access.

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `getContainer()` | `JQuery<HTMLElement> \| undefined` | Get container element |
| `onContainerReady(cb)` | `void` | Register ready callback |

---

## Implementations

### RafPositionSource

RAF-based position source for animation timelines.

**Implements**: `IPositionSource`, `ISeekable`

| Property | Type | Source |
|----------|------|--------|
| `_currentPosition` | `number` | Internal counter |
| `_duration` | `number` | From configuration |
| `_tickInterval` | `number` | 1000ms default |
| `_abortController` | `AbortController` | For timer cancellation |

### VideoPositionSource

Video.js-based position source.

**Implements**: `IPositionSource`, `ISeekable`, `IContainerProvider`

| Property | Type | Source |
|----------|------|--------|
| `_player` | `VideoJsPlayer` | video.js instance |
| `_position` | `number` | From `player.currentTime()` |
| `_duration` | `number` | From `player.duration()` |

### ScrollPositionSource

Scroll-based position source.

**Implements**: `IPositionSource`, `ISeekable`

| Property | Type | Source |
|----------|------|--------|
| `_element` | `HTMLElement` | Scrollable container |
| `_position` | `number` | Calculated from scroll % |
| `_duration` | `number` | Configured duration |
| `_scrollHandler` | `Function` | Bound scroll listener |

### DomContainerProvider

DOM selector-based container provider.

**Implements**: `IContainerProvider`

| Property | Type | Source |
|----------|------|--------|
| `_selector` | `string` | CSS selector |
| `_container` | `JQuery<HTMLElement>` | jQuery-wrapped element |

### SimplePlaylist\<TItem\>

Basic playlist implementation.

**Implements**: `IPlaylist<TItem>`

| Property | Type | Source |
|----------|------|--------|
| `_items` | `TItem[]` | From configuration |
| `_currentIndex` | `number` | Current item index |
| `_identifierKey` | `keyof TItem` | Key for item lookup |

### TimelineProviderFacade

Backwards-compatible wrapper.

**Implements**: `ITimelineProvider` (legacy)

| Property | Type | Source |
|----------|------|--------|
| `_positionSource` | `IPositionSource` | Composed source |
| `_containerProvider` | `IContainerProvider` | Composed container |
| `_playlist` | `IPlaylist \| undefined` | Optional playlist |
| `_seekable` | `ISeekable \| undefined` | Optional seek support |

---

## Type Guards

### isSeekable

```typescript
function isSeekable(source: IPositionSource): source is IPositionSource & ISeekable
```

Returns `true` if source implements `ISeekable` interface.

---

## Configuration Extensions

### ITimelineConfiguration (extended)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `container` | `string` | No | Container selector (defaults to timeline selector) |
| `positionSource` | `'raf' \| 'video' \| 'scroll'` | No | Position source type |

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    TimelineProviderFacade                   │
│              (implements ITimelineProvider)                 │
└─────────────────┬────────────────┬────────────────┬─────────┘
                  │                │                │
                  ▼                ▼                ▼
         ┌────────────────┐ ┌─────────────┐ ┌────────────┐
         │ IPositionSource│ │IContainerPr.│ │ IPlaylist  │
         │    + ISeekable │ │             │ │ (optional) │
         └────────┬───────┘ └──────┬──────┘ └─────┬──────┘
                  │                │              │
    ┌─────────────┼────────────────┼──────────────┤
    │             │                │              │
    ▼             ▼                ▼              ▼
┌───────┐   ┌─────────┐   ┌────────────┐   ┌──────────────┐
│ Raf   │   │ Video   │   │    Dom     │   │   Simple     │
│Source │   │ Source  │   │ Container  │   │   Playlist   │
└───────┘   └─────────┘   └────────────┘   └──────────────┘
```
