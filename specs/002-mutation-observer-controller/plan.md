# Implementation Plan: Mutation Observer Controller

**Branch**: `002-mutation-observer-controller` | **Date**: 2025-11-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-mutation-observer-controller/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a MutationObserverController that extends BaseController to monitor DOM changes on selected elements. The controller observes mutations (attributes, child nodes, text content) and broadcasts events through the Eligius eventbus. Lifecycle management ensures observers start on attach() and disconnect on detach(), with configurable observation options for performance optimization.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode enabled
**Primary Dependencies**:
- Browser MutationObserver API (native Web API)
- jQuery 3.7.1 (peer dependency, for selectedElement wrapper)
- BaseController (Eligius framework, extends from)
- IEventbus (Eligius framework, for broadcasting)
- TimelineEventNames (Eligius framework, for event naming)

**Storage**: N/A (runtime controller, no persistence)
**Testing**: Vitest 3.2.4 (framework testing tool, 90% coverage requirement)
**Target Platform**: Modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
**Project Type**: Single library project (Eligius timeline engine)
**Performance Goals**:
- Mutation notification latency <10ms
- Handle 100+ mutations/second without performance degradation
- Timeline tick processing <16ms (60fps requirement from constitution)

**Constraints**:
- MUST extend BaseController following Eligius controller patterns
- MUST NOT mutate peer dependency objects (jQuery instances)
- MUST use ESM module system
- MUST clean up observer on detach (zero memory leaks)
- MUST follow Test-First Development (constitution Principle I)

**Scale/Scope**:
- Single controller class (MutationObserverController)
- Single metadata interface (IMutationObserverControllerMetadata)
- One new event name in TimelineEventNames (DOM_MUTATION)
- Comprehensive unit tests for lifecycle, observation, and configuration
- TypeDoc documentation with usage examples

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development ✓
- **Compliance**: All implementation will follow RED-GREEN-REFACTOR cycle
- **Action**: Write failing tests BEFORE controller implementation
- **Verification**: Git history will show tests committed before implementation

### Principle II: Technology Stack ✓
- **Compliance**: Using TypeScript 5.9.3, Vitest 3.2.4, Biome 2.3.2, ESM modules
- **No Changes**: No new dependencies required (using existing stack + native MutationObserver API)
- **Verification**: package.json remains unchanged

### Principle III: Security & Compliance First ✓
- **Compliance**: Controller does not execute arbitrary code or manipulate configuration
- **DOM Safety**: Mutations are observed, not modified (consumers handle changes)
- **Event Source Validation**: Mutation events originate from trusted browser API
- **No Logging**: Controller does not log sensitive data

### Principle VI: Testing Standards ✓
- **Coverage Target**: 90% coverage requirement
- **Test Location**: `src/test/unit/controllers/mutation-observer-controller.spec.ts`
- **Test Types**: Unit tests for lifecycle (init/attach/detach), observation (attributes/childList/characterData), configuration options
- **Edge Cases**: Tests for element removal, rapid mutations, multiple attach, missing element

### Principle X: Research & Documentation Standards ✓
- **Context7 Usage**: Will use Context7 MCP server for:
  - MutationObserver API documentation (MDN)
  - jQuery API patterns for element handling
  - Vitest testing patterns for controller testing
  - TypeScript type system features
- **Research Phase**: Phase 0 will resolve all API signatures and patterns

### Principle XI: Dependency Management ✓
- **No New Dependencies**: Feature uses existing stack + native browser API
- **Peer Dependencies**: No changes to jQuery, lottie-web, or video.js versions
- **Verification**: No package.json modifications needed

### Principle XII: Framework-Specific Restrictions ✓
- **Compliance**: No React/Vue/Angular patterns used
- **ESM Only**: No CommonJS require()
- **Peer Dependency Safety**: Will not mutate jQuery objects
- **Framework-Agnostic**: Uses standard TypeScript + Web APIs

### Principle XVII: Technical Overview Reference ✓
- **Pre-Work**: Reviewed BaseController, LabelController, IController interface, TimelineEventNames
- **Existing Patterns**: Will follow established controller lifecycle pattern (init/attach/detach)
- **No Duplication**: No existing MutationObserver controller found
- **Post-Work**: Will update controller documentation and add DOM_MUTATION event name

### Principle XVIII: Configuration Schema Integrity ✓
- **Schema Impact**: Controller metadata will need JSON schema update
- **Action**: Run `npm run generate-schema` after implementing IMutationObserverControllerMetadata
- **Validation**: Schema will validate controller configuration in JSON configs

### Principle XIX: Public API Stability ✓
- **New Export**: MutationObserverController is NEW public API (minor version bump)
- **TypeDoc**: Will include comprehensive TypeDoc comments with usage examples
- **Backward Compatible**: No changes to existing APIs

### Principle XX: Documentation Research Standards ✓
- **Context7 Mandatory**: Will use Context7 MCP server for all library/API research
- **Libraries to Research**:
  - MutationObserver API (browser native)
  - jQuery element handling patterns
  - Vitest testing patterns
  - TypeScript type system features
- **Documentation**: All findings documented in research.md with Context7 sources

### Gate Summary: ✓ ALL GATES PASSED

No constitutional violations. Feature fully compliant with all principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-mutation-observer-controller/
├── spec.md              # Feature specification (completed by /speckit.specify)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command - TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── controllers/
│   ├── base-controller.ts              # Existing: abstract base class
│   ├── label-controller.ts             # Existing: reference example
│   ├── mutation-observer-controller.ts # NEW: main controller implementation
│   ├── types.ts                        # Existing: IController interface
│   └── index.ts                        # UPDATE: export new controller
├── timeline-event-names.ts             # UPDATE: add DOM_MUTATION event
├── eventbus/
│   └── types.ts                        # Existing: IEventbus interface
└── types.ts                            # Existing: core type definitions

