# Feature Specification: Timeline Provider Decomposition

**Feature Branch**: `004-timeline-provider-decomposition`
**Created**: 2025-12-07
**Status**: Draft
**Input**: User description: "Decompose ITimelineProvider interface into composable interfaces (IPositionSource, ISeekable, IPlaylist, IContainerProvider) to support alternative timeline sources like scroll, mouse, and WebSocket"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create RAF-based Position Source (Priority: P1)

As a developer using Eligius, I want to use the existing RequestAnimationFrame-based timeline through the new decomposed interfaces so that I can take advantage of the new architecture while maintaining current functionality.

**Why this priority**: This ensures backwards compatibility and validates that the new interface design works for the primary existing use case.

**Independent Test**: Can be fully tested by creating a RAF position source, activating it, and verifying position updates are emitted at the expected intervals. Delivers the same animation timeline functionality as the current implementation.

**Acceptance Scenarios**:

1. **Given** a RAF position source configured with a 60-second duration, **When** I call `activate()`, **Then** the source state changes to `active` and position updates are emitted every second
2. **Given** an active RAF position source at position 30, **When** I call `suspend()`, **Then** the source state changes to `suspended` and position updates stop while preserving position 30
3. **Given** a suspended RAF position source at position 30, **When** I call `activate()`, **Then** the source resumes from position 30 and continues emitting updates
4. **Given** an active RAF position source, **When** I call `deactivate()`, **Then** the source state changes to `inactive` and position resets to 0
5. **Given** a RAF position source with `loop: true` at position 59, **When** the position reaches 60 (end), **Then** the source emits `'end'` boundary, resets to position 0, and continues
6. **Given** a RAF position source with `loop: false` at position 59, **When** the position reaches 60, **Then** the source emits `'end'` boundary and automatically deactivates

---

### User Story 2 - Create Video.js-based Position Source (Priority: P1)

As a developer using Eligius, I want to use video playback as a timeline source through the new decomposed interfaces so that video-driven experiences continue to work with the new architecture.

**Why this priority**: Video-based timelines are a core use case that must work with the new architecture.

**Independent Test**: Can be fully tested by creating a video position source, loading a video, and verifying that position updates reflect actual video playback time.

**Acceptance Scenarios**:

1. **Given** a video position source with a loaded video, **When** I call `activate()`, **Then** the video starts playing and position updates are emitted matching video currentTime
2. **Given** an active video position source, **When** I call `suspend()`, **Then** the video pauses and position updates stop while preserving current position
3. **Given** a video position source, **When** I call `seek(30.5)`, **Then** the video seeks to 30.5 seconds and returns the actual position after seek
4. **Given** a video position source, **When** the video reaches its end, **Then** the source emits `'end'` boundary event

---

### User Story 3 - Scroll-based Position Source (Priority: P2)

As a developer, I want to use scroll position as a timeline source so that I can create scroll-triggered animations and parallax storytelling experiences.

**Why this priority**: This validates the decomposed architecture supports non-temporal position sources, which is the primary motivation for this refactoring.

**Independent Test**: Can be fully tested by creating a scroll position source, scrolling a container, and verifying that position updates reflect scroll progress.

**Acceptance Scenarios**:

1. **Given** a scroll position source bound to a scrollable container, **When** I call `activate()`, **Then** the source begins listening to scroll events and emitting position updates
2. **Given** an active scroll position source on a container scrolled to 50%, **When** the container is scrolled to 75%, **Then** a position update is emitted with the new position value
3. **Given** a scroll position source with duration 100, **When** the container is scrolled to 50% of its scrollable height, **Then** `getPosition()` returns 50
4. **Given** an active scroll position source, **When** I call `suspend()`, **Then** scroll events are ignored but scroll position is preserved
5. **Given** a scroll position source, **When** I call `seek(75)`, **Then** the container scrolls programmatically to the corresponding scroll position
6. **Given** an active scroll position source, **When** the container is scrolled to the top (0%), **Then** the source emits `'start'` boundary event
7. **Given** an active scroll position source, **When** the container is scrolled to the bottom (100%), **Then** the source emits `'end'` boundary event

---

### User Story 4 - External Container Provider (Priority: P2)

As a developer, I want to configure a container separately from the position source so that I can use position sources that don't have an intrinsic container (like WebSocket or step-based sources).

**Why this priority**: Separating container from position source is essential for supporting non-DOM-based timeline drivers.

**Independent Test**: Can be fully tested by creating a container provider with a DOM selector and verifying it returns the correct jQuery-wrapped element.

**Acceptance Scenarios**:

1. **Given** a DOM container provider configured with selector `#app`, **When** `init()` is called, **Then** `getContainer()` returns a jQuery-wrapped reference to the `#app` element
2. **Given** a container provider, **When** the container element exists in the DOM, **Then** `onContainerReady` callback is invoked
3. **Given** a position source without intrinsic container and a separate container provider, **When** both are initialized, **Then** operations can render content to the container while position comes from the source

---

### User Story 5 - Playlist Management (Priority: P3)

As a developer, I want to manage multiple timeline items through a dedicated playlist interface so that I can switch between different timeline configurations.

**Why this priority**: Playlist functionality exists in current implementation and should be preserved, but is not required for basic position source functionality.

**Independent Test**: Can be fully tested by creating a playlist with multiple items and verifying item selection and change callbacks work correctly.

**Acceptance Scenarios**:

