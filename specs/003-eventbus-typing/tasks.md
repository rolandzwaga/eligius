# Tasks: EventBus Type-Safe Refactor

**Input**: Design documents from `/specs/003-eventbus-typing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-First Development (Principle I) - tests written BEFORE implementation for all tasks

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Note**: User confirmed package.json version number already bumped for breaking change.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/eventbus/`
- Tests: `src/test/unit/eventbus/`
- Tools: `src/tools/code-generator/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and event structure setup

- [ ] T001 Create event directory structure `src/eventbus/events/`
- [ ] T002 Create events metadata directory `src/eventbus/events/metadata/`
- [ ] T003 [P] Create IEventMetadata interface in `src/eventbus/events/metadata/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Extract all event names from `src/timeline-event-names.ts` and document in migration guide
- [ ] T005 [P] Create events metadata generator script in `src/tools/code-generator/events-metadata-generator.ts`
- [ ] T006 [P] Add npm script `events-metadata` to package.json
- [ ] T007 [P] Update npm script `metadata` to include events-metadata in package.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Type-Safe Event Broadcasting (Priority: P1) 🎯 MVP

**Goal**: Developers can broadcast events with compile-time guarantees that event names are correctly associated with their argument types

**Independent Test**: Write TypeScript code that broadcasts events with correct/incorrect types and verify TypeScript compiler catches type mismatches

### Tests for User Story 1 (Test-First Development)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Create test file `src/test/unit/eventbus/type-safety-broadcast.spec.ts` with failing tests for valid event broadcasting
- [ ] T009 [P] [US1] Add test cases for invalid event names (should not compile)
- [ ] T010 [P] [US1] Add test cases for incorrect argument types (should not compile)
- [ ] T011 [P] [US1] Add test cases for missing arguments (should not compile)

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create timeline-play-request event in `src/eventbus/events/timeline-play-request.ts`
- [ ] T013 [P] [US1] Create timeline-pause-request event in `src/eventbus/events/timeline-pause-request.ts`
- [ ] T014 [P] [US1] Create timeline-stop-request event in `src/eventbus/events/timeline-stop-request.ts`
- [ ] T015 [P] [US1] Create timeline-seek-request event in `src/eventbus/events/timeline-seek-request.ts`
- [ ] T016 [P] [US1] Create timeline-play-toggle-request event in `src/eventbus/events/timeline-play-toggle-request.ts`
- [ ] T017 [US1] Generate EventMap and EventName types by running events-metadata generator
- [ ] T018 [US1] Update IEventbus interface in `src/eventbus/types.ts` with type-safe broadcast() signature
- [ ] T019 [US1] Update IEventbus interface with type-safe broadcastForTopic() signature
- [ ] T020 [US1] Verify tests T008-T011 now pass
- [ ] T021 [US1] Run quality checks: `npm run fix && npm run typecheck`

**Checkpoint**: At this point, User Story 1 should be fully functional - type-safe broadcasting works

---

## Phase 4: User Story 2 - Type-Safe Event Handlers (Priority: P1)

**Goal**: Developers registering event handlers receive correctly typed arguments based on the event name they're listening to

**Independent Test**: Register event handlers and verify handler parameters are correctly typed by TypeScript compiler

### Tests for User Story 2 (Test-First Development)

- [ ] T022 [P] [US2] Create test file `src/test/unit/eventbus/type-safety-handlers.spec.ts` with failing tests for valid event handlers
- [ ] T023 [P] [US2] Add test cases for handler parameter type inference
- [ ] T024 [P] [US2] Add test cases for incorrect handler parameter types (should not compile)
- [ ] T025 [P] [US2] Add test cases for once() method type safety

### Implementation for User Story 2

- [ ] T026 [US2] Update IEventbus interface on() method in `src/eventbus/types.ts` with type-safe signature
- [ ] T027 [US2] Update IEventbus interface off() method with type-safe signature
- [ ] T028 [US2] Update IEventbus interface once() method with type-safe signature
- [ ] T029 [US2] Update Eventbus class implementation in `src/eventbus/eventbus.ts` to match new interface signatures
- [ ] T030 [US2] Verify tests T022-T025 now pass
- [ ] T031 [US2] Run quality checks: `npm run fix && npm run typecheck`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - full type-safe EventBus API

---

## Phase 5: User Story 3 - Event Metadata Generation (Priority: P2)

**Goal**: System automatically generates event metadata from TypeScript source files, excluding private events

**Independent Test**: Run metadata generation script and verify generated metadata files match source event definitions, with private events excluded

### Tests for User Story 3 (Test-First Development)

- [ ] T032 [P] [US3] Create test file `src/test/unit/tools/events-metadata-generator.spec.ts` with failing tests for metadata generator
- [ ] T033 [P] [US3] Add test cases for JSDoc description extraction
- [ ] T034 [P] [US3] Add test cases for @category tag extraction
- [ ] T035 [P] [US3] Add test cases for @private tag filtering
- [ ] T036 [P] [US3] Add test cases for args tuple type extraction

