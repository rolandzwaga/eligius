# Feature Specification: Atomic Operations for Interactive Stories

**Feature Branch**: `001-atomic-operations`
**Created**: 2025-01-29
**Status**: Draft
**Input**: User description: "Implement comprehensive set of atomic operations for interactive stories: form operations (getFormData, setFormValue, validateForm, toggleFormElement), text operations (getTextContent, replaceText, formatText), storage operations (saveToStorage, loadFromStorage, clearStorage), array operations (filterArray, sortArray, mapArray, findInArray), scroll operations (scrollToElement, scrollToPosition, isElementInViewport, getScrollPosition), HTTP operations (httpPost, httpPut, httpDelete), string operations (concatenateStrings, splitString, substringText, replaceString), focus operations (setFocus, getFocusedElement, setAriaAttribute, announceToScreenReader), and date operations (formatDate, getCurrentTime, compareDate)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reading and Manipulating Form Data (Priority: P1)

Story creators need to build interactive quizzes, surveys, and user input forms within their stories. They must be able to read form values, set form values programmatically, validate user input, and enable/disable form controls based on story progression.

**Why this priority**: Forms are fundamental to interactive storytelling. Without form operations, creators cannot collect user input, build quizzes, or create meaningful interactions. This is the most commonly requested feature for interactive content.

**Independent Test**: Can be fully tested by creating a simple quiz story with text inputs and validation, and verifies that form data can be read, updated, and validated without any other new operations.

**Acceptance Scenarios**:

1. **Given** a story with a form containing name, email, and age fields, **When** user fills out the form and triggers a "submit" action, **Then** all form data is extracted into operation data with field names as keys
2. **Given** a story that needs to pre-fill user preferences from previous session, **When** story initializes and loads saved preferences, **Then** form fields are populated with saved values using setFormValue operation
3. **Given** a quiz form with required fields and email validation, **When** user submits with empty required field or invalid email, **Then** validation operation identifies errors and returns specific field-level error messages
4. **Given** a multi-step form where step 2 fields should be disabled until step 1 completes, **When** user completes step 1, **Then** toggleFormElement operation enables step 2 fields

---

### User Story 2 - Reading and Transforming Text Content (Priority: P1)

Story creators need to extract text from elements, search and replace text dynamically, and format text (uppercase, lowercase, trim whitespace) based on story state or user actions.

**Why this priority**: Text manipulation is essential for dynamic content generation, personalization, and text-based interactions. This enables creators to build adaptive narratives that respond to user input or story context.

**Independent Test**: Can be fully tested by creating a story that reads user's name from an input, transforms it to uppercase, and displays it in a greeting, verifying text extraction and transformation work independently.

**Acceptance Scenarios**:

1. **Given** a story element containing user-generated content, **When** creator needs to display that text in another location, **Then** getTextContent operation extracts the text without HTML markup
2. **Given** a template text with placeholder tokens like "{{username}}", **When** story needs to personalize the text, **Then** replaceText operation substitutes all occurrences of "{{username}}" with actual value
3. **Given** a user input that may have extra whitespace or inconsistent casing, **When** story processes the input, **Then** formatText operation can trim whitespace, convert to uppercase/lowercase/titlecase as needed

---

### User Story 3 - Persisting Story State Across Sessions (Priority: P1)

Story creators need to save user progress, preferences, and collected data so users can resume stories where they left off, even after closing the browser or returning days later.

**Why this priority**: Without persistence, interactive stories become frustrating. Users lose progress and must restart. This is critical for longer-form stories, educational content, and any scenario where users need to return multiple times.

**Independent Test**: Can be fully tested by creating a story that saves progress to storage on action completion, then refreshing the page and verifying progress is restored from storage.

**Acceptance Scenarios**:

