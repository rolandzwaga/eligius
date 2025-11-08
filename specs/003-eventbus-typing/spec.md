# Feature Specification: EventBus Type-Safe Refactor

**Feature Branch**: `003-eventbus-typing`
**Created**: 2025-11-08
**Status**: Draft
**Input**: User description: "eventbus typing refactor. I want to refactor the eventbus and timeline-event-names in such a way that the broadcast methods are more strictly type. By that I mean the event name should be strictly associated with the arguments. I will also need a similar metadata structure as currently the operations and controllers have and these, like the operations and controllers, should be generated from the typescript sources for the events. Some events should be able to be marked with a @private tag and these would not be added to the metadata."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type-Safe Event Broadcasting (Priority: P1)

Developers using the EventBus can broadcast events with compile-time guarantees that event names are correctly associated with their argument types, preventing runtime errors from incorrect event arguments.

**Why this priority**: This is the core value proposition - type safety prevents bugs at compile time rather than runtime, which is essential for library stability and developer experience.

**Independent Test**: Can be fully tested by writing TypeScript code that broadcasts events with correct and incorrect argument types, verifying that TypeScript compiler catches type mismatches.

**Acceptance Scenarios**:

1. **Given** a developer writes code to broadcast a seek event, **When** they provide a number argument, **Then** TypeScript compilation succeeds
2. **Given** a developer writes code to broadcast a seek event, **When** they provide a string argument instead of number, **Then** TypeScript compilation fails with a clear type error
3. **Given** a developer writes code to broadcast a play event, **When** they provide no arguments (empty array), **Then** TypeScript compilation succeeds
4. **Given** a developer writes code to broadcast a play event, **When** they provide arguments when none are expected, **Then** TypeScript compilation fails
5. **Given** a developer types an event name, **When** they trigger IDE autocomplete, **Then** all available event names appear in the autocomplete list

---

### User Story 2 - Type-Safe Event Handlers (Priority: P1)

Developers registering event handlers receive correctly typed arguments in their handler functions based on the event name they're listening to, eliminating the need for manual type casting or guards.

**Why this priority**: Event handlers are the consumer side of the EventBus. Type safety here is equally critical as broadcasting to provide end-to-end type safety.

**Independent Test**: Can be fully tested by registering event handlers and verifying handler parameters are correctly typed by the TypeScript compiler.

**Acceptance Scenarios**:

1. **Given** a developer registers a handler for a seek event, **When** the handler function is written, **Then** the position parameter is automatically typed as number
2. **Given** a developer registers a handler for a play event, **When** the handler function is written, **Then** the handler receives no parameters
3. **Given** a developer registers a handler for a DOM mutation event, **When** the handler function is written, **Then** all three parameters (mutations, target, timestamp) are correctly typed
4. **Given** a developer tries to access handler parameters with wrong types, **When** TypeScript compiles the code, **Then** compilation fails with type errors

---

### User Story 3 - Event Metadata Generation (Priority: P2)

The system automatically generates event metadata from TypeScript source files, providing documentation and tooling capabilities similar to operations and controllers, while excluding private internal events.

**Why this priority**: Metadata enables documentation, tooling, and external integrations. It's valuable but not required for core type safety functionality.

**Independent Test**: Can be fully tested by running the metadata generation script and verifying generated metadata files match the source event definitions, with private events excluded.

**Acceptance Scenarios**:

1. **Given** event TypeScript files exist in the events directory, **When** the metadata generation script runs, **Then** metadata files are generated for each public event
2. **Given** an event is marked with @private JSDoc tag, **When** the metadata generation script runs, **Then** no metadata file is generated for that event
3. **Given** an event has JSDoc comments with description and category, **When** metadata is generated, **Then** the metadata includes the description and category information
4. **Given** an event has typed arguments, **When** metadata is generated, **Then** the metadata includes argument names and types
5. **Given** metadata files exist, **When** they are imported, **Then** they export IEventMetadata interfaces matching the event structure

---

### User Story 4 - Deprecate TimelineEventNames Class (Priority: P2)

The legacy TimelineEventNames static class is removed from the codebase, replaced by direct string literal event names with full type safety and IDE autocomplete.

**Why this priority**: Cleanup of legacy code improves maintainability but doesn't block core functionality. Can be done after type-safe system is established.

**Independent Test**: Can be fully tested by searching codebase for TimelineEventNames references and verifying all are replaced with string literals, then removing the class.

**Acceptance Scenarios**:

1. **Given** the codebase uses TimelineEventNames constants, **When** all references are migrated to string literals, **Then** no TimelineEventNames imports remain in the codebase
2. **Given** TimelineEventNames class is deleted, **When** TypeScript compiles the codebase, **Then** compilation succeeds with no errors
3. **Given** string literals are used for event names, **When** developers type event names, **Then** IDE provides autocomplete from the EventName union type
4. **Given** migration is complete, **When** timeline-event-names.ts file is removed, **Then** all tests pass

