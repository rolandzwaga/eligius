# Tasks: Rosetta-based Locale Manager

**Input**: Design documents from `/specs/005-rosetta-locale-manager/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per constitution (Test-First Development). Write tests FIRST, verify they FAIL, then implement.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6)
- Exact file paths included

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create module structure

- [ ] T001 Install rosetta dependency: `npm install rosetta`
- [ ] T002 Create locale module directory structure at src/locale/
- [ ] T003 [P] Create type definitions in src/locale/types.ts from contracts/locale-types.ts
- [ ] T004 [P] Create barrel export in src/locale/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core LocaleManager that ALL user stories depend on

**CRITICAL**: No user story work can begin until LocaleManager is functional

### Tests for Foundation

- [ ] T005 Create test file src/test/unit/locale/locale-manager.spec.ts with test context setup
- [ ] T006 [P] Write test: given rosetta instance, when loadLocale called, then translations stored
- [ ] T007 [P] Write test: given loaded locale, when t() called with key, then returns translation
- [ ] T008 [P] Write test: given locale with interpolation, when t() called with params, then placeholders replaced
- [ ] T009 [P] Write test: given nested keys, when t() called with dot notation, then traverses structure
- [ ] T010 Write test: given LocaleManager, when setLocale called, then emits change event

### Implementation for Foundation

- [ ] T011 Implement LocaleManager class wrapping rosetta in src/locale/locale-manager.ts
- [ ] T012 Implement t() method with key resolution and interpolation in src/locale/locale-manager.ts
- [ ] T013 Implement loadLocale() method in src/locale/locale-manager.ts
- [ ] T014 Implement event emission (on/off pattern) in src/locale/locale-manager.ts
- [ ] T015 Implement setLocale() with validation and event emission in src/locale/locale-manager.ts
- [ ] T016 Implement destroy() cleanup method in src/locale/locale-manager.ts
- [ ] T017 Export LocaleManager from src/locale/index.ts
- [ ] T018 Run npm test to verify all foundation tests pass

**Checkpoint**: LocaleManager functional - user story implementation can begin

---

## Phase 3: User Story 1 - Basic Translation Retrieval (Priority: P1) MVP

**Goal**: Developers can define and retrieve translations using nested keys with interpolation

**Independent Test**: Call `t('key.path', { name: 'John' })` and verify correct interpolated string returned

### Tests for User Story 1

- [ ] T019 [P] [US1] Write test: given missing key, when t() called, then returns empty string in src/test/unit/locale/locale-manager.spec.ts
- [ ] T020 [P] [US1] Write test: given array key notation, when t() called, then resolves correctly in src/test/unit/locale/locale-manager.spec.ts
- [ ] T021 [P] [US1] Write test: given function value translation, when t() called, then executes function in src/test/unit/locale/locale-manager.spec.ts

### Implementation for User Story 1

- [ ] T022 [US1] Handle missing keys returning empty string in src/locale/locale-manager.ts
- [ ] T023 [US1] Support array key notation ['nav', 'home'] in src/locale/locale-manager.ts
- [ ] T024 [US1] Support function values in translations in src/locale/locale-manager.ts
- [ ] T025 [US1] Run npm test to verify US1 tests pass

**Checkpoint**: Basic translation retrieval works - MVP functionality complete

---

## Phase 4: User Story 2 - Language Switching (Priority: P1)

**Goal**: Users can change language at runtime and all labels update without page reload

**Independent Test**: Switch locale, verify language-change event fires and LabelController re-renders

**Adapter Strategy**: Create NEW `locale-eventbus-adapter.ts` alongside existing `language-eventbus-adapter.ts`. The existing adapter remains for backward compatibility and will be deprecated in a future release. The new adapter uses the LocaleManager API.

### Tests for User Story 2

- [ ] T026 [P] [US2] Create test file src/test/unit/adapters/locale-eventbus-adapter.spec.ts
- [ ] T027 [P] [US2] Write test: given adapter connected, when language-change broadcast, then LocaleManager.setLocale called
- [ ] T028 [P] [US2] Write test: given adapter connected, when request-current-language received, then returns current locale
- [ ] T029 [P] [US2] Write test: given locale changed, when adapter connected, then updates root element lang attribute
- [ ] T029a [P] [US2] Write test: given setLocale with unavailable locale, when called, then falls back to default and logs warning

### Implementation for User Story 2

- [ ] T030 [US2] Create NEW LocaleEventbusAdapter in src/adapters/locale-eventbus-adapter.ts (alongside existing language-eventbus-adapter.ts)
- [ ] T031 [US2] Implement connect() method with eventbus listeners in src/adapters/locale-eventbus-adapter.ts
- [ ] T032 [US2] Implement disconnect() method for cleanup in src/adapters/locale-eventbus-adapter.ts
- [ ] T033 [US2] Handle language-change event forwarding in src/adapters/locale-eventbus-adapter.ts
- [ ] T034 [US2] Handle request-current-language response in src/adapters/locale-eventbus-adapter.ts
- [ ] T035 [US2] Update root element lang attribute on locale change in src/adapters/locale-eventbus-adapter.ts
- [ ] T035a [US2] Implement fallback to default locale when switching to unavailable locale in src/locale/locale-manager.ts
- [ ] T036 [US2] Run npm test to verify US2 tests pass

**Checkpoint**: Language switching works via eventbus

---

## Phase 5: User Story 3 - Inline Locale Configuration (Priority: P1)

**Goal**: Developers can define translations directly in Eligius configuration

**Independent Test**: Provide config with locales object, verify translations available after init

### Tests for User Story 3

- [ ] T037 [P] [US3] Write test: given config with locales object, when parsed, then LocaleManager receives data
- [ ] T038 [P] [US3] Write test: given multiple inline locales, when availableLocales queried, then all codes returned

### Implementation for User Story 3

- [ ] T039 [US3] Add ILocalesConfiguration to configuration types in src/configuration/types.ts
- [ ] T040 [US3] Update IEngineConfiguration to include optional locales property in src/types.ts
- [ ] T041 [US3] Initialize LocaleManager with inline locales during engine setup
- [ ] T042 [US3] Run npm test to verify US3 tests pass

**Checkpoint**: Inline locale configuration works

---

## Phase 6: User Story 4 - External Locale File Loading (Priority: P2)

**Goal**: Developers can reference external JSON files for translations via $ref syntax

**Independent Test**: Configure locale with $ref, verify file loaded and translations available

### Tests for User Story 4

- [ ] T043 [P] [US4] Create test file src/test/unit/locale/locale-loader.spec.ts
- [ ] T044 [P] [US4] Write test: given $ref config, when load() called, then fetches URL
- [ ] T045 [P] [US4] Write test: given fetch returns JSON, when load() called, then returns parsed data
- [ ] T046 [P] [US4] Write test: given fetch fails, when load() called, then throws with file path in error
- [ ] T047 [P] [US4] Write test: given multiple refs, when loadAll() called, then loads in parallel
- [ ] T047a [P] [US4] Write test: given circular $ref (A refs B refs A), when load() called, then detects cycle and throws error
- [ ] T047b [P] [US4] Write test: given $ref with already-visited path, when loading, then returns cached result (deduplication)

### Implementation for User Story 4

- [ ] T048 [US4] Create LocaleLoader class in src/locale/locale-loader.ts
- [ ] T049 [US4] Implement isLocaleReference() type guard in src/locale/types.ts
- [ ] T050 [US4] Implement load() method with fetch in src/locale/locale-loader.ts
- [ ] T051 [US4] Implement loadAll() for parallel loading in src/locale/locale-loader.ts
- [ ] T052 [US4] Add error handling with descriptive messages in src/locale/locale-loader.ts
- [ ] T052a [US4] Implement circular $ref detection with visited path tracking in src/locale/locale-loader.ts
- [ ] T052b [US4] Add path deduplication/caching to avoid redundant fetches in src/locale/locale-loader.ts
- [ ] T053 [US4] Export LocaleLoader from src/locale/index.ts
- [ ] T054 [US4] Integrate LocaleLoader into engine initialization
- [ ] T055 [US4] Run npm test to verify US4 tests pass

**Checkpoint**: External locale file loading works

---

## Phase 7: User Story 5 - Migration from Legacy Format (Priority: P2)

**Goal**: Existing ILanguageLabel[] configurations continue to work automatically

**Independent Test**: Provide legacy labels config, verify translations accessible via t()

### Tests for User Story 5

- [ ] T056 [P] [US5] Create test file src/test/unit/locale/legacy-converter.spec.ts
- [ ] T057 [P] [US5] Write test: given ILanguageLabel[], when convert() called, then returns ILocalesConfiguration
- [ ] T058 [P] [US5] Write test: given multi-language labels, when converted, then all locales populated
- [ ] T059 [P] [US5] Write test: given isLegacyFormat(), when labels present, then returns true
- [ ] T060 [P] [US5] Write test: given both labels and locales, when merged, then new format takes precedence

### Implementation for User Story 5

- [ ] T061 [US5] Create LegacyConverter class in src/locale/legacy-converter.ts
- [ ] T062 [US5] Implement convert() method in src/locale/legacy-converter.ts
- [ ] T063 [US5] Implement isLegacyFormat() type guard in src/locale/legacy-converter.ts
- [ ] T064 [US5] Implement merge logic for legacy + new format in src/locale/legacy-converter.ts
- [ ] T065 [US5] Export LegacyConverter from src/locale/index.ts
- [ ] T066 [US5] Integrate auto-detection into engine initialization
- [ ] T067 [US5] Run npm test to verify US5 tests pass

**Checkpoint**: Legacy format migration works

---

## Phase 8: User Story 6 - Debug Mode for Missing Translations (Priority: P3)

**Goal**: Developers see console warnings for missing translations during development

**Independent Test**: Enable debug mode, request missing key, verify console warning

### Tests for User Story 6

- [ ] T068 [P] [US6] Write test: given debug=true, when missing key requested, then console.warn called
- [ ] T069 [P] [US6] Write test: given debug=false, when missing key requested, then no console output
- [ ] T070 [P] [US6] Write test: given debug=true and missing interpolation var, then warning logged

### Implementation for User Story 6

- [ ] T071 [US6] Add debug option to ILocaleManagerOptions in src/locale/types.ts
- [ ] T072 [US6] Implement debug mode warning in t() method in src/locale/locale-manager.ts
- [ ] T073 [US6] Detect missing interpolation variables and warn in debug mode in src/locale/locale-manager.ts
- [ ] T074 [US6] Run npm test to verify US6 tests pass

**Checkpoint**: Debug mode works

---

## Phase 9: Integration & LabelController Update

**Purpose**: Update existing components to use new locale system

### Tests for Integration

- [ ] T075 [P] Create test file src/test/integration/locale/locale-integration.spec.ts
- [ ] T076 [P] Write integration test: given LocaleManager + eventbus adapter, when language changed, then event propagates
- [ ] T077 [P] Update LabelController tests to use new locale system in src/test/unit/controllers/LabelController.spec.ts

### Implementation for Integration

- [ ] T078 Update LabelController to use t() via eventbus in src/controllers/label-controller.ts
- [ ] T079 Add request-translation event handling to LocaleEventbusAdapter in src/adapters/locale-eventbus-adapter.ts
- [ ] T080 Maintain backward compatibility with request-label-collection event in src/adapters/locale-eventbus-adapter.ts
- [ ] T081 Run full test suite: npm test
- [ ] T082 Verify 90% coverage: npm run coverage

**Checkpoint**: All components integrated and working

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, schema updates, cleanup

- [ ] T083 [P] Regenerate JSON schema: npm run generate-schema
- [ ] T084 [P] Run Biome fix: npm run fix
- [ ] T085 [P] Run TypeScript check: npm run typecheck
- [ ] T086 [P] Update TypeDoc comments for all new public APIs
- [ ] T087 Validate quickstart.md scenarios work
- [ ] T088 Final test run and coverage verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational completion
  - US1-US3 (P1): Can proceed in parallel after Foundation
  - US4-US5 (P2): Can start after Foundation (independent of P1 stories)
  - US6 (P3): Can start after Foundation (independent)
- **Integration (Phase 9)**: Depends on US1, US2, US3 completion
- **Polish (Phase 10)**: Depends on all phases complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Foundation | US2, US3, US4, US5, US6 |
| US2 (P1) | Foundation | US1, US3, US4, US5, US6 |
| US3 (P1) | Foundation | US1, US2, US4, US5, US6 |
| US4 (P2) | Foundation | US1, US2, US3, US5, US6 |
| US5 (P2) | Foundation | US1, US2, US3, US4, US6 |
| US6 (P3) | Foundation | US1, US2, US3, US4, US5 |

### Within Each User Story

1. Write tests FIRST - verify they FAIL
2. Implement until tests pass
3. Verify with npm test

---

## Parallel Execution Examples

### Foundation Phase (Phase 2)

```bash
# Launch test writing in parallel:
Task: T006 "Write test: given rosetta instance, when loadLocale called..."
Task: T007 "Write test: given loaded locale, when t() called with key..."
Task: T008 "Write test: given locale with interpolation..."
Task: T009 "Write test: given nested keys..."
```

### User Story 4 Tests (Phase 6)

```bash
# All US4 tests can run in parallel:
Task: T043 "Create test file src/test/unit/locale/locale-loader.spec.ts"
Task: T044 "Write test: given $ref config, when load() called..."
Task: T045 "Write test: given fetch returns JSON..."
Task: T046 "Write test: given fetch fails..."
Task: T047 "Write test: given multiple refs..."
```

### Cross-Story Parallelism

```bash
# After Foundation, different developers can work on different stories:
Developer A: US1 (T019-T025) - Basic translation
Developer B: US4 (T043-T055) - External loading
Developer C: US5 (T056-T067) - Legacy migration
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
7. Complete Phase 9: Integration (LabelController update)

