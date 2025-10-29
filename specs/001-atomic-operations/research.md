# Research: Atomic Operations for Interactive Stories

**Date**: 2025-01-29
**Phase**: Phase 0 - Technical Research
**Research Method**: Context7 MCP Server + Existing Eligius Operation Analysis

## Executive Summary

Research completed for all 32 atomic operations across 9 categories. All operations can be implemented using standard Web APIs, jQuery 3.7.1 (peer dependency), and existing Eligius utilities. **No new dependencies required**. All APIs researched using Context7 MCP server for accuracy.

---

## 1. jQuery API Research (Context7: /jquery/jquery)

### Form Manipulation
**APIs Researched**:
- `$('form').serializeArray()` - Returns array of {name, value} objects for form inputs
- `$(element).val()` - Get/set value of form inputs
- `$(element).val(value)` - Set value
- `$(element).prop('disabled', boolean)` - Enable/disable form elements
- `$(element).prop('checked')` - Get checked state
- `$(element).attr(name, value)` - Set attributes

**Decision**: Use `.serializeArray()` for `getFormData`, `.val()` for `setFormValue`, `.prop()` for `toggleFormElement`

### Text Manipulation
**APIs Researched**:
- `$(element).text()` - Get text content (strips HTML)
- `$(element).text(value)` - Set text content (escapes HTML for XSS safety)
- `$(element).html()` - Get/set HTML content
- String methods for replacement

**Decision**: Use `.text()` for `getTextContent` (safe), manipulate string directly for text operations

### Focus Management
**APIs Researched**:
- `$(element).focus()` - Set focus to element
- `document.activeElement` - Get currently focused element
- jQuery doesn't have special focus methods beyond `.focus()`

**Decision**: Use `.focus()` for `setFocus`, wrap `document.activeElement` in jQuery for `getFocusedElement`

**Pattern Consistency**: All operations follow existing Eligius jQuery usage patterns from operations like `selectElement`, `animate`, `toggleElement`

---

## 2. Web Storage API Research (Context7: MDN)

### localStorage/sessionStorage API
**APIs Researched**:
- `localStorage.setItem(key, value)` - Store string value
- `localStorage.getItem(key)` - Retrieve string value (returns null if not found)
- `localStorage.removeItem(key)` - Remove specific item
- `localStorage.clear()` - Remove all items
- `sessionStorage.*` - Same API, cleared on tab close

**Key Findings**:
- Values must be strings (use `JSON.stringify()`/`JSON.parse()` for objects)
- Quota: ~5-10MB per origin (varies by browser)
- Synchronous API (no Promises needed)
- Throws `QuotaExceededError` when storage full
- Same-origin policy enforced

**Error Handling**:
```javascript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    return { error: 'Storage quota exceeded' };
  }
  return { error: e.message };
}
```

