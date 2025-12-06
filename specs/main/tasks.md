# Tasks: Engine API Redesign with Adapter Pattern

**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution Principle I (Test-First Development) and 90% coverage requirement.

**Organization**: Tasks are grouped by functional requirement (FR-1 through FR-8) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which functional requirement this task belongs to (FR1, FR2, etc.)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create new directory structure and update type definitions

- [ ] T001 Create adapters directory at src/adapters/
- [ ] T002 [P] Add EngineEvents interface to src/types.ts
- [ ] T003 [P] Add LanguageEvents interface to src/types.ts
- [ ] T004 [P] Add IEngineFactoryResult interface to src/types.ts
- [ ] T005 [P] Add ILanguageManager interface to src/types.ts
- [ ] T006 [P] Update IEligiusEngine interface in src/types.ts with pure API (state properties, on() method, playback commands)

---

## Phase 2: Foundational (TypedEventEmitter)

**Purpose**: Core utility that ALL other components depend on - MUST complete before any FR implementation

**CRITICAL**: FR-2 through FR-8 all depend on TypedEventEmitter being complete

### Tests for TypedEventEmitter

- [ ] T007 [P] Create test file src/test/unit/util/typed-event-emitter.spec.ts with tests for:
  - on() subscribes and returns unsubscribe function
  - once() fires handler only once
  - off() removes handler
  - emit() calls handlers with correct arguments
  - emit() preserves registration order
  - emit() catches handler errors without breaking other handlers
  - emit() handles handler removal during iteration (copy array)
  - removeAllListeners() clears all handlers
  - removeAllListeners(event) clears handlers for specific event
  - emit() overhead is <1ms for 100 handlers (NFR-2 performance requirement)

### Implementation

- [ ] T008 Implement TypedEventEmitter class in src/util/typed-event-emitter.ts per data-model.md interface
- [ ] T009 Export TypedEventEmitter from src/util/index.ts
- [ ] T010 Run tests and verify all pass: npm test -- src/test/unit/util/typed-event-emitter.spec.ts

**Checkpoint**: TypedEventEmitter complete - FR implementations can now begin

---

## Phase 3: FR-3 - ITimelineProvider Updates (Priority: P1)

**Goal**: Update timeline provider interface and implementations for async start()

**Independent Test**: Call start() on RAF provider, verify it returns Promise<void>

### Tests for FR-3

- [ ] T011 [P] [FR3] Update src/test/unit/timelineproviders/request-animation-frame-timeline-provider.spec.ts to test start() returns Promise<void>
- [ ] T012 [P] [FR3] Update src/test/unit/timelineproviders/video-js-timeline-provider.spec.ts to test start() returns Promise<void> and handles autoplay errors

### Implementation for FR-3

- [ ] T013 [FR3] Update ITimelineProvider interface in src/timelineproviders/types.ts: change start() return type from void to Promise<void>
- [ ] T014 [P] [FR3] Update RequestAnimationFrameTimelineProvider.start() in src/timelineproviders/request-animation-frame-timeline-provider.ts to return Promise.resolve()
- [ ] T015 [P] [FR3] Update VideoJsTimelineProvider.start() in src/timelineproviders/video-js-timeline-provider.ts to return player.play() promise
- [ ] T016 [FR3] Run tests and verify: npm test -- src/test/unit/timelineproviders/

**Checkpoint**: Timeline providers updated - FR-2 can now use async start()

---

## Phase 4: FR-1 - TypedEventEmitter Utility (Priority: P1)

**Goal**: Provide reusable typed event emitter for engine and language manager

**Note**: Implementation already complete in Phase 2. This phase confirms FR-1 requirements met.

- [ ] T017 [FR1] Verify TypedEventEmitter meets all FR-1 requirements from spec.md:
  - Generic type parameter for event map
  - on(), once(), off(), emit(), removeAllListeners()
  - Handler order preserved
  - Error isolation
  - Safe iteration during emit

**Checkpoint**: FR-1 complete (validated from Phase 2)

