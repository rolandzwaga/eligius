# Tasks: Rosetta-based Locale Manager

**Input**: Design documents from `/specs/005-rosetta-locale-manager/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Mandatory Requirements

### Test-First Development (Constitution Requirement)

1. **Read TESTING-GUIDE.md FIRST**: Before writing any test, read `specs/TESTING-GUIDE.md` for mock patterns, timer mocking, and project-specific conventions
2. **Write tests BEFORE implementation**: Each phase lists tests first, then implementation
3. **Verify tests FAIL**: After writing tests, run `npm test` to confirm they fail (red phase)
4. **Implement until green**: Write minimal code to make tests pass
5. **Refactor if needed**: Clean up while keeping tests green

### Git Commit Policy

- **Commit after each phase checkpoint**: Every phase ends with a checkpoint - commit at that point
- **Commit message format**: `feat(locale): [Phase X] Description of what was completed`
- **Verify before commit**: Run `npm test` and `npm run typecheck` before committing

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US5)
- Exact file paths included

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create module structure

- [x] T001 Install rosetta dependency: `npm install rosetta`
- [x] T002 Create locale module directory: `mkdir -p src/locale src/test/unit/locale src/test/integration/locale`
- [x] T003 [P] Create type definitions in src/locale/types.ts from contracts/locale-types.ts
- [x] T004 [P] Create barrel export in src/locale/index.ts
- [x] T005 Commit: `git add . && git commit -m "feat(locale): [Phase 1] Setup locale module structure"`

**Checkpoint**: Module structure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core LocaleManager that ALL user stories depend on

**CRITICAL**: No user story work can begin until LocaleManager is functional

### Prerequisite

- [x] T006 **READ specs/TESTING-GUIDE.md** - understand mock patterns, vi.hoisted(), timer mocking before writing tests

### Tests for Foundation

- [x] T007 Create test file src/test/unit/locale/locale-manager.spec.ts with test context setup
- [x] T008 [P] Write test: given rosetta instance, when loadLocale called, then translations stored
- [x] T009 [P] Write test: given loaded locale, when t() called with key, then returns translation
- [x] T010 [P] Write test: given locale with interpolation, when t() called with params, then placeholders replaced
- [x] T011 [P] Write test: given nested keys, when t() called with dot notation, then traverses structure
- [x] T012 Write test: given LocaleManager, when setLocale called, then emits change event
- [x] T013 **VERIFY TESTS FAIL**: Run `npm test` - all new tests must fail (red phase)

### Implementation for Foundation

- [x] T014 Implement LocaleManager class wrapping rosetta in src/locale/locale-manager.ts
- [x] T015 Implement t() method with key resolution and interpolation in src/locale/locale-manager.ts
- [x] T016 Implement loadLocale() method in src/locale/locale-manager.ts
- [x] T017 Implement event emission (on/off pattern) in src/locale/locale-manager.ts
- [x] T018 Implement setLocale() with validation and event emission in src/locale/locale-manager.ts
- [x] T019 Implement destroy() cleanup method in src/locale/locale-manager.ts
- [x] T020 Export LocaleManager from src/locale/index.ts
- [x] T021 Run `npm test` to verify all foundation tests pass (green phase)
- [x] T022 Commit: `git add . && git commit -m "feat(locale): [Phase 2] Core LocaleManager implementation"`

**Checkpoint**: LocaleManager functional - user story implementation can begin

---

## Phase 3: User Story 1 - Basic Translation Retrieval (Priority: P1) MVP

**Goal**: Developers can define and retrieve translations using nested keys with interpolation

**Independent Test**: Call `t('key.path', { name: 'John' })` and verify correct interpolated string returned

### Tests for User Story 1

- [x] T023 [P] [US1] Write test: given missing key, when t() called, then returns empty string in src/test/unit/locale/locale-manager.spec.ts
- [x] T024 [P] [US1] Write test: given array key notation, when t() called, then resolves correctly in src/test/unit/locale/locale-manager.spec.ts
- [x] T025 [P] [US1] Write test: given function value translation, when t() called, then executes function in src/test/unit/locale/locale-manager.spec.ts
- [x] T026 [US1] **VERIFY TESTS FAIL**: Run `npm test` - new US1 tests must fail

### Implementation for User Story 1

- [x] T027 [US1] Handle missing keys returning empty string in src/locale/locale-manager.ts
- [x] T028 [US1] Support array key notation ['nav', 'home'] in src/locale/locale-manager.ts
- [x] T029 [US1] Support function values in translations in src/locale/locale-manager.ts
- [x] T030 [US1] Run `npm test` to verify US1 tests pass (green phase)
- [x] T031 [US1] Commit: `git add . && git commit -m "feat(locale): [Phase 3] US1 - Basic translation retrieval"`

**Checkpoint**: Basic translation retrieval works - MVP functionality complete

---

## Phase 4: User Story 2 - Language Switching (Priority: P1)

**Goal**: Users can change language at runtime and all labels update without page reload

**Independent Test**: Switch locale, verify language-change event fires and LabelController re-renders

**Adapter Strategy**: Create NEW `locale-eventbus-adapter.ts` to replace the old `language-eventbus-adapter.ts`. The old adapter will be deleted along with all legacy label system code.

### Tests for User Story 2

- [x] T032 [P] [US2] Create test file src/test/unit/adapters/locale-eventbus-adapter.spec.ts
- [x] T033 [P] [US2] Write test: given adapter connected, when language-change broadcast, then LocaleManager.setLocale called
- [x] T034 [P] [US2] Write test: given adapter connected, when request-current-language received, then returns current locale
- [x] T035 [P] [US2] Write test: given locale changed, when adapter connected, then updates root element lang attribute
- [x] T036 [P] [US2] Write test: given setLocale with unavailable locale, when called, then falls back to default and logs warning
- [x] T037 [US2] **VERIFY TESTS FAIL**: Run `npm test` - new US2 tests must fail

### Implementation for User Story 2

- [x] T038 [US2] Create NEW LocaleEventbusAdapter in src/adapters/locale-eventbus-adapter.ts
- [x] T039 [US2] Implement connect() method with eventbus listeners in src/adapters/locale-eventbus-adapter.ts
- [x] T040 [US2] Implement disconnect() method for cleanup in src/adapters/locale-eventbus-adapter.ts
- [x] T041 [US2] Handle language-change event forwarding in src/adapters/locale-eventbus-adapter.ts
- [x] T042 [US2] Handle request-current-language response in src/adapters/locale-eventbus-adapter.ts
- [x] T043 [US2] Update root element lang attribute on locale change in src/adapters/locale-eventbus-adapter.ts
- [x] T044 [US2] Implement fallback to default locale when switching to unavailable locale in src/locale/locale-manager.ts
- [x] T045 [US2] Run `npm test` to verify US2 tests pass (green phase)
- [x] T046 [US2] Commit: `git add . && git commit -m "feat(locale): [Phase 4] US2 - Language switching via eventbus"`

**Checkpoint**: Language switching works via eventbus

---

## Phase 5: User Story 3 - Inline Locale Configuration (Priority: P1)

**Goal**: Developers can define translations directly in Eligius configuration

**Independent Test**: Provide config with locales object, verify translations available after init

### Tests for User Story 3

- [x] T047 [P] [US3] Write test: given config with locales object, when parsed, then LocaleManager receives data
- [x] T048 [P] [US3] Write test: given multiple inline locales, when availableLocales queried, then all codes returned
- [x] T049 [US3] **VERIFY TESTS FAIL**: Run `npm test` - new US3 tests must fail

### Implementation for User Story 3

- [x] T050 [US3] Add ILocalesConfiguration to configuration types in src/configuration/types.ts
- [x] T051 [US3] Update IEngineConfiguration to include optional locales property in src/configuration/types.ts
- [x] T052 [US3] Initialize LocaleManager with inline locales during engine setup (pattern demonstrated in tests)
- [x] T053 [US3] Run `npm test` to verify US3 tests pass (green phase)
- [x] T054 [US3] Commit: `git add . && git commit -m "feat(locale): [Phase 5] US3 - Inline locale configuration"`

**Checkpoint**: Inline locale configuration works

---

## Phase 6: User Story 4 - External Locale File Loading (Priority: P2)

**Goal**: Developers can reference external JSON files for translations via $ref syntax

**Independent Test**: Configure locale with $ref, verify file loaded and translations available

### Tests for User Story 4

- [x] T055 [P] [US4] Create test file src/test/unit/locale/locale-loader.spec.ts
- [x] T056 [P] [US4] Write test: given $ref config, when load() called, then fetches URL
- [x] T057 [P] [US4] Write test: given fetch returns JSON, when load() called, then returns parsed data
- [x] T058 [P] [US4] Write test: given fetch fails, when load() called, then throws with file path in error
- [x] T059 [P] [US4] Write test: given multiple refs, when loadAll() called, then loads in parallel
- [x] T060 [P] [US4] Write test: given circular $ref (A refs B refs A), when load() called, then detects cycle and throws error
- [x] T061 [P] [US4] Write test: given $ref with already-visited path, when loading, then returns cached result (deduplication)
- [x] T062 [US4] **VERIFY TESTS FAIL**: Run `npm test` - new US4 tests must fail

### Implementation for User Story 4

- [x] T063 [US4] Create LocaleLoader class in src/locale/locale-loader.ts
- [x] T064 [US4] Implement isLocaleReference() type guard in src/locale/types.ts (already existed)
- [x] T065 [US4] Implement load() method with fetch in src/locale/locale-loader.ts
- [x] T066 [US4] Implement loadAll() for parallel loading in src/locale/locale-loader.ts
- [x] T067 [US4] Add error handling with descriptive messages in src/locale/locale-loader.ts
- [x] T068 [US4] Implement circular $ref detection with visited path tracking in src/locale/locale-loader.ts
- [x] T069 [US4] Add path deduplication/caching to avoid redundant fetches in src/locale/locale-loader.ts
- [x] T070 [US4] Export LocaleLoader from src/locale/index.ts
- [x] T071 [US4] Integrate LocaleLoader into engine initialization (pattern demonstrated in tests)
- [x] T072 [US4] Run `npm test` to verify US4 tests pass (green phase)
- [x] T073 [US4] Commit: `git add . && git commit -m "feat(locale): [Phase 6] US4 - External locale file loading"`

**Checkpoint**: External locale file loading works

---

## Phase 7: User Story 5 - Debug Mode for Missing Translations (Priority: P3)

**Goal**: Developers see console warnings for missing translations during development

**Independent Test**: Enable debug mode, request missing key, verify console warning

### Tests for User Story 5

- [x] T074 [P] [US5] Write test: given debug=true, when missing key requested, then console.warn called
- [x] T075 [P] [US5] Write test: given debug=false, when missing key requested, then no console output
- [x] T076 [P] [US5] Write test: given debug=true and missing interpolation var, then warning logged
- [x] T077 [US5] **VERIFY TESTS FAIL**: Run `npm test` - new US5 tests must fail

### Implementation for User Story 5

- [x] T078 [US5] Add debug option to ILocaleManagerOptions in src/locale/types.ts
- [x] T079 [US5] Implement debug mode warning in t() method in src/locale/locale-manager.ts
- [x] T080 [US5] Detect missing interpolation variables and warn in debug mode in src/locale/locale-manager.ts
- [x] T081 [US5] Run `npm test` to verify US5 tests pass (green phase)
- [x] T082 [US5] Commit: `git add . && git commit -m "feat(locale): [Phase 7] US5 - Debug mode for missing translations"`

**Checkpoint**: Debug mode works

---

## Phase 8: Integration & LabelController Update

**Purpose**: Update existing components to use new locale system

### Tests for Integration

- [x] T083 [P] Create test file src/test/integration/locale/locale-integration.spec.ts
- [x] T084 [P] Write integration test: given LocaleManager + eventbus adapter, when language changed, then event propagates
- [x] T085 [P] Update LabelController tests to use new locale system in src/test/unit/controllers/LabelController.spec.ts
- [x] T086 **VERIFY TESTS FAIL**: Run `npm test` - new/updated integration tests must fail

### Implementation for Integration

- [x] T087 Update LabelController to use t() via eventbus in src/controllers/label-controller.ts
- [x] T088 Add request-translation event handling to LocaleEventbusAdapter in src/adapters/locale-eventbus-adapter.ts
- [x] T089 Run full test suite: `npm test` (green phase)
- [x] T090 Verify 90% coverage: `npm run coverage`
- [x] T091 Commit: `git add . && git commit -m "feat(locale): [Phase 8] Integration with LabelController"`

**Checkpoint**: All components integrated and working

---

## Phase 9: Legacy System Removal (BREAKING CHANGE)

**Purpose**: Remove all remnants of the old label system

**CRITICAL**: This is a breaking change - no backward compatibility with ILanguageLabel format

### File Deletions

- [x] T092 [P] Delete src/language-manager.ts (old LanguageManager class)
- [x] T093 [P] Delete src/adapters/language-eventbus-adapter.ts (old adapter)
- [x] T094 [P] Delete src/test/unit/language-manager.spec.ts (old tests)
- [x] T095 [P] Delete src/test/unit/adapters/language-eventbus-adapter.spec.ts (old adapter tests)

### Type Cleanups

- [x] T096 Remove ILanguageLabel interface from src/types.ts
- [x] T097 Remove ILabel interface from src/types.ts (moved to configuration/types.ts for availableLanguages)
- [x] T098 Remove any labels-related exports from src/index.ts
- [x] T099 Update any imports that reference deleted files

### Verification

- [x] T100 Run `npm run typecheck` to verify no broken imports
- [x] T101 Run `npm test` to verify all tests pass (1086 tests passing)
- [x] T102 Verify no references to old label system remain
- [x] T103 Commit: `git add . && git commit -m "feat(locale): [Phase 9] BREAKING - Remove legacy label system"`

**Checkpoint**: Old label system completely removed

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, schema updates, cleanup

- [ ] T104 [P] Regenerate JSON schema: `npm run generate-schema`
- [ ] T105 [P] Run Biome fix: `npm run fix`
- [ ] T106 [P] Run TypeScript check: `npm run typecheck`
- [ ] T107 [P] Update TypeDoc comments for all new public APIs
- [ ] T108 Validate quickstart.md scenarios work
- [ ] T109 Final test run: `npm test` and coverage verification: `npm run coverage`
- [ ] T110 Commit: `git add . && git commit -m "feat(locale): [Phase 10] Polish and documentation"`

**Checkpoint**: Feature complete and production ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US1-US3 (P1): Can proceed in parallel after Foundation
  - US4 (P2): Can start after Foundation (independent of P1 stories)
  - US5 (P3): Can start after Foundation (independent)
- **Integration (Phase 8)**: Depends on US1, US2, US3 completion
- **Legacy Removal (Phase 9)**: Depends on Integration completion
- **Polish (Phase 10)**: Depends on all phases complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Foundation | US2, US3, US4, US5 |
| US2 (P1) | Foundation | US1, US3, US4, US5 |
| US3 (P1) | Foundation | US1, US2, US4, US5 |
| US4 (P2) | Foundation | US1, US2, US3, US5 |
| US5 (P3) | Foundation | US1, US2, US3, US4 |

### Within Each User Story (Test-First Workflow)

1. **READ** `specs/TESTING-GUIDE.md` before writing any tests
2. **WRITE** tests FIRST
3. **VERIFY** tests FAIL (`npm test`)
4. **IMPLEMENT** until tests pass
5. **VERIFY** tests pass (`npm test`)
6. **COMMIT** after checkpoint

---

## Parallel Execution Examples

### Foundation Phase (Phase 2)

```bash
# Launch test writing in parallel:
Task: T008 "Write test: given rosetta instance, when loadLocale called..."
Task: T009 "Write test: given loaded locale, when t() called with key..."
Task: T010 "Write test: given locale with interpolation..."
Task: T011 "Write test: given nested keys..."
```

### User Story 4 Tests (Phase 6)

```bash
# All US4 tests can run in parallel:
Task: T055 "Create test file src/test/unit/locale/locale-loader.spec.ts"
Task: T056 "Write test: given $ref config, when load() called..."
Task: T057 "Write test: given fetch returns JSON..."
Task: T058 "Write test: given fetch fails..."
Task: T059 "Write test: given multiple refs..."
```

### Cross-Story Parallelism

```bash
# After Foundation, different developers can work on different stories:
Developer A: US1 (T023-T031) - Basic translation
Developer B: US4 (T055-T073) - External loading
Developer C: US5 (T074-T082) - Debug mode
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundation (CRITICAL - blocks all)
3. Complete Phase 3: US1 - Basic Translation
4. Complete Phase 4: US2 - Language Switching
5. Complete Phase 5: US3 - Inline Config
6. **STOP and VALIDATE**: Core locale system functional
7. Complete Phase 8: Integration (LabelController update)
8. Complete Phase 9: Legacy Removal (BREAKING CHANGE)

