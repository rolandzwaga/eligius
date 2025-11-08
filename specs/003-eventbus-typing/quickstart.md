# Quickstart: EventBus Type-Safe Refactor

**Feature**: 003-eventbus-typing
**For**: Developers using or contributing to Eligius

## What Changed

EventBus is now type-safe. Event names are strictly associated with their argument types at compile-time.

**Before**:
```typescript
import { TimelineEventNames } from 'eligius';

eventbus.broadcast(TimelineEventNames.SEEK_REQUEST, [5.0]);
eventbus.on(TimelineEventNames.PLAY_REQUEST, () => { /* ... */ });
```

**After**:
```typescript
// No import needed - use string literals
eventbus.broadcast('timeline-seek-request', [5.0]); // Type-safe!
eventbus.on('timeline-play-request', () => { /* ... */ }); // Autocomplete!
```

## Benefits

1. **Compile-Time Safety**: TypeScript catches invalid event names and wrong argument types
2. **IDE Autocomplete**: Type event name and get autocomplete list
3. **Type Inference**: Handler parameters automatically typed based on event name
4. **No Runtime Overhead**: Types erased at compile-time - zero performance impact
5. **Self-Documenting**: Event definitions document their arguments

## Creating a New Event

### 1. Create Event Interface File

Create `src/eventbus/events/my-custom-event.ts`:

```typescript
/**
 * Description of when this event is broadcast/handled
 * @category Event Category Name
 */
export interface MyCustomEvent {
  name: 'my-custom-event';
  args: [data: string, count: number];
}
```

**Rules**:
- One event per file
- File name matches event name (kebab-case)
- Interface name is PascalCase ending with "Event"
- Event name is kebab-case string literal
- Args is tuple type (use `[]` for no arguments)
- Include JSDoc documentation
- Export the interface

### 2. Mark Private Events (Optional)

To exclude event from public metadata:

```typescript
/**
 * Internal engine event
 * @private
 * @category Internal
 */
export interface InternalDebugEvent {
  name: 'internal-debug';
  args: [data: unknown];
}
```

### 3. Generate Metadata

Run metadata generator to update EventMap and create metadata files:

```bash
npm run events-metadata
```

This generates:
- `src/eventbus/events/types.ts` - EventMap and EventName (updated)
- `src/eventbus/events/metadata/my-custom-event.ts` - Event metadata (new)

### 4. Use the Event

```typescript
// Broadcasting
eventbus.broadcast('my-custom-event', ['hello', 42]);

// Listening
eventbus.on('my-custom-event', (data, count) => {
  console.log(data);  // TypeScript knows data is string
  console.log(count); // TypeScript knows count is number
});
```

## TypeScript Type Safety Examples

### Autocomplete

```typescript
eventbus.on('timeline-|') // IDE shows all event names
         //           ^ cursor here - shows autocomplete dropdown
```

### Type Inference

```typescript
eventbus.on('timeline-seek-request', (position) => {
  // position is automatically typed as number
  // No need to write (position: number)
});
```

### Compile-Time Errors

```typescript
// ❌ Invalid event name
eventbus.broadcast('non-existent-event', []);
// Error: Argument of type '"non-existent-event"' is not assignable to parameter of type 'EventName'

// ❌ Wrong argument type
eventbus.broadcast('timeline-seek-request', ['5.0']);
// Error: Type 'string' is not assignable to type 'number'

// ❌ Missing arguments
eventbus.broadcast('timeline-seek-request', []);
// Error: Type '[]' is not assignable to type '[position: number]'

// ❌ Wrong handler signature
eventbus.on('timeline-seek-request', (pos: string) => {});
// Error: Types of parameters 'pos' and 'args_0' are incompatible
```

## Migration from TimelineEventNames

### Before (Old Pattern)

```typescript
import { TimelineEventNames } from 'eligius';

function seekTo(position: number) {
  this.eventbus.broadcast(TimelineEventNames.SEEK_REQUEST, [position]);
}

this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.handlePlay.bind(this));
```

### After (New Pattern)

```typescript
// No TimelineEventNames import needed

function seekTo(position: number) {
  this.eventbus.broadcast('timeline-seek-request', [position]);
}

this.eventbus.on('timeline-play-request', this.handlePlay.bind(this));
```

### Migration Steps

1. Find all `TimelineEventNames.` references in your code
2. Replace with corresponding string literal:
   - `TimelineEventNames.PLAY_REQUEST` → `'timeline-play-request'`
   - `TimelineEventNames.SEEK_REQUEST` → `'timeline-seek-request'`
   - etc.
3. Remove `TimelineEventNames` imports
4. Run TypeScript compiler to verify type safety
5. Run tests to verify behavior unchanged