---

## Phase 5: FR-2 - EligiusEngine Pure API (Priority: P1) - MVP

**Goal**: Refactor engine to expose explicit public API without eventbus dependency

**Independent Test**: Create engine, call start()/pause()/seek() directly, verify state changes

### Tests for FR-2

- [ ] T018 [P] [FR2] Create mock helper createMockEngineWithEmitter() in src/test/fixtures/engine-factory.ts
- [ ] T019 [FR2] Update src/test/unit/eligius-engine.spec.ts to test pure API:
  - Test state properties (position, duration, playState, currentTimelineUri, container, engineRoot)
  - Test on() method for event subscription
  - Test start() calls provider.start() and emits 'start' event
  - Test pause() calls provider.pause() and emits 'pause' event
  - Test stop() calls provider.stop() and emits 'stop' event
  - Test seek() emits 'seekStart' before and 'seekComplete' after
  - Test switchTimeline() emits 'timelineChange'
  - Remove all eventbus-based tests (move to adapter tests)

### Implementation for FR-2

- [ ] T020 [FR2] Add TypedEventEmitter instance to EligiusEngine in src/eligius-engine.ts
- [ ] T021 [FR2] Add state getters to EligiusEngine: position, duration, playState, currentTimelineUri, container, engineRoot
- [ ] T022 [FR2] Add on() method to EligiusEngine that delegates to TypedEventEmitter
- [ ] T023 [FR2] Implement start() method in EligiusEngine: call provider.start(), emit 'start' event
- [ ] T024 [FR2] Implement pause() method in EligiusEngine: call provider.pause(), emit 'pause' event
- [ ] T025 [FR2] Implement stop() method in EligiusEngine: call provider.stop(), emit 'stop' event
- [ ] T026 [FR2] Implement seek() method in EligiusEngine: emit 'seekStart', call provider.seek(), execute actions, emit 'seekComplete'
- [ ] T027 [FR2] Implement switchTimeline() method in EligiusEngine: cleanup current, switch provider, emit 'timelineChange'
- [ ] T028 [FR2] Update provider callbacks (onTime, onComplete, onFirstFrame, onRestart) to emit corresponding events
- [ ] T029 [FR2] Remove _addEventbusListeners() method and all eventbus-related code from EligiusEngine
- [ ] T030 [FR2] Remove eventbus parameter from EligiusEngine constructor
- [ ] T031 [FR2] Run tests and verify: npm test -- src/test/unit/eligius-engine.spec.ts

**Checkpoint**: Engine has pure API - adapters can now bridge to eventbus

---

## Phase 6: FR-4 - LanguageManager Pure API (Priority: P2)

**Goal**: Refactor LanguageManager to expose explicit API without eventbus dependency

**Independent Test**: Create LanguageManager, call setLanguage(), verify 'change' event emits

### Tests for FR-4

- [ ] T032 [FR4] Update src/test/unit/language-manager.spec.ts to test pure API:
  - Test language getter returns current language
  - Test setLanguage() updates language and emits 'change' event with previous language
  - Test setLanguage() throws on empty/null language
  - Test getLabelCollection() returns labels by ID
  - Test getLabelCollections() returns multiple collections
  - Test on() method for event subscription
  - Test destroy() cleans up
  - Remove eventbus-based tests (move to adapter tests)

### Implementation for FR-4

- [ ] T033 [FR4] Add TypedEventEmitter instance to LanguageManager in src/language-manager.ts
- [ ] T034 [FR4] Add language getter to LanguageManager
- [ ] T035 [FR4] Add on() method to LanguageManager that delegates to TypedEventEmitter
- [ ] T036 [FR4] Implement setLanguage() method: validate, update state, emit 'change' event
- [ ] T037 [FR4] Rename getLabelCollection methods to public API (remove underscore prefix)
- [ ] T038 [FR4] Remove _addEventbusListeners() method and all eventbus-related code from LanguageManager
- [ ] T039 [FR4] Remove eventbus parameter from LanguageManager constructor
- [ ] T040 [FR4] Run tests and verify: npm test -- src/test/unit/language-manager.spec.ts

