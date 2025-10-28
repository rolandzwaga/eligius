# Implementation Plan: Codebase Quality Improvement Initiative

**Branch**: `001-codebase-improvements` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-codebase-improvements/spec.md`

**Note**: This plan addresses technical debt through comprehensive testing, code deduplication, performance optimization, and type safety improvements across the existing Eligius codebase.

## Summary

This initiative improves codebase quality by achieving 90% test coverage (currently 66%), eliminating 150+ lines of duplicated code, optimizing timeline performance by 50%, and reducing type safety violations by 50% in core files. Work is organized into 9 prioritized user stories focusing on controllers, operations, helpers, and core engine files. All improvements maintain backward compatibility and are verified by existing tests.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode
**Primary Dependencies**: Vitest 3.2.4 (testing), Biome 2.3.2 (linting/formatting), tsdown 0.15.11 (build)
**Storage**: N/A (this is refactoring work, no new storage)
**Testing**: Vitest with Istanbul coverage provider (config: src/vitest.config.ts)
**Target Platform**: Node.js >=20, browser environments (ESM modules)
**Project Type**: Single TypeScript library project
**Performance Goals**:
- Timeline initialization: 50% faster (consolidate double loop)
- Timeline lookups: O(1) via Map cache (currently O(n))
- LottieController label replacement: 50% faster (O(n) vs O(n²))
**Constraints**:
- Must maintain 100% backward compatibility (all existing tests pass)
- Must achieve 90% code coverage (constitutional requirement)
- Must exclude build tools directory from coverage (src/build/, src/tools/)
- Must preserve existing public API contracts
**Scale/Scope**:
- 12,057 lines of code across 278 TypeScript files
- 28+ operations to refactor for property deletion
- 5 controllers to test (LottieController, NavigationController, ProgressBarController, RoutingController, SubtitlesController)
- 2 missing operation tests (remove-element, remove-controller-from-element)
- 469 'any' type usages (focus on 2 core files)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development ✅ COMPLIANT
- **Status**: Will be satisfied by this initiative
- **Current Gap**: Controller coverage at 29% (need 90%)
- **Plan**: User Stories 1-2 add comprehensive controller and operation tests
- **Verification**: Coverage report must show ≥90% for affected modules

### Principle II: Technology Stack ✅ COMPLIANT
- **Status**: No technology changes
- **Stack**: TypeScript 5.9.3, Vitest 3.2.4, Biome 2.3.2 (all existing)
- **Dependencies**: No new dependencies added

### Principle III: Security & Compliance ✅ COMPLIANT
- **Status**: Improvements don't affect security surface
- **Note**: Refactoring maintains existing input validation and sanitization

### Principle IV: Code Quality & Architecture ✅ COMPLIANT
- **Status**: This initiative directly addresses code quality
- **Actions**: Property deletion duplication elimination, type safety improvements, BaseController standardization
- **Quality Checks**: All quality checks (lint, format, typecheck, fix) run after each task

### Principle V: Domain-Specific Requirements ✅ COMPLIANT
- **Status**: Performance optimizations maintain timeline precision (100ms granularity)
- **Timeline Operations**: All optimizations preserve idempotent, deterministic behavior
- **Verification**: Existing timeline tests must pass unchanged

### Principle VI: Testing Standards ✅ TARGET
- **Current**: ~66% overall coverage, 29% controller coverage
- **Target**: ≥90% coverage excluding build tools
- **Actions**: Add 42+ new tests across controllers and operations
- **Coverage Exclusions**: src/build/, src/tools/ (per constitutional allowance)

### Principle VII: Development Workflow ✅ COMPLIANT
- **Status**: Test-first workflow enforced for all new tests
- **Pattern**: RED (write failing test) → GREEN (implement) → REFACTOR → Quality checks
- **Verification**: Each PR includes tests before implementation

### Principle VIII: Performance & User Experience ✅ COMPLIANT
- **Status**: Performance improvements are core goal
- **Actions**: Timeline optimization (50% faster), LottieController optimization (O(n²)→O(n))
- **Memory**: Fix leak risks in global cache and event listener binding

### Principle X: Research & Documentation Standards ✅ COMPLIANT
- **Status**: Use Context7 MCP server for library research
- **Libraries to Research**: Vitest (testing patterns), TypeScript (type guards), jQuery (mocking)
- **Documentation**: All findings documented in research.md

### Principle XI: Dependency Management ✅ COMPLIANT
- **Status**: No new dependencies
- **Change**: None (refactoring existing code only)

### Principle XII: Framework-Specific Restrictions ✅ COMPLIANT
- **Status**: No framework dependencies
- **Pattern**: Vanilla TypeScript, jQuery (existing peer dependency)

### Principle XIII: Debugging Attempt Limit ✅ COMPLIANT
- **Status**: 5-attempt rule applies to refactoring bugs
- **Note**: Stop and consult after 5 failed fix attempts

### Principle XIV: Concise Communication ✅ COMPLIANT
- **Status**: Brief, technical communication throughout
- **Example**: "Added LottieController tests. 92% coverage. All tests pass."

### Principle XV: Token Efficiency ✅ COMPLIANT
- **Status**: No documentation generation (code-focused work)
- **Note**: Run commands to verify, don't duplicate output

### Principle XVI: Zero Failing Tests Policy ✅ CRITICAL
- **Status**: ALL tests must pass after EVERY commit
- **Verification**: Run `npm test` after each refactoring
- **Gate**: Cannot proceed if any test fails

### Principle XVII: Technical Overview Reference ✅ COMPLIANT
- **Status**: Consulted CLAUDE.md and constitution before planning
- **Actions**: Update CLAUDE.md after completion with new patterns
- **Verification**: Document new helpers and patterns

### Principle XVIII: Configuration Schema Integrity ✅ COMPLIANT
- **Status**: No configuration format changes
- **Note**: JSON schema unchanged (refactoring only)

### Principle XIX: Public API Stability ✅ COMPLIANT
- **Status**: No public API changes
- **Verification**: All existing tests pass (proves API unchanged)
- **Note**: Internal refactoring only (helpers, test coverage, optimizations)

### Principle XX: Documentation Research Standards ✅ COMPLIANT
- **Status**: Will use Context7 for Vitest, TypeScript research
- **Libraries**: vitest, typescript, jquery (for mocking patterns)
- **Workflow**: resolve-library-id → get-library-docs → document in research.md

**GATE RESULT**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-codebase-improvements/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0 output (library research, patterns)
├── data-model.md        # Phase 1 output (helper/class designs)
├── quickstart.md        # Phase 1 output (refactoring guide)
├── checklists/
│   └── requirements.md  # Spec validation (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── operation/                       # Timeline operations (28+ files to refactor)
│   ├── helper/                     # Operation helpers (add removeProperties)
│   │   ├── remove-operation-properties.ts  # NEW: Property deletion helper
│   │   ├── resolve-property-values.ts      # MODIFY: Fix memory leak
│   │   └── [14 other helpers]
│   ├── remove-element.ts           # ADD TEST
│   ├── remove-controller-from-element.ts  # ADD TEST
│   ├── add-class.ts                # REFACTOR: Use removeProperties
│   ├── remove-class.ts             # REFACTOR: Use removeProperties
│   ├── animate.ts                  # REFACTOR: Use removeProperties
│   └── [25+ other operations]      # REFACTOR: Use removeProperties
├── controllers/                     # UI controllers (5 to test, base class)
│   ├── base-controller.ts          # NEW: Abstract base class
│   ├── lottie-controller.ts        # ADD TESTS + OPTIMIZE string replacement
│   ├── navigation-controller.ts    # ADD TESTS
│   ├── progressbar-controller.ts   # ADD TESTS
│   ├── routing-controller.ts       # ADD TESTS
│   ├── subtitles-controller.ts     # ADD TESTS
│   ├── event-listener-controller.ts  # REFACTOR: Extend BaseController
│   └── label-controller.ts         # REFACTOR: Extend BaseController
├── eligius-engine.ts               # OPTIMIZE: Timeline setup, cache, execution
├── operation/helper/
│   └── merge-operation-data.ts     # TYPE SAFETY: Remove 'any'
└── util/                           # Utility functions
    └── [7 utils]                   # No changes needed

src/test/                            # Test suite (add 42+ tests)
├── unit/
│   ├── controllers/
│   │   ├── LottieController.spec.ts        # NEW (10 tests)
│   │   ├── NavigationController.spec.ts    # NEW (10 tests)
│   │   ├── ProgressBarController.spec.ts   # NEW (6 tests)
│   │   ├── RoutingController.spec.ts       # NEW (8 tests)
│   │   ├── SubtitlesController.spec.ts     # NEW (8 tests)
│   │   └── BaseController.spec.ts          # NEW (6 tests)
│   ├── operation/
│   │   ├── remove-element.spec.ts          # NEW (4 tests)
│   │   ├── remove-controller-from-element.spec.ts  # NEW (4 tests)
│   │   └── helper/
│   │       └── remove-operation-properties.spec.ts  # NEW (6 tests)
│   └── performance/
│       ├── timeline-benchmarks.spec.ts     # NEW (3 benchmarks)
│       └── memory-leak-detection.spec.ts   # NEW (2 tests)
└── integration/
    └── [5 existing tests]                  # No changes

vitest.config.ts                    # UPDATE: Exclude build tools from coverage
```

