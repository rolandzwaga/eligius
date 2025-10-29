# Quickstart Guide: Implementing Atomic Operations

**Feature**: 001-atomic-operations
**Created**: 2025-10-29
**Purpose**: Roadmap for implementing 32 atomic operations for interactive stories

---

## Implementation Overview

This guide provides a roadmap for implementing 32 new atomic operations across 9 categories. All operations follow existing Eligius patterns and require test-first development (RED-GREEN-REFACTOR cycle).

**Total Scope**:
- 32 operations across 9 categories
- ~3200 lines of implementation code
- ~3200 lines of test code (1:1 ratio)
- 90% test coverage requirement
- Zero new production dependencies

---

## Implementation Priority Order

### Phase 1: P1 Operations (MVP) - 10 operations

**Priority**: HIGHEST - Core interactive storytelling features

1. **Form Operations** (4 operations) - User Story 1
   - `getFormData` - Extract form values
   - `setFormValue` - Set input values
   - `validateForm` - Validate with rules
   - `toggleFormElement` - Enable/disable inputs

2. **Text Operations** (3 operations) - User Story 2
   - `getTextContent` - Extract text (XSS-safe)
   - `replaceText` - Find and replace
   - `formatText` - Transform text (uppercase, lowercase, etc.)

3. **Storage Operations** (3 operations) - User Story 3
   - `saveToStorage` - Save to localStorage/sessionStorage
   - `loadFromStorage` - Load from storage
   - `clearStorage` - Clear storage data

**Checkpoint**: After P1, creators can build functional quizzes with progress persistence

---

### Phase 2: P2 Operations (Enhanced Features) - 15 operations

**Priority**: MEDIUM - Rich interactivity and accessibility

4. **Array Operations** (4 operations) - User Story 4
   - `filterArray` - Filter by criteria
   - `sortArray` - Sort by property
   - `mapArray` - Transform items
   - `findInArray` - Find matching item

5. **Scroll Operations** (4 operations) - User Story 5
   - `scrollToElement` - Smooth scroll to element
   - `scrollToPosition` - Scroll to X/Y coordinates
   - `isElementInViewport` - Check visibility
   - `getScrollPosition` - Get current position

6. **HTTP Operations** (3 operations) - User Story 6
   - `httpPost` - POST request
   - `httpPut` - PUT request
   - `httpDelete` - DELETE request

7. **Focus Operations** (4 operations) - User Story 8
   - `setFocus` - Move keyboard focus
   - `getFocusedElement` - Get focused element
   - `setAriaAttribute` - Set ARIA attributes
   - `announceToScreenReader` - ARIA live announcements

**Checkpoint**: After P2, full interactive features + accessibility support

---

### Phase 3: P3 Operations (Advanced Features) - 7 operations

**Priority**: LOWER - Advanced text and date manipulation

8. **String Operations** (4 operations) - User Story 7
   - `concatenateStrings` - Join strings
   - `splitString` - Split by delimiter
   - `substringText` - Extract substring
   - `replaceString` - Replace with regex

9. **Date Operations** (3 operations) - User Story 9
   - `formatDate` - Format with pattern
   - `getCurrentTime` - Get timestamp
   - `compareDate` - Compare two dates

**Checkpoint**: After P3, all 32 operations complete

---

## Per-Operation Development Workflow

Each operation follows this strict sequence:

### 1. **RED** - Write Failing Test First

**Time**: ~45 minutes per operation

```typescript
// Example: src/test/unit/operation/get-form-data.spec.ts
import {describe, test, expect, beforeEach} from 'vitest';
import {getFormData} from '../../../operation/get-form-data.ts';

describe('getFormData', () => {
  beforeEach(() => {
    // Setup DOM fixtures
  });

  test('extracts form field values into object', () => {
    // Arrange
    const formHTML = '<form><input name="email" value="test@example.com"/></form>';
    document.body.innerHTML = formHTML;

    // Act
    const result = getFormData({selector: 'form'});

    // Assert
    expect(result.formData).toEqual({email: 'test@example.com'});
  });

  test('returns error for non-form element', () => {
    document.body.innerHTML = '<div id="notform"></div>';
    const result = getFormData({selector: '#notform'});
    expect(result.error).toBeDefined();
  });
});
```

**Verify test FAILS** before proceeding to implementation.

---

### 2. **GREEN** - Implement Minimum Code

**Time**: ~45 minutes per operation

