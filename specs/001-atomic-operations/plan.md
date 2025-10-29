# Implementation Plan: Atomic Operations for Interactive Stories

**Branch**: `001-atomic-operations` | **Date**: 2025-01-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-atomic-operations/spec.md`

## Summary

This feature adds 32 new atomic operations across 9 categories to enable rich interactive storytelling capabilities in Eligius. These operations fill critical functionality gaps identified through comprehensive analysis of the existing 50 operations. The new operations enable form handling, text manipulation, browser storage, array processing, scroll control, HTTP requests, string operations, accessibility features, and date/time handling. All operations follow existing Eligius patterns for operation data flow, error handling, JSDoc documentation, and TypeScript metadata generation.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode
**Primary Dependencies**: jQuery 3.7.1 (peer), hotkeys-js 3.13.15, ts-is-present 1.2.2, uuid 13.0.0
**Storage**: Browser localStorage/sessionStorage APIs
**Testing**: Vitest 3.2.4 with 90% coverage requirement
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single library project (TypeScript library)
**Performance Goals**: <16ms operation execution (60fps), <100ms for array operations on 1000+ items, <500ms scroll animations
**Constraints**: ESM-only, no framework dependencies, must work with jQuery 3.7.1, operations must be atomic and composable
**Scale/Scope**: 32 new operations, ~3200 lines of implementation code, ~3200 lines of test code (1:1 ratio)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development ✅
- **Status**: COMPLIANT
- **Plan**: Each operation implementation will follow RED-GREEN-REFACTOR cycle
- **Verification**: Tests written before implementation for all 32 operations

### Principle II: Technology Stack ✅
- **Status**: COMPLIANT
- **Dependencies**: No new production dependencies required
- **Rationale**: All operations use standard Web APIs, jQuery (peer dependency), and existing utilities

### Principle III: Security & Compliance First ✅
- **Status**: COMPLIANT
- **Considerations**:
  - Form operations: Validate and sanitize all form data extraction
  - Storage operations: Use secure storage keys, validate data before storing
  - HTTP operations: Respect CORS, validate URLs, sanitize request data
  - Text/String operations: Prevent XSS through proper escaping
  - Scroll operations: Validate element existence before scrolling
  - ARIA operations: Validate ARIA attribute values

### Principle IV: Code Quality & Architecture ✅
- **Status**: COMPLIANT
- **Pattern**: All operations follow existing atomic operation pattern from 50 current operations
- **Architecture**: Operations accept operationData, return modified data/Promise, use IOperationScope for context

### Principle V: Domain-Specific Requirements ✅
- **Status**: COMPLIANT
- **Timeline Integration**: Operations designed to work within timeline action sequences
- **Performance**: Operations optimized for <16ms execution to not block 60fps timeline

### Principle VI: Testing Standards ✅
- **Status**: COMPLIANT
- **Coverage Target**: 90% minimum for all operations
- **Test Types**: Unit tests for each operation, integration tests for operation chains

### Principle X: Research & Documentation Standards ✅
- **Status**: COMPLIANT
- **Plan**: Use Context7 MCP server to research:
  - jQuery API for DOM manipulation patterns
  - Web Storage API specifications
  - Fetch API for HTTP operations
  - ARIA specifications for accessibility operations
  - Date/time formatting patterns

### Principle XI: Dependency Management ✅
- **Status**: COMPLIANT
- **No New Dependencies**: All operations use existing dependencies and standard Web APIs

### Principle XVII: Technical Overview Reference ✅
- **Status**: COMPLIANT
- **Checked**: Reviewed all 50 existing operations to understand patterns
- **Verified**: No duplicate functionality being created

### Principle XVIII: Configuration Schema Integrity ✅
- **Status**: COMPLIANT
- **Schema Update**: JSON schema will be regenerated after operation metadata is created
- **Note**: Per user input, operation metadata files are auto-generated from JSDoc comments

### Principle XX: Documentation Research Standards ✅
- **Status**: COMPLIANT
- **Plan**: Use Context7 to research jQuery, Web Storage, Fetch API, ARIA before implementation

**GATE RESULT**: ✅ ALL CHECKS PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-atomic-operations/
├── plan.md              # This file
├── research.md          # Phase 0: API research and patterns
├── data-model.md        # Phase 1: Operation data structures
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: Operation contracts (TypeScript interfaces)
│   ├── form-operations.ts
│   ├── text-operations.ts
│   ├── storage-operations.ts
│   ├── array-operations.ts
│   ├── scroll-operations.ts
│   ├── http-operations.ts
│   ├── string-operations.ts
│   ├── focus-operations.ts
│   └── date-operations.ts
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2: Generated by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── operation/          # Existing directory - add new operations here
│   ├── get-form-data.ts
│   ├── set-form-value.ts
│   ├── validate-form.ts
│   ├── toggle-form-element.ts
│   ├── get-text-content.ts
│   ├── replace-text.ts
│   ├── format-text.ts
│   ├── save-to-storage.ts
│   ├── load-from-storage.ts
│   ├── clear-storage.ts
│   ├── filter-array.ts
│   ├── sort-array.ts
│   ├── map-array.ts
│   ├── find-in-array.ts
│   ├── scroll-to-element.ts
│   ├── scroll-to-position.ts
│   ├── is-element-in-viewport.ts
│   ├── get-scroll-position.ts
│   ├── http-post.ts
│   ├── http-put.ts
│   ├── http-delete.ts
│   ├── concatenate-strings.ts
│   ├── split-string.ts
│   ├── substring-text.ts
│   ├── replace-string.ts
│   ├── set-focus.ts
│   ├── get-focused-element.ts
│   ├── set-aria-attribute.ts
│   ├── announce-to-screen-reader.ts
│   ├── format-date.ts
│   ├── get-current-time.ts
│   ├── compare-date.ts
│   ├── index.ts          # Update exports
│   └── helper/           # Existing - may add utilities if needed
│       └── [shared utilities]
│
├── operation/metadata/  # AUTO-GENERATED from JSDoc - no manual files
│   └── [generated by schema tools]
│
├── test/
│   ├── unit/
│   │   └── operation/
│   │       ├── get-form-data.spec.ts
│   │       ├── set-form-value.spec.ts
│   │       ├── validate-form.spec.ts
│   │       ├── toggle-form-element.spec.ts
│   │       ├── get-text-content.spec.ts
│   │       ├── replace-text.spec.ts
│   │       ├── format-text.spec.ts
│   │       ├── save-to-storage.spec.ts
│   │       ├── load-from-storage.spec.ts
│   │       ├── clear-storage.spec.ts
│   │       ├── filter-array.spec.ts
│   │       ├── sort-array.spec.ts
│   │       ├── map-array.spec.ts
│   │       ├── find-in-array.spec.ts
│   │       ├── scroll-to-element.spec.ts
│   │       ├── scroll-to-position.spec.ts
│   │       ├── is-element-in-viewport.spec.ts
│   │       ├── get-scroll-position.spec.ts
│   │       ├── http-post.spec.ts
│   │       ├── http-put.spec.ts
│   │       ├── http-delete.spec.ts
│   │       ├── concatenate-strings.spec.ts
│   │       ├── split-string.spec.ts
│   │       ├── substring-text.spec.ts
│   │       ├── replace-string.spec.ts
│   │       ├── set-focus.spec.ts
│   │       ├── get-focused-element.spec.ts
│   │       ├── set-aria-attribute.ts
│   │       ├── announce-to-screen-reader.spec.ts
│   │       ├── format-date.spec.ts
│   │       ├── get-current-time.spec.ts
│   │       └── compare-date.spec.ts
│   └── integration/
│       └── atomic-operations-chains.spec.ts  # Test operation chaining
│
└── types.ts            # May need to add shared types
```

