# Research: Rosetta-based Locale Manager

**Feature**: 005-rosetta-locale-manager
**Date**: 2025-12-13

## Research Topics

### 1. Rosetta Library API

**Decision**: Use rosetta as the core translation engine

**Source**: [lukeed/rosetta GitHub](https://github.com/lukeed/rosetta)

**API Summary**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `rosetta(dict?)` | `(dict?: Record<string, any>) => Rosetta` | Creates instance with optional initial translations |
| `locale(lang?)` | `(lang?: string) => string` | Gets/sets active language code |
| `set(lang, table)` | `(lang: string, table: Record<string, any>) => void` | Merges translation keys into language dictionary |
| `t(key, params?, lang?)` | `(key: string \| string[], params?: object, lang?: string) => string` | Fetches translation with optional interpolation |
| `table(lang)` | `(lang: string) => Record<string, any>` | Retrieves complete dictionary for language |

**Key Features**:
- Size: ~300 bytes (including dependencies)
- Interpolation: `{{variable}}` syntax
- Nested keys: Dot notation (`nav.home`) or array notation (`['nav', 'home']`)
- Function values: Translations can be functions for dynamic content
- Debug mode: `/debug` export logs missing keys

**Translation Format**:
```javascript
{
  en: {
    greeting: 'Hello {{name}}!',
    nav: {
      home: 'Home',
      about: 'About'
    }
  }
}
```

**Rationale**: Rosetta provides exactly the features needed (nested keys, interpolation, small size) without the overhead of larger i18n frameworks like i18next (~22KB).

**Alternatives Considered**:
- **i18next**: More features but 22KB+ bundle size, overkill for Eligius needs
- **FormatJS**: ICU-focused, heavier, better for complex plural forms
- **Custom implementation**: More control but reinvents the wheel

---

### 2. TypeScript Integration Pattern

**Decision**: Create thin wrapper around rosetta with strong typing

**Rationale**: Rosetta's JS API needs TypeScript types for Eligius's strict mode

**Pattern**:
```typescript
import rosetta from 'rosetta';

type TLocaleData = Record<string, string | TLocaleData | ((params: Record<string, unknown>) => string)>;

interface ILocaleManager {
  readonly locale: TLanguageCode;
  readonly availableLocales: TLanguageCode[];
  t(key: string, params?: Record<string, unknown>, locale?: TLanguageCode): string;
  setLocale(locale: TLanguageCode): void;
  // ... event handling
}

class LocaleManager implements ILocaleManager {
  private readonly _rosetta = rosetta();
  // Wrap rosetta methods with type safety
}
```

**Alternatives Considered**:
- **Direct rosetta usage**: Loses type safety
- **@types/rosetta**: Not available on DefinitelyTyped

---

### 3. External Locale File Loading

**Decision**: Use `$ref` syntax with fetch API for external files

**Pattern**:
```typescript
interface ILocaleReference {
  $ref: string;  // URL or relative path
}

// Configuration format
{
  locales: {
    'en-US': { $ref: './locales/en-US.json' },
    'nl-NL': { greeting: 'Hallo' }  // Inline also supported
  }
}
```

**Loading Strategy**:
1. During engine initialization, detect `$ref` entries
2. Use `fetch()` to load external JSON files
3. Parse and merge into rosetta instance
4. Parallel loading for multiple locales

**Error Handling**:
- 404: Log error, continue with available locales
- Parse error: Throw with file path context
- Network error: Throw with descriptive message

**Rationale**: `$ref` is a standard JSON Reference pattern, fetch is widely available in target browsers.

**Alternatives Considered**:
- **Dynamic import**: Only works for JS modules, not JSON
- **Custom loader callback**: More flexible but more complex API

---

### 4. Legacy Format Migration

**Decision**: Auto-detect and convert `ILanguageLabel[]` format at initialization

**Current Format**:
```typescript
interface ILanguageLabel {
  id: string;
  labels: ILabel[];
}
interface ILabel {
  id: string;
  languageCode: TLanguageCode;
  label: string;
}
```

**Conversion Algorithm**:
```typescript
function convertLegacyLabels(labels: ILanguageLabel[]): Record<TLanguageCode, TLocaleData> {
  const result: Record<TLanguageCode, TLocaleData> = {};

  for (const labelGroup of labels) {
    for (const label of labelGroup.labels) {
      if (!result[label.languageCode]) {
        result[label.languageCode] = {};
      }
      result[label.languageCode][labelGroup.id] = label.label;
    }
  }

  return result;
}
```

**Detection Logic**:
- If config has `labels` (array): Legacy format, convert
- If config has `locales` (object): New format, use directly
- If both: Merge, new format takes precedence

**Rationale**: Zero-breaking-change migration path for existing users.

---

### 5. Eventbus Integration Pattern

**Decision**: Create LocaleEventbusAdapter similar to existing LanguageEventbusAdapter

**Events to Support**:

| Event | Direction | Signature |
|-------|-----------|-----------|
| `language-change` | Broadcast | `[locale: TLanguageCode]` |
| `request-current-language` | Request/Response | `[callback: (locale) => void]` |
| `request-translation` | Request/Response | `[key: string, params?: object, callback: (text) => void]` |

**New Event** (optional):
- `request-translation`: Direct translation request via eventbus

**Backward Compatibility**:
- `request-label-collection` still works (returns empty array for new-format keys)
- `request-label-collections` still works

**Rationale**: Maintains existing eventbus patterns for seamless integration.

---

### 6. Debug Mode Implementation

**Decision**: Environment-based debug mode with console warnings

**Implementation**:
```typescript
// Use rosetta/debug in development
import rosetta from 'rosetta/debug';  // Logs missing keys

// Or custom wrapper
class LocaleManager {
  t(key: string, params?: object, locale?: string): string {
    const result = this._rosetta.t(key, params, locale);
    if (this._debug && result === '') {
      console.warn(`[LocaleManager] Missing translation: ${key}`);
    }
    return result;
  }
}
```

**Activation**:
- Configuration option: `debug: true`
- Or: Automatically enabled in development builds

**Rationale**: Rosetta provides built-in debug mode, but custom wrapper allows more control.

---

## Unresolved Items

None. All research topics resolved.

## Dependencies to Install

| Package | Version | Type | Justification |
|---------|---------|------|---------------|
| rosetta | ^1.1.0 | production | Core translation engine, ~300 bytes, user-requested |

**Note**: User explicitly requested rosetta in feature description, satisfying constitution's dependency approval requirement.