```typescript
// Example: src/operation/get-form-data.ts
import type {IOperation} from './types.ts';
import type {TOperationData} from './types.ts';
import $ from 'jquery';

/**
 * Extracts all input, select, and textarea values from form element.
 *
 * @param data - Operation data containing selector or selectedElement
 * @param scope - Operation scope (not used)
 * @returns Modified operation data with formData object
 *
 * @example
 * ```typescript
 * await getFormData({selector: '#myForm'});
 * // Returns: {selector: '#myForm', formData: {name: 'John', email: 'john@example.com'}}
 * ```
 */
export const getFormData: IOperation = async (data: TOperationData) => {
  const $element = data.selectedElement || $(data.selector);

  if ($element.length === 0) {
    return {...data, error: `Element not found: ${data.selector}`};
  }

  if (!$element.is('form')) {
    return {...data, error: 'Element must be a form'};
  }

  const formArray = $element.serializeArray();
  const formData: Record<string, any> = {};

  for (const field of formArray) {
    formData[field.name] = field.value;
  }

  return {...data, formData};
};
```

**Key Patterns**:
- Accept `operationData` parameter
- Check for `selectedElement` or use `selector`
- Return errors as `{error: 'message'}`, never throw
- Return modified data with output properties
- Include comprehensive JSDoc with @param, @returns, @example

---

### 3. **REFACTOR** - Improve Quality

**Time**: ~20 minutes per operation

- Extract reusable helpers if needed
- Improve variable names
- Add edge case handling
- Optimize performance
- Keep tests green

---

### 4. **Quality Gate** - Verify

**Time**: ~10 minutes per operation

```bash
npm run lint       # Auto-fix code style issues
npm run format     # Format with Biome
npm run typecheck  # Verify type correctness
npm test          # Run all tests (ensure green)
```

**All checks must pass** before moving to next operation.

---

## Technical Patterns Reference

### Pattern 1: jQuery Element Selection

```typescript
const $element = data.selectedElement || $(data.selector);

if ($element.length === 0) {
  return {...data, error: `Element not found: ${data.selector}`};
}
```

Always support both `selector` and `selectedElement` for flexibility.

---

### Pattern 2: Error Handling

```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
  return {...data, success: true};
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    return {...data, error: 'Storage quota exceeded'};
  }
  return {...data, error: e.message};
}
```

**Never throw** - always return errors in operation data.

---

### Pattern 3: Async Operations

```typescript
export const httpPost: IOperation = async (data: TOperationData) => {
  try {
    const response = await fetch(data.url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...data.headers},
      body: JSON.stringify(data.data)
    });

    if (!response.ok) {
      return {...data, error: `HTTP ${response.status}: ${response.statusText}`};
    }

    const responseData = await response.json();
    return {...data, responseData, status: response.status, success: true};
  } catch (error) {
    return {...data, error: error.message};
  }
};
```

Return Promises for async operations (HTTP, animations with callbacks).

---

### Pattern 4: Expression Evaluation (Array Operations)

```typescript
// Follow existing forEach operation pattern
import {resolvePropertyChain} from './helper/resolve-property-chain.ts';

export const filterArray: IOperation = async (data: TOperationData) => {
  const array = resolvePropertyChain(data, data.arrayPropertyPath);

  if (!Array.isArray(array)) {
    return {...data, error: 'Property is not an array'};
  }

  const filtered = array.filter(item => {
    // Evaluate expression or call function
    if (data.filterFunction) {
      return data.filterFunction(item);
    }
    // ... expression evaluation logic
  });

  return {...data, filteredArray: filtered, filteredCount: filtered.length};
};
```

---

## Testing Patterns

### Unit Test Structure

```typescript
import {describe, test, expect, beforeEach, afterEach} from 'vitest';

describe('operationName', () => {
  beforeEach(() => {
    // Setup: Create DOM fixtures, mock data
    document.body.innerHTML = '<div id="test"></div>';
  });

  afterEach(() => {
    // Cleanup: Clear DOM, reset mocks
    document.body.innerHTML = '';
  });

  test('performs primary function successfully', () => {
    // Arrange, Act, Assert
  });

  test('returns error for invalid input', () => {
    // Test error paths
  });

  test('handles edge cases correctly', () => {
    // Test boundaries, empty values, etc.
  });
});
```

---

### Coverage Requirements

Each operation test file must achieve **90% coverage**:

```bash
npm run coverage
# Check coverage/index.html for per-file results
```

If coverage < 90%, add tests for:
- Error paths
- Edge cases
- Conditional branches
- Early returns

---

## Integration Testing

After all operations complete, create integration test:

**File**: `src/test/integration/atomic-operations-chains.spec.ts`

**Purpose**: Test operation chaining across categories

```typescript
test('quiz flow: form + storage + validation', async () => {
  // 1. User fills form
  const formResult = await getFormData({selector: '#quiz'});

  // 2. Validate answers
  const validResult = await validateForm({...formResult});

  // 3. Save to storage
  const saveResult = await saveToStorage({
    ...validResult,
    storageType: 'local',
    key: 'quiz-answers',
    data: formResult.formData
  });

  expect(saveResult.success).toBe(true);
});
```

---

## Schema Generation

After all operations implemented:

```bash
# Auto-generate metadata from JSDoc comments
npm run metadata

# Regenerate JSON schema with all 32 operations
npm run generate-schema

# Verify schema validates correctly
npm run docs
```