---

### Edge Cases

- What happens when an event interface is defined without a `name` property? (Metadata generator should skip or error with clear message)
- What happens when an event interface has invalid `args` type (not a tuple)? (TypeScript should catch at compile time)
- What happens when two events have the same `name` value? (TypeScript should error on duplicate keys in EventMap)
- How does the system handle events with optional arguments? (Use optional tuple elements: `[arg?: Type]`)
- What happens when eventbus methods are called with runtime string values not in EventName? (TypeScript allows `string` but loses type safety - acceptable tradeoff)
- How are events with generic/templated arguments handled? (Document as not supported, require concrete types)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a type-safe EventBus interface where event names are mapped to their argument types
- **FR-002**: System MUST infer event handler argument types based on the event name being registered
- **FR-003**: System MUST validate at compile-time that broadcast calls provide arguments matching the event's expected argument types
- **FR-004**: System MUST generate TypeScript union type (EventName) containing all event names for IDE autocomplete
- **FR-005**: System MUST store each event definition in a separate TypeScript file in `src/eventbus/events/` directory
- **FR-006**: System MUST generate EventMap type mapping event names to their argument tuple types
- **FR-007**: System MUST generate event metadata from TypeScript source files similar to operations and controllers
- **FR-008**: System MUST exclude events marked with @private JSDoc tag from generated metadata
- **FR-009**: System MUST support events with zero arguments (empty tuple type)
- **FR-010**: System MUST support events with multiple arguments (tuple with multiple elements)
- **FR-011**: System MUST preserve eventTopic parameter as untyped string for runtime user-defined values
- **FR-012**: System MUST extract event description from JSDoc comments for metadata generation
- **FR-013**: System MUST extract event category from @category JSDoc tag for metadata generation
- **FR-014**: System MUST remove TimelineEventNames class from the codebase after migration
- **FR-015**: System MUST provide npm script command for generating event metadata (`npm run events-metadata`)
- **FR-016**: System MUST auto-generate `src/eventbus/events/types.ts` file containing EventMap and EventName types
- **FR-017**: Metadata generator MUST create metadata files in `src/eventbus/events/metadata/` directory
- **FR-018**: Each event metadata file MUST export a function returning IEventMetadata interface

### Key Entities *(include if feature involves data)*

- **Event Definition**: TypeScript interface with `name` (string literal) and `args` (tuple type) properties, stored in individual files
- **EventMap**: Generated type mapping event name strings to their argument tuple types
- **EventName**: Generated union type of all event name string literals
- **Event Metadata**: Generated metadata object containing event description, category, and argument information
- **IEventMetadata**: Interface defining the structure of event metadata (description, category, args array with name/type/description)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers receive TypeScript compile-time errors when broadcasting events with incorrect argument types
- **SC-002**: Developers receive automatic TypeScript type inference for event handler parameters without manual type annotations
- **SC-003**: IDE autocomplete displays all available event names when typing event name strings
- **SC-004**: Metadata generation script completes successfully for all public events in under 10 seconds
- **SC-005**: Zero TimelineEventNames class references remain in the codebase after migration
- **SC-006**: All existing tests pass after EventBus refactor with zero behavioral changes
- **SC-007**: Event metadata structure matches operations and controllers metadata format for consistency
- **SC-008**: Private events marked with @private tag do not appear in generated metadata output

## Assumptions *(optional)*

- All event argument types are concrete types (no generics or type parameters)
- Event names are unique across the entire EventBus system
- Existing EventBus behavior (topics, interceptors, listeners) remains unchanged except for type signatures
- Metadata generation runs as part of build process similar to operations/controllers
- Developers are using TypeScript-aware IDEs (VSCode, WebStorm, etc.) for autocomplete benefits
- Event argument tuples have maximum 10 arguments (reasonable practical limit)
- Migration from TimelineEventNames to string literals can be done incrementally
- Generated `types.ts` file is committed to version control (not gitignored)

## Dependencies *(optional)*

- TypeScript 5.9.3 compiler with strict mode enabled
- ts-morph library (already in project) for parsing TypeScript source files in metadata generator
- Existing metadata generation infrastructure (`src/tools/code-generator/`)
- npm scripts infrastructure for running metadata generation commands
- Biome for linting/formatting generated files

## Non-Goals *(optional)*

- Runtime event validation or type checking (TypeScript compile-time only)
- Type-safe event topics (topics remain untyped strings for user flexibility)
- Event inheritance or composition patterns
- Generic/templated event argument types
- Backwards compatibility layer for TimelineEventNames class (clean deprecation)
- Migration of third-party code using the EventBus (only internal codebase migration)
- Event versioning or schema evolution support

## Open Questions *(optional)*

None - all design decisions confirmed with user.