1. **Given** a story tracks user's current chapter and collected items, **When** user progresses to chapter 3 and collects a key, **Then** saveToStorage operation persists this state to browser storage with unique key
2. **Given** a user returns to a story after closing browser, **When** story initializes, **Then** loadFromStorage operation retrieves saved chapter and items, restoring exact state
3. **Given** a user wants to restart a story fresh, **When** user clicks "reset progress" action, **Then** clearStorage operation removes all saved state for that story
4. **Given** a story saves sensitive user data, **When** using browser storage, **Then** operation uses sessionStorage for sensitive data (cleared on tab close) and localStorage for progress (persists across sessions)

---

### User Story 4 - Filtering and Transforming Data Collections (Priority: P2)

Story creators need to process arrays of data - filtering lists based on criteria, sorting items by properties, transforming array items, and finding specific items - to create dynamic content like inventory systems, search results, or leaderboards.

**Why this priority**: Data processing enables sophisticated interactive features. While not every story needs this, it's essential for RPG-style stories, educational content with quizzes, and any content with searchable/filterable collections.

**Independent Test**: Can be fully tested by creating a story with an inventory array, filtering it to show only "weapons" category, sorting by "power" value, and displaying results, verifying array operations work independently.

**Acceptance Scenarios**:

1. **Given** a story has an array of inventory items with category property, **When** creator wants to show only "weapon" items, **Then** filterArray operation returns subset matching category condition
2. **Given** a leaderboard array with player objects containing score property, **When** displaying high scores, **Then** sortArray operation orders players by score descending
3. **Given** an array of raw quest data objects, **When** creator needs to display quest names, **Then** mapArray operation transforms objects to extract just name property
4. **Given** an array of collectible items, **When** checking if user has specific item, **Then** findInArray operation returns first item matching search criteria or null if not found

---

### User Story 5 - Controlling Scroll Behavior (Priority: P2)

Story creators need to programmatically scroll to specific story sections, detect when elements become visible in viewport, and create scroll-based narrative transitions for cinematic storytelling effects.

**Why this priority**: Scroll control enables cinematic storytelling, smooth transitions between story sections, and scroll-triggered narrative events. Common in visual stories and parallax-style presentations.

**Independent Test**: Can be fully tested by creating a multi-section story with navigation menu that smoothly scrolls to each section when clicked, verifying scroll operations work independently.

**Acceptance Scenarios**:

1. **Given** a story with multiple chapters as separate sections, **When** user clicks "Chapter 3" in navigation, **Then** scrollToElement operation smoothly scrolls to Chapter 3 section with optional offset for sticky headers
2. **Given** a story with parallax effects that trigger at specific scroll positions, **When** creator needs to scroll to exact coordinates, **Then** scrollToPosition operation scrolls to precise X/Y coordinates
3. **Given** a story with fade-in animations for elements, **When** elements enter viewport, **Then** isElementInViewport operation detects visibility and triggers animation actions
4. **Given** a story needs to save scroll position for resume later, **When** saving progress, **Then** getScrollPosition operation returns current scroll X/Y coordinates

---

### User Story 6 - Submitting Data via HTTP Requests (Priority: P2)

Story creators need to submit form data to external APIs, update server resources, and delete data via HTTP requests to integrate stories with backend services, leaderboards, or content management systems.

**Why this priority**: HTTP operations enable integration with external systems. While loadJson (GET) exists, POST/PUT/DELETE are needed for full CRUD operations. Common for submission forms, leaderboards, and cloud-saved progress.

**Independent Test**: Can be fully tested by creating a quiz that submits answers to a test API endpoint via POST, verifying the operation sends data correctly and handles responses.

**Acceptance Scenarios**:

1. **Given** a story with quiz submission form, **When** user completes quiz, **Then** httpPost operation sends answers to scoring API and returns score in operation data
2. **Given** a story where user updates their profile, **When** user saves changes, **Then** httpPut operation updates user record on server with modified data
3. **Given** a story where user can delete saved progress from cloud, **When** user clicks "delete cloud save", **Then** httpDelete operation removes save data from server
4. **Given** any HTTP operation encounters network error, **When** request fails, **Then** operation returns error details in operation data without crashing story

---

