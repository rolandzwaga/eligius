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
│   ├── legacy-converter.ts   # Legacy format converter
│   └── types.ts              # Type definitions (copy from contracts/)
├── adapters/
│   └── locale-eventbus-adapter.ts  # Updated adapter
└── controllers/
    └── label-controller.ts   # Updated controller

src/test/unit/locale/
├── locale-manager.spec.ts
├── locale-loader.spec.ts
└── legacy-converter.spec.ts
```

## Implementation Order

### Phase 1: Core Types (P1)

1. Create `src/locale/types.ts` from contracts
2. Export from `src/locale/index.ts`

### Phase 2: LocaleManager (P1)

1. Write tests for LocaleManager
2. Implement LocaleManager wrapping rosetta
3. Test: `t()`, `setLocale()`, event emission

### Phase 3: LegacyConverter (P2)

1. Write tests for conversion logic
2. Implement converter
3. Test with existing ILanguageLabel[] data

### Phase 4: LocaleLoader (P2)

1. Write tests (mock fetch)
2. Implement `$ref` resolution
3. Test error handling

### Phase 5: Integration (P1)

1. Update LocaleEventbusAdapter
2. Update LabelController
3. Integration tests

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

### Legacy Format (Auto-converted)

```json
{
  "labels": [
    {
      "id": "greeting",
      "labels": [
        { "id": "1", "languageCode": "en-US", "label": "Hello" },
        { "id": "2", "languageCode": "nl-NL", "label": "Hallo" }
      ]
    }
  ]
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

- [ ] Types created in `src/locale/types.ts`
- [ ] LocaleManager implemented with tests
- [ ] LegacyConverter implemented with tests
- [ ] LocaleLoader implemented with tests
- [ ] LocaleEventbusAdapter updated
- [ ] LabelController updated
- [ ] Integration tests passing
- [ ] 90% coverage achieved
- [ ] JSON schema regenerated
- [ ] All quality checks passing
