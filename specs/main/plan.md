# Implementation Plan: Engine API Redesign with Adapter Pattern

**Branch**: `main` | **Date**: 2025-12-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from conversation and `specs/main/spec.md`

## Summary

Redesign the EligiusEngine API to expose explicit, testable methods instead of hiding functionality behind eventbus listeners. Introduce adapter pattern to create clean seams between core components and the eventbus, enabling better discoverability, testability, and separation of concerns.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode
**Primary Dependencies**: jQuery 3.7.1 (peer), video.js 8.23.4 (peer), hotkeys-js 3.13.15
**Storage**: N/A (runtime engine, no persistence)
**Testing**: Vitest 3.2.4 with 90% coverage requirement
**Target Platform**: Modern browsers (last 2 versions Chrome, Firefox, Safari, Edge)
**Project Type**: Single library project
**Performance Goals**: <16ms tick processing (60fps), <1ms event emission overhead
**Constraints**: No new production dependencies, backward compatible eventbus events
**Scale/Scope**: Core engine refactoring affecting ~5 source files, ~3 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | ✅ WILL COMPLY | All new code (TypedEventEmitter, adapters) written test-first |
| II. Technology Stack | ✅ COMPLIANT | No new dependencies, using existing stack |
| III. Security & Compliance | ✅ COMPLIANT | No new attack surfaces, internal refactoring |
| IV. Code Quality | ✅ WILL COMPLY | Biome/TypeScript checks after each task |
| V. Domain-Specific (Timeline) | ✅ COMPLIANT | Timeline precision unaffected, API change only |
| VI. Testing Standards | ✅ WILL COMPLY | 90% coverage, consult TESTING-GUIDE.md |
| XI. Dependency Management | ✅ COMPLIANT | No new dependencies |
| XII. Framework Restrictions | ✅ COMPLIANT | No framework-specific patterns |
| XVI. Zero Failing Tests | ✅ WILL COMPLY | All tests passing before completion |
| XVIII. Schema Integrity | ✅ N/A | No configuration format changes |
| XIX. Public API Stability | ⚠️ BREAKING | Factory return type changes - MAJOR version bump required |

**Gate Result**: PASS with noted breaking change (approved in conversation)

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (interfaces)
├── quickstart.md        # Phase 1 output (usage examples)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── util/
│   └── typed-event-emitter.ts     # NEW: Reusable typed emitter
├── adapters/                       # NEW: Adapter layer
│   ├── index.ts
│   ├── engine-eventbus-adapter.ts
│   ├── language-eventbus-adapter.ts
│   └── engine-input-adapter.ts
├── eligius-engine.ts               # MODIFIED: Pure API, no eventbus
├── language-manager.ts             # MODIFIED: Pure API, no eventbus
├── engine-factory.ts               # MODIFIED: Creates adapters, new return type
├── timelineproviders/
│   ├── types.ts                    # MODIFIED: start() becomes async
│   ├── request-animation-frame-timeline-provider.ts  # MODIFIED
│   └── video-js-timeline-provider.ts                 # MODIFIED
└── types.ts                        # MODIFIED: New interfaces

src/test/
├── unit/
│   ├── util/
│   │   └── typed-event-emitter.spec.ts
│   ├── adapters/
│   │   ├── engine-eventbus-adapter.spec.ts
│   │   ├── language-eventbus-adapter.spec.ts
│   │   └── engine-input-adapter.spec.ts
│   ├── eligius-engine.spec.ts      # MODIFIED: Test pure API
│   └── language-manager.spec.ts    # NEW or MODIFIED
└── integration/
    └── engine-adapter-integration.spec.ts  # NEW: Full integration test
```

**Structure Decision**: Single project structure maintained. New `adapters/` directory for adapter layer. TypedEventEmitter in `util/` for reusability.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Breaking API change | Factory return type must change to expose adapters and provide destroy function | Keeping old return type would hide adapters, preventing proper cleanup |

## Phase 0: Research ✅ COMPLETE

See [research.md](research.md) for full findings.

### Key Decisions

1. **video.js play() returns Promise** - `start()` must be async to handle autoplay failures
2. **LanguageManager refactor** - emit `'change'` event, adapter handles DOM updates
3. **Test strategy** - split into pure API tests and adapter tests

## Phase 1: Design ✅ COMPLETE

### Generated Artifacts

- [data-model.md](data-model.md) - All interfaces defined:
  - `ITypedEventEmitter<T>` - Generic typed emitter
  - `EngineEvents` / `LanguageEvents` - Event maps
  - `IEligiusEngine` - Pure engine API
  - `ILanguageManager` - Pure language manager API
  - `ITimelineProvider` - Updated with async `start()`
  - Adapter interfaces
  - `IEngineFactoryResult` - Factory return type

- [quickstart.md](quickstart.md) - Usage examples:
  - Factory usage (recommended)
  - Direct engine usage (testing)
  - Language manager usage
  - Testing patterns
  - Migration guide from v1.x to v2.x

### Contracts

Not applicable - internal refactoring, TypeScript interfaces serve as contracts.

## Phase 2: Task Generation

Run `/speckit.tasks` to generate implementation tasks.
