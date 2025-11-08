# Research: EventBus Type-Safe Refactor

**Feature**: 003-eventbus-typing
**Date**: 2025-11-08
**Status**: Complete

## Research Overview

This document consolidates research findings for implementing type-safe EventBus with event name-argument association and metadata generation.

## TypeScript Type System Features

### Mapped Types with Template Literal Keys

**Decision**: Use mapped types to convert event interfaces to EventMap type

**Source**: /microsoft/typescript (Context7)

**Pattern**:
```typescript
// Event interfaces
interface TimelineSeekRequestEvent {
  name: 'timeline-seek-request';
  args: [position: number];
}

// Generate EventMap using mapped type
type EventMap = {
  [K in TimelineSeekRequestEvent as K['name']]: K['args']
};
// Result: { 'timeline-seek-request': [position: number] }
```

**Rationale**:
- Automatically derives event name-to-args mapping from event interfaces
- Type-safe: compiler enforces name/args consistency
- No manual maintenance of EventMap - generated from source of truth (event interfaces)

**Alternatives Considered**:
- Manual EventMap definition: Error-prone, requires duplicate maintenance
- String literal unions: Doesn't associate args with names

### Conditional Types for Event Name Union

**Decision**: Use `keyof` on mapped type to extract event names

**Source**: /microsoft/typescript (Context7)

**Pattern**:
```typescript
type EventName = keyof EventMap;
// Result: 'timeline-play-request' | 'timeline-seek-request' | ...
```

**Rationale**:
- Single source of truth (event interfaces)
- IDE autocomplete for event names
- Type-safe event name validation

### Generic Constraints for Type Safety

**Decision**: Use generic constraints on EventBus methods

**Source**: /microsoft/typescript (Context7)

**Pattern**:
```typescript
interface IEventbus {
  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover;

  broadcast<E extends EventName>(
    eventName: E,
    args: EventMap[E]
  ): void;
}
```

**Rationale**:
- `E extends EventName` ensures only valid event names accepted
- `EventMap[E]` provides exact args type for each event
- TypeScript infers correct types at call site

## ts-morph Metadata Generation

### Parsing Interface Declarations

**Decision**: Use ts-morph to parse event interface files and extract metadata

**Source**: /dsherret/ts-morph (Context7)

**Pattern**:
```typescript
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ skipAddingFilesFromTsConfig: true });
project.addSourceFilesAtPaths('./src/eventbus/events/*.ts');

const sourceFiles = project.getSourceFiles();
for (const sourceFile of sourceFiles) {
  const interfaces = sourceFile.getInterfaces();

  for (const iface of interfaces) {
    const name = iface.getName(); // e.g., "TimelineSeekRequestEvent"
    const jsDocs = iface.getJsDocs();

    // Extract JSDoc information
    const description = jsDocs[0]?.getDescription() || '';
    const tags = jsDocs[0]?.getTags() || [];

    // Find @category and @private tags
    const categoryTag = tags.find(t => t.getTagName() === 'category');
    const isPrivate = tags.some(t => t.getTagName() === 'private');

    // Get event properties
    const nameProperty = iface.getProperty('name');
    const argsProperty = iface.getProperty('args');
  }
}
```

**Rationale**:
- ts-morph provides type-safe AST manipulation
- Familiar API similar to TypeScript compiler API
- Handles JSDoc extraction cleanly
- Already in project dependencies

**Alternatives Considered**:
- Direct TypeScript compiler API: More complex, lower-level
- RegEx parsing: Fragile, doesn't understand TypeScript syntax

### Extracting JSDoc Tags

**Decision**: Filter tags by `getTagName()` to identify @private and @category

**Source**: /dsherret/ts-morph (Context7)

**Pattern**:
```typescript
const jsDocs = interfaceDeclaration.getJsDocs();
const tags = jsDocs[0]?.getTags() || [];

const isPrivate = tags.some(tag => tag.getTagName() === 'private');
const categoryTag = tags.find(tag => tag.getTagName() === 'category');
const category = categoryTag?.getCommentText() || 'unknown';
```

**Rationale**:
- JSDoc tags are first-class ts-morph nodes
- Type-safe tag extraction
- Follows existing operations/controllers metadata pattern

### Generating TypeScript Files

**Decision**: Use ts-morph `createSourceFile()` and `save()` for code generation

**Source**: /dsherret/ts-morph (Context7)

**Pattern**:
```typescript
const outputFile = project.createSourceFile(
  './src/eventbus/events/metadata/timeline-seek-request.ts',
  '',
  { overwrite: true }
);

outputFile.addImportDeclaration({
  moduleSpecifier: '../timeline-seek-request.ts',
  namedImports: [{ name: 'TimelineSeekRequestEvent', isTypeOnly: true }]
});

outputFile.addFunction({
  name: 'timelineSeekRequest',
  isExported: true,
  returnType: 'IEventMetadata<[position: number]>',
  statements: writer => {
    writer.writeLine('return {');
    writer.writeLine(`  description: '${description}',`);
    writer.writeLine(`  category: '${category}',`);
    writer.writeLine('  args: [');
    writer.writeLine(`    { name: 'position', type: 'number' }`);
    writer.writeLine('  ]');
    writer.writeLine('};');
  }
});

outputFile.formatText();
await project.save();
```

**Rationale**:
- Programmatic TypeScript generation
- Automatic formatting via Biome
- Type-safe code generation
- Matches operations/controllers generator pattern

## Event Interface Structure

### Event Definition Pattern

**Decision**: Each event is a TypeScript interface with `name` (string literal) and `args` (tuple) properties

