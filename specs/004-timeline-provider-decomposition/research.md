# Research: Timeline Provider Decomposition

**Date**: 2025-12-07
**Feature**: 004-timeline-provider-decomposition

## Research Areas

### 1. Video.js Event API Patterns

**Context**: Need to understand video.js event patterns for VideoPositionSource implementation.

**Decision**: Use video.js event API (`on`, `off`, `one`, `trigger`) for position tracking.

**Findings** (via Context7):
- `player.on('timeupdate', callback)` - For position updates during playback
- `player.on('ended', callback)` - For boundary event detection
- `player.currentTime()` - Get/set current playback position
- `player.duration()` - Get video duration
- `player.one('eventName', callback)` - Single-fire event listener
- `player.off('eventName', callback)` - Remove event listener

**Rationale**: Standard video.js event patterns ensure compatibility with peer dependency.

**Alternatives Considered**:
- Polling currentTime: Rejected (inefficient, missed events)
- Native video element events: Rejected (video.js already wraps these)

---

### 2. Vitest Fake Timer Patterns

**Context**: Need patterns for testing RAF-based and timer-dependent position sources.

**Decision**: Use `vi.useFakeTimers()` with `vi.advanceTimersByTime()` for deterministic testing.

**Findings** (via Context7):
```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Advance by specific duration
vi.advanceTimersByTime(1000) // 1 second

// Advance to next timer
vi.advanceTimersToNextTimer()

// Advance to next animation frame
vi.advanceTimersToNextFrame()

// Mock system time
vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
```

**Rationale**: Fake timers enable testing of time-dependent code without real delays.

**Alternatives Considered**:
- Real-time tests with small timeouts: Rejected (flaky, slow)
- Custom time abstraction: Rejected (Vitest handles this well)

---

### 3. Scroll Event Debouncing

**Context**: Scroll events fire rapidly; need efficient position tracking.

**Decision**: Use passive scroll listeners with RAF-based position sampling.

**Findings**:
- Scroll events fire 60+ times per second during active scrolling
- Use `{ passive: true }` for scroll listeners to avoid blocking
- Sample position on RAF tick rather than every scroll event
- Calculate position: `position = (scrollTop / maxScroll) * duration`

**Pattern**:
```typescript
let ticking = false;
element.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      this.updatePosition();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

**Rationale**: Prevents scroll jank and keeps position updates at 60fps max.

**Alternatives Considered**:
- Throttle with setTimeout: Rejected (inconsistent timing)
- Every scroll event: Rejected (performance impact)

---

### 4. animationInterval Utility

**Context**: Existing utility for RAF-based timing in Eligius.

**Decision**: Continue using `animationInterval` utility for RafPositionSource.

**Findings** (from `src/util/animation-interval.ts`):
- Uses `requestAnimationFrame` with time-based scheduling
- Supports `AbortSignal` for cancellation
- Syncs with document timeline when available
- Already proven in `RequestAnimationFrameTimelineProvider`

**Rationale**: Reuse existing, tested utility rather than reimplementing.

---

### 5. State Machine Pattern for Position Sources

**Context**: Position sources have 3 states with defined transitions.

**Decision**: Simple state property with explicit transition methods.

**State Diagram**:
```
          activate()        suspend()
    ┌─────────────────┐   ┌─────────────┐
    │                 ▼   │             ▼
 inactive ◄──────── active ────────► suspended
    ▲                 │                 │
    │                 │   activate()    │
    │    deactivate() │ ◄───────────────┘
    └─────────────────┘
```

**Valid Transitions**:
- `inactive` → `active` (activate)
- `active` → `suspended` (suspend)
- `active` → `inactive` (deactivate)
- `suspended` → `active` (activate)
- `suspended` → `inactive` (deactivate)

**Rationale**: Simple state property is sufficient; no need for state machine library.

---

### 6. Facade Pattern for Backwards Compatibility

**Context**: Need to wrap new interfaces into legacy ITimelineProvider.

**Decision**: Implement facade that delegates to composed interfaces.

**Mapping**:
| Legacy Method | New Interface | Delegation |
|---------------|---------------|------------|
| `start()` | IPositionSource | `positionSource.activate()` |
| `pause()` | IPositionSource | `positionSource.suspend()` |
| `stop()` | IPositionSource | `positionSource.deactivate()` |
| `seek()` | ISeekable | `seekable?.seek() ?? currentPosition` |
| `playState` | IPositionSource | Map `state` to legacy values |
| `getPosition()` | IPositionSource | `positionSource.getPosition()` |
| `getDuration()` | IPositionSource | `positionSource.getDuration()` |
| `getContainer()` | IContainerProvider | `containerProvider.getContainer()` |
| `playlistItem()` | IPlaylist | `playlist?.selectItem()` |
| `onTime()` | IPositionSource | `positionSource.onPosition()` |
| `onComplete()` | IPositionSource | Filter `onBoundaryReached('end')` |
| `onRestart()` | IPositionSource | Detect loop + boundary |
| `onFirstFrame()` | IContainerProvider | `containerProvider.onContainerReady()` |

**State Mapping**:
- `active` → `running`
- `suspended` → `paused`
- `inactive` → `stopped`

**Rationale**: Facade provides clean API translation without changing engine code.

---

### 7. Configuration Schema Extension

**Context**: Need to add container configuration separate from timeline provider.

**Decision**: Add optional `container` field to timeline configuration.

**Schema Extension**:
```typescript
interface ITimelineConfiguration {
  // Existing fields...

