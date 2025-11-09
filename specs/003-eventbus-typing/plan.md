# Implementation Plan: EventBus Type-Safe Refactor

**Branch**: `003-eventbus-typing` | **Date**: 2025-11-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-eventbus-typing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor EventBus to provide compile-time type safety where event names are strictly associated with their argument types. Implement event metadata generation system similar to operations and controllers, with support for marking events as @private to exclude them from public metadata.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode enabled
**Primary Dependencies**:
- ts-morph (existing) - TypeScript AST manipulation for metadata generation
- Biome 2.3.2 - Linting and formatting
- Vitest 3.2.4 - Testing framework

**Storage**: N/A (runtime type system, no persistence)
**Testing**: Vitest with 90% coverage requirement
**Target Platform**: Node.js >=20, modern browsers (last 2 Chrome/Firefox/Safari/Edge)
**Project Type**: Single project (library)
**Performance Goals**:
- Type checking at compile-time (zero runtime overhead)
- Metadata generation completes in <10 seconds
- No change to EventBus runtime performance

**Constraints**:
- Must maintain backward compatibility with existing EventBus behavior
- Event topics remain untyped (user-defined at runtime)
- No runtime type validation (TypeScript compile-time only)
- TimelineEventNames class will be deprecated (breaking change, major version bump)

**Scale/Scope**:
- ~40 events currently in TimelineEventNames
- Each event becomes separate TypeScript file
- Metadata generation similar to existing operations/controllers generators

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I - Test-First Development ✅
- All EventBus interface changes will have tests written first
- Metadata generator will have tests written first
- Event definition examples will have tests written first
- Migration of existing events will be test-driven

### Principle II - Technology Stack ✅
- Using TypeScript 5.9.3 with strict mode ✅
- Using Vitest for testing ✅
- Using Biome for linting ✅
- Using ts-morph (existing dependency) ✅
- No new dependencies required ✅

### Principle III - Security & Compliance First ✅
- Type safety feature - reduces runtime errors
- No configuration changes affecting validation
- No DOM manipulation changes
- No impact on XSS prevention

### Principle IV - Code Quality & Architecture ✅
- Type system enforces business rules at compile time
- Single responsibility: each event in its own file
- EventBus interface remains clean and focused
- Quality checks will run after each task

### Principle V - Domain-Specific Requirements ✅
- No impact on timeline precision (100ms)
- No impact on timeline state management
- No impact on configuration parsing
- Performance: type checking is compile-time only

### Principle VI - Testing Standards ✅
- Will achieve 90% coverage for new code
- Unit tests for metadata generator
- Integration tests for type-safe EventBus
- Test existing EventBus behavior remains unchanged

### Principle VII - Development Workflow ✅
- Following Test-First Development (Red-Green-Refactor)
- Quality gates will run after each task
- Commits will include tests and implementation together

### Principle VIII - Performance & User Experience ✅
- Zero runtime performance impact (compile-time types)
- Metadata generation <10 seconds
- No change to EventBus runtime behavior

### Principle IX - Accessibility & Usability ✅
- Improved developer experience (autocomplete, type safety)
- Better error messages from TypeScript compiler
- Comprehensive TypeDoc comments

### Principle X - Research & Documentation Standards ✅
- Will use Context7 for TypeScript advanced features research
- Will use Context7 for ts-morph API documentation
- Will document findings in research.md

### Principle XI - Dependency Management ✅
- No new production dependencies required
- ts-morph already exists as dev dependency
- No peer dependency changes

### Principle XII - Framework-Specific Restrictions ✅
- No framework-specific patterns
- Pure TypeScript type system features
- Works with any consumer framework

### Principle XIII - Debugging Attempt Limit ✅
- Will follow 5-attempt rule for any issues

### Principle XIV - Concise Communication ✅
- Will keep communication brief and technical

### Principle XV - Token Efficiency ✅
- Will not duplicate command output in docs
- Will reference file paths instead of copying content

### Principle XVI - Zero Failing Tests Policy ✅
- All tests must pass before completion
- Will fix any test failures immediately

### Principle XVII - Technical Overview Reference ✅
- Will consult CLAUDE.md before implementation
- Will check for existing event patterns
- Will update docs after completion

### Principle XVIII - Configuration Schema Integrity ✅
- No JSON schema changes (EventBus is runtime API, not configuration)

### Principle XIX - Public API Stability ✅
- **BREAKING CHANGE**: TimelineEventNames class deprecation
- Requires major version bump
- Migration path: replace `TimelineEventNames.PLAY_REQUEST` with `'timeline-play-request'`
- Type safety improvement justifies breaking change
- **RESOLVED**: User confirmed package.json version already bumped (2025-11-08)

### Principle XX - Documentation Research Standards ✅
- Will use Context7 for TypeScript conditional types research
- Will use Context7 for ts-morph API patterns
- Will document in research.md

**GATE STATUS**: ✅ **ALL CHECKS PASS** - Breaking change approved, version bumped

## Project Structure

### Documentation (this feature)

```text
specs/003-eventbus-typing/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── event-interface.ts    # Event interface contract
│   └── eventbus-interface.ts # EventBus interface contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── eventbus/
│   ├── events/                    # NEW - Individual event definitions
│   │   ├── timeline-play-request.ts
│   │   ├── timeline-pause-request.ts
│   │   ├── timeline-seek-request.ts
│   │   ├── dom-mutation.ts        # @private event
│   │   ├── ... (all events)
│   │   ├── types.ts               # GENERATED - EventMap and EventName
│   │   ├── metadata/              # GENERATED - Event metadata
│   │   │   ├── timeline-play-request.ts
│   │   │   ├── timeline-pause-request.ts
│   │   │   ├── ... (public events only)
│   │   │   ├── types.ts           # IEventMetadata interface
│   │   │   └── index.ts           # Barrel export
│   │   └── index.ts               # Barrel export for events
│   ├── eventbus.ts                # MODIFIED - Type-safe implementation
│   ├── types.ts                   # MODIFIED - Type-safe IEventbus interface
│   └── index.ts                   # Barrel export
├── timeline-event-names.ts        # DEPRECATED - Will be removed
├── tools/code-generator/
│   └── events-metadata-generator.ts  # NEW - Metadata generator script
└── test/
    └── unit/
        └── eventbus/
            ├── eventbus.spec.ts           # MODIFIED - Type safety tests
            ├── events/
            │   └── timeline-play-request.spec.ts  # Example event test
            └── tools/
                └── events-metadata-generator.spec.ts  # Generator tests

package.json                       # MODIFIED - Add npm run events-metadata script
```

**Structure Decision**: Single project structure. All EventBus code remains in `src/eventbus/` with new `events/` subdirectory for individual event definitions. Metadata generator follows existing pattern in `src/tools/code-generator/`.

## Complexity Tracking

*No violations requiring justification. All constitution checks pass except Principle XIX which requires user approval for breaking change.*