**Pattern**:
```typescript
/**
 * Request to seek to a specific position in the timeline
 * @category Timeline Control
 */
export interface TimelineSeekRequestEvent {
  name: 'timeline-seek-request';
  args: [position: number];
}

/**
 * Request to play the timeline
 * @category Timeline Control
 */
export interface TimelinePlayRequestEvent {
  name: 'timeline-play-request';
  args: [];
}

/**
 * Announces DOM mutations detected by MutationObserverController
 * @private
 * @category Controller Events
 */
export interface DomMutationEvent {
  name: 'dom-mutation';
  args: [mutations: MutationRecord[], target: Element, timestamp: number];
}
```

**Rationale**:
- String literal `name` provides exact type for autocomplete
- Tuple `args` preserves parameter names and order
- JSDoc provides documentation and metadata directives (@private, @category)
- One file per event maintains single responsibility

**Alternatives Considered**:
- Class-based events: Adds runtime overhead, unnecessary complexity
- Type alias instead of interface: Interfaces compose better for metadata extraction

## EventBus Type Compatibility

### Backward Compatibility Strategy

**Decision**: Maintain existing EventBus runtime behavior while adding type safety to interface

**Pattern**:
```typescript
// Existing implementation stays the same
export class Eventbus implements IEventbus {
  private eventHandlers = new Map<string, TEventHandler[]>();

  // Type-safe signature, same runtime behavior
  on<E extends EventName>(
    eventName: E,
    eventHandler: (...args: EventMap[E]) => void,
    eventTopic?: string
  ): TEventbusRemover {
    // Existing implementation unchanged
    this._getEventHandlers(eventName, eventTopic).push(eventHandler);
    return () => this.off(eventName, eventHandler, eventTopic);
  }

  broadcast<E extends EventName>(
    eventName: E,
    args: EventMap[E] = [] as EventMap[E]
  ): void {
    // Existing implementation unchanged
    this._callHandlers(eventName, undefined, args);
  }
}
```

**Rationale**:
- Zero runtime overhead - types erased at compile time
- Existing EventBus tests pass without modification
- Type safety enforced at call sites, not implementation
- Event topics remain untyped (user-defined)

## Metadata Generation Script

### Generator Architecture

**Decision**: Follow existing operations/controllers metadata generator pattern

**File**: `src/tools/code-generator/events-metadata-generator.ts`

**Pattern**:
```typescript
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  compilerOptions: { noEmit: true },
  skipAddingFilesFromTsConfig: true
});

project.addSourceFilesAtPaths('./src/eventbus/events/*.ts');

const eventFiles = project.getSourceFiles().filter(
  src => src.getBaseName() !== 'index.ts' && src.getBaseName() !== 'types.ts'
);

// Process each event file
for (const sourceFile of eventFiles) {
  const interfaces = sourceFile.getInterfaces();

  for (const eventInterface of interfaces) {
    const jsDocs = eventInterface.getJsDocs();
    const tags = jsDocs[0]?.getTags() || [];

    // Skip @private events
    if (tags.some(t => t.getTagName() === 'private')) {
      continue;
    }

    // Generate metadata file
    createMetadataFile(eventInterface);
  }
}

// Generate types.ts with EventMap and EventName
generateTypesFile(eventFiles);

project.saveSync();
```

**Rationale**:
- Consistent with operations/controllers generators
- Automated metadata synchronization with source
- Filters out @private events from public metadata
- Generates EventMap and EventName types

### npm Script Integration

**Decision**: Add `npm run events-metadata` command

**Package.json**:
```json
{
  "scripts": {
    "events-metadata": "tsx src/tools/code-generator/events-metadata-generator.ts",
    "metadata": "npm run opers-metadata && npm run ctrls-metadata && npm run events-metadata"
  }
}
```

**Rationale**:
- Follows existing metadata command pattern
- Integrates with `npm run metadata` umbrella command
- Uses tsx for TypeScript execution (already in project)

## Migration Strategy

### TimelineEventNames Deprecation

**Decision**: Remove TimelineEventNames class after migrating all usages to string literals

**Migration Path**:
1. Extract all event names from TimelineEventNames
2. Create individual event interface files for each
3. Generate EventMap and EventName types
4. Update EventBus interface with type-safe methods
5. Search codebase for `TimelineEventNames.` references
6. Replace with string literals (e.g., `TimelineEventNames.PLAY_REQUEST` → `'timeline-play-request'`)
7. Run tests to verify behavior unchanged
8. Delete `src/timeline-event-names.ts`
9. Remove TimelineEventNames imports

**Rationale**:
- Breaking change requires major version bump (user approved)
- Type safety improvement justifies deprecation
- String literals with EventName union provide same autocomplete
- Reduces codebase complexity

**Testing**:
- All existing EventBus tests must pass unchanged
- Add new tests verifying TypeScript type errors for invalid events
- Integration tests ensure timeline functionality unchanged

## Summary of Decisions

1. **Event Structure**: Interface with string literal `name` and tuple `args`
2. **Type Mapping**: Mapped type to generate EventMap from event interfaces
3. **Event Names**: `keyof EventMap` union type for autocomplete
4. **EventBus Interface**: Generic constraints for type-safe methods
5. **Metadata Generator**: ts-morph-based generator following operations/controllers pattern
6. **@private Tag**: JSDoc tag filtering to exclude internal events from metadata
7. **Backward Compatibility**: Type-only changes, zero runtime modification
8. **Migration**: Replace TimelineEventNames with string literals + EventName union

All research complete. Ready for Phase 1 (Design & Contracts).
