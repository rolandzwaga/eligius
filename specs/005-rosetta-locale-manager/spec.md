# Feature Specification: Rosetta-based Locale Manager

**Feature Branch**: `005-rosetta-locale-manager`
**Created**: 2025-12-13
**Status**: Draft
**Input**: User description: "Reimplement label management based on rosetta library with support for inline and external locale files"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Translation Retrieval (Priority: P1)

As a developer configuring an Eligius timeline, I want to define translations using a simple nested key structure with interpolation support, so that I can display localized text with dynamic values in my timeline elements.

**Why this priority**: This is the core functionality - without translation retrieval, the entire locale system is non-functional. Developers need to be able to define and retrieve translations before any other features matter.

**Independent Test**: Can be fully tested by configuring inline translations and verifying that `t('key.path', { name: 'John' })` returns the correctly interpolated string for the current locale.

**Acceptance Scenarios**:

1. **Given** translations are configured inline with nested keys, **When** I call `t('nav.home')`, **Then** the system returns the translation string for the current locale
2. **Given** a translation contains `{{name}}` placeholder, **When** I call `t('greeting', { name: 'John' })`, **Then** the system returns "Hello John!" with the interpolated value
3. **Given** a nested translation structure exists, **When** I access `t('section.subsection.key')`, **Then** the system traverses the structure and returns the correct value
4. **Given** a translation key does not exist, **When** I call `t('missing.key')`, **Then** the system returns an empty string (or logs a warning in debug mode)

---

### User Story 2 - Language Switching (Priority: P1)

As a user of an Eligius-powered application, I want to change the display language at runtime, so that all visible labels update to my preferred language without page reload.

**Why this priority**: Language switching is essential for any multi-language application. Users expect immediate feedback when changing languages.

**Independent Test**: Can be tested by setting up translations for two locales, switching between them, and verifying all LabelController instances update their displayed text.

**Acceptance Scenarios**:

1. **Given** the current locale is "en-US", **When** I change the locale to "nl-NL", **Then** all displayed labels update to Dutch translations
2. **Given** multiple LabelController instances are attached to DOM elements, **When** the locale changes, **Then** all controllers receive the language-change event and re-render
3. **Given** the locale is changed, **When** the DOM lang attribute is inspected, **Then** it reflects the new language code

---

### User Story 3 - Inline Locale Configuration (Priority: P1)

As a developer, I want to define all translations directly within my Eligius configuration file, so that I can keep simple projects self-contained without external dependencies.

**Why this priority**: Inline configuration is the simplest approach and supports the existing pattern of self-contained configuration files.

**Independent Test**: Can be tested by providing a configuration with embedded `locales` object and verifying translations are available immediately after engine initialization.

**Acceptance Scenarios**:

1. **Given** a configuration with inline locales object, **When** the engine initializes, **Then** all translations are immediately available
2. **Given** inline locales for multiple languages, **When** I query available locales, **Then** all configured language codes are returned
3. **Given** nested translation keys in inline config, **When** accessing translations, **Then** dot-notation and array notation both work

---

### User Story 4 - External Locale File Loading (Priority: P2)

As a developer with a large application, I want to reference external JSON files for my translations, so that I can manage translations separately from configuration and enable lazy loading.

**Why this priority**: External files enable better organization, translation management workflows, and performance optimization for large applications. However, inline support must work first.

**Independent Test**: Can be tested by configuring a locale with `$ref` pointing to an external JSON file, initializing the engine, and verifying translations load correctly.

**Acceptance Scenarios**:

1. **Given** a locale configuration with `{ "$ref": "./locales/en-US.json" }`, **When** the engine initializes, **Then** the system fetches and loads the external file
2. **Given** an external locale file cannot be loaded, **When** initialization occurs, **Then** the system reports a clear error with the file path
3. **Given** multiple locales reference external files, **When** the engine initializes, **Then** all files are loaded (in parallel where possible)
4. **Given** a mix of inline and external locales, **When** the engine initializes, **Then** both are correctly loaded and available

---

### User Story 5 - Debug Mode for Missing Translations (Priority: P3)