**Checkpoint**: LanguageManager has pure API - adapter can bridge to eventbus

---

## Phase 7: FR-5 - EngineEventbusAdapter (Priority: P2)

**Goal**: Bridge engine events to/from eventbus for backward compatibility

**Independent Test**: Connect adapter, broadcast timeline-play-request, verify engine.start() called

### Tests for FR-5

- [ ] T041 [P] [FR5] Create src/test/unit/adapters/engine-eventbus-adapter.spec.ts with tests:
  - connect() subscribes to engine events and eventbus events
  - disconnect() removes all subscriptions
  - Engine 'start' event → broadcasts 'timeline-play' to eventbus
  - Engine 'pause' event → broadcasts 'timeline-pause' to eventbus
  - Engine 'stop' event → broadcasts 'timeline-stop' to eventbus
  - Engine 'time' event → broadcasts 'timeline-time' to eventbus
  - Engine 'seekStart' event → broadcasts 'timeline-seek' to eventbus
  - Engine 'seekComplete' event → broadcasts 'timeline-seeked' to eventbus
  - Engine 'timelineChange' event → broadcasts 'timeline-current-timeline-change' to eventbus
  - Eventbus 'timeline-play-request' → calls engine.start()
  - Eventbus 'timeline-pause-request' → calls engine.pause()
  - Eventbus 'timeline-stop-request' → calls engine.stop()
  - Eventbus 'timeline-seek-request' → calls engine.seek()
  - Eventbus 'timeline-play-toggle-request' → calls engine.pause() if playing, engine.start() if not
  - Eventbus 'request-current-timeline-position' → calls callback with engine.position
  - Eventbus 'timeline-duration-request' → calls callback with engine.duration
  - Eventbus 'request-engine-root' → calls callback with engine.engineRoot

### Implementation for FR-5

- [ ] T042 [FR5] Create src/adapters/engine-eventbus-adapter.ts implementing IEngineEventbusAdapter with constructor(engine, eventbus)
- [ ] T043 [FR5] Implement connect() method: subscribe to engine events, subscribe to eventbus requests
- [ ] T044 [FR5] Implement disconnect() method: unsubscribe all listeners
- [ ] T045 [FR5] Implement engine event → eventbus broadcast mappings per data-model.md
- [ ] T046 [FR5] Implement eventbus request → engine method mappings per data-model.md
- [ ] T047 [FR5] Implement callback-style request handlers (position, duration, container, etc.)
- [ ] T048 [FR5] Export EngineEventbusAdapter from src/adapters/index.ts
- [ ] T049 [FR5] Run tests and verify: npm test -- src/test/unit/adapters/engine-eventbus-adapter.spec.ts

**Checkpoint**: Engine eventbus adapter complete - backward compatibility maintained

---

## Phase 8: FR-6 - LanguageEventbusAdapter (Priority: P2)

**Goal**: Bridge language manager events to/from eventbus

**Independent Test**: Connect adapter, broadcast language-change, verify manager.setLanguage() called

### Tests for FR-6

- [ ] T050 [P] [FR6] Create src/test/unit/adapters/language-eventbus-adapter.spec.ts with tests:
  - connect() subscribes to language manager events and eventbus events
  - disconnect() removes all subscriptions
  - LanguageManager 'change' event → broadcasts 'language-change' to eventbus AND updates DOM lang attribute
  - Eventbus 'request-current-language' → calls callback with languageManager.language
  - Eventbus 'request-label-collection' → calls callback with languageManager.getLabelCollection()
  - Eventbus 'request-label-collections' → calls callback with languageManager.getLabelCollections()
  - Eventbus 'language-change' → calls languageManager.setLanguage()

### Implementation for FR-6