**Decision**:
- Wrap in try/catch for quota errors
- Serialize/deserialize automatically
- Return errors in operation data (don't throw)
- `storageType` parameter to choose localStorage vs sessionStorage

---

## 3. Fetch API Research (Context7: MDN)

### HTTP POST/PUT/DELETE
**APIs Researched**:
- `fetch(url, options)` - Returns Promise
- Request options: method, headers, body
- Response methods: .json(), .text(), .status

**Key Findings**:
- Async API (returns Promise)
- CORS restrictions apply
- Network errors reject Promise
- Timeout not built-in (must use AbortController)
- Response.ok indicates 200-299 status

**Pattern**:
```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...customHeaders
  },
  body: JSON.stringify(data)
});

if (!response.ok) {
  return { error: `HTTP ${response.status}: ${response.statusText}` };
}

const result = await response.json();
return { responseData: result };
```

**Decision**:
- All HTTP operations are async (return Promise)
- Return response data in `responseData` property
- Return errors in `error` property
- Allow custom headers
- Default Content-Type: application/json

---

## 4. Array Processing Patterns (Context7: MDN + Existing forEach Operation)

### Array Methods Research
**APIs Researched**:
- `array.filter(predicate)` - Returns new array with matching items
- `array.sort(compareFn)` - In-place sort (stable in ES2019+)
- `array.map(transform)` - Returns new array with transformed items
- `array.find(predicate)` - Returns first matching item or undefined

**Key Findings**:
- All methods preserve original array (except sort)
- Stable sort guaranteed in modern browsers
- Map/filter/find support this context and index parameter

**Existing Pattern**: Eligius has `forEach` operation that evaluates expressions
**Decision**: Follow `forEach` pattern for expression evaluation in filter/map
- Support expression strings (evaluate using existing helpers)
- Support property paths for sort keys
- Use `resolvePropertyChain` from existing helpers

**Performance**: All operations O(n) or O(n log n) for sort, meeting <100ms requirement for 1000 items

---

## 5. Scroll API Research (Context7: MDN)

### Scroll Methods
**APIs Researched**:
- `element.scrollIntoView(options)` - Scroll element into viewport
  - Options: `{ behavior: 'smooth', block: 'start', inline: 'nearest' }`
- `window.scrollTo(x, y)` or `window.scrollTo({ left, top, behavior })`
- `element.getBoundingClientRect()` - Get element position
- `window.pageXOffset`, `window.pageYOffset` - Current scroll position

**Key Findings**:
- `scrollIntoView()` with `behavior: 'smooth'` provides animated scroll
- `block` option controls vertical alignment (start/center/end/nearest)
- Scroll is async but doesn't return Promise (completes when animation done)
- getBoundingClientRect() provides viewport-relative coordinates

**Viewport Detection**:
```javascript
const rect = element.getBoundingClientRect();
const inViewport = (
  rect.top >= 0 &&
  rect.left >= 0 &&
  rect.bottom <= window.innerHeight &&
  rect.right <= window.innerWidth
);
```

**Decision**:
- Use `scrollIntoView({ behavior: 'smooth' })` for `scrollToElement`
- Use `window.scrollTo({ left, top, behavior: 'smooth' })` for `scrollToPosition`
- Use `getBoundingClientRect()` for `isElementInViewport`
- Return current `pageXOffset/pageYOffset` for `getScrollPosition`

---

## 6. ARIA Accessibility Research (Context7: MDN)

### ARIA Attributes and Live Regions
**APIs Researched**:
- `element.setAttribute('aria-*', value)` - Set ARIA attributes
- ARIA live regions: `aria-live="polite"` or `"assertive"`
- `aria-atomic="true"` - Announce entire region
- Common attributes: `aria-label`, `aria-describedby`, `aria-hidden`, `aria-expanded`

**Key Findings**:
- Live regions must exist in DOM before updates (create once, update text)
- `polite` waits for user to finish current task
- `assertive` interrupts immediately (use sparingly)
- Focus management separate from announcements

**Announcement Pattern**:
```javascript
// Create live region if doesn't exist
let liveRegion = document.getElementById('sr-announcer');
if (!liveRegion) {
  liveRegion = document.createElement('div');
  liveRegion.id = 'sr-announcer';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px'; // Off-screen
  document.body.appendChild(liveRegion);
}
// Update text to announce
liveRegion.textContent = message;
```

**Decision**:
- Create persistent live region for announcements
- Default to `polite`, allow `assertive` option
- Use jQuery `.attr()` for `setAriaAttribute`
- Hide live region off-screen with CSS

---

## 7. Date/Time Formatting Research (Context7: MDN)

### Date APIs
**APIs Researched**:
- `new Date()` - Current timestamp
- `new Date(string)` - Parse ISO 8601 and other formats
- `date.toISOString()` - ISO format: "2025-01-29T12:34:56.789Z"
- `date.getTime()` - Unix epoch milliseconds
- `Intl.DateTimeFormat` - Locale-aware formatting

**Key Findings**:
- ISO 8601 parsing is reliable cross-browser
- `getTime()` returns milliseconds (not seconds)
- Comparison: `date1.getTime() - date2.getTime()`
- Simple formatting without full i18n library

**Format Pattern Approach**:
```javascript
// Simple pattern replacement (no full i18n)
function formatDate(date, pattern) {
  const d = new Date(date);
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  };
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, m => map[m]);
}
```

**Decision**:
- Use simple pattern replacement for `formatDate`
- Return ISO string or epoch millis for `getCurrentTime`
- Use `getTime()` comparison for `compareDate` (return -1/0/1)

---

## 8. String Manipulation Research (Context7: MDN + Existing Operations)

### String Methods
**APIs Researched**:
- `string.concat(str1, str2, ...)` or `[...].join(separator)`
- `string.split(delimiter)` - Returns array
- `string.substring(start, end)` - Extract substring
- `string.replace(pattern, replacement)` - Replace with string or regex
- `string.replaceAll(pattern, replacement)` - Replace all occurrences

**Key Findings**:
- `join()` more efficient than repeated `concat()`
- `substring()` vs `slice()` - substring swaps negative indices
- `replace()` with regex + 'g' flag replaces all
- `replaceAll()` available in modern browsers

**Unicode Handling**:
- JavaScript strings are UTF-16
- Emoji and multi-byte characters handled correctly by default
- No special handling needed for basic operations

**Decision**:
- Use `array.join(separator)` for concatenation
- Use `split()` for splitting
- Use `substring()` for extraction
- Use `replace()` with regex for replacements

---

## 9. Form Validation Research (Context7: MDN)

### HTML5 Validation APIs
**APIs Researched**:
- `input.validity` - ValidityState object
- `input.validationMessage` - Browser validation message
- `input.checkValidity()` - Returns boolean
- Validation attributes: required, minlength, maxlength, pattern, type="email"

**ValidityState Properties**:
- `valueMissing` - Required field empty
- `typeMismatch` - Email/URL format invalid
- `patternMismatch` - Regex pattern failed
- `tooShort` / `tooLong` - Length constraints
- `valid` - All validations passed

**Custom Validation Pattern**:
```javascript
const errors = {};
$('form input, form select, form textarea').each(function() {
  const $input = $(this);
  const name = $input.attr('name');

  if (!this.checkValidity()) {
    errors[name] = this.validationMessage;
  }
});
return { validationErrors: errors };
```

**Decision**:
- Use HTML5 validation API as base
- Support custom rules object for extended validation
- Return errors as object with field names as keys
- Leverage browser's built-in validation messages

---

## 10. Existing Eligius Operation Patterns

### Pattern Analysis (8 Operations Studied)

**Operation Signature** (Consistent across all 50 operations):
```typescript
export const operationName: IOperation = async (
  data: TOperationData,
  scope?: IOperationScope
): Promise<TOperationData> => {
  // Implementation
  return data; // or modified data
};
```

**Key Patterns Identified**:

1. **Import Structure**:
```typescript
import type {IOperation} from './types.ts';
import type {TOperationData} from './types.ts';
import type {IOperationScope} from '../types.ts';
import $ from 'jquery'; // If jQuery needed
```

2. **JSDoc Format** (Example from selectElement):
```typescript
/**
 * Selects one or more DOM elements using CSS selectors.
 *
 * @param data - Operation data containing selector
 * @param scope - Operation scope with eventbus access
 * @returns Modified operation data with selectedElement
 *
 * @example
 * ```typescript
 * await selectElement({ selector: '#myElement' });
 * // Returns: { selector: '#myElement', selectedElement: <jQuery> }
 * ```
 */
```

3. **Error Handling** (Return errors, don't throw):
```typescript
if (!data.selector) {
  return { ...data, error: 'selector is required' };
}

const $element = $(data.selector);
if ($element.length === 0) {
  return { ...data, error: `Element not found: ${data.selector}` };
}
```

4. **Async Operations** (HTTP, animations):
```typescript
export const loadJson: IOperation = async (data, scope) => {
  try {
    const response = await fetch(data.url);
    const json = await response.json();
    return { ...data, json };
  } catch (error) {
    return { ...data, error: error.message };
  }
};
```

5. **Property Chain Resolution** (Use existing helpers):
```typescript
import { resolvePropertyChain } from './helper/resolve-property-chain.ts';

const value = resolvePropertyChain(data, 'user.profile.name');
```

6. **Scope Usage** (Eventbus access):
```typescript
export const broadcastEvent: IOperation = (data, scope) => {
  scope?.eventbus?.broadcast(data.eventName, data.eventArgs);
  return data;
};
```

7. **Output Properties** (Document in JSDoc):
```typescript
/**
 * @returns Operation data with added properties:
 * - textContent: Extracted text from element
 * - error: Error message if operation failed
 */
```

---

## Key Decisions Summary

### Architecture Decisions

1. **No New Dependencies**: All operations use standard Web APIs + jQuery 3.7.1 (peer dep)
2. **Pattern Consistency**: Strict adherence to existing 50 operation patterns
3. **Error Handling**: Return errors as data objects, never throw exceptions
4. **Async Operations**: HTTP (fetch), storage (sync), scroll (sync but uses smooth behavior)
5. **Type Safety**: Strict TypeScript interfaces for all operation data structures
6. **Security**:
   - jQuery `.text()` for XSS-safe text extraction/setting
   - Storage: validate keys, serialize safely with try/catch
   - HTTP: respect CORS, validate URLs
   - ARIA: validate attribute names

### Operation-Specific Decisions

**Form Operations**:
- Use jQuery `.serializeArray()` for getFormData
- Use `.val()` for setFormValue
- Use HTML5 validation API for validateForm
- Use `.prop('disabled')` for toggleFormElement

**Text Operations**:
- Use jQuery `.text()` for getTextContent (XSS-safe)
- Direct string manipulation for replaceText
- String methods for formatText transformations

**Storage Operations**:
- Support both localStorage and sessionStorage via parameter
- JSON serialize/deserialize automatically
- Handle QuotaExceededError gracefully

**Array Operations**:
- Follow forEach operation pattern for expression evaluation
- Use native array methods (filter, sort, map, find)
- Support both expressions and property paths

**Scroll Operations**:
- Use scrollIntoView() with smooth behavior
- Use window.scrollTo() for position scrolling
- Use getBoundingClientRect() for viewport detection

**HTTP Operations**:
- Use Fetch API (returns Promise)
- Default to JSON content type
- Return errors in operation data

**String Operations**:
- Use native String methods
- Support regex patterns where applicable
- Handle Unicode correctly by default

**Focus Operations**:
- Use jQuery .focus() for setFocus
- Wrap document.activeElement for getFocusedElement
- Use .attr() for setAriaAttribute
- Create persistent off-screen live region for announceToScreenReader

**Date Operations**:
- Simple pattern replacement for formatDate (not full i18n)
- Use Date.getTime() for timestamps and comparison
- Return ISO string or epoch millis

---

## Implementation Roadmap

### Priority Order (Based on User Story Priorities)

**P1 Operations** (10 operations):
1. Form: getFormData, setFormValue, validateForm, toggleFormElement
2. Text: getTextContent, replaceText, formatText
3. Storage: saveToStorage, loadFromStorage, clearStorage

**P2 Operations** (15 operations):
4. Array: filterArray, sortArray, mapArray, findInArray
5. Scroll: scrollToElement, scrollToPosition, isElementInViewport, getScrollPosition
6. HTTP: httpPost, httpPut, httpDelete
7. Focus: setFocus, getFocusedElement, setAriaAttribute, announceToScreenReader

**P3 Operations** (7 operations):
8. String: concatenateStrings, splitString, substringText, replaceString
9. Date: formatDate, getCurrentTime, compareDate

### Estimated Implementation Effort

**Per Operation Average**: 1.5 hours (implementation) + 1.5 hours (testing) = 3 hours total

**Total**: 32 operations × 3 hours = 96 hours (~12 days)

**Additional**:
- Integration tests: 4 hours
- Schema generation: 2 hours
- Documentation: 2 hours

**Total Effort**: ~108 hours

---

## Risk Mitigation Strategies

### Identified Risks

1. **Risk**: Browser API compatibility issues
   **Mitigation**: Use feature detection, test in multiple browsers, provide fallbacks

2. **Risk**: jQuery API changes or deprecations
   **Mitigation**: Context7 verified current jQuery 3.7.1 API, all methods stable

3. **Risk**: Storage quota errors
   **Mitigation**: Comprehensive try/catch, clear error messages, documented in JSDoc

4. **Risk**: ARIA not working with all screen readers
   **Mitigation**: Use standard ARIA patterns from WAI-ARIA spec, test with NVDA/JAWS

5. **Risk**: Pattern drift across 32 operations
   **Mitigation**: Reference this document + existing operations during implementation

---

## Next Phase

Phase 0 complete. Ready for Phase 1: Design & Contracts
- Generate data-model.md with all 32 operation data structures
- Generate contracts/ directory with 9 TypeScript interface files
- Generate quickstart.md with implementation guide