As a developer, I want to see console warnings when translations are missing, so that I can identify untranslated keys during development.

**Why this priority**: Debug mode improves developer experience but is not essential for production functionality.

**Independent Test**: Can be tested by enabling debug mode, requesting a non-existent key, and verifying a console warning appears with the missing key path.

**Acceptance Scenarios**:

1. **Given** debug mode is enabled, **When** a missing translation key is requested, **Then** a console warning is logged with the key path
2. **Given** debug mode is disabled (production), **When** a missing translation key is requested, **Then** no console output occurs
3. **Given** debug mode is enabled, **When** an interpolation variable is missing, **Then** a warning is logged and the placeholder renders as empty

---

### Edge Cases

- What happens when a locale file URL returns 404? System logs error and continues with available locales
- How does the system handle circular `$ref` references? System detects and reports circular references, preventing infinite loops
- What happens when interpolation params contain special characters (e.g., `{{`, `}}`)? System escapes or handles gracefully
- How does the system behave with empty translation strings? Empty strings are valid translations and returned as-is
- What happens when switching to a locale that isn't loaded? System logs warning and falls back to default locale

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support nested translation keys accessible via dot notation (e.g., `nav.home.title`)
- **FR-002**: System MUST support variable interpolation using `{{variable}}` syntax
- **FR-003**: System MUST support function values in translations for dynamic content generation
- **FR-004**: System MUST allow inline locale definitions within the configuration object
- **FR-005**: System MUST allow external locale file references using `$ref` syntax
- **FR-006**: System MUST load external locale files during engine initialization
- **FR-007**: System MUST emit `language-change` events when the active locale changes
- **FR-008**: System MUST update the root element's `lang` attribute when locale changes
- **FR-009**: System MUST provide a `t(key, params?, locale?)` method for translation retrieval
- **FR-010**: System MUST provide methods to get/set the current locale
- **FR-011**: System MUST expose the list of available locales
- **FR-012**: System MUST support the existing eventbus request/response pattern for translations
- **FR-013**: System MUST provide a debug mode that logs missing translation keys
- **FR-014**: System MUST return empty string for missing keys in production mode
- **FR-015**: LabelController MUST continue to work with the new locale system
- **FR-016**: System MUST support IETF language tags (e.g., `en-US`, `nl-NL`) as locale identifiers
- **FR-017**: Old label system (LanguageManager, ILanguageLabel, language-eventbus-adapter) MUST be completely removed

### Key Entities

- **Locale**: A language/region combination (e.g., `en-US`) with its associated translation data
- **Translation**: A key-value pair where the key is a dot-notation path and the value is a string, template, or function
- **LocaleManager**: The core service managing locale state, translation retrieval, and language change events
- **LocaleLoader**: A service responsible for resolving and loading external locale file references
- **LocaleEventbusAdapter**: Bridge connecting LocaleManager to the eventbus for cross-module communication

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can define translations in 50% fewer lines compared to the legacy `ILanguageLabel[]` format
- **SC-002**: Translation retrieval with interpolation completes in under 1 millisecond for typical keys
- **SC-003**: Language switching updates all visible labels within 100 milliseconds
- **SC-004**: External locale files load successfully with standard HTTP/fetch mechanisms
- **SC-005**: 100% of existing LabelController functionality continues to work without modification to consuming code
- **SC-006**: Debug mode correctly identifies and reports all missing translation keys during development
- **SC-007**: All legacy label system code is removed from codebase (LanguageManager, ILanguageLabel types, language-eventbus-adapter)

## Assumptions

- The rosetta library (~300 bytes) will be used as the underlying translation engine
- External locale files will be JSON format following the rosetta nested structure
- The `$ref` syntax follows JSON Reference conventions for consistency
- Locale files are loaded at initialization time, not lazily per-key
- The system runs in environments with `fetch` API available (or polyfilled)
- The old label system will be completely removed (breaking change - no backward compatibility)

## Out of Scope

- Plural form handling (ICU MessageFormat) - may be added in future iteration
- Automatic locale detection from browser settings
- Translation management UI or tooling
- Server-side rendering considerations
- Locale file bundling or build-time optimization