- [ ] T051 [FR6] Create src/adapters/language-eventbus-adapter.ts implementing ILanguageEventbusAdapter with constructor(languageManager, eventbus, engine)
- [ ] T052 [FR6] Implement connect() method with language manager and eventbus subscriptions
- [ ] T053 [FR6] Implement disconnect() method
- [ ] T054 [FR6] Implement DOM lang attribute update on language change: use engine.engineRoot to set lang attribute (moved from LanguageManager._setRootElementLang)
- [ ] T055 [FR6] Export LanguageEventbusAdapter from src/adapters/index.ts
- [ ] T056 [FR6] Run tests and verify: npm test -- src/test/unit/adapters/language-eventbus-adapter.spec.ts

**Checkpoint**: Language eventbus adapter complete

---

## Phase 9: FR-7 - EngineInputAdapter (Priority: P3)

**Goal**: Handle external input sources (hotkeys, resize, devtools)

**Independent Test**: Connect adapter, press space, verify engine.start() or engine.pause() called

### Tests for FR-7

- [ ] T057 [P] [FR7] Create src/test/unit/adapters/engine-input-adapter.spec.ts with tests:
  - connect() sets up hotkey handlers
  - disconnect() removes hotkey handlers
  - Space key toggles play/pause via engine methods
  - Resize event broadcasts 'resize' to eventbus
  - Devtools integration calls engine methods (if enabled)

### Implementation for FR-7

- [ ] T058 [FR7] Create src/adapters/engine-input-adapter.ts implementing IEngineInputAdapter with constructor(engine, eventbus, windowRef, options?)
- [ ] T059 [FR7] Move hotkeys setup from engine-factory.ts (lines 91-93, 101-108) to EngineInputAdapter.connect(): space key calls engine.start() or engine.pause() based on playState
- [ ] T060 [FR7] Move resize handler from engine-factory.ts (lines 95-98, 171-178) to EngineInputAdapter.connect(): window resize broadcasts 'resize' event to eventbus
- [ ] T061 [FR7] Move devtools integration from engine-factory.ts (lines 110-165) to EngineInputAdapter.connect(): window.__ELIGIUS_DEVTOOLS__ hooks for play/pause/stop/seek
- [ ] T062 [FR7] Implement disconnect() to cleanup all handlers
- [ ] T063 [FR7] Export EngineInputAdapter from src/adapters/index.ts
- [ ] T064 [FR7] Run tests and verify: npm test -- src/test/unit/adapters/engine-input-adapter.spec.ts

**Checkpoint**: Input adapter complete - all external inputs handled

---

## Phase 10: FR-8 - EngineFactory Result Change (Priority: P3)

**Goal**: Update factory to create and wire all adapters, return comprehensive result

**Independent Test**: Call createEngine(), verify result contains engine, languageManager, eventbus, destroy()

### Tests for FR-8

- [ ] T065 [FR8] Update src/test/unit/engine-factory.spec.ts (or create if missing) to test:
  - createEngine() returns IEngineFactoryResult with engine, languageManager, eventbus, destroy
  - All adapters are connected on creation
  - destroy() disconnects all adapters and destroys engine
  - Backward compatibility: eventbus events still work through adapters

### Implementation for FR-8

- [ ] T066 [FR8] Update EngineFactory.createEngine() in src/engine-factory.ts to create core components without eventbus
- [ ] T067 [FR8] Update factory to create EngineEventbusAdapter and call connect()
- [ ] T068 [FR8] Update factory to create LanguageEventbusAdapter and call connect()
- [ ] T069 [FR8] Update factory to create EngineInputAdapter and call connect()
- [ ] T070 [FR8] Update factory return type to IEngineFactoryResult
- [ ] T071 [FR8] Implement destroy function that disconnects all adapters and destroys engine
- [ ] T072 [FR8] Remove direct eventbus/hotkey/resize/devtools setup from factory (now in adapters)
- [ ] T073 [FR8] Update IEngineFactory interface in src/types.ts
- [ ] T074 [FR8] Run tests and verify: npm test -- src/test/unit/engine-factory.spec.ts

