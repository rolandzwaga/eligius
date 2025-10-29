# Tasks: Atomic Operations for Interactive Stories

**Input**: Design documents from `/specs/001-atomic-operations/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete)

**Tests**: All operations require comprehensive unit tests following Vitest framework with 90% coverage requirement per Constitution Principle VI.

**Organization**: Tasks are grouped by user story (priority-based) to enable independent implementation and testing of each story. Test-first development mandatory per Constitution Principle I.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US9)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and structure verification

- [X] T001 Verify TypeScript 5.9.3 project structure in src/operation/
- [X] T002 Verify Vitest 3.2.4 test configuration in src/vitest.config.ts
- [X] T003 [P] Create specs/001-atomic-operations/data-model.md documenting all 32 operation data structures (reference plan.md lines 308-361 for structure)
- [X] T004 [P] Create specs/001-atomic-operations/quickstart.md with implementation roadmap (reference plan.md lines 379-395 for content guidance)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and contracts that all operations depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Create specs/001-atomic-operations/contracts/form-operations.ts with 4 TypeScript interfaces
- [X] T006 [P] Create specs/001-atomic-operations/contracts/text-operations.ts with 3 TypeScript interfaces
- [X] T007 [P] Create specs/001-atomic-operations/contracts/storage-operations.ts with 3 TypeScript interfaces
- [X] T008 [P] Create specs/001-atomic-operations/contracts/array-operations.ts with 4 TypeScript interfaces
- [X] T009 [P] Create specs/001-atomic-operations/contracts/scroll-operations.ts with 4 TypeScript interfaces
- [X] T010 [P] Create specs/001-atomic-operations/contracts/http-operations.ts with 3 TypeScript interfaces
- [X] T011 [P] Create specs/001-atomic-operations/contracts/string-operations.ts with 4 TypeScript interfaces
- [X] T012 [P] Create specs/001-atomic-operations/contracts/focus-operations.ts with 4 TypeScript interfaces
- [X] T013 [P] Create specs/001-atomic-operations/contracts/date-operations.ts with 3 TypeScript interfaces

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reading and Manipulating Form Data (Priority: P1) 🎯 MVP

**Goal**: Enable creators to build quizzes, surveys, and forms with data extraction, value setting, validation, and element toggling

**Independent Test**: Create a simple quiz story with text inputs and validation, verify form data can be read, updated, and validated

### Tests for User Story 1 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] Create test suite for getFormData in src/test/unit/operation/get-form-data.spec.ts
- [ ] T015 [P] [US1] Create test suite for setFormValue in src/test/unit/operation/set-form-value.spec.ts
- [ ] T016 [P] [US1] Create test suite for validateForm in src/test/unit/operation/validate-form.spec.ts
- [ ] T017 [P] [US1] Create test suite for toggleFormElement in src/test/unit/operation/toggle-form-element.spec.ts

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement getFormData operation in src/operation/get-form-data.ts using jQuery .serializeArray()
- [ ] T019 [P] [US1] Implement setFormValue operation in src/operation/set-form-value.ts using jQuery .val()
- [ ] T020 [P] [US1] Implement validateForm operation in src/operation/validate-form.ts using HTML5 validation API
- [ ] T021 [P] [US1] Implement toggleFormElement operation in src/operation/toggle-form-element.ts using jQuery .prop('disabled')
- [ ] T022 [US1] Update src/operation/index.ts to export all 4 form operations
- [ ] T023 [US1] Verify all US1 tests pass with green status
- [ ] T024 [US1] Run npm run coverage and verify 90%+ coverage for form operations

**Checkpoint**: User Story 1 fully functional - creators can build functional quizzes with validation

---

## Phase 4: User Story 2 - Reading and Transforming Text Content (Priority: P1) 🎯 MVP

**Goal**: Enable creators to extract, search/replace, and format text dynamically for adaptive narratives

**Independent Test**: Create a story that reads user's name from input, transforms to uppercase, displays in greeting

### Tests for User Story 2 (Test-First)

- [ ] T025 [P] [US2] Create test suite for getTextContent in src/test/unit/operation/get-text-content.spec.ts
- [ ] T026 [P] [US2] Create test suite for replaceText in src/test/unit/operation/replace-text.spec.ts
- [ ] T027 [P] [US2] Create test suite for formatText in src/test/unit/operation/format-text.spec.ts

### Implementation for User Story 2

- [ ] T028 [P] [US2] Implement getTextContent operation in src/operation/get-text-content.ts using jQuery .text() (XSS-safe)
- [ ] T029 [P] [US2] Implement replaceText operation in src/operation/replace-text.ts using string replace with regex support
- [ ] T030 [P] [US2] Implement formatText operation in src/operation/format-text.ts with uppercase/lowercase/titlecase/trim transformations
- [ ] T031 [US2] Update src/operation/index.ts to export all 3 text operations
- [ ] T032 [US2] Verify all US2 tests pass with green status
- [ ] T033 [US2] Run npm run coverage and verify 90%+ coverage for text operations

**Checkpoint**: User Story 2 fully functional - creators can extract and transform text dynamically

---

## Phase 5: User Story 3 - Persisting Story State Across Sessions (Priority: P1) 🎯 MVP

**Goal**: Enable creators to save progress, preferences, and data so users can resume stories after closing browser

**Independent Test**: Create a story that saves progress to storage, refresh page, verify progress restored

### Tests for User Story 3 (Test-First)

- [ ] T034 [P] [US3] Create test suite for saveToStorage in src/test/unit/operation/save-to-storage.spec.ts with QuotaExceededError handling
- [ ] T035 [P] [US3] Create test suite for loadFromStorage in src/test/unit/operation/load-from-storage.spec.ts with missing key handling
- [ ] T036 [P] [US3] Create test suite for clearStorage in src/test/unit/operation/clear-storage.spec.ts

### Implementation for User Story 3

- [ ] T037 [P] [US3] Implement saveToStorage operation in src/operation/save-to-storage.ts using localStorage/sessionStorage with JSON serialization
- [ ] T038 [P] [US3] Implement loadFromStorage operation in src/operation/load-from-storage.ts with JSON deserialization and null handling
- [ ] T039 [P] [US3] Implement clearStorage operation in src/operation/clear-storage.ts with single key and clear-all support
- [ ] T040 [US3] Update src/operation/index.ts to export all 3 storage operations
- [ ] T041 [US3] Verify all US3 tests pass with green status
- [ ] T042 [US3] Run npm run coverage and verify 90%+ coverage for storage operations

**Checkpoint**: User Story 3 fully functional - users can save/resume progress across sessions with 100% reliability

---

## Phase 6: User Story 4 - Filtering and Transforming Data Collections (Priority: P2)

**Goal**: Enable creators to process arrays for inventory systems, search results, and leaderboards

**Independent Test**: Create a story with inventory array, filter by category, sort by power, display results

### Tests for User Story 4 (Test-First)

- [ ] T043 [P] [US4] Create test suite for filterArray in src/test/unit/operation/filter-array.spec.ts with expression evaluation
- [ ] T044 [P] [US4] Create test suite for sortArray in src/test/unit/operation/sort-array.spec.ts with asc/desc order
- [ ] T045 [P] [US4] Create test suite for mapArray in src/test/unit/operation/map-array.spec.ts with property extraction
- [ ] T046 [P] [US4] Create test suite for findInArray in src/test/unit/operation/find-in-array.spec.ts with search criteria

### Implementation for User Story 4

- [ ] T047 [P] [US4] Implement filterArray operation in src/operation/filter-array.ts following forEach operation pattern
- [ ] T048 [P] [US4] Implement sortArray operation in src/operation/sort-array.ts using native stable sort with property path support
- [ ] T049 [P] [US4] Implement mapArray operation in src/operation/map-array.ts with transformation function/expression
- [ ] T050 [P] [US4] Implement findInArray operation in src/operation/find-in-array.ts with search criteria matching
- [ ] T051 [US4] Update src/operation/index.ts to export all 4 array operations
- [ ] T052 [US4] Verify all US4 tests pass with green status
- [ ] T053 [US4] Run npm run coverage and verify 90%+ coverage for array operations
- [ ] T054 [US4] Performance test: verify <100ms processing for 1000+ items (SC-009)

**Checkpoint**: User Story 4 fully functional - creators can build sophisticated data-driven features

---

## Phase 7: User Story 5 - Controlling Scroll Behavior (Priority: P2)

**Goal**: Enable creators to create cinematic storytelling with programmatic scroll control and visibility detection

**Independent Test**: Create multi-section story with navigation that smoothly scrolls to each section when clicked

### Tests for User Story 5 (Test-First)

- [ ] T055 [P] [US5] Create test suite for scrollToElement in src/test/unit/operation/scroll-to-element.spec.ts with offset support
- [ ] T056 [P] [US5] Create test suite for scrollToPosition in src/test/unit/operation/scroll-to-position.spec.ts with smooth animation
- [ ] T057 [P] [US5] Create test suite for isElementInViewport in src/test/unit/operation/is-element-in-viewport.spec.ts
- [ ] T058 [P] [US5] Create test suite for getScrollPosition in src/test/unit/operation/get-scroll-position.spec.ts

### Implementation for User Story 5

- [ ] T059 [P] [US5] Implement scrollToElement operation in src/operation/scroll-to-element.ts using scrollIntoView with smooth behavior
- [ ] T060 [P] [US5] Implement scrollToPosition operation in src/operation/scroll-to-position.ts using window.scrollTo with smooth option
- [ ] T061 [P] [US5] Implement isElementInViewport operation in src/operation/is-element-in-viewport.ts using getBoundingClientRect
- [ ] T062 [P] [US5] Implement getScrollPosition operation in src/operation/get-scroll-position.ts using pageXOffset/pageYOffset
- [ ] T063 [US5] Update src/operation/index.ts to export all 4 scroll operations
- [ ] T064 [US5] Verify all US5 tests pass with green status
- [ ] T065 [US5] Run npm run coverage and verify 90%+ coverage for scroll operations
- [ ] T066 [US5] Performance test: verify <500ms scroll transitions (SC-004)

**Checkpoint**: User Story 5 fully functional - creators can build cinematic scroll-based narratives

---

## Phase 8: User Story 6 - Submitting Data via HTTP Requests (Priority: P2)

**Goal**: Enable creators to integrate stories with backend services, leaderboards, and cloud-saved progress

**Independent Test**: Create a quiz that submits answers to test API endpoint via POST, verify response handling

### Tests for User Story 6 (Test-First)

- [ ] T067 [P] [US6] Create test suite for httpPost in src/test/unit/operation/http-post.spec.ts with fetch mock
- [ ] T068 [P] [US6] Create test suite for httpPut in src/test/unit/operation/http-put.spec.ts with fetch mock
- [ ] T069 [P] [US6] Create test suite for httpDelete in src/test/unit/operation/http-delete.spec.ts with fetch mock

### Implementation for User Story 6

- [ ] T070 [P] [US6] Implement httpPost operation in src/operation/http-post.ts using Fetch API with JSON Content-Type
- [ ] T071 [P] [US6] Implement httpPut operation in src/operation/http-put.ts using Fetch API with error handling
- [ ] T072 [P] [US6] Implement httpDelete operation in src/operation/http-delete.ts using Fetch API with response parsing
- [ ] T073 [US6] Update src/operation/index.ts to export all 3 HTTP operations
- [ ] T074 [US6] Verify all US6 tests pass with green status
- [ ] T075 [US6] Run npm run coverage and verify 90%+ coverage for HTTP operations
- [ ] T076 [US6] Performance test: verify <2 second submission time for quiz (SC-002)

**Checkpoint**: User Story 6 fully functional - creators can integrate with external APIs and cloud services

---

## Phase 9: User Story 7 - Manipulating Strings (Priority: P3)

**Goal**: Enable creators to concatenate, split, extract, and replace strings for dynamic text generation

**Independent Test**: Create a story that splits comma-separated input, processes items, concatenates results

### Tests for User Story 7 (Test-First)

- [ ] T077 [P] [US7] Create test suite for concatenateStrings in src/test/unit/operation/concatenate-strings.spec.ts
- [ ] T078 [P] [US7] Create test suite for splitString in src/test/unit/operation/split-string.spec.ts
- [ ] T079 [P] [US7] Create test suite for substringText in src/test/unit/operation/substring-text.spec.ts
- [ ] T080 [P] [US7] Create test suite for replaceString in src/test/unit/operation/replace-string.spec.ts with regex support

### Implementation for User Story 7

- [ ] T081 [P] [US7] Implement concatenateStrings operation in src/operation/concatenate-strings.ts using array.join()
- [ ] T082 [P] [US7] Implement splitString operation in src/operation/split-string.ts using string.split()
- [ ] T083 [P] [US7] Implement substringText operation in src/operation/substring-text.ts using string.substring()
- [ ] T084 [P] [US7] Implement replaceString operation in src/operation/replace-string.ts with regex pattern support
- [ ] T085 [US7] Update src/operation/index.ts to export all 4 string operations
- [ ] T086 [US7] Verify all US7 tests pass with green status
- [ ] T087 [US7] Run npm run coverage and verify 90%+ coverage for string operations
- [ ] T088 [US7] Test unicode handling: verify emoji and international characters work correctly (SC-010)

**Checkpoint**: User Story 7 fully functional - creators can perform advanced string manipulation

---

## Phase 10: User Story 8 - Managing Keyboard Focus and Accessibility (Priority: P2)

**Goal**: Enable creators to build accessible stories with focus control and screen reader support for WCAG compliance

**Independent Test**: Create a story with sequential focus navigation, verify focus moves correctly with keyboard

### Tests for User Story 8 (Test-First)

- [ ] T089 [P] [US8] Create test suite for setFocus in src/test/unit/operation/set-focus.spec.ts
- [ ] T090 [P] [US8] Create test suite for getFocusedElement in src/test/unit/operation/get-focused-element.spec.ts
- [ ] T091 [P] [US8] Create test suite for setAriaAttribute in src/test/unit/operation/set-aria-attribute.spec.ts
- [ ] T092 [P] [US8] Create test suite for announceToScreenReader in src/test/unit/operation/announce-to-screen-reader.spec.ts with live region

### Implementation for User Story 8

- [ ] T093 [P] [US8] Implement setFocus operation in src/operation/set-focus.ts using jQuery .focus()
- [ ] T094 [P] [US8] Implement getFocusedElement operation in src/operation/get-focused-element.ts using document.activeElement
- [ ] T095 [P] [US8] Implement setAriaAttribute operation in src/operation/set-aria-attribute.ts using jQuery .attr()
- [ ] T096 [US8] Implement announceToScreenReader operation in src/operation/announce-to-screen-reader.ts with persistent off-screen live region
- [ ] T097 [US8] Update src/operation/index.ts to export all 4 focus operations
- [ ] T098 [US8] Verify all US8 tests pass with green status
- [ ] T099 [US8] Run npm run coverage and verify 90%+ coverage for focus operations
- [ ] T100 [US8] Accessibility test: verify 100% keyboard accessibility (SC-007)

**Checkpoint**: User Story 8 fully functional - stories are accessible with screen reader support

---

## Phase 11: User Story 9 - Working with Dates and Times (Priority: P3)

**Goal**: Enable creators to format dates, get timestamps, and compare dates for time-based mechanics

**Independent Test**: Create a story that displays formatted current date/time and checks if deadline passed

### Tests for User Story 9 (Test-First)

- [ ] T101 [P] [US9] Create test suite for formatDate in src/test/unit/operation/format-date.spec.ts with pattern replacement
- [ ] T102 [P] [US9] Create test suite for getCurrentTime in src/test/unit/operation/get-current-time.spec.ts
- [ ] T103 [P] [US9] Create test suite for compareDate in src/test/unit/operation/compare-date.spec.ts

### Implementation for User Story 9

- [ ] T104 [P] [US9] Implement formatDate operation in src/operation/format-date.ts using simple pattern replacement (YYYY-MM-DD format)
- [ ] T105 [P] [US9] Implement getCurrentTime operation in src/operation/get-current-time.ts returning ISO string or epoch millis
- [ ] T106 [P] [US9] Implement compareDate operation in src/operation/compare-date.ts using Date.getTime() returning -1/0/1
- [ ] T107 [US9] Update src/operation/index.ts to export all 3 date operations
- [ ] T108 [US9] Verify all US9 tests pass with green status
- [ ] T109 [US9] Run npm run coverage and verify 90%+ coverage for date operations

**Checkpoint**: All 9 user stories fully functional - all 32 operations complete

---

## Phase 12: Integration & Quality Assurance

**Purpose**: Cross-story testing, schema generation, and documentation

- [ ] T110 Create integration test in src/test/integration/atomic-operations-chains.spec.ts testing operation chaining across categories
- [ ] T111 Run npm run metadata to auto-generate operation metadata from JSDoc comments (depends on all 32 operation JSDoc comments being complete; per plan.md note, metadata files are NOT created manually)
- [ ] T112 Run npm run generate-schema to regenerate JSON schema with all 32 new operations
- [ ] T113 Run npm test to verify all 408+ tests pass (existing + new)
- [ ] T114 Run npm run coverage to verify 90%+ coverage across entire codebase
- [ ] T115 Run npm run typecheck to verify 0 TypeScript errors
- [ ] T116 Run npm run lint to verify code quality standards
- [ ] T117 Update CHANGELOG.md with version 1.5.0 documenting 32 new operations
- [ ] T118 Test edge cases (comprehensive checklist):
  - Form operations: getFormData on non-form element, setFormValue on non-existent selector, validateForm with invalid rules, toggleFormElement on disabled element
  - Storage operations: saveToStorage with QuotaExceededError, loadFromStorage with missing key, clearStorage with invalid key
  - Scroll operations: scrollToElement with non-existent selector, scrollToPosition with invalid coordinates, isElementInViewport with null element
  - HTTP operations: network timeout, CORS error, 404/500 responses, malformed JSON response
  - Date operations: formatDate with invalid date string, compareDate with null values
  - Array operations: filter/sort/map/find with non-array data, empty arrays, null values
  - String operations: concatenate/split/substring/replace with null/undefined values
  - Text operations: getTextContent/replaceText/formatText on elements with no text content
  - Focus operations: setFocus on hidden element, setAriaAttribute with invalid attribute name
- [ ] T119 Performance validation: run all performance tests from success criteria (SC-002, SC-004, SC-008, SC-009)
- [ ] T120 Security audit: verify XSS prevention in text operations, CORS handling in HTTP, storage key validation

---

## Phase 13: Documentation & Release

**Purpose**: Final documentation and release preparation

- [ ] T121 [P] Update src/operation/README.md documenting all 32 new operations by category
- [ ] T122 [P] Run npm run docs to regenerate TypeDoc documentation
- [ ] T123 [P] Create examples in specs/001-atomic-operations/examples/ demonstrating quiz, inventory, and scroll story patterns
- [ ] T124 Update main README.md highlighting new operation categories
- [ ] T125 Validate quickstart.md accuracy with actual implementation
- [ ] T126 Final test run: npm test && npm run coverage && npm run typecheck && npm run lint
- [ ] T127 Commit all changes with descriptive commit message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-11)**: All depend on Foundational phase completion
  - **P1 Stories (US1-US3)**: Highest priority, implement first (Phases 3-5)
  - **P2 Stories (US4-US6, US8)**: Medium priority, implement next (Phases 6-8, 10)
  - **P3 Stories (US7, US9)**: Lower priority, implement last (Phases 9, 11)
  - User stories can proceed in parallel if team capacity allows
- **Integration (Phase 12)**: Depends on all desired user stories being complete
- **Documentation (Phase 13)**: Depends on Integration phase completion

### Within Each User Story

1. Tests MUST be written FIRST (TDD - Test-Driven Development per Constitution Principle I)
2. Tests MUST FAIL before implementation begins (RED state)
3. Implementation makes tests pass (GREEN state)
4. Refactor for quality (REFACTOR state)
5. Verify coverage meets 90% threshold
6. Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T003 and T004 can run in parallel

**Phase 2 (Foundational)**: All 9 contract files (T005-T013) can run in parallel

**Within Each User Story Phase**:
- All tests for a story can be written in parallel (marked with [P])
- All implementations for a story can be developed in parallel (marked with [P])
- Exception: index.ts export update must wait for all implementations

**Cross-Story Parallelization**:
Once Phase 2 complete, all user stories can be worked on in parallel by different team members:
- Developer A: User Story 1 (Form operations) - Phase 3
- Developer B: User Story 2 (Text operations) - Phase 4
- Developer C: User Story 3 (Storage operations) - Phase 5
- Continue pattern for US4-US9

**Phase 12 (Integration)**: T116-T117 can run in parallel

**Phase 13 (Documentation)**: T121-T123 can run in parallel

---

## Parallel Example: User Story 1 (Form Operations)

```typescript
// Launch all tests for User Story 1 together:
// Task T014: Create test suite for getFormData in src/test/unit/operation/get-form-data.spec.ts
// Task T015: Create test suite for setFormValue in src/test/unit/operation/set-form-value.spec.ts
// Task T016: Create test suite for validateForm in src/test/unit/operation/validate-form.spec.ts
// Task T017: Create test suite for toggleFormElement in src/test/unit/operation/toggle-form-element.spec.ts