1. **Given** a playlist with 3 items, **When** I access `currentItem`, **Then** I receive the first item
2. **Given** a playlist with items having URIs "chapter-1", "chapter-2", "chapter-3", **When** I call `selectItem("chapter-2")`, **Then** `currentItem` changes to the chapter-2 item
3. **Given** a playlist with an `onItemChange` callback registered, **When** I call `selectItem()`, **Then** the callback is invoked with the new current item
4. **Given** a playlist, **When** I call `selectItem("non-existent")`, **Then** an error is thrown

---

### User Story 6 - Backwards Compatible Facade (Priority: P3)

As a developer with existing Eligius implementations, I want the engine to continue working with the legacy `ITimelineProvider` interface so that I don't need to immediately refactor my code.

**Why this priority**: Backwards compatibility ensures existing users aren't forced to migrate immediately.

**Independent Test**: Can be fully tested by running existing engine code against a facade that wraps the new decomposed interfaces.

**Acceptance Scenarios**:

1. **Given** a composed timeline provider facade wrapping new interfaces, **When** I call legacy methods like `start()`, `pause()`, `stop()`, **Then** they delegate correctly to the underlying position source
2. **Given** a facade, **When** I access `playState`, **Then** it returns the mapped state from the position source (`active` -> `running`, `suspended` -> `paused`, `inactive` -> `stopped`)
3. **Given** a facade with a seekable position source, **When** I call `seek()`, **Then** it delegates to the seekable interface

---

### Edge Cases

- What happens when `seek()` is called on a non-seekable position source? The engine should use the `isSeekable()` type guard and handle gracefully (return current position).
- What happens when `loop` is set to `true` on a position source that doesn't support looping (e.g., mouse position)? The `loop` property is advisory; sources that don't support looping ignore it. This MUST be documented in the `IPositionSource` interface JSDoc.
- What happens when `activate()` is called on an already active source? The source should remain active; no error thrown.
- What happens when a scroll position source's container is removed from DOM? The source MUST deactivate and emit an `'end'` boundary event to signal termination.
- What happens when `getContainer()` is called before `init()`? Should return `undefined`. All IPositionSource methods except `init()` and property access should be safe to call before initialization but may return default/undefined values.
- What happens when duration is `Infinity` (unbounded sources)? Looping should not apply; sources run indefinitely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an `IPositionSource` interface with state management (`active`, `suspended`, `inactive`)
- **FR-002**: System MUST provide lifecycle methods on position sources (`init()`, `destroy()`)
- **FR-003**: System MUST provide transport methods on position sources (`activate()`, `suspend()`, `deactivate()`)
- **FR-004**: System MUST provide position query methods (`getPosition()`, `getDuration()`)
- **FR-005**: System MUST provide event registration methods (`onPosition()`, `onBoundaryReached()`)
- **FR-006**: System MUST provide a `loop` property on position sources that controls end-of-timeline behavior
- **FR-007**: System MUST provide an `ISeekable` interface for sources that support arbitrary position changes
- **FR-008**: System MUST provide an `isSeekable()` type guard function to check if a source implements `ISeekable`
- **FR-009**: System MUST provide an `IPlaylist<TItem>` interface for managing multiple timeline items
- **FR-010**: System MUST provide an `IContainerProvider` interface for DOM container access
- **FR-011**: System MUST maintain the legacy `ITimelineProvider` interface marked as deprecated
- **FR-012**: System MUST provide a facade/adapter to wrap new interfaces into legacy `ITimelineProvider`
- **FR-013**: System MUST implement `RafPositionSource` using the new `IPositionSource` interface
- **FR-014**: System MUST implement `VideoPositionSource` using the new interfaces
- **FR-015**: Position sources MUST emit `'end'` boundary event when reaching duration
- **FR-016**: Position sources with `loop: true` MUST reset to position 0 after emitting `'end'` boundary
- **FR-017**: Position sources with `loop: false` MUST deactivate after emitting `'end'` boundary
- **FR-018**: The engine factory MUST assemble position source, container provider, and playlist based on configuration

### Key Types and Entities

**Interfaces (Entities)**:
- **IPositionSource**: Core interface providing position within a timeline. Responsible for state management, lifecycle, transport controls, and position events. Can be implemented by various sources (RAF, video, scroll, mouse, WebSocket).
- **ISeekable**: Optional capability interface for sources that support jumping to arbitrary positions.
- **IPlaylist<TItem>**: Collection manager for multiple timeline configurations. Supports item selection and change notifications.
- **IContainerProvider**: DOM container access for rendering operations. Can be intrinsic to a position source (video) or configured separately.

**Types**:
- **TSourceState**: Union type representing position source state: `'active'` | `'suspended'` | `'inactive'`
- **TBoundary**: Union type representing boundary events: `'start'` | `'end'`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing tests pass without modification when using the backwards-compatible facade
- **SC-002**: New position source implementations (RAF, Video) pass all acceptance scenarios defined above
- **SC-003**: A scroll-based position source can be implemented using only the new interfaces (validates extensibility)
- **SC-004**: The decomposed interfaces require no changes to the engine's action execution logic
- **SC-005**: Configuration-driven assembly allows switching between position source types without code changes
- **SC-006**: Code coverage for new interfaces and implementations meets the 90% project threshold

## Assumptions

- The engine factory will handle assembly of the decomposed pieces based on configuration
- Configuration schema changes are minimal (adding container selector as a separate field)
- Existing timeline provider implementations will be refactored to use the new interfaces internally while exposing the legacy interface via facade during transition
- The jQuery dependency for `IContainerProvider.getContainer()` is acceptable as jQuery is already a peer dependency
- Position is always represented as a number (seconds for time-based sources, progress units for others)
- Duration of `Infinity` indicates an unbounded source (no natural end)