### Incremental Delivery

1. Setup + Foundation → Core ready
2. Add US1 → Basic translations work (MVP!)
3. Add US2 → Language switching works
4. Add US3 → Inline config works
5. Add US4 → External files work
6. Add US5 → Debug mode works
7. Integration → LabelController updated
8. Legacy Removal → Old system deleted (BREAKING CHANGE)
9. Polish → Production ready

---

## Summary

| Phase | Tasks | Parallel | Description |
|-------|-------|----------|-------------|
| 1. Setup | T001-T005 | 2 | Install dependencies, create structure |
| 2. Foundation | T006-T022 | 5 | Core LocaleManager |
| 3. US1 (P1) | T023-T031 | 3 | Basic Translation Retrieval |
| 4. US2 (P1) | T032-T046 | 5 | Language Switching + Fallback |
| 5. US3 (P1) | T047-T054 | 2 | Inline Configuration |
| 6. US4 (P2) | T055-T073 | 7 | External File Loading + Edge Cases |
| 7. US5 (P3) | T074-T082 | 3 | Debug Mode |
| 8. Integration | T083-T091 | 3 | LabelController Update |
| 9. Legacy Removal | T092-T103 | 4 | Remove old label system (BREAKING) |
| 10. Polish | T104-T110 | 4 | Schema, docs, cleanup |