// After all tests written and FAILING, launch all implementations together:
// Task T018: Implement getFormData operation in src/operation/get-form-data.ts
// Task T019: Implement setFormValue operation in src/operation/set-form-value.ts
// Task T020: Implement validateForm operation in src/operation/validate-form.ts
// Task T021: Implement toggleFormElement operation in src/operation/toggle-form-element.ts

// Sequential tasks:
// Task T022: Update src/operation/index.ts (depends on T018-T021 complete)
// Task T023: Verify all US1 tests pass (depends on T022)
// Task T024: Run coverage verification (depends on T023)
```

---

## Implementation Strategy

### MVP First (P1 Operations Only - 10 operations)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Form operations - 4 operations)
4. Complete Phase 4: User Story 2 (Text operations - 3 operations)
5. Complete Phase 5: User Story 3 (Storage operations - 3 operations)
6. **STOP and VALIDATE**: Test P1 operations independently
7. Run integration tests for form + text + storage chains
8. Deploy/demo if ready - creators can now build functional quizzes with persistence

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → Infrastructure ready
2. **MVP** (US1-US3) → Form + Text + Storage → Creators can build quizzes
3. **Enhanced MVP** (US4-US6, US8) → Arrays + Scroll + HTTP + Focus → Full interactivity + accessibility
4. **Complete** (US7, US9) → String + Date → Advanced text manipulation + time-based features
5. Each increment adds value without breaking previous functionality

### Recommended Priority Order (Sequential)

If implementing sequentially with single developer:

1. **P1 First** (Phases 3-5): Form, Text, Storage - Most critical for basic interactivity
2. **P2 Core** (Phases 6-8, 10): Arrays, Scroll, HTTP, Focus - Rich features + accessibility
3. **P3 Polish** (Phases 9, 11): String, Date - Advanced features
4. Integration & Documentation (Phases 12-13)

### Parallel Team Strategy

With 3+ developers after Phase 2 completion:

- **Team A (P1 Operations)**: Phases 3-5 (US1-US3) - Form, Text, Storage
- **Team B (P2 Operations A)**: Phases 6-7 (US4-US5) - Arrays, Scroll
- **Team C (P2 Operations B)**: Phases 8, 10 (US6, US8) - HTTP, Focus
- **Team D (P3 Operations)**: Phases 9, 11 (US7, US9) - String, Date
- **All Teams**: Reconvene for Phase 12 (Integration) and Phase 13 (Documentation)

---

## Estimated Effort

**Per Operation**: 1.5 hours implementation + 1.5 hours testing = 3 hours total

**Breakdown by Phase**:
- Phase 1 (Setup): 2 hours
- Phase 2 (Foundational): 4 hours (9 contract files)
- Phase 3 (US1 - 4 operations): 12 hours
- Phase 4 (US2 - 3 operations): 9 hours
- Phase 5 (US3 - 3 operations): 9 hours
- Phase 6 (US4 - 4 operations): 12 hours
- Phase 7 (US5 - 4 operations): 12 hours
- Phase 8 (US6 - 3 operations): 9 hours
- Phase 9 (US7 - 4 operations): 12 hours
- Phase 10 (US8 - 4 operations): 12 hours
- Phase 11 (US9 - 3 operations): 9 hours
- Phase 12 (Integration): 6 hours
- Phase 13 (Documentation): 4 hours

**Total**: ~112 hours (~14 days at 8 hours/day for single developer)

**With 3 Parallel Teams**: ~6 days (Phases 3-11 parallelized)

---

## Success Validation Checklist

After implementation, verify all Success Criteria from spec.md:

- [ ] **SC-001**: Story creator can build functional 5-question quiz with validation in <30 minutes
- [ ] **SC-002**: Quiz submission completes (including HTTP POST) in <2 seconds
- [ ] **SC-003**: Progress persists with 100% reliability across browser restarts
- [ ] **SC-004**: Scroll transitions complete in <500ms with 60fps animation
- [ ] **SC-005**: All 32 operations handle errors gracefully (100% error scenarios return errors, not exceptions)
- [ ] **SC-006**: New creators learn operation usage from docs in <5 minutes per operation
- [ ] **SC-007**: Screen reader users can navigate stories (100% keyboard accessibility)
- [ ] **SC-008**: Form validation feedback appears within 100ms
- [ ] **SC-009**: Array operations process 1000+ items in <100ms
- [ ] **SC-010**: String/text operations handle unicode correctly (emoji, international chars)

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** = maps task to specific user story for traceability
- **Test-First Mandatory**: RED (test fails) → GREEN (test passes) → REFACTOR
- **Constitution Compliance**: All checks passed in plan.md
- **No New Dependencies**: All operations use jQuery 3.7.1 (peer), standard Web APIs
- **Metadata Auto-Generated**: Do NOT manually create operation/metadata files (per user note)
- **Coverage Requirement**: 90% minimum per Constitution Principle VI
- **Pattern Consistency**: Follow existing 50 operation patterns strictly
- Verify tests FAIL before implementing
- Commit after each logical group of tasks
- Stop at checkpoints to validate story independence