**Structure Decision**: Single TypeScript project with existing structure. All work is refactoring, testing, and optimization of existing modules. No new directories needed except BaseController and performance test directories.

## Complexity Tracking

*No constitution violations - this section not needed.*

## Phase 0: Research & Library Documentation

**Status**: Required for test patterns, type guards, mocking strategies

### Research Tasks

1. **Vitest Testing Patterns** (User Stories 1-2)
   - **Query**: Vitest controller testing with mock dependencies
   - **Focus**: Mocking lottie-web, jQuery, video.js in tests
   - **Output**: Mock patterns, test setup best practices
   - **Context7**: `/vitest/vitest` → controller testing patterns

2. **TypeScript Type Guards** (User Story 6)
   - **Query**: TypeScript type narrowing without 'any'
   - **Focus**: Generic type constraints, discriminated unions, type predicates
   - **Output**: Type guard patterns for eligius-engine.ts, merge-operation-data.ts
   - **Context7**: `/microsoft/TypeScript` → type guard patterns

3. **jQuery Mocking Patterns** (User Stories 1-2)
   - **Query**: Mocking jQuery in Vitest tests
   - **Focus**: Mock element methods (addClass, removeClass, on, off, etc.)
   - **Output**: Mock jQuery element patterns for controller tests
   - **Context7**: `/jquery/jquery` → API signatures for mocking