**Critical**: Metadata files are **AUTO-GENERATED** from JSDoc. Do NOT create them manually.

---

## Documentation Updates

### 1. Update Operation Index

**File**: `src/operation/index.ts`

```typescript
// Form operations
export {getFormData} from './get-form-data.ts';
export {setFormValue} from './set-form-value.ts';
export {validateForm} from './validate-form.ts';
export {toggleFormElement} from './toggle-form-element.ts';

// Text operations
export {getTextContent} from './get-text-content.ts';
// ... etc for all 32 operations
```

---

### 2. Update Operation README

**File**: `src/operation/README.md`

Add new sections for each operation category with brief descriptions.

---

### 3. Generate TypeDoc

```bash
npm run typedoc
# Updates docs/ with API documentation
```

---

## Estimated Timeline

### Single Developer (Sequential)

- **Phase 1 (P1)**: 10 operations × 2 hours = 20 hours (2.5 days)
- **Phase 2 (P2)**: 15 operations × 2 hours = 30 hours (3.75 days)
- **Phase 3 (P3)**: 7 operations × 2 hours = 14 hours (1.75 days)
- **Integration**: 4 hours (0.5 days)
- **Documentation**: 2 hours (0.25 days)
- **Total**: ~70 hours (~9 days at 8 hours/day)

### Parallel Team (3 developers)

- **Setup**: 2 hours (sequential)
- **P1 Operations**: 20 hours / 3 = ~7 hours (1 day)
- **P2 Operations**: 30 hours / 3 = ~10 hours (1.5 days)
- **P3 Operations**: 14 hours / 3 = ~5 hours (0.75 days)
- **Integration**: 4 hours (sequential)
- **Documentation**: 2 hours (sequential)
- **Total**: ~30 hours (~4 days at 8 hours/day)

---

## Quality Assurance Checklist

Before marking feature complete:

- [ ] All 408+ tests passing (existing + 32 new operation tests)
- [ ] 90%+ coverage across all operations
- [ ] Zero TypeScript errors (`npm run typecheck`)
- [ ] Zero linting errors (`npm run lint`)
- [ ] All JSDoc comments complete with examples
- [ ] Metadata auto-generated successfully (`npm run metadata`)
- [ ] JSON schema regenerated (`npm run generate-schema`)
- [ ] Integration tests passing
- [ ] Edge cases tested (see tasks.md T118 for comprehensive list)
- [ ] Performance validated (SC-002, SC-004, SC-008, SC-009)
- [ ] Security audit passed (XSS prevention, CORS, storage validation)
- [ ] CHANGELOG.md updated
- [ ] Examples created for quiz, inventory, and scroll patterns

---

## Common Pitfalls to Avoid

1. **DON'T** write implementation before tests (violates Constitution Principle I)
2. **DON'T** throw exceptions - always return errors as data
3. **DON'T** create metadata files manually - they're auto-generated
4. **DON'T** skip quality checks - run after each operation
5. **DON'T** assume API signatures - use Context7 for jQuery/Web API research
6. **DON'T** add new dependencies without user approval
7. **DON'T** commit code with failing tests
8. **DON'T** use `any` type - use proper type narrowing
9. **DON'T** forget JSDoc examples - they're required
10. **DON'T** skip coverage verification - 90% is mandatory

---

## Success Criteria Validation

After implementation, verify all 10 success criteria:

- **SC-001**: Can build 5-question quiz in <30 minutes ✓
- **SC-002**: Quiz submission <2 seconds ✓
- **SC-003**: 100% persistence reliability ✓
- **SC-004**: Scroll <500ms with 60fps ✓
- **SC-005**: 100% error graceful handling ✓
- **SC-006**: <5 minute learning per operation ✓
- **SC-007**: 100% keyboard accessibility ✓
- **SC-008**: <100ms validation feedback ✓
- **SC-009**: <100ms array processing (1000+ items) ✓
- **SC-010**: Unicode support (emoji, international chars) ✓

---

## Resources

- **Existing Operations**: `src/operation/` (50 operations for pattern reference)
- **Test Patterns**: `src/test/unit/operation/` (existing test suites)
- **Type Definitions**: `src/operation/types.ts`
- **Helper Utilities**: `src/operation/helper/`
- **jQuery Documentation**: Use Context7 MCP server for current API
- **Vitest Documentation**: [vitest.dev](https://vitest.dev/)
- **Constitution**: `.specify/memory/constitution.md` (development principles)

---

## Getting Help

If blocked after 5 attempts (Constitution Principle XIII):
1. Document what was tried and why each failed
2. Analyze common patterns across failures
3. Formulate specific questions
4. Present findings to user
5. Wait for guidance

---

**Ready to Begin**: Start with Phase 1 (Setup), then move to Phase 2 (Foundational), then implement operations in priority order (P1 → P2 → P3).
