# Quickstart: Implementing Codebase Improvements

**Feature**: Codebase Quality Improvements
**Branch**: `001-codebase-improvements`
**Prerequisites**: Node.js >=20, all existing tests passing

---

## Prerequisites Checklist

Before starting implementation:

- [ ] Node.js >=20 installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] All existing tests pass (`npm test`)
- [ ] Clean working directory (`git status`)
- [ ] On feature branch (`git checkout 001-codebase-improvements`)

---

## Implementation Order (Test-First Workflow)

### Phase 1: Test Infrastructure (Priority 1 - Week 1)

#### Step 1.1: Add BaseController Tests

**File**: `src/test/unit/controllers/BaseController.spec.ts`

```bash
# 1. Write failing test
#    Create test file with BaseController test cases (6 tests)
# 2. Run tests - should FAIL
npm test src/test/unit/controllers/BaseController.spec.ts
# 3. Implement BaseController
#    File: src/controllers/base-controller.ts
# 4. Run tests - should PASS
npm test src/test/unit/controllers/BaseController.spec.ts
# 5. Quality checks
npm run fix && npm run typecheck
```

**Test cases** (write these FIRST):
- Test `addListener` tracks remover functions
- Test `detach` calls all removers
- Test `detach` clears listener array
- Test binding preserves 'this' context
- Test `attachMultiple` with multiple listeners
- Test no memory leaks after detach

#### Step 1.2: Add Controller Tests (Priority Order)

**LottieController** (most complex - 10 tests):
```bash
# Write failing tests FIRST
# File: src/test/unit/controllers/LottieController.spec.ts
npm test src/test/unit/controllers/LottieController.spec.ts  # Should FAIL

# Tests: init, animation loading, language changes, label replacement,
#        destroy, error handling, data serialization, URL parsing
```

**NavigationController** (10 tests):
**ProgressBarController** (6 tests):
**RoutingController** (8 tests):
**SubtitlesController** (8 tests):