  /** Container selector (optional, defaults to timeline selector) */
  container?: string;

  /** Position source type */
  positionSource?: 'raf' | 'video' | 'scroll';
}
```

**Rationale**: Additive change, backwards compatible (container defaults to existing behavior).

---

## Summary of Key Decisions

| Area | Decision |
|------|----------|
| Video.js events | Use standard `on/off/one` event API |
| Test timers | Vitest `vi.useFakeTimers()` with `advanceTimersByTime` |
| Scroll handling | Passive listeners + RAF-based sampling |
| RAF timing | Reuse existing `animationInterval` utility |
| State management | Simple property with explicit transition methods |
| Backwards compat | Facade pattern delegating to new interfaces |
| Configuration | Additive optional `container` field |

## Unresolved Items

None - all research questions resolved.

---

## Future Position Source Ideas

The following position source concepts were brainstormed during the design phase. They are documented here for future reference, as the decomposed `IPositionSource` architecture was specifically designed to enable these implementations.

### Temporal Sources

| Source | Description | Position Derivation |
|--------|-------------|---------------------|
| **Audio Playback** | Web Audio API driven | `audioContext.currentTime` or `<audio>` element |
| **WebSocket Clock** | Server-pushed timestamps | Remote timestamp mapped to local position |
| **External Sync** | NTP or master clock | Synchronized multi-device timelines |
| **MIDI Timecode** | MIDI clock signals | Beat/bar position from MIDI device |

### Spatial/Input Sources

| Source | Description | Position Derivation |
|--------|-------------|---------------------|
| **Mouse Position** | Cursor X/Y coordinates | `(mouseX / containerWidth) * duration` |
| **Device Orientation** | Gyroscope/accelerometer | Tilt angle mapped to position |
| **Touch Gesture** | Swipe/drag progression | Cumulative gesture distance |
| **Drag Distance** | Element drag position | Drag offset as percentage of range |
| **Gamepad Axis** | Controller analog stick | Stick position mapped to timeline |

### Data-Driven Sources

| Source | Description | Position Derivation |
|--------|-------------|---------------------|
| **Sensor Stream** | IoT/environmental data | Sensor value normalized to duration |
| **Game State** | Level/quest progression | Completion percentage × duration |
| **Form Completion** | Multi-step form wizard | `(fieldsComplete / totalFields) * duration` |
| **Loading Progress** | Asset/data loading | Bytes loaded as percentage |
| **API Polling** | External data endpoint | Mapped value from API response |

### Interactive Sources

| Source | Description | Position Derivation |
|--------|-------------|---------------------|
| **Slider/Range Input** | HTML range element | `input.value` scaled to duration |
| **Keyboard Sequence** | Step-through with keys | Discrete position increments |
| **Voice Commands** | Speech recognition | Command-driven position jumps |
| **Eye Tracking** | Gaze position | Screen region mapped to position |
| **Gesture Recognition** | Hand/body gestures | Gesture completion percentage |

### Hybrid/Composite Sources

| Source | Description | Position Derivation |
|--------|-------------|---------------------|
| **Multi-Source Blend** | Weighted average of sources | `(source1 * w1 + source2 * w2) / (w1 + w2)` |
| **Conditional Source** | Switch between sources | Active source based on context |
| **Clamped Source** | Bounded position range | Primary source with min/max limits |

### Implementation Notes

All these sources would implement `IPositionSource` and optionally `ISeekable`:

```typescript
// Example: MousePositionSource
class MousePositionSource implements IPositionSource, ISeekable {
  private _position = 0;
  private _duration: number;
  private _element: HTMLElement;

  constructor(element: HTMLElement, duration: number) {
    this._element = element;
    this._duration = duration;
  }

  // Track mouse X position within element
  private handleMouseMove = (e: MouseEvent) => {
    const rect = this._element.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    this._position = Math.max(0, Math.min(1, percentage)) * this._duration;
    this._positionCallbacks.forEach(cb => cb(this._position));
  };

  // ... IPositionSource implementation
}
```

### Selection Criteria for MVP

The MVP includes RAF, Video, and Scroll sources because they:
1. Cover the most common use cases (animation, video sync, scrollytelling)
2. Represent different source categories (temporal, media, spatial)
3. Validate the interface design with diverse implementations
4. Have well-understood behavior and testing patterns

Future sources can be added incrementally without architecture changes.