### Incremental Delivery

1. Setup + Foundation → Core ready
2. Add US1 → Basic translations work (MVP!)
3. Add US2 → Language switching works
4. Add US3 → Inline config works
5. Add US4 → External files work
6. Add US5 → Legacy migration works
7. Add US6 → Debug mode works
8. Polish → Production ready

---

## Summary

| Phase | Tasks | Parallel | Description |
|-------|-------|----------|-------------|
| 1. Setup | T001-T004 | 2 | Install dependencies, create structure |
| 2. Foundation | T005-T018 | 5 | Core LocaleManager |
| 3. US1 (P1) | T019-T025 | 3 | Basic Translation Retrieval |
| 4. US2 (P1) | T026-T036 + T029a, T035a | 5 | Language Switching + Fallback |
| 5. US3 (P1) | T037-T042 | 2 | Inline Configuration |
| 6. US4 (P2) | T043-T055 + T047a/b, T052a/b | 7 | External File Loading + Edge Cases |
| 7. US5 (P2) | T056-T067 | 5 | Legacy Migration |
| 8. US6 (P3) | T068-T074 | 3 | Debug Mode |
| 9. Integration | T075-T082 | 3 | LabelController Update |
| 10. Polish | T083-T088 | 4 | Schema, docs, cleanup |

**Total Tasks**: 94 (6 new edge case tasks added)
**Parallel Opportunities**: 39 tasks marked [P]
**MVP Scope**: Phases 1-5 + 9 (US1, US2, US3 + Integration)

---

## Notes

- Constitution requires test-first development - write tests before implementation
- Consult TESTING-GUIDE.md for mock patterns (vi.hoisted, timer mocking)
- Use fixtures from src/test/fixtures/ for eventbus and jQuery mocks
- Run `npm run fix` after each phase to ensure code quality
- Commit after each logical task group

### Edge Case Handling

- **Interpolation special chars** (`{{`, `}}`): Handled by rosetta library - no additional implementation needed. Rosetta's interpolation replaces `{{key}}` patterns; literal braces in content don't trigger interpolation.
- **Empty translation strings**: Valid translations - rosetta returns them as-is (not treated as missing)
- **Circular $ref references**: Detected by LocaleLoader with visited-path tracking (T052a)
- **Unavailable locale fallback**: LocaleManager falls back to default locale with console warning (T035a)