**Structure Decision**: Single library project structure. All operations added to existing `src/operation/` directory following established patterns from 50 existing operations. Test files mirror source structure in `src/test/unit/operation/`. No new directories required beyond adding test files.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - all constitution checks passed. This section intentionally left empty.

---

## Phase 0: Research & Technical Decisions

**Objective**: Research Web APIs, jQuery patterns, and best practices for all operation categories using Context7 MCP server.

### Research Tasks

1. **jQuery DOM Manipulation Patterns**
   - Research jQuery form serialization methods
   - Research jQuery text manipulation methods
   - Research jQuery DOM traversal for focus management
   - Research jQuery event handling patterns
   - **Source**: Context7 MCP server (jquery library)

2. **Web Storage API**
   - Research localStorage/sessionStorage API patterns
   - Research storage quota and error handling
   - Research storage event handling
   - Research best practices for key naming
   - **Source**: Context7 MCP server (MDN Web Storage API)

3. **Fetch API for HTTP Operations**
   - Research fetch() API for POST/PUT/DELETE
   - Research request/response patterns
   - Research error handling and timeout strategies
   - Research CORS considerations
   - **Source**: Context7 MCP server (MDN Fetch API)

4. **ARIA Accessibility Patterns**
   - Research ARIA live regions
   - Research ARIA attribute patterns
   - Research focus management best practices
   - Research screen reader announcement patterns
   - **Source**: Context7 MCP server (MDN ARIA documentation)

5. **Date/Time Formatting**
   - Research Intl.DateTimeFormat API
   - Research Date constructor patterns
   - Research date comparison patterns
   - Research ISO 8601 format handling
   - **Source**: Context7 MCP server (MDN Date API)

