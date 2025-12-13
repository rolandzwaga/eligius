# Data Model: Rosetta-based Locale Manager

**Feature**: 005-rosetta-locale-manager
**Date**: 2025-12-13

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    IEngineConfiguration                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  locales?: ILocalesConfiguration                            │ │
│  │    - Inline or external locale data per language code       │ │
│  │                                                             │ │
│  │  labels?: ILanguageLabel[]  (LEGACY - auto-converted)       │ │
│  │    - Existing format for backward compatibility             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LocaleManager                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  _rosetta: Rosetta                                          │ │
│  │    - Internal rosetta instance                              │ │
│  │                                                             │ │
│  │  _locale: TLanguageCode                                     │ │
│  │    - Current active locale                                  │ │
│  │                                                             │ │
│  │  _availableLocales: TLanguageCode[]                         │ │
│  │    - List of loaded locale codes                            │ │
│  │                                                             │ │
│  │  _debug: boolean                                            │ │
│  │    - Debug mode flag                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Entities

### 1. TLanguageCode (Existing)

IETF language tag format.

```typescript
type TLanguageCode = `${Lowercase<string>}-${Uppercase<string>}`;
// Examples: 'en-US', 'nl-NL', 'de-DE', 'fr-FR'
```

### 2. TLocaleData (NEW)

Nested translation data structure compatible with rosetta.

```typescript
type TLocaleValue =
  | string                                    // Simple translation
  | ((params: Record<string, unknown>) => string)  // Dynamic translation
  | TLocaleData;                              // Nested structure

type TLocaleData = Record<string, TLocaleValue>;
```

**Example**:
```typescript
const enUS: TLocaleData = {
  greeting: 'Hello {{name}}!',
  nav: {
    home: 'Home',
    about: 'About Us'
  },
  dynamicGreeting: (params) => params.formal ? 'Good day' : 'Hey'
};
```

### 3. ILocaleReference (NEW)

External locale file reference using JSON Reference syntax.

```typescript
interface ILocaleReference {
  $ref: string;  // URL or relative path to JSON file
}
```

**Example**:
```typescript
const ref: ILocaleReference = { $ref: './locales/en-US.json' };
```

### 4. ILocalesConfiguration (NEW)

Top-level configuration for all locales.

```typescript
type TLocaleEntry = TLocaleData | ILocaleReference;

interface ILocalesConfiguration {
  [locale: TLanguageCode]: TLocaleEntry;
}
```

**Example**:
```typescript
const locales: ILocalesConfiguration = {
  'en-US': { greeting: 'Hello' },           // Inline
  'nl-NL': { $ref: './locales/nl-NL.json' } // External
};
```

### 5. ILocaleManagerOptions (NEW)

Options for LocaleManager initialization.

```typescript
interface ILocaleManagerOptions {
  defaultLocale: TLanguageCode;
  debug?: boolean;
}
```

### 6. ILocaleManager (NEW)

Interface for the LocaleManager service.

```typescript
interface ILocaleManager {
  // State
  readonly locale: TLanguageCode;
  readonly availableLocales: ReadonlyArray<TLanguageCode>;

  // Translation
  t(key: string, params?: Record<string, unknown>, locale?: TLanguageCode): string;

  // Locale management
  setLocale(locale: TLanguageCode): void;
  loadLocale(locale: TLanguageCode, data: TLocaleData): void;

  // Events
  on<K extends keyof LocaleEvents>(
    event: K,
    handler: (...args: LocaleEvents[K]) => void
  ): () => void;

  // Lifecycle
  destroy(): void;
}
```

### 7. LocaleEvents (NEW)

Event types for LocaleManager.

```typescript
type LocaleEvents = {
  change: [locale: TLanguageCode, previousLocale: TLanguageCode];
};
```

## Legacy Entities (Preserved for Backward Compatibility)

### ILanguageLabel (Existing - LEGACY)

```typescript
interface ILanguageLabel {
  id: string;
  labels: ILabel[];
}
```

### ILabel (Existing - LEGACY)

```typescript
interface ILabel {
  id: string;
  languageCode: TLanguageCode;
  label: string;
}
```

## Entity Relationships

```
IEngineConfiguration
    │
    ├── locales: ILocalesConfiguration (NEW)
    │       │
    │       └── [locale]: TLocaleData | ILocaleReference
    │                           │
    │                           └── (resolved) → TLocaleData
    │
    └── labels: ILanguageLabel[] (LEGACY)
            │
            └── (converted) → ILocalesConfiguration

LocaleManager
    │
    ├── wraps → rosetta instance
    │
    ├── consumes → ILocalesConfiguration
    │
    └── emits → LocaleEvents

LocaleEventbusAdapter
    │
    ├── bridges → LocaleManager ↔ IEventbus
    │
    └── handles → language-change, request-current-language, request-translation

LabelController
    │
    └── uses → LocaleManager.t() (via eventbus)
```

## Validation Rules

| Entity | Rule | Error |
|--------|------|-------|
| TLanguageCode | Must match pattern `xx-XX` | Invalid locale format |
| TLocaleData | Keys must not contain `.` at root level (reserved for nesting) | Invalid key format |
| ILocaleReference.$ref | Must be valid URL or relative path | Invalid reference |
| ILocalesConfiguration | Must have at least one locale | No locales configured |

## State Transitions

### LocaleManager.locale

```
Initial State: defaultLocale from options
    │
    ├── setLocale(newLocale) where newLocale in availableLocales
    │       │
    │       └── locale = newLocale
    │           emit('change', newLocale, oldLocale)
    │
    └── setLocale(unknownLocale) where unknownLocale NOT in availableLocales
            │
            └── WARN: Locale not available, no change
```

### External Locale Loading

```
Configuration with $ref
    │
    ├── LocaleLoader.load()
    │       │
    │       ├── fetch($ref)
    │       │       │
    │       │       ├── SUCCESS: Parse JSON → TLocaleData
    │       │       │
    │       │       └── FAILURE: Throw LoadError with path
    │       │
    │       └── Return resolved TLocaleData
    │
    └── LocaleManager.loadLocale(locale, data)
```
