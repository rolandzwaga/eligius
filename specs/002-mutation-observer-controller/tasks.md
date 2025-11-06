# Tasks: Mutation Observer Controller

**Input**: Design documents from `/specs/002-mutation-observer-controller/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED per Constitution Principle I (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `src/test/` at repository root
- Eligius uses TypeScript with Vitest for testing
- Controller in `src/controllers/`, tests in `src/test/unit/controllers/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [X] T001 Verify project structure matches plan.md (src/controllers/, src/test/unit/controllers/)
- [X] T002 [P] Verify Vitest configuration includes JSDOM environment in src/vitest.config.ts
- [X] T003 [P] Verify TypeScript strict mode enabled in tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add DOM_MUTATION event name to src/timeline-event-names.ts
- [X] T005 Create IMutationObserverControllerMetadata interface in src/controllers/mutation-observer-controller.ts
- [X] T006 Create stub MutationObserverController class extending BaseController in src/controllers/mutation-observer-controller.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Observe DOM Changes on Elements (Priority: P1) 🎯 MVP

**Goal**: Enable monitoring of DOM attribute, child node, and text content changes with event broadcasting

**Independent Test**: Attach controller to element, make DOM changes (add child, change attribute, modify text), verify mutation events broadcasted with correct details

### Tests for User Story 1 (Test-First Development - RED phase)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Write test for MutationObserver instance creation in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [X] T008 [P] [US1] Write test for attribute mutation observation in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [X] T009 [P] [US1] Write test for childList mutation observation in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [X] T010 [P] [US1] Write test for characterData mutation observation in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [X] T011 [P] [US1] Write test for mutation event broadcasting through eventbus in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [X] T012 [P] [US1] Write test for mutation event payload structure in src/test/unit/controllers/mutation-observer-controller.spec.ts

### Implementation for User Story 1 (GREEN phase)

- [X] T013 [US1] Implement _buildObserverOptions() method with default options in src/controllers/mutation-observer-controller.ts
- [X] T014 [US1] Implement _handleMutations() method to broadcast events in src/controllers/mutation-observer-controller.ts
- [X] T015 [US1] Implement attach() method to create and start observer in src/controllers/mutation-observer-controller.ts
- [X] T016 [US1] Add jQuery element unwrapping logic (.get(0)) in attach() method
- [X] T017 [US1] Add mutation event payload structure with timestamp in _handleMutations()
- [X] T018 [US1] Verify all US1 tests pass (GREEN phase complete)

### Refactor for User Story 1

- [X] T019 [US1] Run linting and formatting (npm run fix) on modified files
- [X] T020 [US1] Run type checking (npm run typecheck) to verify TypeScript correctness
- [X] T021 [US1] Review and refactor _handleMutations() for clarity

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - mutations are observed and broadcasted

---

## Phase 4: User Story 2 - Automatic Lifecycle Management (Priority: P2)

**Goal**: Ensure observer automatically starts on attach(), stops on detach(), with proper resource cleanup and no memory leaks

**Independent Test**: Attach controller (observation starts), detach controller (observation stops), verify no further events emitted, verify no memory leaks over 1000 attach/detach cycles

### Tests for User Story 2 (Test-First Development - RED phase)

- [ ] T022 [P] [US2] Write test for init() method setting operationData in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T023 [P] [US2] Write test for attach() guard when operationData is null in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T024 [P] [US2] Write test for detach() disconnecting observer in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T025 [P] [US2] Write test verifying no events after detach in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T026 [P] [US2] Write test for multiple attach/detach cycles (memory leak prevention) in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T027 [P] [US2] Write test for duplicate attach() calls (guard against multiple observers) in src/test/unit/controllers/mutation-observer-controller.spec.ts

### Implementation for User Story 2 (GREEN phase)

- [ ] T028 [US2] Implement init() method to store operationData copy in src/controllers/mutation-observer-controller.ts
- [ ] T029 [US2] Add operationData guard in attach() method
- [ ] T030 [US2] Implement detach() method with observer.disconnect() in src/controllers/mutation-observer-controller.ts
- [ ] T031 [US2] Add observer = null cleanup in detach() method
- [ ] T032 [US2] Call super.detach() for BaseController cleanup
- [ ] T033 [US2] Add guard in attach() to prevent duplicate observer creation
- [ ] T034 [US2] Verify all US2 tests pass (GREEN phase complete)

### Refactor for User Story 2

- [ ] T035 [US2] Run linting and formatting (npm run fix) on modified files
- [ ] T036 [US2] Run type checking (npm run typecheck) to verify TypeScript correctness
- [ ] T037 [US2] Review detach() method for complete resource cleanup

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - lifecycle is properly managed

---

## Phase 5: User Story 3 - Configurable Observation Options (Priority: P3)

**Goal**: Enable configuration of observation types (attributes, childList, characterData, subtree, filters) to optimize performance and reduce noise

