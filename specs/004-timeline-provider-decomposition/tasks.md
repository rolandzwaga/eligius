# Tasks: Timeline Provider Decomposition

**Input**: Design documents from `/specs/004-timeline-provider-decomposition/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per constitution (Test-First Development). All test tasks must be completed with failing tests BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and interface definitions (already partially complete)

- [x] T001 Create directory structure for position-sources, container-providers, playlist, and legacy in src/timelineproviders/
- [x] T002 [P] Verify interface definitions in src/timelineproviders/types.ts match contracts/interfaces.ts
- [x] T003 [P] Export new types from src/timelineproviders/index.ts barrel file
- [x] T004 [P] Create test directory structure matching source in src/test/unit/timelineproviders/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Note**: The `isSeekable()` type guard is already defined in types.ts

- [x] T005 Create abstract base class for position sources in src/timelineproviders/position-sources/base-position-source.ts with shared state management
- [x] T006 Write tests for base position source state transitions in src/test/unit/timelineproviders/position-sources/base-position-source.spec.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - RAF-based Position Source (Priority: P1) 🎯 MVP

**Goal**: Create RafPositionSource implementing IPositionSource and ISeekable using existing animationInterval utility

**Independent Test**: Activate source, verify position updates emitted at 1-second intervals, test all state transitions

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [US1] Write tests for RafPositionSource state transitions (activate/suspend/deactivate) in src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts
- [x] T008 [US1] Write tests for RafPositionSource position updates and onPosition callback in src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts
- [x] T009 [US1] Write tests for RafPositionSource boundary events and looping in src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts
- [x] T010 [US1] Write tests for RafPositionSource seek functionality in src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts

### Implementation for User Story 1

- [x] T011 [US1] Implement RafPositionSource class in src/timelineproviders/position-sources/raf-position-source.ts
- [x] T012 [US1] Implement ISeekable.seek() method in RafPositionSource
- [x] T013 [US1] Wire up animationInterval utility for position ticking in RafPositionSource
- [x] T014 [US1] Implement boundary detection and loop handling in RafPositionSource
- [x] T015 [US1] Run quality checks and verify all US1 tests pass

**Checkpoint**: RafPositionSource fully functional - can be used as primary animation timeline source

---

## Phase 4: User Story 2 - Video.js-based Position Source (Priority: P1)

**Goal**: Create VideoPositionSource implementing IPositionSource, ISeekable, and IContainerProvider wrapping video.js player

**Independent Test**: Create source with mock video.js, verify position updates match video currentTime, test seek

### Tests for User Story 2

> **NOTE: Write these tests FIRST using vi.hoisted() pattern for video.js mocking**

- [x] T016 [US2] Write tests for VideoPositionSource initialization and video.js setup in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts
- [x] T017 [US2] Write tests for VideoPositionSource state transitions in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts
- [x] T018 [US2] Write tests for VideoPositionSource position updates from timeupdate event in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts
- [x] T019 [US2] Write tests for VideoPositionSource seek and boundary events in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts
- [x] T020 [US2] Write tests for VideoPositionSource container provider methods in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts

### Implementation for User Story 2

- [x] T021 [US2] Implement VideoPositionSource class in src/timelineproviders/position-sources/video-position-source.ts
- [x] T022 [US2] Implement video.js event handling (timeupdate, ended) in VideoPositionSource
- [x] T023 [US2] Implement ISeekable.seek() delegating to video.js currentTime() in VideoPositionSource
- [x] T024 [US2] Implement IContainerProvider methods in VideoPositionSource
- [x] T025 [US2] Run quality checks and verify all US2 tests pass

**Checkpoint**: VideoPositionSource fully functional - video-driven timelines work with new architecture

---

## Phase 5: User Story 3 - Scroll-based Position Source (Priority: P2)

**Goal**: Create ScrollPositionSource implementing IPositionSource and ISeekable to validate non-temporal sources

**Independent Test**: Create source bound to scrollable element, scroll container, verify position updates

### Tests for User Story 3

- [x] T026 [US3] Write tests for ScrollPositionSource initialization with scroll container in src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts
- [x] T027 [US3] Write tests for ScrollPositionSource position calculation from scroll percentage in src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts
- [x] T028 [US3] Write tests for ScrollPositionSource state transitions (activate/suspend/deactivate) in src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts
- [x] T029 [US3] Write tests for ScrollPositionSource seek (programmatic scroll) in src/test/unit/timelineproviders/position-sources/scroll-position-source.spec.ts

### Implementation for User Story 3

- [x] T030 [US3] Implement ScrollPositionSource class in src/timelineproviders/position-sources/scroll-position-source.ts
- [x] T031 [US3] Implement passive scroll listener with RAF-based sampling in ScrollPositionSource
- [x] T032 [US3] Implement ISeekable.seek() with programmatic scroll in ScrollPositionSource
- [x] T033 [US3] Implement boundary detection for scroll reaching top/bottom in ScrollPositionSource
- [x] T034 [US3] Run quality checks and verify all US3 tests pass

**Checkpoint**: ScrollPositionSource validates the decomposed architecture supports non-temporal sources

---

## Phase 6: User Story 4 - External Container Provider (Priority: P2)

**Goal**: Create DomContainerProvider implementing IContainerProvider for selector-based container access

**Independent Test**: Create provider with CSS selector, verify getContainer() returns correct jQuery element

### Tests for User Story 4

- [x] T035 [P] [US4] Write tests for DomContainerProvider initialization in src/test/unit/timelineproviders/container-providers/dom-container-provider.spec.ts
- [x] T036 [P] [US4] Write tests for DomContainerProvider getContainer() returning jQuery element in src/test/unit/timelineproviders/container-providers/dom-container-provider.spec.ts
- [x] T037 [P] [US4] Write tests for DomContainerProvider onContainerReady callback in src/test/unit/timelineproviders/container-providers/dom-container-provider.spec.ts

### Implementation for User Story 4

- [x] T038 [US4] Implement DomContainerProvider class in src/timelineproviders/container-providers/dom-container-provider.ts
- [x] T039 [US4] Implement init() with jQuery selector lookup in DomContainerProvider
- [x] T040 [US4] Implement onContainerReady callback invocation in DomContainerProvider
- [x] T041 [US4] Run quality checks and verify all US4 tests pass

**Checkpoint**: Container can be configured separately from position source

---

## Phase 7: User Story 5 - Playlist Management (Priority: P3)

**Goal**: Create SimplePlaylist implementing IPlaylist for managing multiple timeline items

**Independent Test**: Create playlist with items, select item by URI, verify callbacks invoked

### Tests for User Story 5

- [x] T042 [P] [US5] Write tests for SimplePlaylist initialization with items in src/test/unit/timelineproviders/playlist/simple-playlist.spec.ts
- [x] T043 [P] [US5] Write tests for SimplePlaylist selectItem() by identifier in src/test/unit/timelineproviders/playlist/simple-playlist.spec.ts
- [x] T044 [P] [US5] Write tests for SimplePlaylist onItemChange callback in src/test/unit/timelineproviders/playlist/simple-playlist.spec.ts
- [x] T045 [P] [US5] Write tests for SimplePlaylist error handling for unknown identifiers in src/test/unit/timelineproviders/playlist/simple-playlist.spec.ts

### Implementation for User Story 5

- [x] T046 [US5] Implement SimplePlaylist class in src/timelineproviders/playlist/simple-playlist.ts
- [x] T047 [US5] Implement selectItem() with identifier lookup in SimplePlaylist
- [x] T048 [US5] Implement onItemChange callback registration and invocation in SimplePlaylist
- [x] T049 [US5] Run quality checks and verify all US5 tests pass

**Checkpoint**: Playlist functionality available for multi-item timeline management

---

## Phase 8: User Story 6 - Backwards Compatible Facade (Priority: P3)

**Goal**: Create TimelineProviderFacade implementing ITimelineProvider by delegating to new interfaces

**Independent Test**: Create facade wrapping position source, verify legacy methods delegate correctly

### Tests for User Story 6

- [x] T050 [US6] Write tests for TimelineProviderFacade playState mapping in src/test/unit/timelineproviders/legacy/timeline-provider-facade.spec.ts
- [x] T051 [US6] Write tests for TimelineProviderFacade transport method delegation (start/pause/stop) in src/test/unit/timelineproviders/legacy/timeline-provider-facade.spec.ts
- [x] T052 [US6] Write tests for TimelineProviderFacade seek delegation to ISeekable in src/test/unit/timelineproviders/legacy/timeline-provider-facade.spec.ts
- [x] T053 [US6] Write tests for TimelineProviderFacade callback method mapping in src/test/unit/timelineproviders/legacy/timeline-provider-facade.spec.ts

### Implementation for User Story 6

- [x] T054 [US6] Implement TimelineProviderFacade class in src/timelineproviders/legacy/timeline-provider-facade.ts
- [x] T055 [US6] Implement state mapping (active->running, suspended->paused, inactive->stopped) in facade
- [x] T056 [US6] Implement transport method delegation (start->activate, pause->suspend, stop->deactivate) in facade
- [x] T057 [US6] Implement callback method mapping (onTime->onPosition, onComplete->onBoundaryReached) in facade
- [x] T058 [US6] Run quality checks and verify all US6 tests pass

**Checkpoint**: Existing code using ITimelineProvider continues to work via facade

---

## Phase 9: Integration & Polish

**Purpose**: Cross-cutting concerns and final validation

### Integration Tests

- [x] T059 [P] Write integration test for composed timeline (position source + container + playlist) in src/test/integration/timelineproviders/composed-timeline.spec.ts
- [x] T060 [P] Write integration test verifying facade works with engine in src/test/integration/timelineproviders/facade-engine-integration.spec.ts

### Exports and Documentation

- [x] T061 [P] Update src/timelineproviders/index.ts to export all new classes and types
- [x] T062 [P] Update src/index.ts to re-export from timelineproviders
- [x] T063 Add TypeDoc comments to all public APIs in new source files
- [x] T064 Update configuration types in src/configuration/types.ts for optional container field

### Engine Factory Integration

- [x] T068 Update src/engine-factory.ts to assemble position source, container provider, and playlist based on configuration (FR-018)

### Schema and Final Validation

- [x] T065 Run full test suite and verify 90% coverage for new code
- [x] T066 Run npm run fix and npm run typecheck to verify quality
- [x] T067 Validate quickstart.md examples work with implemented code
- [x] T069 Run npm run generate-schema to regenerate JSON schema with configuration changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (RAF) and US2 (Video) can proceed in parallel
  - US3 (Scroll) and US4 (Container) can proceed in parallel
  - US5 (Playlist) and US6 (Facade) can proceed in parallel
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - No dependencies on other stories
- **User Story 2 (P1)**: Independent - No dependencies on other stories
- **User Story 3 (P2)**: Independent - No dependencies on other stories
- **User Story 4 (P2)**: Independent - No dependencies on other stories
- **User Story 5 (P3)**: Independent - No dependencies on other stories
- **User Story 6 (P3)**: Depends on at least one position source (US1 or US2) existing for testing

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Base class before concrete implementation
- Core methods before auxiliary methods
- Quality checks after implementation complete

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel
- **Phase 3-4**: US1 and US2 can be implemented in parallel by different developers
- **Phase 5-6**: US3 and US4 can be implemented in parallel
- **Phase 7-8**: US5 and US6 can be implemented in parallel
- **Phase 9**: T059, T060, T061, T062 can run in parallel

---

## Parallel Example: User Stories 1 & 2 (P1 Priority)

```bash
# Developer A: User Story 1 (RAF)
Task: "Write tests for RafPositionSource state transitions in src/test/unit/timelineproviders/position-sources/raf-position-source.spec.ts"
Task: "Implement RafPositionSource class in src/timelineproviders/position-sources/raf-position-source.ts"

