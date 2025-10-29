# Data Model: Atomic Operations for Interactive Stories

**Feature**: 001-atomic-operations
**Created**: 2025-10-29
**Purpose**: Define operation data structures for all 32 atomic operations

---

## Overview

This document defines the TypeScript interfaces for operation data structures. Each operation follows the existing Eligius pattern:
- Input parameters via `operationData`
- Output results returned in modified `operationData`
- Operations are composable and atomic

All interfaces extend the base operation data pattern from `src/operation/types.ts`.

---

## 1. Form Operations (4 operations)

### IGetFormDataOperationData

Extracts form field values into an object.

**Input**:
- `selector` (string): CSS selector for form element
- `selectedElement` (jQuery, optional): Pre-selected form element

**Output**:
- `formData` (object): Field names as keys, values as values
- `error` (string, optional): Error message if operation failed

### ISetFormValueOperationData

Sets value of a form input element.

**Input**:
- `selector` (string): CSS selector for input/select/textarea
- `selectedElement` (jQuery, optional): Pre-selected element
- `value` (string | number | boolean): Value to set

**Output**:
- `error` (string, optional): Error message if operation failed

### IValidateFormOperationData

Validates form fields against rules.

**Input**:
- `selector` (string): CSS selector for form element
- `selectedElement` (jQuery, optional): Pre-selected form
- `validationRules` (object, optional): Custom validation rules
  - `required` (boolean): Field is required
  - `minLength` (number): Minimum length
  - `maxLength` (number): Maximum length
  - `pattern` (string | RegExp): Regex pattern to match
  - `email` (boolean): Validate as email format

**Output**:
- `validationErrors` (object): Field names as keys, error messages as values
- `isValid` (boolean): True if all fields valid
- `error` (string, optional): Error message if operation failed

### IToggleFormElementOperationData

Enables or disables form input elements.

**Input**:
- `selector` (string): CSS selector for input/select/textarea/button
- `selectedElement` (jQuery, optional): Pre-selected element
- `enabled` (boolean): True to enable, false to disable

**Output**:
- `error` (string, optional): Error message if operation failed

---

## 2. Text Operations (3 operations)

### IGetTextContentOperationData

Extracts text content from element (strips HTML).

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element

**Output**:
- `textContent` (string): Extracted text without HTML markup
- `error` (string, optional): Error message if operation failed

### IReplaceTextOperationData

Finds and replaces text within element content.

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element
- `searchPattern` (string | RegExp): Text or regex pattern to find
- `replacement` (string): Replacement text

**Output**:
- `replacedText` (string): Text after replacement
- `replacementCount` (number): Number of replacements made
- `error` (string, optional): Error message if operation failed

### IFormatTextOperationData

Transforms text using format operations.

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element
- `transformation` ('uppercase' | 'lowercase' | 'capitalize' | 'titlecase' | 'trim'): Transformation type

**Output**:
- `formattedText` (string): Transformed text
- `error` (string, optional): Error message if operation failed

---

## 3. Storage Operations (3 operations)

### ISaveToStorageOperationData

Saves data to browser storage (localStorage or sessionStorage).

**Input**:
- `storageType` ('local' | 'session'): Which storage to use
- `key` (string): Storage key
- `data` (any): Data to save (will be JSON stringified)
- `expiration` (number, optional): Expiration time in milliseconds (for localStorage only)

**Output**:
- `success` (boolean): True if saved successfully
- `error` (string, optional): Error message (e.g., QuotaExceededError)

### ILoadFromStorageOperationData

Retrieves data from browser storage.

**Input**:
- `storageType` ('local' | 'session'): Which storage to use
- `key` (string): Storage key

**Output**:
- `data` (any): Loaded data (JSON parsed), null if not found or expired
- `found` (boolean): True if key existed
- `error` (string, optional): Error message if operation failed

### IClearStorageOperationData

Removes item(s) from browser storage.

**Input**:
- `storageType` ('local' | 'session'): Which storage to use
- `key` (string, optional): Storage key to remove (null/undefined = clear all)

**Output**:
- `cleared` (boolean): True if cleared successfully
- `error` (string, optional): Error message if operation failed

---

## 4. Array Operations (4 operations)

### IFilterArrayOperationData

Filters array by condition.

**Input**:
- `arrayPropertyPath` (string): Property path to array in operation data
- `filterExpression` (string): Expression to evaluate for each item (e.g., "item.category === 'weapon'")
- `filterFunction` (function, optional): Alternative to expression - function that returns boolean

**Output**:
- `filteredArray` (array): Subset of items matching criteria
- `filteredCount` (number): Number of items in filtered array
- `error` (string, optional): Error message if operation failed