6. **Array Processing Patterns**
   - Research efficient array filtering algorithms
   - Research array sorting patterns (stable sort)
   - Research array mapping and transformation
   - Research find/search performance
   - **Source**: Context7 MCP server (MDN Array methods)

7. **Scroll API Patterns**
   - Research Element.scrollIntoView() API
   - Research window.scrollTo() patterns
   - Research IntersectionObserver for viewport detection
   - Research scroll animation patterns
   - **Source**: Context7 MCP server (MDN Scroll APIs)

8. **String Manipulation**
   - Research regex patterns for string replacement
   - Research String.prototype methods
   - Research Unicode handling patterns
   - Research performance of string operations
   - **Source**: Context7 MCP server (MDN String API)

9. **Form Validation Patterns**
   - Research HTML5 validation APIs
   - Research custom validation patterns
   - Research error message formatting
   - Research jQuery form plugins (for compatibility)
   - **Source**: Context7 MCP server (MDN Form Validation, jquery)

### Existing Operation Patterns Analysis

**Studied Operations** (for pattern consistency):
- `selectElement.ts` - DOM selection pattern
- `setElementAttributes.ts` - Attribute manipulation pattern
- `loadJson.ts` - Async HTTP request pattern
- `getAttributesFromElement.ts` - Data extraction pattern
- `forEach.ts` - Array iteration pattern
- `when.ts` - Expression evaluation pattern
- `animate.ts` - jQuery animation pattern
- `broadcastEvent.ts` - Eventbus pattern

**Key Patterns Identified**:
1. **Operation Signature**: `export const operationName: IOperation = async (data: TOperationData, scope?: IOperationScope) => { ... }`
2. **Error Handling**: Return error in operation data, don't throw
3. **JSDoc Format**: Description, @param docs, @returns docs, @example usage
4. **Type Safety**: Strict typing for operation data with interfaces
5. **Scope Usage**: Use `scope?.eventbus` for event communication
6. **Async Pattern**: Return Promise for async operations, void for sync
7. **Data Flow**: Read from operationData, return modified operationData

**Output**: `research.md` documenting all API research findings and pattern decisions

---

## Phase 1: Design & Contracts

**Objective**: Define operation data structures, contracts, and implementation patterns.

### Data Model (`data-model.md`)

**Operation Data Structures**:

1. **Form Operations**
   - `IGetFormDataOperationData` - Form selector, output: formData object
   - `ISetFormValueOperationData` - Element selector, value to set
   - `IValidateFormOperationData` - Form selector, validation rules, output: errors object
   - `IToggleFormElementOperationData` - Element selector, enabled boolean

2. **Text Operations**
   - `IGetTextContentOperationData` - Element selector (uses selectedElement), output: textContent string
   - `IReplaceTextOperationData` - Element selector, search pattern, replacement string
   - `IFormatTextOperationData` - Element selector, transformation type (uppercase/lowercase/etc)

3. **Storage Operations**
   - `ISaveToStorageOperationData` - Storage type (local/session), key, data to save
   - `ILoadFromStorageOperationData` - Storage type, key, output: loaded data
   - `IClearStorageOperationData` - Storage type, optional key (null = clear all)

4. **Array Operations**
   - `IFilterArrayOperationData` - Array property, filter expression/function, output: filtered array
   - `ISortArrayOperationData` - Array property, sort key, order (asc/desc), output: sorted array
   - `IMapArrayOperationData` - Array property, map expression/function, output: mapped array
   - `IFindInArrayOperationData` - Array property, search criteria, output: found item or null

5. **Scroll Operations**
   - `IScrollToElementOperationData` - Element selector, offset, duration
   - `IScrollToPositionOperationData` - X/Y coordinates, smooth boolean
   - `IIsElementInViewportOperationData` - Element selector, output: boolean
   - `IGetScrollPositionOperationData` - Output: X/Y coordinates

6. **HTTP Operations**
   - `IHttpPostOperationData` - URL, data payload, headers, output: response
   - `IHttpPutOperationData` - URL, data payload, headers, output: response
   - `IHttpDeleteOperationData` - URL, headers, output: response

7. **String Operations**
   - `IConcatenateStringsOperationData` - String values array, separator, output: concatenated string
   - `ISplitStringOperationData` - String value, delimiter, output: string array
   - `ISubstringTextOperationData` - String value, start/end indices, output: substring
   - `IReplaceStringOperationData` - String value, pattern, replacement, output: replaced string

8. **Focus Operations**
   - `ISetFocusOperationData` - Element selector
   - `IGetFocusedElementOperationData` - Output: focused element reference
   - `ISetAriaAttributeOperationData` - Element selector, attribute name, value
   - `IAnnounceToScreenReaderOperationData` - Message text, politeness level

9. **Date Operations**
   - `IFormatDateOperationData` - Date value, format pattern, output: formatted string
   - `IGetCurrentTimeOperationData` - Format type (iso/epoch), output: timestamp
   - `ICompareDateOperationData` - Date 1, Date 2, output: comparison result (-1/0/1)