**Pattern for each controller**:
1. RED: Write failing tests covering initialization, core functionality, events, cleanup
2. GREEN: Add tests incrementally (don't implement controller code yet if missing)
3. Run tests: `npm test src/test/unit/controllers/<Name>.spec.ts`
4. Fix/verify: `npm run fix && npm run typecheck`

#### Step 1.3: Add Missing Operation Tests

**remove-element** (4 tests):
```bash
# File: src/test/unit/operation/remove-element.spec.ts
npm test src/test/unit/operation/remove-element.spec.ts
```

**remove-controller-from-element** (4 tests):
```bash
# File: src/test/unit/operation/remove-controller-from-element.spec.ts
npm test src/test/unit/operation/remove-controller-from-element.spec.ts
```

#### Step 1.4: Verify Coverage

```bash
npm run coverage

# Check coverage report:
# - Controllers: ≥90% (currently 29%)
# - Operations: ≥90% (should already be ~96%)
# - Overall: ≥90% (excluding build tools)
```

**Expected outcome**: All controller tests pass, 90% coverage achieved

---

### Phase 2: Code Deduplication (Priority 2 - Week 1-2)

#### Step 2.1: Create removeProperties Helper

```bash
# 1. RED: Write failing test
# File: src/test/unit/operation/helper/remove-operation-properties.spec.ts
npm test src/test/unit/operation/helper/remove-operation-properties.spec.ts  # FAIL

# 2. GREEN: Implement helper
# File: src/operation/helper/remove-operation-properties.ts
npm test src/test/unit/operation/helper/remove-operation-properties.spec.ts  # PASS

# 3. Quality checks
npm run fix && npm run typecheck
```

**Test cases**:
- Remove 1 property
- Remove 2 properties
- Remove 5 properties
- Return type correctness (TypeScript compilation test)
- Original object mutated
- Various property types (string, number, object, array)

#### Step 2.2: Refactor Operations (Proof of Concept)

**Refactor 3-5 operations first** to validate approach:

```bash
# 1. Pick simple operations: add-class, remove-class, toggle-class
# 2. Refactor to use removeProperties helper
# 3. Run existing tests - should PASS
npm test src/test/unit/operation/add-class.spec.ts
npm test src/test/unit/operation/remove-class.spec.ts
npm test src/test/unit/operation/toggle-class.spec.ts

# 4. Verify no behavior changes
npm test  # All tests should pass
```

#### Step 2.3: Refactor Remaining 23+ Operations

**Operations to refactor**:
- animate.ts
- calc.ts
- log.ts
- select-element.ts
- set-element-attributes.ts
- set-style.ts
- ... (see analysis for full list)

**For each operation**:
1. Replace manual deletion with `removeProperties(operationData, 'prop1', 'prop2', ...)`
2. Run operation's test: `npm test src/test/unit/operation/<name>.spec.ts`
3. Verify test passes unchanged

#### Step 2.4: Verify Deduplication

```bash
# Count lines removed
git diff --stat

# Should show ~150 lines removed across operations
# Run all tests
npm test  # Should pass 100%
```

---

### Phase 3: Performance Optimization (Priority 2 - Week 2)

#### Step 3.1: Add Performance Benchmarks (Baseline)

```bash
# 1. Create performance test directory
mkdir -p src/test/unit/performance

# 2. Write benchmark tests
# File: src/test/unit/performance/timeline-benchmarks.spec.ts
npm test src/test/unit/performance/timeline-benchmarks.spec.ts

# 3. Record baseline metrics (save output)
# Example: timeline initialization ~X ms, lookup ~Y ms
```

#### Step 3.2: Optimize Timeline Setup (Single Loop)

```bash
# 1. Modify _createTimelineLookup in src/eligius-engine.ts
# 2. Run existing tests - should PASS
npm test

# 3. Run benchmarks - should show ~50% improvement
npm test src/test/unit/performance/timeline-benchmarks.spec.ts
```

**Change**:
```typescript
// Consolidate double loop into single pass
this.configuration.timelines.forEach(timelineInfo => {
  timelineInfo.timelineActions.forEach(action => {
    this._addTimelineActionStart(timelineInfo.uri, action)
    this._addTimelineActionEnd(timelineInfo.uri, action)
  })
})
```

#### Step 3.3: Add Timeline Lookup Cache

```bash
# 1. Add Map property to EligiusEngine
# 2. Initialize in _createTimelineLookup
# 3. Replace find() with get() (2 locations: lines 473, 580)
# 4. Run tests - should PASS
npm test

# 5. Run benchmarks - should show O(1) lookups
npm test src/test/unit/performance/timeline-benchmarks.spec.ts
```

#### Step 3.4: Convert Recursive Execution to Iterative

```bash
# 1. Replace _executeActions recursive method with for loop
# 2. Run tests - should PASS
npm test
```

**Change**:
```typescript
// Replace recursion with iteration
private async _executeActions(actions: IEndableAction[], methodName: 'start' | 'end') {
  for (const action of actions) {
    await action[methodName]()
  }
}
```

---

### Phase 4: Controller Standardization (Priority 3 - Week 2-3)

#### Step 4.1: Refactor EventListenerController

```bash
# 1. Extend BaseController instead of implementing IController
# 2. Replace listener management with addListener/attachMultiple
# 3. Remove detach() (inherited)
# 4. Run tests - should PASS
npm test src/test/unit/controllers/EventListenerController.spec.ts
```

#### Step 4.2: Refactor LabelController

```bash
# Same pattern as Step 4.1
npm test src/test/unit/controllers/LabelController.spec.ts
```

#### Step 4.3: Refactor Remaining 5 Controllers

Apply same pattern to:
- LottieController
- NavigationController
- ProgressBarController
- RoutingController
- SubtitlesController

**Verify after each**:
```bash
npm test src/test/unit/controllers/<Name>.spec.ts
```

---

### Phase 5: Type Safety (Priority 3 - Week 3)

#### Step 5.1: Add Type Guards for eligius-engine.ts

```bash
# 1. Create type guard functions in src/util/guards/
# 2. Replace 'any' assertions with type guards
# 3. Run typecheck after EACH change
npm run typecheck

# 4. Run tests - should PASS
npm test
```

**Locations in eligius-engine.ts**:
- Line 351: `(timelineActions as any)[key]`
- Other 'any' usages identified in analysis

#### Step 5.2: Refactor merge-operation-data.ts

```bash
# 1. Replace 'any' with generic types and discriminated union
# 2. Update callers to handle MergeResult type
# 3. Run typecheck
npm run typecheck

# 4. Run tests
npm test
```

#### Step 5.3: Verify 'any' Reduction

```bash
# Count remaining 'any' usages in core files
grep -n "as any" src/eligius-engine.ts src/operation/helper/merge-operation-data.ts

# Should show ≥50% reduction
```

---

### Phase 6: Additional Optimizations (Priority 3 - Week 3)

#### Step 6.1: Optimize LottieController String Replacement

```bash
# 1. Replace split/join loop with regex
# 2. Run tests - should PASS
npm test src/test/unit/controllers/LottieController.spec.ts

# 3. Run benchmarks - should show improvement
# (Add benchmark if not already present)
```

**Change**:
```typescript
// Replace O(n²) with O(n)
serialized = serialized.replace(/!!(\w+)!!/g, (_, id) =>
  this.labelData[id]?.[this.currentLanguage] || ''
)
```

#### Step 6.2: Fix Memory Leaks

**resolve-property-values cache**:
```bash
# 1. Use WeakSet or ensure proper cleanup in finally block
# 2. Run memory leak tests
npm test src/test/unit/performance/memory-leak-detection.spec.ts
```

**Event listener binding**:
```bash
# 1. Already fixed by BaseController refactoring
# 2. Verify with memory leak tests
npm test src/test/unit/performance/memory-leak-detection.spec.ts
```

#### Step 6.3: Add Memory Leak Detection Tests

```bash
# File: src/test/unit/performance/memory-leak-detection.spec.ts
npm test src/test/unit/performance/memory-leak-detection.spec.ts

# Requires --expose-gc flag:
node --expose-gc node_modules/vitest/vitest.mjs
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/test/unit/controllers/LottieController.spec.ts

# Run with coverage
npm run coverage

# Run type checking
npm run typecheck

# Run linting and formatting
npm run fix

# Run all quality checks
npm run fix && npm run typecheck && npm test
```

---

## Verification Checklist

After completing ALL phases:

- [ ] All existing tests pass (`npm test`) - 100% pass rate
- [ ] Coverage ≥90% (`npm run coverage`) - excluding build tools
- [ ] Type checking passes (`npm run typecheck`) - no errors
- [ ] Linting passes (`npm run lint`) - no errors
- [ ] ~150 lines removed (property deletion duplication)
- [ ] Timeline initialization ≥50% faster (benchmarks)
- [ ] Timeline lookups are O(1) (benchmarks)
- [ ] LottieController label replacement ≥50% faster (benchmarks)
- [ ] 'any' usage reduced by ≥50% in core files (grep count)
- [ ] Memory leak tests pass
- [ ] All controllers extend BaseController
- [ ] All operations use removeProperties helper

---

## Success Criteria

✅ All existing tests pass (100% pass rate)
✅ Coverage ≥90% (excluding src/build/, src/tools/)
✅ Performance benchmarks show ≥50% improvement
✅ Zero 'any' type errors in refactored files
✅ Memory leak tests pass
✅ Code reduced by ~150 lines
✅ All quality checks pass

---

## Common Issues & Solutions

**Issue**: Tests fail after refactoring
**Solution**: Ensure `removeProperties` returns the same object (mutation), not a new object

**Issue**: Type errors after removing 'any'
**Solution**: Add proper type guard functions, don't just replace with assertions

**Issue**: Benchmarks don't show improvement
**Solution**: Ensure enough iterations, check for correctness first (passing tests)

**Issue**: Memory leak tests fail
**Solution**: Verify all event listeners properly removed in detach(), check for closures

**Issue**: Coverage drops below 90%
**Solution**: Add missing test cases for edge cases, error conditions

---

## Next Steps

After completing all phases:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Begin implementation following this quickstart guide
3. Update CLAUDE.md with new patterns after completion
4. Create PR with all changes

**Estimated Total Effort**: 3-4 weeks for all 9 user stories