### User Story 7 - Manipulating Strings (Priority: P3)

Story creators need to concatenate text values, split strings into arrays, extract substrings, and perform find-replace operations for dynamic text generation and parsing.

**Why this priority**: String operations enable advanced text manipulation beyond basic formatting. Useful for text parsing, dynamic dialogue generation, and text-based puzzles. Lower priority as many use cases can use existing text operations.

**Independent Test**: Can be fully tested by creating a story that takes a comma-separated input, splits it into array, processes each item, and concatenates results, verifying string operations independently.

**Acceptance Scenarios**:

1. **Given** a story needs to build full name from separate first/last name variables, **When** generating greeting, **Then** concatenateStrings operation combines values with space separator
2. **Given** a comma-separated list of tags in text field, **When** processing tags, **Then** splitString operation converts "rpg,fantasy,magic" into array ["rpg", "fantasy", "magic"]
3. **Given** a story displays character count limitation showing "You have 50 characters remaining", **When** extracting the number, **Then** substringText operation extracts just the number portion
4. **Given** a text template with multiple placeholder patterns, **When** substituting values, **Then** replaceString operation uses regex patterns to replace all matches

---

### User Story 8 - Managing Keyboard Focus and Accessibility (Priority: P2)

Story creators need to control keyboard focus for navigation, retrieve currently focused elements, set ARIA attributes for screen reader users, and announce dynamic content changes to assistive technology.

**Why this priority**: Accessibility is essential for inclusive storytelling. Focus management enables keyboard navigation, and ARIA support ensures screen reader users can experience stories. Required for WCAG compliance.

**Independent Test**: Can be fully tested by creating a story with sequential focus navigation and verifying focus moves correctly between story elements using keyboard, independently of other operations.

**Acceptance Scenarios**:

1. **Given** a story transitions to new section, **When** section loads, **Then** setFocus operation moves keyboard focus to first interactive element in section
2. **Given** a story needs to detect which element has focus, **When** checking focus state, **Then** getFocusedElement operation returns currently focused element reference
3. **Given** a dynamically updated content region, **When** content changes, **Then** setAriaAttribute operation marks region with aria-live="polite" so screen readers announce changes
4. **Given** a story shows notification message, **When** message appears, **Then** announceToScreenReader operation uses ARIA live region to announce text to screen reader users without moving focus

---

### User Story 9 - Working with Dates and Times (Priority: P3)

Story creators need to format dates for display, get current timestamps, and compare dates to create time-based story mechanics, scheduling features, or timestamp displays.

**Why this priority**: Date operations enable time-based features like "story published 3 days ago", countdown timers, or schedule-based content unlocking. Lower priority as many stories don't need complex date handling.

**Independent Test**: Can be fully tested by creating a story that displays current date/time formatted in specific format and checks if deadline has passed, verifying date operations work independently.

**Acceptance Scenarios**:

1. **Given** a story displays publication date, **When** rendering timestamp, **Then** formatDate operation converts ISO timestamp to "January 29, 2025" or other specified format
2. **Given** a story needs to timestamp user actions, **When** saving activity log, **Then** getCurrentTime operation returns current timestamp in ISO format
3. **Given** a story with deadline mechanic, **When** checking if deadline passed, **Then** compareDate operation returns whether first date is before/after/equal to second date

---

### Edge Cases

- What happens when form operations are used on non-form elements (e.g., getFormData on a div)? → Return empty object or error message
- How does system handle storage operations when storage is full or disabled? → Return error in operation data, don't crash story
- What happens when filtering/sorting operations receive non-array data? → Return empty array or original data with warning
- How does HTTP operation handle timeout or network offline? → Return error object with timeout/offline status
- What happens when scrollToElement targets non-existent element? → Log warning, don't scroll, continue story execution
- How does formatDate handle invalid date strings? → Return original input unchanged or error message
- What happens when string operations receive non-string data? → Coerce to string (toString()) before processing
- How does setFocus handle disabled or hidden elements? → Skip focus change, log warning
- What happens when announceToScreenReader is called rapidly multiple times? → Queue announcements with debouncing

