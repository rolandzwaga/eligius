# Data Model: Mutation Observer Controller

**Feature**: Mutation Observer Controller
**Date**: 2025-11-06

## Overview

The Mutation Observer Controller uses a simple data model consisting of configuration metadata for the controller and mutation event payloads for eventbus broadcasting.

## Entities

### IMutationObserverControllerMetadata

Controller configuration interface passed to `init()` method.

**Purpose**: Configure observation behavior and specify target element

**Properties**:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `selectedElement` | `JQuery` | Yes | N/A | jQuery-wrapped DOM element to observe. Marked as `@dependency` in metadata annotations. |
| `observeAttributes` | `boolean` | No | `true` | When true, observe attribute changes on the target element |
| `observeChildList` | `boolean` | No | `true` | When true, observe additions and removals of child nodes |
| `observeCharacterData` | `boolean` | No | `true` | When true, observe changes to text content (character data) |
| `observeSubtree` | `boolean` | No | `false` | When true, observe mutations throughout the subtree (descendants) |
| `attributeOldValue` | `boolean` | No | `false` | When true, record previous attribute values in mutation records |
| `characterDataOldValue` | `boolean` | No | `false` | When true, record previous text values in mutation records |
| `attributeFilter` | `string[]` | No | `undefined` | Array of specific attribute local names to observe. If omitted, all attributes are observed when `observeAttributes` is true. |

**Metadata Annotations** (for JSON schema generation):
```typescript
/**
 * @dependency
 */
selectedElement: JQuery;

/**
 * @optional
 */
observeAttributes?: boolean;

/**
 * @optional
 */
observeChildList?: boolean;

// ... (remaining optional properties)
```

**Validation Rules**:
- At least one of `observeAttributes`, `observeChildList`, or `observeCharacterData` must be `true`
- `attributeOldValue` requires `observeAttributes` to be `true` (or will default to true automatically)
- `characterDataOldValue` requires `observeCharacterData` to be `true` (or will default to true automatically)
- `selectedElement` must contain a valid DOM node (`.get(0)` must not be `undefined`)

**Relationships**:
- Passed to `MutationObserverController.init()`
- Stored in `this.operationData` via BaseController
- Used to build `MutationObserverInit` options for native observer

### MutationEvent (Event Payload)

Event data broadcasted through Eligius eventbus when mutations are detected.

**Purpose**: Notify consumers of DOM mutations with full mutation details

**Event Name**: `TimelineEventNames.DOM_MUTATION` (new constant to be added)

**Payload Structure**:

| Property | Type | Description |
|----------|------|-------------|
| `mutations` | `MutationRecord[]` | Array of native MutationRecord objects from the observer callback |
| `target` | `Element` | Reference to the observed element (native DOM node, not jQuery wrapper) |
| `timestamp` | `number` | Timestamp when mutations were detected (via `Date.now()`) |

**MutationRecord Properties** (from browser API):

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'attributes' \| 'characterData' \| 'childList'` | Type of mutation that occurred |
| `target` | `Node` | The node affected by the mutation |
| `addedNodes` | `NodeList` | Nodes added (for `childList` mutations) |
| `removedNodes` | `NodeList` | Nodes removed (for `childList` mutations) |
| `previousSibling` | `Node \| null` | Previous sibling of added/removed nodes |
| `nextSibling` | `Node \| null` | Next sibling of added/removed nodes |
| `attributeName` | `string \| null` | Name of changed attribute (for `attributes` mutations) |
| `attributeNamespace` | `string \| null` | Namespace of changed attribute |
| `oldValue` | `string \| null` | Previous value (if `attributeOldValue` or `characterDataOldValue` was true) |

**Example Event Broadcast**:
```typescript
eventbus.broadcast(TimelineEventNames.DOM_MUTATION, [
  {
    mutations: [
      {
        type: 'attributes',
        target: divElement,
        attributeName: 'class',
        oldValue: 'old-class',
        // ... other MutationRecord properties
      }
    ],
    target: divElement,
    timestamp: 1699564832145
  }
]);
```

**Relationships**:
- Broadcasted by `MutationObserverController._handleMutations()`
- Consumed by eventbus listeners registered by application code
- Contains native `MutationRecord` objects (not transformed)

## State Management

### Controller Instance State

| State Variable | Type | Lifecycle | Description |
|----------------|------|-----------|-------------|
| `operationData` | `IMutationObserverControllerMetadata \| null` | Set in `init()`, cleared on GC | Controller configuration |
| `observer` | `MutationObserver \| null` | Created in `attach()`, cleared in `detach()` | Native observer instance |
| `eventListeners` | `TEventbusRemover[]` | Managed by BaseController | Cleanup functions for eventbus listeners |

### State Transitions

```
[Created]
   ↓ init(metadata)
[Initialized] (operationData set, observer = null)
   ↓ attach(eventbus)
[Observing] (observer created and observing)
   ↓ detach(eventbus)
[Detached] (observer disconnected, observer = null)
   ↓ (can call attach() again to re-observe)
[Observing] ...
```

**Valid Transitions**:
- `Created → Initialized`: Call `init()`
- `Initialized → Observing`: Call `attach()`
- `Observing → Detached`: Call `detach()`
- `Detached → Observing`: Call `attach()` again (re-observation)

**Invalid Transitions** (guarded):
- `Created → Observing`: Cannot attach without init (guarded by `if (!this.operationData)`)
- `Observing → Observing`: Calling attach twice should guard against duplicate observers

## Data Flow

```
1. JSON Configuration
   ↓ (parsed by Eligius engine)
2. IMutationObserverControllerMetadata
   ↓ (passed to controller.init())
3. Stored in this.operationData
   ↓ (used in attach())
4. MutationObserverInit options
   ↓ (built from metadata)
5. Native MutationObserver.observe()
   ↓ (DOM mutations detected)
6. MutationRecord[] in callback
   ↓ (wrapped with metadata)
7. MutationEvent payload
   ↓ (broadcasted via eventbus)
8. Consumer event handlers
```

## Validation

### At Init Time
- Validate `selectedElement` is not null/undefined
- Deep copy `operationData` to prevent external mutation

### At Attach Time
- Validate `selectedElement.get(0)` returns a valid DOM node
- Validate at least one observation type is enabled
- Throw error if validation fails (fail fast)

### At Runtime
- No validation needed (browser API handles invalid states)
- Observer callback always receives valid `MutationRecord[]`

## Memory Management

### Resources to Clean Up (in detach())
1. **MutationObserver**: Call `disconnect()` to stop observation
2. **Observer reference**: Set `this.observer = null`
3. **Event listeners**: Call `super.detach()` to remove eventbus listeners (BaseController handles this)

### Memory Leak Prevention
- Observer disconnected in `detach()` prevents continued observation of removed elements
- No circular references (observer callback is bound method, not closure with external references)
- Event listeners cleaned up by BaseController pattern

## Type Definitions Location

All TypeScript interfaces will be defined in:
- `src/controllers/mutation-observer-controller.ts` (controller and metadata interface)
- `src/timeline-event-names.ts` (DOM_MUTATION constant)

No new central type files needed.