### API Contracts (`contracts/` directory)

Each contract file will define TypeScript interfaces for operation data structures following existing patterns from `src/operation/types.ts`.

**Contract Files**:
- `form-operations.ts` - 4 interfaces
- `text-operations.ts` - 3 interfaces
- `storage-operations.ts` - 3 interfaces
- `array-operations.ts` - 4 interfaces
- `scroll-operations.ts` - 4 interfaces
- `http-operations.ts` - 3 interfaces
- `string-operations.ts` - 4 interfaces
- `focus-operations.ts` - 4 interfaces
- `date-operations.ts` - 3 interfaces

**Total**: 32 TypeScript interface definitions

### Quickstart Guide (`quickstart.md`)

Implementation roadmap:
1. Start with P1 operations (Forms, Text, Storage) - 10 operations
2. Then P2 operations (Arrays, Scroll, HTTP, Focus) - 15 operations
3. Finally P3 operations (String, Date) - 7 operations
4. Each operation: Test → Implement → Refactor → Quality Check
5. After all operations: Integration tests, schema generation, documentation update

**Estimated Effort**:
- Research: 4 hours (Context7 queries + pattern analysis)
- Design: 2 hours (data models + contracts)
- Implementation: 48 hours (32 operations × 1.5 hours average)
- Testing: 48 hours (32 test files × 1.5 hours average)
- Integration: 4 hours (operation chains + edge cases)
- Documentation: 2 hours (JSDoc + schema generation)
- **Total**: ~108 hours (~13.5 days at 8 hours/day)

---

## Phase 2: Task Generation (Not Done in /speckit.plan)

**Next Command**: `/speckit.tasks` will generate detailed task breakdown from this plan.

**Expected Task Structure**:
- Research tasks (9 tasks from Phase 0)
- Design tasks (data model + contracts)
- Implementation tasks (32 operation implementations)
- Testing tasks (32 test suites + 1 integration suite)
- Documentation tasks (schema generation + updates)
- Quality tasks (coverage verification + linting)

**Estimated Total Tasks**: ~80-90 tasks

---

## Implementation Notes

### Key Decisions

1. **No New Dependencies**: All operations use standard Web APIs, jQuery (peer dep), and existing utilities
2. **Metadata Auto-Generation**: Per user input, operation/metadata files are generated from JSDoc comments, not created manually
3. **Pattern Consistency**: All 32 operations follow exact patterns from existing 50 operations
4. **Error Handling**: Return errors as data objects, never throw exceptions
5. **Async Operations**: HTTP, storage, and scroll operations return Promises
6. **Type Safety**: Strict TypeScript interfaces for all operation data
7. **Test-First**: Every operation has test written before implementation
8. **Coverage**: 90% minimum coverage target for all operations

### Risk Mitigation

**Risk**: Large scope (32 operations) may lead to pattern drift
**Mitigation**: Strict adherence to existing operation patterns, frequent pattern validation

**Risk**: jQuery API changes or deprecations
**Mitigation**: Use Context7 to verify current jQuery 3.7.1 API before implementation

**Risk**: Browser API compatibility issues
**Mitigation**: Test in multiple browsers, use feature detection where needed

**Risk**: Storage quota errors not handled properly
**Mitigation**: Research and implement proper QuotaExceededError handling

**Risk**: ARIA implementation may not work with all screen readers
**Mitigation**: Test with NVDA and JAWS, follow WAI-ARIA authoring practices

### Success Criteria Validation

From spec.md Success Criteria:

- **SC-001**: Quiz building capability → Validated by form + storage + HTTP operations
- **SC-002**: 2-second submission time → HTTP POST performance requirement
- **SC-003**: 100% persistence reliability → Storage operations with error handling
- **SC-004**: <500ms scroll transitions → Scroll operation performance target
- **SC-005**: 100% error graceful handling → All operations return errors as data
- **SC-006**: 5-minute learning time → JSDoc examples + consistent patterns
- **SC-007**: 100% keyboard accessibility → Focus operations + ARIA support
- **SC-008**: <100ms validation feedback → Sync form validation operation
- **SC-009**: <100ms array processing → Efficient array operation algorithms
- **SC-010**: Unicode support → String/text operations handle UTF-8 correctly

All success criteria are achievable with planned implementation approach.

---

## Next Steps

1. ✅ Spec completed and validated
2. ✅ Plan completed (this document)
3. ⏭️ Execute Phase 0: Research (generate research.md using Context7)
4. ⏭️ Execute Phase 1: Design (generate data-model.md, contracts/, quickstart.md)
5. ⏭️ Run `/speckit.tasks` to generate task breakdown
6. ⏭️ Begin implementation following task sequence