## Requirements *(mandatory)*

### Functional Requirements

#### Form Operations (FR-001 through FR-004)

- **FR-001**: System MUST provide `getFormData` operation that extracts all input, select, and textarea values from form element into operation data as object with field names as keys
- **FR-002**: System MUST provide `setFormValue` operation that sets value of input/select/textarea element by selector and new value
- **FR-003**: System MUST provide `validateForm` operation that validates form fields against rules (required, minLength, maxLength, pattern, email) and returns validation errors object
- **FR-004**: System MUST provide `toggleFormElement` operation that enables/disables form inputs based on boolean condition

#### Text Operations (FR-005 through FR-007)

- **FR-005**: System MUST provide `getTextContent` operation that extracts text content from selected element (stripping HTML tags) into operation data
- **FR-006**: System MUST provide `replaceText` operation that finds and replaces text within element content using literal string or regex pattern
- **FR-007**: System MUST provide `formatText` operation that transforms text using transformations: uppercase, lowercase, capitalize (first letter), titlecase (all words), trim (whitespace)

#### Storage Operations (FR-008 through FR-010)

- **FR-008**: System MUST provide `saveToStorage` operation that saves data to localStorage or sessionStorage with specified key and optional expiration
- **FR-009**: System MUST provide `loadFromStorage` operation that retrieves data from storage by key and returns it in operation data, handling missing keys gracefully
- **FR-010**: System MUST provide `clearStorage` operation that removes item(s) from storage by key or clears all storage for current origin

#### Array Operations (FR-011 through FR-014)

- **FR-011**: System MUST provide `filterArray` operation that filters array by expression or condition function, returning subset of items matching criteria
- **FR-012**: System MUST provide `sortArray` operation that sorts array by property path or comparator function, supporting ascending/descending order
- **FR-013**: System MUST provide `mapArray` operation that transforms array items by applying transformation expression or function to each item
- **FR-014**: System MUST provide `findInArray` operation that returns first array item matching search criteria or null if not found

#### Scroll Operations (FR-015 through FR-018)

- **FR-015**: System MUST provide `scrollToElement` operation that smoothly scrolls to selected element with optional offset and animation duration
- **FR-016**: System MUST provide `scrollToPosition` operation that scrolls to exact X/Y coordinates with optional smooth animation
- **FR-017**: System MUST provide `isElementInViewport` operation that checks if element is visible in viewport and returns boolean result
- **FR-018**: System MUST provide `getScrollPosition` operation that retrieves current scroll X/Y coordinates into operation data

#### HTTP Operations (FR-019 through FR-021)

- **FR-019**: System MUST provide `httpPost` operation that sends POST request to URL with data payload and returns response in operation data
- **FR-020**: System MUST provide `httpPut` operation that sends PUT request to URL with data payload and returns response in operation data
- **FR-021**: System MUST provide `httpDelete` operation that sends DELETE request to URL and returns response in operation data

#### String Operations (FR-022 through FR-025)

- **FR-022**: System MUST provide `concatenateStrings` operation that joins multiple string values with optional separator
- **FR-023**: System MUST provide `splitString` operation that splits string by delimiter into array of substrings
- **FR-024**: System MUST provide `substringText` operation that extracts substring from start index to end index
- **FR-025**: System MUST provide `replaceString` operation that replaces text using literal string or regex pattern with substitution value

#### Focus Operations (FR-026 through FR-029)

- **FR-026**: System MUST provide `setFocus` operation that moves keyboard focus to selected element
- **FR-027**: System MUST provide `getFocusedElement` operation that returns currently focused element reference in operation data
- **FR-028**: System MUST provide `setAriaAttribute` operation that sets ARIA attributes on selected element for screen reader accessibility
- **FR-029**: System MUST provide `announceToScreenReader` operation that announces text to screen readers using ARIA live region without moving focus

#### Date Operations (FR-030 through FR-032)