4. **Performance Benchmarking with Vitest** (User Story 9)
   - **Query**: Vitest performance benchmarks
   - **Focus**: Measuring execution time, memory profiling
   - **Output**: Benchmark test patterns
   - **Context7**: `/vitest/vitest` → bench() API usage

### Research Output Format

```markdown
# Research Findings: Codebase Improvements

## 1. Vitest Controller Testing Patterns

**Decision**: Use Vitest with class-based mocks for external dependencies
**Rationale**: Vitest supports ES modules, TypeScript, and provides type-safe mocking
**Pattern**:
```typescript
class MockLottie {
  loadAnimation = vi.fn();
  destroy = vi.fn();
}
vi.mock('lottie-web', () => ({ default: MockLottie }));
```
**Context7 Source**: /vitest/vitest (version: latest)

## 2. TypeScript Type Guards
[... and so on for each research task ...]
```

## Phase 1: Design Artifacts

### A. Data Model (Helpers & Classes)

**File**: `data-model.md`

This initiative creates new abstractions for code reuse:

#### 1. RemoveProperties Helper

**Purpose**: Eliminate property deletion duplication across 28+ operations

**Interface**:
```typescript
function removeProperties<T extends Record<string, any>, K extends keyof T>(
  operationData: T,
  ...keys: K[]
): Omit<T, K>
```

**Behavior**: Deletes specified properties from operationData, returns typed result

**Type Safety**: Uses TypeScript utility type `Omit<T, K>` for correct return typing

#### 2. BaseController Abstract Class

**Purpose**: Standardize event listener management across controllers

**Interface**:
```typescript
abstract class BaseController<T extends TOperationData> implements IController<T> {
  protected eventListeners: TEventbusRemover[];
  abstract name: string;

  protected addListener(eventbus: IEventbus, eventName: string, handler: Function): void;
  protected attachMultiple(eventbus: IEventbus, listeners: Array<{eventName, handler}>): void;
  detach(eventbus: IEventbus): void;

  abstract init(operationData: T): void;
  abstract attach(eventbus: IEventbus): Promise<any> | void;
}
```