### Implementation for User Story 3

- [ ] T037 [P] [US3] Implement parseEventInterface() in `src/tools/code-generator/events-metadata-generator.ts`
- [ ] T038 [P] [US3] Implement extractJSDocMetadata() for description and category extraction
- [ ] T039 [P] [US3] Implement filterPrivateEvents() to exclude @private tagged events
- [ ] T040 [P] [US3] Implement extractArgsMetadata() for tuple type parsing
- [ ] T041 [US3] Implement generateMetadataFile() to create metadata function files
- [ ] T042 [US3] Implement generateTypesFile() to create EventMap and EventName
- [ ] T043 [US3] Implement generateIndexFile() for barrel exports
- [ ] T044 [US3] Add @private tag to dom-mutation event in `src/eventbus/events/dom-mutation.ts`
- [ ] T045 [US3] Run `npm run events-metadata` and verify metadata files generated
- [ ] T046 [US3] Verify dom-mutation metadata NOT generated (private event)
- [ ] T047 [US3] Verify tests T032-T036 now pass
- [ ] T048 [US3] Run quality checks: `npm run fix && npm run typecheck`

**Checkpoint**: Event metadata generation fully functional

---

## Phase 6: User Story 4 - Deprecate TimelineEventNames Class (Priority: P2)

**Goal**: Legacy TimelineEventNames static class removed from codebase, replaced by type-safe string literals

**Independent Test**: Search codebase for TimelineEventNames references, verify all replaced with string literals, verify tests pass after removal

### Tests for User Story 4 (Test-First Development)

- [ ] T049 [P] [US4] Create test file `src/test/unit/eventbus/migration.spec.ts` verifying existing EventBus tests still pass
- [ ] T050 [P] [US4] Add integration tests verifying timeline functionality unchanged

### Implementation for User Story 4

- [ ] T051 [US4] Create all remaining timeline event interfaces from TimelineEventNames entries
- [ ] T052 [US4] Create timeline-resize-request event in `src/eventbus/events/timeline-resize-request.ts`
- [ ] T053 [US4] Create timeline-container-request event in `src/eventbus/events/timeline-container-request.ts`
- [ ] T054 [US4] Create timeline-duration-request event in `src/eventbus/events/timeline-duration-request.ts`
- [ ] T055 [US4] Create request-current-timeline event in `src/eventbus/events/request-current-timeline.ts`
- [ ] T056 [US4] Create timeline-duration event in `src/eventbus/events/timeline-duration.ts`
- [ ] T057 [US4] Create timeline-time event in `src/eventbus/events/timeline-time.ts`
- [ ] T058 [US4] Create timeline-seeked event in `src/eventbus/events/timeline-seeked.ts`
- [ ] T059 [US4] Create timeline-complete event in `src/eventbus/events/timeline-complete.ts`
- [ ] T060 [US4] Create timeline-restart event in `src/eventbus/events/timeline-restart.ts`
- [ ] T061 [US4] Create timeline-play event in `src/eventbus/events/timeline-play.ts`
- [ ] T062 [US4] Create timeline-stop event in `src/eventbus/events/timeline-stop.ts`
- [ ] T063 [US4] Create timeline-pause event in `src/eventbus/events/timeline-pause.ts`
- [ ] T064 [US4] Create timeline-seek event in `src/eventbus/events/timeline-seek.ts`
- [ ] T065 [US4] Create timeline-resize event in `src/eventbus/events/timeline-resize.ts`
- [ ] T066 [US4] Create timeline-current-timeline-change event in `src/eventbus/events/timeline-current-timeline-change.ts`
- [ ] T067 [US4] Create timeline-firstframe event in `src/eventbus/events/timeline-firstframe.ts`
- [ ] T068 [US4] Create request-instance event in `src/eventbus/events/request-instance.ts`
- [ ] T069 [US4] Create request-action event in `src/eventbus/events/request-action.ts`
- [ ] T070 [US4] Create request-function event in `src/eventbus/events/request-function.ts`
- [ ] T071 [US4] Create request-timeline-uri event in `src/eventbus/events/request-timeline-uri.ts`
- [ ] T072 [US4] Create before-request-timeline-uri event in `src/eventbus/events/before-request-timeline-uri.ts`
- [ ] T073 [US4] Create request-engine-root event in `src/eventbus/events/request-engine-root.ts`
- [ ] T074 [US4] Create request-current-timeline-position event in `src/eventbus/events/request-current-timeline-position.ts`
- [ ] T075 [US4] Create request-timeline-cleanup event in `src/eventbus/events/request-timeline-cleanup.ts`
- [ ] T076 [US4] Create request-label-collection event in `src/eventbus/events/request-label-collection.ts`
- [ ] T077 [US4] Create request-label-collections event in `src/eventbus/events/request-label-collections.ts`
- [ ] T078 [US4] Create request-current-language event in `src/eventbus/events/request-current-language.ts`
- [ ] T079 [US4] Create language-change event in `src/eventbus/events/language-change.ts`
- [ ] T080 [US4] Create dom-mutation event in `src/eventbus/events/dom-mutation.ts` (mark as @private)
- [ ] T081 [US4] Run `npm run events-metadata` to regenerate types and metadata
- [ ] T082 [US4] Find all TimelineEventNames references in `src/` using grep
- [ ] T083 [US4] Replace TimelineEventNames.PLAY_REQUEST with 'timeline-play-request' in all files
- [ ] T084 [US4] Replace TimelineEventNames.PAUSE_REQUEST with 'timeline-pause-request' in all files
- [ ] T085 [US4] Replace TimelineEventNames.STOP_REQUEST with 'timeline-stop-request' in all files
- [ ] T086 [US4] Replace TimelineEventNames.SEEK_REQUEST with 'timeline-seek-request' in all files
- [ ] T087 [US4] Replace all remaining TimelineEventNames references with corresponding string literals
- [ ] T088 [US4] Remove all TimelineEventNames imports from source files
- [ ] T089 [US4] Delete `src/timeline-event-names.ts` file
- [ ] T090 [US4] Run full test suite: `npm test`
- [ ] T091 [US4] Verify tests T049-T050 pass
- [ ] T092 [US4] Run quality checks: `npm run fix && npm run typecheck`