**Checkpoint**: Factory refactored - breaking API change complete

---

## Phase 11: Integration & Polish

**Purpose**: Ensure all components work together, update exports, final verification

### Integration Tests

- [ ] T075 [P] Create src/test/integration/engine-adapter-integration.spec.ts testing:
  - Full factory → engine → adapter → eventbus flow
  - Eventbus backward compatibility for all events
  - destroy() properly cleans up everything

### Polish

- [ ] T076 Update src/index.ts to export new types and adapters
- [ ] T077 Update src/adapters/index.ts with all adapter exports
- [ ] T078 Run full test suite: npm test
- [ ] T079 Run typecheck: npm run typecheck
- [ ] T080 Run lint: npm run lint
- [ ] T081 Run coverage and verify 90%+: npm run coverage
- [ ] T082 Validate quickstart.md examples work with new API
- [ ] T083 Update CHANGELOG.md with breaking change notice

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (TypedEventEmitter)**: Depends on Phase 1 - BLOCKS all FR implementations
- **Phase 3 (FR-3 Provider)**: Depends on Phase 2 - updates async before engine uses it
- **Phase 4 (FR-1 Verification)**: Depends on Phase 2
- **Phase 5 (FR-2 Engine)**: Depends on Phase 2, Phase 3 - core engine refactor
- **Phase 6 (FR-4 LanguageManager)**: Depends on Phase 2 - can parallel with Phase 5
- **Phase 7 (FR-5 EngineAdapter)**: Depends on Phase 5 - needs pure engine API
- **Phase 8 (FR-6 LanguageAdapter)**: Depends on Phase 6 - needs pure language manager API
- **Phase 9 (FR-7 InputAdapter)**: Depends on Phase 5 - needs pure engine API
- **Phase 10 (FR-8 Factory)**: Depends on Phase 7, 8, 9 - needs all adapters
- **Phase 11 (Polish)**: Depends on all phases complete

### Parallel Opportunities

```
Phase 1 (Setup)
    ↓
Phase 2 (TypedEventEmitter) ← BLOCKING
    ↓
    ├─── Phase 3 (FR-3 Provider) ─┐
    │                             │
    ├─── Phase 5 (FR-2 Engine) ───┼──→ Phase 7 (FR-5 EngineAdapter) ──┐
    │                             │                                    │
    └─── Phase 6 (FR-4 LangMgr) ──┴──→ Phase 8 (FR-6 LangAdapter) ────┼──→ Phase 10 (FR-8 Factory)
                                       Phase 9 (FR-7 InputAdapter) ────┘           ↓
                                                                            Phase 11 (Polish)
```

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- Verify tests pass after implementation
- Commit after each task or logical group

---

## Parallel Example: Phases 5 & 6

```bash
# After Phase 2 completes, launch in parallel:
Task: "[FR2] Update src/test/unit/eligius-engine.spec.ts"
Task: "[FR4] Update src/test/unit/language-manager.spec.ts"

# Then in parallel:
Task: "[FR2] Add TypedEventEmitter instance to EligiusEngine"
Task: "[FR4] Add TypedEventEmitter instance to LanguageManager"
```

---

## Implementation Strategy

### MVP First (Phases 1-5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: TypedEventEmitter (CRITICAL - blocks all)
3. Complete Phase 3: Provider async update
4. Complete Phase 5: Engine pure API
5. **STOP and VALIDATE**: Test engine methods work directly
6. Engine can be used without eventbus at this point

### Full Implementation

1. Complete Phases 1-5 (MVP)
2. Complete Phase 6: LanguageManager pure API
3. Complete Phases 7-9: All adapters
4. Complete Phase 10: Factory refactor
5. Complete Phase 11: Integration & Polish
6. Major version bump for breaking change

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label (FR1-FR8) maps task to functional requirement
- Each FR should be independently testable after its phase
- Constitution mandates test-first and 90% coverage
- BREAKING CHANGE: Factory return type changes - requires major version bump
- Commit after each task or logical group