- **FR-030**: System MUST provide `formatDate` operation that formats date/timestamp using specified format string (e.g., "YYYY-MM-DD", "MMM D, YYYY")
- **FR-031**: System MUST provide `getCurrentTime` operation that returns current timestamp in ISO format or Unix epoch milliseconds
- **FR-032**: System MUST provide `compareDate` operation that compares two dates and returns -1 (before), 0 (equal), or 1 (after)

#### Cross-Cutting Requirements (FR-033 through FR-036)

- **FR-033**: All operations MUST follow existing operation patterns: accept operationData parameter, return modified operation data or Promise, use operation scope for context
- **FR-034**: All operations MUST handle errors gracefully by returning error information in operation data rather than throwing exceptions that crash story
- **FR-035**: All operations MUST include JSDoc comments with description, parameter documentation, return value documentation, and usage examples matching existing operation style
- **FR-036**: All operations MUST have corresponding TypeScript metadata for JSON schema generation following existing metadata patterns

### Key Entities

- **Operation Data**: Object containing input parameters and output results for each operation, follows existing pattern of passing data between operations in action sequence
- **Form Data**: Object representation of form field values extracted by getFormData, with field names as keys and values as values
- **Validation Rules**: Object defining validation constraints for form fields (required: boolean, minLength: number, pattern: regex)
- **Validation Errors**: Object containing field-level error messages when validation fails
- **Storage Key**: String identifier for saved data in localStorage/sessionStorage
- **Array Filter Criteria**: Expression string or function for filtering array items
- **Sort Configuration**: Object specifying property path, sort order (asc/desc), and optional comparator function
- **HTTP Request Configuration**: Object with URL, method, headers, and data payload for HTTP operations
- **Date Format Pattern**: String template defining how dates should be formatted (e.g., "YYYY-MM-DD HH:mm:ss")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Story creators can build functional quiz with 5+ questions including validation without writing custom JavaScript, completing implementation in under 30 minutes
- **SC-002**: Users can submit quiz answers and receive results within 2 seconds, including HTTP POST to external API
- **SC-003**: Story progress persists across browser sessions with 100% reliability - user can close browser and return days later to exact same state
- **SC-004**: Stories with scroll-based navigation smoothly transition between sections in under 500ms with 60fps animation
- **SC-005**: All 32 operations handle error conditions gracefully without crashing story - 100% of error scenarios return error information rather than throwing exceptions
- **SC-006**: Operations follow consistent patterns - new creators can learn operation usage from documentation and examples in under 5 minutes per operation
- **SC-007**: Screen reader users can navigate and interact with stories using focus operations - 100% of interactive elements are keyboard accessible
- **SC-008**: Form validation provides immediate feedback - users see validation errors within 100ms of triggering validation
- **SC-009**: Array operations process collections of 1000+ items in under 100ms for smooth user experience
- **SC-010**: String and text operations handle unicode characters correctly - support for emoji, international characters, and special symbols

## Assumptions

1. **Browser Support**: Operations target modern browsers with ES6+ support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
2. **Storage Limits**: localStorage operations work within browser quota limits (typically 5-10MB), creators responsible for managing storage size
3. **HTTP CORS**: HTTP operations respect browser CORS policies, creators must ensure target APIs configure CORS headers correctly
4. **Validation Rules**: Form validation uses standard HTML5 validation patterns extended with custom rules, not complex validation library
5. **Date Formatting**: Date operations use simple format string patterns (not full i18n library), creators handle timezone complexity when needed
6. **Accessibility**: Screen reader operations use standard ARIA practices, compatibility tested with NVDA and JAWS
7. **Async Operations**: HTTP, storage, and animation operations are asynchronous (return Promises), matching existing async operation patterns
8. **Error Handling**: Operations return errors as data objects (not exceptions) to maintain story execution flow
9. **Existing Pattern Compliance**: All operations follow established patterns from existing 50 operations regarding typing, JSDoc, metadata, and operation data flow