**Independent Test**: Configure controller to observe only specific mutation types, make various DOM changes, verify only configured mutation types trigger events

### Tests for User Story 3 (Test-First Development - RED phase)

- [ ] T038 [P] [US3] Write test for observeAttributes option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T039 [P] [US3] Write test for observeChildList option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T040 [P] [US3] Write test for observeCharacterData option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T041 [P] [US3] Write test for observeSubtree option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T042 [P] [US3] Write test for attributeOldValue option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T043 [P] [US3] Write test for characterDataOldValue option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T044 [P] [US3] Write test for attributeFilter option in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T045 [P] [US3] Write test for default options when not specified in src/test/unit/controllers/mutation-observer-controller.spec.ts

### Implementation for User Story 3 (GREEN phase)

- [ ] T046 [US3] Update _buildObserverOptions() to read metadata properties in src/controllers/mutation-observer-controller.ts
- [ ] T047 [US3] Implement observeAttributes configuration with default true
- [ ] T048 [US3] Implement observeChildList configuration with default true
- [ ] T049 [US3] Implement observeCharacterData configuration with default true
- [ ] T050 [US3] Implement observeSubtree configuration with default false
- [ ] T051 [US3] Implement attributeOldValue configuration with default false
- [ ] T052 [US3] Implement characterDataOldValue configuration with default false
- [ ] T053 [US3] Implement attributeFilter array configuration (optional)
- [ ] T054 [US3] Add metadata property type definitions with JSDoc annotations (@optional, @required, @dependency)
- [ ] T055 [US3] Verify all US3 tests pass (GREEN phase complete)

### Refactor for User Story 3

- [ ] T056 [US3] Run linting and formatting (npm run fix) on modified files
- [ ] T057 [US3] Run type checking (npm run typecheck) to verify TypeScript correctness
- [ ] T058 [US3] Refactor _buildObserverOptions() for readability with clear default handling

**Checkpoint**: All user stories should now be independently functional - full configuration flexibility achieved

---

## Phase 6: Edge Cases & Error Handling

**Purpose**: Handle edge cases identified in spec.md and data-model.md

- [ ] T059 [P] Write test for missing selectedElement in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T060 [P] Write test for selectedElement.get(0) returning undefined in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T061 [P] Write test for element removed from DOM while observing in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T062 [P] Write test for rapid succession of mutations in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T062a [P] Write test for eventbus unavailable when mutation occurs in src/test/unit/controllers/mutation-observer-controller.spec.ts
- [ ] T063 Add validation for selectedElement in attach() method
- [ ] T064 Add error handling for invalid native DOM node
- [ ] T065 Verify edge case tests pass

---

## Phase 7: Integration & Exports

**Purpose**: Integrate controller into Eligius public API

- [ ] T066 Export MutationObserverController from src/controllers/index.ts
- [ ] T067 Export IMutationObserverControllerMetadata from src/controllers/index.ts
- [ ] T068 Verify exports in src/index.ts include new controller
- [ ] T069 Run build (npm run build) to verify distribution generation
- [ ] T070 Verify type definitions generated correctly in dist/

---

## Phase 8: Documentation & Schema

**Purpose**: Complete TypeDoc documentation and JSON schema generation

- [ ] T071 [P] Add comprehensive TypeDoc comments to MutationObserverController class
- [ ] T072 [P] Add TypeDoc comments to IMutationObserverControllerMetadata interface
- [ ] T073 [P] Add usage examples in TypeDoc comments
- [ ] T074 [P] Add edge case documentation in TypeDoc
- [ ] T075 Regenerate JSON schema (npm run generate-schema)
- [ ] T076 Verify schema validates sample configuration from quickstart.md
- [ ] T077 [P] Update controller metadata documentation in src/controllers/
- [ ] T078 [P] Generate API documentation (npm run typedoc)

---

## Phase 9: Coverage Verification & Final Quality

**Purpose**: Ensure 90%+ coverage and all quality checks pass