src/test/unit/
└── controllers/
    └── mutation-observer-controller.spec.ts  # NEW: controller unit tests

dist/                                   # Build output (generated)
├── index.js                           # UPDATE: includes new controller export
└── index.d.ts                         # UPDATE: includes new controller types

jsonschema/
└── eligius-configuration.json         # UPDATE: regenerate with new controller metadata schema
```

**Structure Decision**: Single library project structure (Option 1). Eligius is a TypeScript library with all source in `src/` and tests in `src/test/`. The controller follows existing patterns in `src/controllers/` directory, extending BaseController and implementing IController interface. Tests are colocated in `src/test/unit/controllers/` to match the source structure.

## Phase 0: Research ✓ COMPLETE

**Status**: All research completed using Context7 MCP server

**Research Artifacts**:
- [research.md](research.md) - Comprehensive research findings

**Key Findings**:
1. **MutationObserver API**: Native browser API, well-documented (MDN via Context7 `/mdn/content`)
   - Constructor: `new MutationObserver(callback)`
   - Start: `observer.observe(target, options)`
   - Stop: `observer.disconnect()`
   - Options: `childList`, `attributes`, `characterData`, `subtree`, `attributeOldValue`, `characterDataOldValue`, `attributeFilter`

2. **jQuery Element Unwrapping**: Use `.get(0)` to access native DOM node
   - Documented via Context7 `/jquery/jquery`
   - Pattern: `const nativeNode = $element.get(0)`

3. **Vitest Testing**: JSDOM environment with beforeEach/afterEach lifecycle
   - Documented via Context7 `/vitest-dev/vitest` (v3.2.4)
   - Mock eventbus, test DOM mutations, verify broadcasts
   - Use `vi.waitFor` for async mutation testing

4. **Controller Pattern**: Extend BaseController following LabelController example
   - init/attach/detach lifecycle
   - Use `this.addListener()` for eventbus subscription (auto-cleanup)
   - Bind mutation callback to controller instance

**No Unresolved Questions**: All technical decisions made with Context7-verified documentation.

## Phase 1: Design & Contracts ✓ COMPLETE

**Status**: All design artifacts created

**Design Artifacts**:
- [data-model.md](data-model.md) - Entity definitions and state management
- [contracts/mutation-observer-controller.ts](contracts/mutation-observer-controller.ts) - TypeScript interfaces
- [quickstart.md](quickstart.md) - Usage examples and best practices

**Key Design Decisions**:

### 1. Metadata Interface (IMutationObserverControllerMetadata)
```typescript
{
  selectedElement: JQuery;           // @dependency, @required
  observeAttributes?: boolean;       // default: true
  observeChildList?: boolean;        // default: true
  observeCharacterData?: boolean;    // default: true
  observeSubtree?: boolean;          // default: false
  attributeOldValue?: boolean;       // default: false
  characterDataOldValue?: boolean;   // default: false
  attributeFilter?: string[];        // optional
}
```

### 2. Event Payload (IMutationEventPayload)
```typescript
{
  mutations: MutationRecord[];  // Native browser API type
  target: Element;              // Observed element reference
  timestamp: number;            // Date.now()
}
```

### 3. Controller Class Structure
```typescript
export class MutationObserverController extends BaseController<IMutationObserverControllerMetadata> {
  name = 'MutationObserverController';
  private observer: MutationObserver | null = null;

  init(operationData: IMutationObserverControllerMetadata): void;
  attach(eventbus: IEventbus): void;
  detach(eventbus: IEventbus): void;

  private _handleMutations(eventbus: IEventbus, mutations: MutationRecord[]): void;
  private _buildObserverOptions(): MutationObserverInit;
}
```

### 4. Event Name Addition
Add to `src/timeline-event-names.ts`:
```typescript
static DOM_MUTATION = 'dom-mutation';
```

**Agent Context Updated**: ✓ Claude Code context updated with TypeScript 5.9.3 and project details

## Constitution Re-Check (Post-Design)

*Re-evaluating constitutional compliance after design phase*

### Updated Gate Status: ✓ ALL GATES STILL PASSING

**Design Validation**:
- ✓ Test-First: Design supports RED-GREEN-REFACTOR (tests can be written before implementation)
- ✓ No New Dependencies: Design uses only existing stack + native API
- ✓ Security: No code execution, no configuration manipulation, only observation
- ✓ API Stability: New export (minor version), backward compatible
- ✓ Schema: Metadata interface will generate valid JSON schema
- ✓ Pattern Consistency: Follows BaseController pattern exactly like LabelController

**No constitutional violations introduced by design.**

## Implementation Readiness

**Prerequisites Met**:
- ✓ Research complete (Context7-verified documentation)
- ✓ Data model defined (entities, state, validation)
- ✓ Contracts written (TypeScript interfaces)
- ✓ Usage documented (quickstart with examples)
- ✓ Agent context updated (CLAUDE.md)
- ✓ Constitution check passed (twice)

**Ready for Phase 2**: Feature is ready for `/speckit.tasks` command to generate implementation tasks.

## Next Steps (User Actions)

Run `/speckit.tasks` to generate the task breakdown for implementation. The planning phase is complete.

## Summary

**Feature**: Mutation Observer Controller
**Complexity**: Low-Medium (single controller, established patterns)
**Dependencies**: None (uses existing stack + native browser API)
**Files to Create**: 2 (controller + test file)
**Files to Modify**: 3 (index.ts, timeline-event-names.ts, schema regeneration)
**Test Coverage Target**: 90%+ (unit tests for lifecycle, observation, configuration)
**Estimated Effort**: Small feature (1-2 implementation sessions)
