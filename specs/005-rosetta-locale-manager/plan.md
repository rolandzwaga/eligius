# Implementation Plan: Rosetta-based Locale Manager

**Branch**: `005-rosetta-locale-manager` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-rosetta-locale-manager/spec.md`

## Summary

Reimplement Eligius label management using the rosetta library (~300 bytes) as the underlying translation engine. The new system supports:
- Nested translation keys with dot notation (`nav.home.title`)
- Variable interpolation (`{{variable}}` syntax)
- Inline locale definitions within configuration
- External locale file references via `$ref` syntax
- Backward compatibility with legacy `ILanguageLabel[]` format

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode enabled
**Primary Dependencies**: rosetta (new, ~300 bytes), existing eventbus infrastructure
**Storage**: N/A (runtime only, configuration-driven)
**Testing**: Vitest 3.2.4 (config: src/vitest.config.ts)
**Target Platform**: Browser (modern browsers: last 2 Chrome, Firefox, Safari, Edge)
**Project Type**: Single library project (ESM output via tsdown)
**Performance Goals**: Translation retrieval <1ms, language switching <100ms (60fps compatible)
**Constraints**: <16ms per operation (timeline tick budget), no memory leaks in long-running timelines
**Scale/Scope**: Typical configurations with 100-1000 translation keys across 2-10 locales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | PASS | All new modules will have tests written first |
| II. Technology Stack | REQUIRES APPROVAL | Adding rosetta as new dependency - user already approved in spec |
| III. Security & Compliance | PASS | No configuration code execution, sanitized DOM operations via existing patterns |
| IV. Code Quality | PASS | Will use Biome, TypeScript strict mode |
| V. Domain-Specific (Timeline) | PASS | 100ms precision maintained, <16ms execution |
| VI. Testing Standards | PASS | 90% coverage target, consult TESTING-GUIDE.md |
| XI. Dependency Management | REQUIRES APPROVAL | rosetta is new production dependency - user explicitly requested it |
| XII. Framework-Specific | PASS | No framework-specific patterns, vanilla TypeScript |
| XVIII. Configuration Schema | PASS | Schema will be regenerated after types updated |
| XIX. Public API Stability | PASS | New API is additive, legacy format still supported |
| XX. Documentation Research | PASS | Context7 and web research completed for rosetta |

**Gate Result**: PASS (rosetta dependency pre-approved by user request)

## Project Structure

### Documentation (this feature)

```text
specs/005-rosetta-locale-manager/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── locale/                      # NEW: Locale management module
│   ├── locale-manager.ts        # Core LocaleManager wrapping rosetta
│   ├── locale-loader.ts         # External file loader with $ref resolution
│   ├── legacy-converter.ts      # ILanguageLabel[] to rosetta format converter
│   └── types.ts                 # Locale-specific type definitions
├── adapters/
│   ├── locale-eventbus-adapter.ts  # NEW: LocaleManager adapter (alongside existing)
│   └── language-eventbus-adapter.ts  # EXISTING: Deprecated, kept for backward compat
├── controllers/
│   └── label-controller.ts      # MODIFIED: Use t() API instead of lookup
├── configuration/
│   └── types.ts                 # MODIFIED: Add ILocaleConfiguration types
└── types.ts                     # MODIFIED: Add TLocaleData, ILocaleReference

src/test/
├── unit/
│   └── locale/                  # NEW: Unit tests for locale module
│       ├── locale-manager.spec.ts
│       ├── locale-loader.spec.ts
│       └── legacy-converter.spec.ts
└── integration/
    └── locale/                  # NEW: Integration tests
        └── locale-integration.spec.ts
```

**Structure Decision**: Single project structure following existing Eligius patterns. New `locale/` module contains all locale-specific code. Existing adapters and controllers modified minimally to integrate with new system.

## Complexity Tracking

> No constitution violations requiring justification. The rosetta dependency was explicitly requested by the user in the feature description.
