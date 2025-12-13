# Quickstart: Rosetta-based Locale Manager

**Feature**: 005-rosetta-locale-manager
**Date**: 2025-12-13

## Overview

This guide covers implementing the new locale management system for Eligius using the rosetta library.

## Prerequisites

- Node.js >= 20
- TypeScript 5.9.3
- Existing Eligius codebase checked out
- rosetta package installed: `npm install rosetta`

## File Structure

```
src/
├── locale/
│   ├── index.ts              # Barrel export
│   ├── locale-manager.ts     # Core LocaleManager class
│   ├── locale-loader.ts      # External file loader
│   └── types.ts              # Type definitions
├── adapters/
│   └── locale-eventbus-adapter.ts  # Bridges LocaleManager to eventbus
└── controllers/
    └── label-controller.ts   # Uses translationKey property

src/test/unit/locale/
├── locale-manager.spec.ts
└── locale-loader.spec.ts

src/test/integration/locale/
└── locale-integration.spec.ts
```

## Implementation Order

### Phase 1: Setup

1. Install rosetta: `npm install rosetta`
2. Create locale module structure
3. Create `src/locale/types.ts` with core types
4. Export from `src/locale/index.ts`

### Phase 2-3: LocaleManager (P1)

1. Write tests for LocaleManager
2. Implement LocaleManager wrapping rosetta
3. Test: `t()`, `setLocale()`, `loadLocale()`, event emission
4. Handle missing keys (return empty string)
5. Support array key notation `['nav', 'home']`

### Phase 4: Language Switching (P1)

1. Create LocaleEventbusAdapter
2. Handle language-change event forwarding
3. Handle request-current-language responses
4. Update DOM lang attribute on locale change
5. Implement fallback for unavailable locales

### Phase 5-6: LocaleLoader (P2)

1. Write tests (mock fetch)
2. Implement `$ref` resolution
3. Test error handling
4. Implement circular reference detection
5. Add URL caching

### Phase 7: Debug Mode (P3)

1. Add debug option to LocaleManager
2. Log warnings for missing keys
3. Log warnings for missing interpolation variables

### Phase 8: Integration (P1)

1. Update LabelController to use `translationKey`
2. Add request-translation to adapter
3. Integration tests

### Phase 9: Legacy Removal (BREAKING CHANGE)

1. Delete legacy LanguageManager
2. Delete legacy language-eventbus-adapter
3. Remove ILanguageLabel types
4. Update all configuration files

## Quick Code Examples

### Creating LocaleManager

```typescript
import { LocaleManager } from './locale';

const manager = new LocaleManager({
  defaultLocale: 'en-US',
  debug: true
});

// Load translations
manager.loadLocale('en-US', {
  greeting: 'Hello {{name}}!',
  nav: {
    home: 'Home',
    about: 'About'
  }
});

manager.loadLocale('nl-NL', {
  greeting: 'Hallo {{name}}!',
  nav: {
    home: 'Thuis',
    about: 'Over'
  }
});
```

### Using Translations

```typescript
// Simple key
manager.t('nav.home');  // "Home"

// With interpolation
manager.t('greeting', { name: 'John' });  // "Hello John!"

// Override locale
manager.t('greeting', { name: 'Jan' }, 'nl-NL');  // "Hallo Jan!"
```

### Language Switching

```typescript
// Listen for changes
const unsubscribe = manager.on('change', (newLocale, oldLocale) => {
  console.log(`Changed from ${oldLocale} to ${newLocale}`);
});

// Switch language
manager.setLocale('nl-NL');

// Cleanup
unsubscribe();
manager.destroy();
```

### Configuration Format (Inline)

```json
{
  "locales": {
    "en-US": {
      "greeting": "Hello {{name}}!",
      "nav": {
        "home": "Home",
        "about": "About"
      }
    },
    "nl-NL": {
      "greeting": "Hallo {{name}}!",
      "nav": {
        "home": "Thuis",
        "about": "Over"
      }
    }
  }
}
```

### Configuration Format (External)

```json
{
  "locales": {
    "en-US": { "$ref": "./locales/en-US.json" },
    "nl-NL": { "$ref": "./locales/nl-NL.json" }
  }
}
```

## Testing Patterns

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LocaleManager } from './locale-manager';

describe('LocaleManager', () => {
  it('given loaded locale, when t() called, then returns translation', () => {
    const manager = new LocaleManager({ defaultLocale: 'en-US' });
    manager.loadLocale('en-US', { greeting: 'Hello' });

    expect(manager.t('greeting')).toBe('Hello');
  });

  it('given interpolation params, when t() called, then replaces placeholders', () => {
    const manager = new LocaleManager({ defaultLocale: 'en-US' });
    manager.loadLocale('en-US', { greeting: 'Hello {{name}}!' });

    expect(manager.t('greeting', { name: 'World' })).toBe('Hello World!');
  });
});
```

### Mocking Fetch for LocaleLoader

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LocaleLoader } from './locale-loader';

describe('LocaleLoader', () => {
  it('given valid $ref, when load() called, then fetches and parses JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ greeting: 'Hello' })
    });

    const loader = new LocaleLoader({ fetch: mockFetch });
    const result = await loader.load('en-US', { $ref: './en-US.json' });

    expect(result.data.greeting).toBe('Hello');
    expect(mockFetch).toHaveBeenCalledWith('./en-US.json');
  });
});
```

## Common Commands

```bash
# Run tests
npm test -- --run src/test/unit/locale

# Type check
npm run typecheck

# Lint and format
npm run fix

# Generate coverage
npm run coverage
```

## Checklist

- [x] Types created in `src/locale/types.ts`
- [x] LocaleManager implemented with tests (15 tests)
- [x] LocaleLoader implemented with tests (8 tests)
- [x] LocaleEventbusAdapter created with tests (10 tests)
- [x] LabelController updated to use `translationKey`
- [x] Integration tests passing (5 tests)
- [x] Debug mode implemented (missing keys + interpolation warnings)
- [x] Legacy label system removed (BREAKING CHANGE)
- [x] ~90% coverage achieved (89.91% overall, 89.31% locale module)
- [x] JSON schema regenerated
- [x] All 1086 tests passing