### ISortArrayOperationData

Sorts array by property or comparator.

**Input**:
- `arrayPropertyPath` (string): Property path to array in operation data
- `sortKey` (string): Property path to sort by (e.g., "score", "user.name")
- `order` ('asc' | 'desc'): Sort order (ascending or descending)
- `comparator` (function, optional): Custom comparator function

**Output**:
- `sortedArray` (array): Sorted array
- `error` (string, optional): Error message if operation failed

### IMapArrayOperationData

Transforms array items by applying transformation.

**Input**:
- `arrayPropertyPath` (string): Property path to array in operation data
- `mapExpression` (string): Expression to evaluate for each item (e.g., "item.name")
- `mapFunction` (function, optional): Alternative to expression - transformation function

**Output**:
- `mappedArray` (array): Transformed array
- `error` (string, optional): Error message if operation failed

### IFindInArrayOperationData

Finds first item matching search criteria.

**Input**:
- `arrayPropertyPath` (string): Property path to array in operation data
- `searchExpression` (string): Expression to evaluate for each item (e.g., "item.id === targetId")
- `searchFunction` (function, optional): Alternative to expression - search function

**Output**:
- `foundItem` (any): First matching item, null if not found
- `foundIndex` (number): Index of found item, -1 if not found
- `error` (string, optional): Error message if operation failed

---

## 5. Scroll Operations (4 operations)

### IScrollToElementOperationData

Smoothly scrolls to element position.

**Input**:
- `selector` (string): CSS selector for target element
- `selectedElement` (jQuery, optional): Pre-selected element
- `offset` (number, optional): Vertical offset in pixels (for sticky headers)
- `behavior` ('smooth' | 'auto', default: 'smooth'): Scroll animation behavior
- `block` ('start' | 'center' | 'end' | 'nearest', default: 'start'): Vertical alignment

**Output**:
- `scrolled` (boolean): True if scroll executed
- `error` (string, optional): Error message if operation failed

### IScrollToPositionOperationData

Scrolls to exact X/Y coordinates.

**Input**:
- `x` (number): Horizontal scroll position in pixels
- `y` (number): Vertical scroll position in pixels
- `behavior` ('smooth' | 'auto', default: 'smooth'): Scroll animation behavior

**Output**:
- `scrolled` (boolean): True if scroll executed
- `error` (string, optional): Error message if operation failed

### IIsElementInViewportOperationData

Checks if element is visible in viewport.

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element

**Output**:
- `inViewport` (boolean): True if element visible in viewport
- `error` (string, optional): Error message if operation failed

### IGetScrollPositionOperationData

Retrieves current scroll position.

**Input**: None

**Output**:
- `scrollX` (number): Horizontal scroll position in pixels
- `scrollY` (number): Vertical scroll position in pixels
- `error` (string, optional): Error message if operation failed

---

## 6. HTTP Operations (3 operations)

### IHttpPostOperationData

Sends POST request to URL.

**Input**:
- `url` (string): Target URL
- `data` (any): Data payload to send (will be JSON stringified)
- `headers` (object, optional): Custom HTTP headers
- `timeout` (number, optional): Request timeout in milliseconds

**Output**:
- `responseData` (any): Response data (JSON parsed if possible)
- `status` (number): HTTP status code
- `success` (boolean): True if 200-299 status
- `error` (string, optional): Error message if request failed

### IHttpPutOperationData

Sends PUT request to URL.

**Input**:
- `url` (string): Target URL
- `data` (any): Data payload to send (will be JSON stringified)
- `headers` (object, optional): Custom HTTP headers
- `timeout` (number, optional): Request timeout in milliseconds

**Output**:
- `responseData` (any): Response data (JSON parsed if possible)
- `status` (number): HTTP status code
- `success` (boolean): True if 200-299 status
- `error` (string, optional): Error message if request failed

### IHttpDeleteOperationData

Sends DELETE request to URL.

**Input**:
- `url` (string): Target URL
- `headers` (object, optional): Custom HTTP headers
- `timeout` (number, optional): Request timeout in milliseconds

**Output**:
- `responseData` (any): Response data (JSON parsed if possible)
- `status` (number): HTTP status code
- `success` (boolean): True if 200-299 status
- `error` (string, optional): Error message if request failed

---

## 7. String Operations (4 operations)

### IConcatenateStringsOperationData

Joins multiple string values.

**Input**:
- `strings` (array<string>): Array of strings to concatenate
- `separator` (string, optional, default: ''): Separator to insert between strings

**Output**:
- `concatenated` (string): Joined string
- `error` (string, optional): Error message if operation failed

### ISplitStringOperationData

Splits string into array.