**Checkpoint**: TimelineEventNames fully removed, all tests passing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T093 [P] Update CLAUDE.md with event creation workflow in ## Event Bus section
- [ ] T094 [P] Update `src/eventbus/index.ts` to export event metadata types from events/metadata
- [ ] T095 [P] Add TypeDoc comments to IEventMetadata interface in `src/eventbus/events/metadata/types.ts`
- [ ] T096 [P] Add TypeDoc comments to EventMap and EventName in `src/eventbus/events/types.ts`
- [ ] T097 [P] Add event usage example to quickstart.md in ## Creating a New Event section
- [ ] T098 Run full coverage report: `npm run coverage`
- [ ] T099 Verify 90% coverage threshold met per Constitution Principle VI
- [ ] T100 Run all quality checks: `npm run fix && npm run typecheck && npm test`
- [ ] T101 Validate quickstart.md examples work as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but complements US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P2)**: Should complete after US1/US2/US3 - Requires all events defined and EventMap generated

### Within Each User Story

- Tests written and FAIL before implementation (Test-First Development)
- Event interfaces before EventMap generation
- EventMap generation before EventBus interface updates
- EventBus interface before implementation
- Tests pass before story completion

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Once Foundational phase completes, US1, US2, US3 can start in parallel
- Within US1: All event interface creation tasks (T012-T016) can run in parallel
- Within US4: All event interface creation tasks (T051-T080) can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (Test-First):
Task: "T008 Create test file for valid event broadcasting"
Task: "T009 Add test cases for invalid event names"
Task: "T010 Add test cases for incorrect argument types"
Task: "T011 Add test cases for missing arguments"

# Launch all event interfaces for User Story 1 together:
Task: "T012 Create timeline-play-request event"
Task: "T013 Create timeline-pause-request event"
Task: "T014 Create timeline-stop-request event"
Task: "T015 Create timeline-seek-request event"
Task: "T016 Create timeline-play-toggle-request event"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Type-Safe Broadcasting)
4. Complete Phase 4: User Story 2 (Type-Safe Handlers)
5. **STOP and VALIDATE**: Test type safety works end-to-end
6. Deploy/demo if ready

**Rationale**: US1 + US2 together provide complete type-safe EventBus API - full value delivery

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Type-safe broadcasting works
3. Add User Story 2 → Full type-safe EventBus API (MVP!)
4. Add User Story 3 → Metadata generation for tooling
5. Add User Story 4 → Complete migration, deprecate TimelineEventNames
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Broadcasting)
   - Developer B: User Story 2 (Handlers)
   - Developer C: User Story 3 (Metadata)
3. After US1-US3 complete:
   - Developer A: User Story 4 (Migration)

---

## Summary

**Total Tasks**: 101
- Setup: 3 tasks
- Foundational: 4 tasks
- User Story 1 (P1): 14 tasks (4 tests + 10 implementation)
- User Story 2 (P1): 10 tasks (4 tests + 6 implementation)
- User Story 3 (P2): 17 tasks (5 tests + 12 implementation)
- User Story 4 (P2): 44 tasks (2 tests + 42 implementation)
- Polish: 9 tasks

**Parallel Opportunities**: 51 tasks marked [P] (50% parallelizable)

**Independent Test Criteria**:
- US1: TypeScript compiler catches type errors for invalid broadcasts
- US2: TypeScript compiler infers correct handler parameter types
- US3: Metadata generation excludes @private events
- US4: All tests pass after TimelineEventNames removal

**MVP Scope**: User Stories 1 + 2 (Phases 1-4, tasks T001-T031)

**Breaking Change**: User Story 4 removes TimelineEventNames class (version already bumped per user note)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story independently completable and testable
- Test-First Development: All tests written before implementation
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution Principle I (Test-First Development) strictly followed
- Constitution Principle VI (90% coverage) validated in Phase 7
