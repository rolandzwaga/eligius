# Implementation Plan: Timeline Provider Decomposition

**Branch**: `004-timeline-provider-decomposition` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-timeline-provider-decomposition/spec.md`

## Summary

Decompose the monolithic `ITimelineProvider` interface into composable, single-responsibility interfaces (`IPositionSource`, `ISeekable`, `IPlaylist`, `IContainerProvider`) to enable non-temporal timeline sources like scroll, mouse, and WebSocket. This enables the Eligius engine to support a wider variety of position sources while maintaining backwards compatibility through a facade pattern.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode enabled
**Primary Dependencies**: jQuery 3.7.1 (peer), video.js 8.23.4 (peer), hotkeys-js 3.13.15
**Storage**: N/A (runtime engine, no persistence)
**Testing**: Vitest 3.2.4 (config: src/vitest.config.ts)
**Target Platform**: Modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
**Project Type**: Single library project
**Performance Goals**: <16ms tick processing (60fps), timeline precision to 100ms
**Constraints**: Timeline scrubbing <100ms response, play/pause/stop <50ms response
**Scale/Scope**: Library consumed by external projects; public API stability required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | ✅ PASS | Will write tests before implementations |
| II. Technology Stack | ✅ PASS | Uses existing TypeScript, Vitest, jQuery patterns |
| III. Security & Compliance | ✅ PASS | No new attack surfaces; interfaces are internal |
| IV. Code Quality & Architecture | ✅ PASS | Single responsibility, composable interfaces |
| V. Domain-Specific (Timeline) | ✅ PASS | Maintains 100ms precision requirement |
| VI. Testing Standards | ✅ PASS | 90% coverage target maintained |
| XI. Dependency Management | ✅ PASS | No new dependencies required |
| XII. Framework-Specific Restrictions | ✅ PASS | Framework-agnostic interfaces |
| XVIII. Configuration Schema | ⚠️ MINOR | Schema update needed for container config |
| XIX. Public API Stability | ⚠️ MINOR | Deprecates ITimelineProvider (not removal) |
| XX. Documentation Research | ✅ PASS | Will use Context7 for video.js/jQuery patterns |

**Gate Result**: PASS - No violations. Minor schema update required post-implementation.

## Project Structure

### Documentation (this feature)

```text
specs/004-timeline-provider-decomposition/
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
├── timelineproviders/
│   ├── types.ts                              # Interface definitions (already started)
│   ├── position-sources/
│   │   ├── base-position-source.ts           # Abstract base class with shared state management
│   │   ├── raf-position-source.ts            # RAF implementation
│   │   ├── video-position-source.ts          # Video.js implementation
│   │   └── scroll-position-source.ts         # Scroll implementation (P2)
│   ├── container-providers/
│   │   └── dom-container-provider.ts         # DOM selector-based container
│   ├── playlist/
│   │   └── simple-playlist.ts                # Basic playlist implementation
│   └── legacy/
│       └── timeline-provider-facade.ts       # Backwards compatibility facade
├── configuration/
│   └── types.ts                              # Config type updates for container
└── engine-factory.ts                         # Factory updates for assembly

src/test/
├── unit/
│   └── timelineproviders/
│       ├── position-sources/
│       │   ├── base-position-source.spec.ts  # Base class tests
│       │   ├── raf-position-source.spec.ts
│       │   ├── video-position-source.spec.ts
│       │   └── scroll-position-source.spec.ts
│       ├── container-providers/
│       │   └── dom-container-provider.spec.ts
│       ├── playlist/
│       │   └── simple-playlist.spec.ts
│       └── legacy/
│           └── timeline-provider-facade.spec.ts
└── integration/
    └── timelineproviders/
        └── composed-timeline.spec.ts         # Integration tests for composition
```

**Structure Decision**: Single library project with new subdirectories under `src/timelineproviders/` for organized separation of position sources, container providers, playlist, and legacy facade.

## Complexity Tracking

> No violations requiring justification. Design follows single responsibility principle.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Interface count | 4 interfaces | Each has single responsibility; minimal coupling |
| Backwards compatibility | Facade pattern | Existing code continues working without changes |
| Configuration changes | Additive only | New optional `container` field; no breaking changes |