- [ ] T079 Run coverage report (npm run coverage)
- [ ] T080 Verify 90%+ coverage for MutationObserverController
- [ ] T081 Write additional tests for uncovered branches if below 90%
- [ ] T082 Run full test suite (npm test) and verify ALL tests pass
- [ ] T083 Run linting (npm run lint) and fix any issues
- [ ] T084 Run formatting (npm run format)
- [ ] T085 Run type checking (npm run typecheck) final verification
- [ ] T086 Run all quality checks together (npm run fix && npm run typecheck && npm test)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T087 [P] Review quickstart.md examples and ensure they work with implementation
- [ ] T088 [P] Validate example configurations from quickstart.md
- [ ] T089 [P] Execute and validate all quickstart.md examples with actual Eligius engine instance
- [ ] T090 Code review and cleanup
- [ ] T091 Verify no console warnings or errors
- [ ] T092 Performance check: Verify <10ms mutation notification latency
- [ ] T093 Performance check: Verify handling 100+ mutations/second
- [ ] T094 Memory leak verification: 1000 attach/detach cycles with no leaks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Edge Cases (Phase 6)**: Depends on User Stories 1-3 completion
- **Integration (Phase 7)**: Depends on Edge Cases completion
- **Documentation (Phase 8)**: Can run in parallel with Phase 7
- **Coverage (Phase 9)**: Depends on all implementation phases
- **Polish (Phase 10)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1/US2 but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation (RED phase)
- Implementation makes tests pass (GREEN phase)
- Refactoring improves code while keeping tests green (REFACTOR phase)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All setup tasks marked [P] can run in parallel
- **Phase 2**: Foundation tasks can run in parallel after T004
- **Phase 3-5**: After Foundational phase completes, all user stories CAN start in parallel (if team capacity allows)
- **Within US1**: Tests T007-T012 all [P], can write in parallel
- **Within US2**: Tests T022-T027 all [P], can write in parallel
- **Within US3**: Tests T038-T045 all [P], can write in parallel
- **Phase 6**: Edge case tests T059-T062 all [P]
- **Phase 8**: Documentation tasks T071-T074, T077-T078 all [P]

---

## Parallel Example: User Story 1

```bash
# RED Phase - Launch all tests for User Story 1 together:
Task T007: "Write test for MutationObserver instance creation"
Task T008: "Write test for attribute mutation observation"
Task T009: "Write test for childList mutation observation"
Task T010: "Write test for characterData mutation observation"
Task T011: "Write test for mutation event broadcasting"
Task T012: "Write test for mutation event payload structure"

# Verify all tests FAIL

# GREEN Phase - Implement sequentially (dependencies):
Task T013: "Implement _buildObserverOptions() method"
Task T014: "Implement _handleMutations() method"
Task T015: "Implement attach() method"
Task T016: "Add jQuery unwrapping logic"
Task T017: "Add mutation event payload"
Task T018: "Verify all tests PASS"

# REFACTOR Phase:
Task T019: "Run linting and formatting"
Task T020: "Run type checking"
Task T021: "Refactor for clarity"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T007-T021)
4. **STOP and VALIDATE**: Test User Story 1 independently - mutations observed and broadcasted
5. Deploy/demo if ready

### Incremental Delivery (Following Test-First Development)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (RED → GREEN → REFACTOR) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (RED → GREEN → REFACTOR) → Test independently → Deploy/Demo
4. Add User Story 3 (RED → GREEN → REFACTOR) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T006)
2. Once Foundational is done:
   - Developer A: User Story 1 (T007-T021) - Core observation
   - Developer B: User Story 2 (T022-T037) - Lifecycle management
   - Developer C: User Story 3 (T038-T058) - Configuration options
3. Stories complete and integrate independently

---

## Task Summary

### Total Tasks: 95

**By Phase**:
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (US1 - Observe DOM Changes): 15 tasks
- Phase 4 (US2 - Lifecycle Management): 16 tasks
- Phase 5 (US3 - Configuration Options): 21 tasks
- Phase 6 (Edge Cases): 8 tasks
- Phase 7 (Integration): 5 tasks
- Phase 8 (Documentation): 8 tasks
- Phase 9 (Coverage & Quality): 8 tasks
- Phase 10 (Polish): 8 tasks

**By User Story**:
- User Story 1: 15 tasks (6 tests + 6 implementation + 3 refactor)
- User Story 2: 16 tasks (6 tests + 7 implementation + 3 refactor)
- User Story 3: 21 tasks (8 tests + 8 implementation + 3 refactor + 2 metadata)
- Shared/Infrastructure: 42 tasks

**Parallel Opportunities Identified**:
- Phase 1: 2 parallel tasks
- Phase 2: 1 parallel task
- US1 tests: 6 parallel tasks
- US2 tests: 6 parallel tasks
- US3 tests: 8 parallel tasks
- Phase 6 tests: 5 parallel tasks
- Phase 8 documentation: 6 parallel tasks
- **Total: 34 tasks can run in parallel**

**Independent Test Criteria**:
- US1: Attach controller, mutate DOM, verify events broadcasted
- US2: Attach/detach cycles, verify no events after detach, no memory leaks
- US3: Configure observation options, verify only configured types trigger events

**Suggested MVP Scope**:
- Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 21 tasks
- Delivers core observation functionality with event broadcasting

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story follows RED-GREEN-REFACTOR cycle per Constitution Principle I
- Tests MUST FAIL before implementation (RED phase)
- Implementation makes tests pass (GREEN phase)
- Refactoring improves while keeping tests green (REFACTOR phase)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 90%+ coverage requirement enforced in Phase 9
- All quality checks (lint, format, typecheck, test) must pass before completion