**Event Name Mapping**:
```typescript
// Timeline Request Events
TimelineEventNames.PLAY_TOGGLE_REQUEST → 'timeline-play-toggle-request'
TimelineEventNames.PLAY_REQUEST        → 'timeline-play-request'
TimelineEventNames.STOP_REQUEST        → 'timeline-stop-request'
TimelineEventNames.PAUSE_REQUEST       → 'timeline-pause-request'
TimelineEventNames.SEEK_REQUEST        → 'timeline-seek-request'
TimelineEventNames.RESIZE_REQUEST      → 'timeline-resize-request'
TimelineEventNames.CONTAINER_REQUEST   → 'timeline-container-request'
TimelineEventNames.DURATION_REQUEST    → 'timeline-duration-request'
TimelineEventNames.REQUEST_CURRENT_TIMELINE → 'timeline-request-current-timeline'

// Timeline Announcement Events
TimelineEventNames.DURATION            → 'timeline-duration'
TimelineEventNames.TIME                → 'timeline-time'
TimelineEventNames.SEEKED              → 'timeline-seeked'
TimelineEventNames.COMPLETE            → 'timeline-complete'
TimelineEventNames.RESTART             → 'timeline-restart'
TimelineEventNames.PLAY                → 'timeline-play'
TimelineEventNames.STOP                → 'timeline-stop'
TimelineEventNames.PAUSE               → 'timeline-pause'
TimelineEventNames.SEEK                → 'timeline-seek'
TimelineEventNames.RESIZE              → 'timeline-resize'
TimelineEventNames.CURRENT_TIMELINE_CHANGE → 'timeline-current-timeline-change'
TimelineEventNames.FIRST_FRAME         → 'timeline-firstframe'

// Factory and Engine Events
TimelineEventNames.REQUEST_INSTANCE    → 'request-instance'
TimelineEventNames.REQUEST_ACTION      → 'request-action'
TimelineEventNames.REQUEST_FUNCTION    → 'request-function'
TimelineEventNames.REQUEST_TIMELINE_URI → 'request-timeline-uri'
TimelineEventNames.BEFORE_REQUEST_TIMELINE_URI → 'before-request-timeline-uri'
TimelineEventNames.REQUEST_ENGINE_ROOT → 'request-engine-root'
TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION → 'request-current-timeline-position'
TimelineEventNames.REQUEST_TIMELINE_CLEANUP → 'request-timeline-cleanup'

// Language Manager Events
TimelineEventNames.REQUEST_LABEL_COLLECTION → 'request-label-collection'
TimelineEventNames.REQUEST_LABEL_COLLECTIONS → 'request-label-collections'
TimelineEventNames.REQUEST_CURRENT_LANGUAGE → 'request-current-language'
TimelineEventNames.LANGUAGE_CHANGE     → 'language-change'

// Controller Events
TimelineEventNames.DOM_MUTATION        → 'dom-mutation'
```

## Event Metadata

Event metadata available for tooling/documentation:

```typescript
import { timelineSeekRequest } from 'eligius/eventbus/events/metadata';

const metadata = timelineSeekRequest();
console.log(metadata.description); // "Request to seek to a specific position..."
console.log(metadata.category);    // "Timeline Control"
console.log(metadata.args);        // [{ name: 'position', type: 'number' }]
```

**Use cases**:
- Documentation generation
- IDE plugins
- Runtime debugging tools
- External integrations

## Common Patterns

### Events with No Arguments

```typescript
/**
 * Request to play the timeline
 * @category Timeline Control
 */
export interface TimelinePlayRequestEvent {
  name: 'timeline-play-request';
  args: []; // Empty tuple, not void
}

// Usage
eventbus.broadcast('timeline-play-request', []); // Must pass empty array
eventbus.on('timeline-play-request', () => { /* no args */ });
```

### Events with Multiple Arguments

```typescript
/**
 * Announces DOM mutations
 * @category Controller Events
 */
export interface DomMutationEvent {
  name: 'dom-mutation';
  args: [mutations: MutationRecord[], target: Element, timestamp: number];
}

// Usage
eventbus.broadcast('dom-mutation', [mutations, element, Date.now()]);
eventbus.on('dom-mutation', (mutations, target, timestamp) => {
  // All parameters automatically typed
});
```

### Events with Topics

Topics remain untyped (user-defined):

```typescript
// Broadcasting to topic
eventbus.broadcastForTopic('custom-event', 'my-topic', [data]);

// Listening to topic
eventbus.on('custom-event', handler, 'my-topic');
```

## Troubleshooting

### "Type '...' is not assignable to type 'EventName'"

**Cause**: Using invalid event name string

**Solution**: Check spelling, use autocomplete, or add event definition

### "Argument of type 'X' is not assignable to parameter of type 'Y'"

**Cause**: Broadcast args or handler params don't match event definition

**Solution**: Check event args tuple type in event definition file

### "Cannot find module 'eligius/eventbus/events/metadata'"

**Cause**: Metadata not generated

**Solution**: Run `npm run events-metadata`

### Event not showing in autocomplete

**Cause**: EventMap not regenerated

**Solution**: Run `npm run events-metadata` to update generated types

## Best Practices

1. **Event Names**: Use kebab-case for consistency
2. **Argument Names**: Use descriptive tuple element names
3. **Documentation**: Always add JSDoc to event interfaces
4. **Categories**: Group related events with @category tag
5. **Private Events**: Mark internal events with @private
6. **Metadata**: Regenerate after adding/modifying events (`npm run events-metadata`)
7. **Testing**: Test event handlers with type-correct arguments

## Breaking Changes

**Major Version Bump Required**

This is a breaking change requiring major version increment:

- `TimelineEventNames` class removed
- Direct string literals replace constants
- Consumers must update imports and event references

**Migration Path**:
1. Review event name mapping (TimelineEventNames → string literals)
2. Replace all `TimelineEventNames.X` with `'event-name'`
3. Remove `TimelineEventNames` imports
4. Run TypeScript compiler
5. Run tests

**No Runtime Behavior Changes**:
- EventBus functionality identical
- All existing tests pass
- Zero performance impact
- Topics work the same way

## Next Steps

- Review [contracts/event-interface.ts](contracts/event-interface.ts) for detailed event definition contract
- Review [contracts/eventbus-interface.ts](contracts/eventbus-interface.ts) for EventBus API contract
- See [data-model.md](data-model.md) for type system architecture
- See [research.md](research.md) for technical decisions and rationale