**Responsibilities**:
- Track event listeners for cleanup
- Auto-bind handlers to controller instance
- Provide centralized detach() implementation

#### 3. Timeline Lookup Cache

**Purpose**: O(1) timeline configuration lookups

**Implementation**: `Map<string, IResolvedTimelineConfiguration>`

**Initialization**: Built once during `_createTimelineLookup()`

**Lookup**: `this._timelineLookupCache.get(uri)` replaces `array.find()`

### B. Contracts

**File**: `contracts/` (empty - no API contracts for refactoring work)

This initiative doesn't add new APIs. All changes are internal refactoring.

### C. Quickstart Guide

**File**: `quickstart.md`

```markdown
# Quickstart: Implementing Codebase Improvements

## Prerequisites
- Node.js >=20
- All existing tests passing (`npm test`)
- Clean working directory

## Implementation Order

### Phase 1: Test Infrastructure (US1-US2)
1. Add BaseController tests first (defines contract)
2. Add controller tests in priority order:
   - LottieController (most complex)
   - NavigationController
   - ProgressBarController, RoutingController, SubtitlesController
3. Add missing operation tests (remove-element, remove-controller-from-element)
4. Verify: `npm run coverage` shows ≥90% for controllers/operations

### Phase 2: Code Deduplication (US3)
1. Create removeProperties helper with tests (TDD)
2. Refactor 3-5 operations as proof of concept
3. Verify existing tests still pass
4. Refactor remaining 23+ operations
5. Verify: `npm test` passes, ~150 lines removed

### Phase 3: Performance Optimization (US4)
1. Add performance benchmarks (establish baseline)
2. Optimize timeline setup (single loop)
3. Add timeline lookup cache
4. Convert recursive execution to iterative
5. Verify: Benchmarks show ≥50% improvement, all tests pass

### Phase 4: Controller Standardization (US5)
1. Create BaseController with tests (TDD)
2. Refactor EventListenerController to extend BaseController
3. Verify tests pass
4. Refactor remaining 6 controllers
5. Verify: All controller tests pass, memory leak tests pass

### Phase 5: Type Safety (US6)
1. Add type guards and interfaces for eligius-engine.ts
2. Run typecheck after each change
3. Refactor merge-operation-data.ts with generic types
4. Verify: `npm run typecheck` passes, tests pass, 'any' usage reduced

### Phase 6: Additional Optimizations (US7-US9)
1. Optimize LottieController string replacement (regex-based)
2. Fix memory leak in resolve-property-values (WeakSet or proper cleanup)
3. Fix event listener binding (consistent references)
4. Add memory leak detection tests
5. Verify: Benchmarks show improvements, leak tests pass

## Running Tests
```bash
npm test                 # Run all tests
npm run coverage         # Check coverage (must be ≥90%)
npm run typecheck        # Verify TypeScript compilation
npm run fix              # Run Biome auto-fix
```

## Success Criteria
- All existing tests pass (100% pass rate)
- Coverage ≥90% (excluding src/build/, src/tools/)
- Performance benchmarks show ≥50% improvement
- Zero 'any' type errors in refactored files
- Memory leak tests pass
```

## Phase 2: Agent Context Update

**Action**: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

**Updates**: No new technologies added (refactoring work only). CLAUDE.md already contains:
- TypeScript 5.9.3
- Vitest 3.2.4
- Biome 2.3.2
- Testing guidelines
- Operation patterns
- Controller patterns

**Post-Completion Update Required**: After implementation, update CLAUDE.md with:
- New removeProperties helper pattern
- New BaseController base class pattern
- Performance optimization patterns
- Type guard patterns for 'any' elimination

## Summary

This plan addresses technical debt systematically through 9 user stories organized into test coverage (P1), code quality (P2), and optimization (P3). All work maintains backward compatibility verified by existing tests. The initiative requires no new dependencies and follows constitutional requirements including test-first development, 90% coverage, and Context7 research for library patterns.

**Next Steps**:
1. Execute Phase 0 research using Context7 for Vitest, TypeScript, jQuery patterns
2. Generate data-model.md with helper/class designs
3. Generate quickstart.md with implementation guide
4. Run `/speckit.tasks` to generate detailed task breakdown
5. Begin implementation following test-first workflow

**Estimated Effort**: 3-4 weeks for all 9 user stories (per original analysis)