**Input**:
- `text` (string): String to split
- `delimiter` (string | RegExp): Delimiter to split on

**Output**:
- `parts` (array<string>): Array of string parts
- `count` (number): Number of parts
- `error` (string, optional): Error message if operation failed

### ISubstringTextOperationData

Extracts substring from text.

**Input**:
- `text` (string): Source string
- `start` (number): Start index (inclusive)
- `end` (number, optional): End index (exclusive) - omit for end of string

**Output**:
- `substring` (string): Extracted substring
- `error` (string, optional): Error message if operation failed

### IReplaceStringOperationData

Replaces text using pattern.

**Input**:
- `text` (string): Source string
- `pattern` (string | RegExp): Pattern to find
- `replacement` (string): Replacement text
- `replaceAll` (boolean, default: true): Replace all occurrences or just first

**Output**:
- `result` (string): String after replacement
- `replacementCount` (number): Number of replacements made
- `error` (string, optional): Error message if operation failed

---

## 8. Focus Operations (4 operations)

### ISetFocusOperationData

Moves keyboard focus to element.

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element

**Output**:
- `focused` (boolean): True if focus set successfully
- `error` (string, optional): Error message if operation failed

### IGetFocusedElementOperationData

Returns currently focused element.

**Input**: None

**Output**:
- `focusedElement` (jQuery): Currently focused element (jQuery wrapped)
- `selector` (string): Selector for focused element (if identifiable)
- `hasFocus` (boolean): True if any element has focus
- `error` (string, optional): Error message if operation failed

### ISetAriaAttributeOperationData

Sets ARIA attribute on element.

**Input**:
- `selector` (string): CSS selector for element
- `selectedElement` (jQuery, optional): Pre-selected element
- `attribute` (string): ARIA attribute name (e.g., 'aria-label', 'aria-live')
- `value` (string | boolean | number): Attribute value

**Output**:
- `set` (boolean): True if attribute set successfully
- `error` (string, optional): Error message if operation failed

### IAnnounceToScreenReaderOperationData

Announces text to screen readers using ARIA live region.

**Input**:
- `message` (string): Text to announce
- `politeness` ('polite' | 'assertive', default: 'polite'): Announcement urgency

**Output**:
- `announced` (boolean): True if announcement triggered
- `error` (string, optional): Error message if operation failed

---

## 9. Date Operations (3 operations)

### IFormatDateOperationData

Formats date using pattern.

**Input**:
- `date` (string | number | Date): Date to format (ISO string, timestamp, or Date object)
- `format` (string): Format pattern (e.g., 'YYYY-MM-DD', 'MMM D, YYYY')
  - Supported tokens: YYYY (year), MM (month), DD (day), HH (hour), mm (minute), ss (second)

**Output**:
- `formatted` (string): Formatted date string
- `error` (string, optional): Error message if date invalid or format failed

### IGetCurrentTimeOperationData

Returns current timestamp.

**Input**:
- `format` ('iso' | 'epoch', default: 'iso'): Output format
  - 'iso': ISO 8601 string (e.g., "2025-10-29T12:34:56.789Z")
  - 'epoch': Unix epoch milliseconds (number)

**Output**:
- `timestamp` (string | number): Current timestamp in requested format
- `error` (string, optional): Error message if operation failed

### ICompareDateOperationData

Compares two dates.

**Input**:
- `date1` (string | number | Date): First date to compare
- `date2` (string | number | Date): Second date to compare

**Output**:
- `comparison` (-1 | 0 | 1): -1 if date1 < date2, 0 if equal, 1 if date1 > date2
- `difference` (number): Difference in milliseconds (date1 - date2)
- `error` (string, optional): Error message if dates invalid

---

## Cross-Cutting Concerns

### Error Handling

All operations follow the same error handling pattern:
- **NEVER throw exceptions** - always return errors in `error` property
- Errors are descriptive strings with context
- Operations continue story execution even on error
- Consumer can check `error` property to detect failures

### Type Safety

All interfaces will be defined in TypeScript contract files (`specs/001-atomic-operations/contracts/`) and follow existing patterns from `src/operation/types.ts`.

### Operation Data Flow

1. Operation receives `data: TOperationData` parameter
2. Operation reads input properties from `data`
3. Operation performs atomic action
4. Operation returns modified `data` with output properties added
5. Next operation in chain receives the modified data

This enables composable operation chains in timeline actions.

---

## Implementation Notes

- All interfaces will be created in Phase 2 (Foundational) as TypeScript contract files
- Interfaces follow existing Eligius operation patterns
- Optional properties use TypeScript `?` syntax
- All operations return modified operation data (not void)
- Operations accept both `selector` string and pre-selected `selectedElement` jQuery object for flexibility