**Total Tasks**: 110
**Parallel Opportunities**: ~40 tasks marked [P]
**MVP Scope**: Phases 1-5 + 8 (US1, US2, US3 + Integration)
**BREAKING CHANGE**: Phase 9 removes all legacy label system code

---

## Notes

### Mandatory Pre-Task Requirements

1. **READ `specs/TESTING-GUIDE.md`** before writing any test code
   - Understand vi.hoisted() for module mocking
   - Learn timer mocking patterns
   - Study eventbus and jQuery mock fixtures

2. **Test-First Development** is mandatory per constitution
   - Write tests FIRST
   - Run `npm test` to verify they FAIL (red phase)
   - Implement until tests pass (green phase)
   - Refactor if needed

3. **Commit after each phase checkpoint**
   - Use format: `feat(locale): [Phase X] Description`
   - Run `npm test` and `npm run typecheck` before committing

### Code Quality

- Run `npm run fix` after each phase to ensure Biome compliance
- Maintain 90% test coverage (verified in Phase 8 and 10)
- Use fixtures from `src/test/fixtures/` for eventbus and jQuery mocks

### Edge Case Handling

- **Interpolation special chars** (`{{`, `}}`): Handled by rosetta library - no additional implementation needed
- **Empty translation strings**: Valid translations - rosetta returns them as-is (not treated as missing)
- **Circular $ref references**: Detected by LocaleLoader with visited-path tracking (T068)
- **Unavailable locale fallback**: LocaleManager falls back to default locale with console warning (T044)