# Developer B: User Story 2 (Video.js)
Task: "Write tests for VideoPositionSource initialization in src/test/unit/timelineproviders/position-sources/video-position-source.spec.ts"
Task: "Implement VideoPositionSource class in src/timelineproviders/position-sources/video-position-source.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (RafPositionSource)
4. **STOP and VALIDATE**: Test RafPositionSource independently
5. MVP delivers: New architecture working for primary use case

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (RAF) → Test independently → Core animation timelines work
3. Add US2 (Video) → Test independently → Video timelines work
4. Add US4 (Container) → Test independently → Container decoupling works
5. Add US6 (Facade) → Test independently → Backwards compatibility
6. Add US3, US5 → Complete feature set

### Parallel Team Strategy

With two developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (RAF) → US3 (Scroll) → US5 (Playlist)
   - Developer B: US2 (Video) → US4 (Container) → US6 (Facade)
3. Both complete Integration tests

---

## Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|------------|------------|----------------|
| 1 | Setup | 4 | 3 |
| 2 | Foundational | 2 | 0 |
| 3 | US1 - RAF Position Source | 9 | 0 |
| 4 | US2 - Video Position Source | 10 | 0 |
| 5 | US3 - Scroll Position Source | 9 | 0 |
| 6 | US4 - Container Provider | 7 | 3 |
| 7 | US5 - Playlist | 8 | 4 |
| 8 | US6 - Backwards Facade | 9 | 0 |
| 9 | Polish | 11 | 4 |
| **Total** | | **69** | **14** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Constitution requires Test-First Development - all test tasks before implementation
