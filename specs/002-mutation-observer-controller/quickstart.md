# Quick Start: Mutation Observer Controller

**Feature**: Mutation Observer Controller
**Date**: 2025-11-06

## Overview

The MutationObserverController monitors DOM changes on specific elements and broadcasts mutation events through the Eligius eventbus. This enables reactive behavior in response to attribute changes, child node modifications, and text content updates.

## Basic Usage

### 1. Add Controller to Timeline Action (JSON Configuration)

```json
{
  "name": "ObserveForm",
  "duration": { "start": 0, "end": 60 },
  "startOperations": [
    {
      "systemName": "selectElement",
      "operationData": { "selector": "#contact-form" }
    },
    {
      "systemName": "addControllerToElement",
      "operationData": {
        "controllerName": "MutationObserverController",
        "observeAttributes": true,
        "observeChildList": true,
        "observeCharacterData": false
      }
    }
  ]
}
```

### 2. Listen for Mutation Events

```typescript
import { TimelineEventNames } from 'eligius';

// Subscribe to mutation events
eventbus.on(TimelineEventNames.DOM_MUTATION, (payload) => {
  console.log('Mutations detected:', payload);

  payload.mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'attributes':
        console.log(`Attribute '${mutation.attributeName}' changed on:`, mutation.target);
        break;
      case 'childList':
        console.log('Child nodes added:', mutation.addedNodes);
        console.log('Child nodes removed:', mutation.removedNodes);
        break;
      case 'characterData':
        console.log('Text content changed:', mutation.target);
        break;
    }
  });
});
```

## Configuration Options

### Observe Attributes Only

Monitor changes to element attributes (class, id, data-*, etc.):

```json
{
  "systemName": "addControllerToElement",
  "operationData": {
    "controllerName": "MutationObserverController",
    "observeAttributes": true,
    "observeChildList": false,
    "observeCharacterData": false,
    "attributeOldValue": true
  }
}
```

### Observe Specific Attributes

Filter observation to only specific attributes:

```json
{
  "systemName": "addControllerToElement",
  "operationData": {
    "controllerName": "MutationObserverController",
    "observeAttributes": true,
    "attributeFilter": ["class", "data-status"],
    "attributeOldValue": true
  }
}
```

### Observe Child Nodes Only

Monitor additions and removals of child elements:

```json
{
  "systemName": "addControllerToElement",
  "operationData": {
    "controllerName": "MutationObserverController",
    "observeAttributes": false,
    "observeChildList": true,
    "observeCharacterData": false
  }
}
```

### Observe Entire Subtree

Monitor mutations throughout the element's descendants:

```json
{
  "systemName": "addControllerToElement",
  "operationData": {
    "controllerName": "MutationObserverController",
    "observeAttributes": true,
    "observeChildList": true,
    "observeSubtree": true
  }
}
```

## Common Use Cases

### Use Case 1: Form Validation Feedback

Observe form element changes and trigger validation feedback:

```json
{
  "name": "ValidateFormOnChange",
  "duration": { "start": 0, "end": 300 },
  "startOperations": [
    {
      "systemName": "selectElement",
      "operationData": { "selector": "#registration-form" }
    },
    {
      "systemName": "addControllerToElement",
      "operationData": {
        "controllerName": "MutationObserverController",
        "observeAttributes": true,
        "observeChildList": true,
        "observeSubtree": true,
        "attributeFilter": ["value", "class"]
      }
    }
  ]
}
```

```typescript
// Listen for mutations and trigger validation
eventbus.on(TimelineEventNames.DOM_MUTATION, (payload) => {
  payload.mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const element = mutation.target as HTMLElement;
      if (element.classList.contains('invalid')) {
        // Trigger error message action
        eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, ['ShowValidationError']);
      }
    }
  });
});
```

### Use Case 2: Dynamic Content Loading

Monitor a container for dynamically added content:

```json
{
  "name": "ObserveContentContainer",
  "duration": { "start": 0, "end": 600 },
  "startOperations": [
    {
      "systemName": "selectElement",
      "operationData": { "selector": "#content-stream" }
    },
    {
      "systemName": "addControllerToElement",
      "operationData": {
        "controllerName": "MutationObserverController",
        "observeChildList": true,
        "observeSubtree": false
      }
    }
  ]
}
```

```typescript
// Detect when new content is added
eventbus.on(TimelineEventNames.DOM_MUTATION, (payload) => {
  payload.mutations.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('New content added:', node);
          // Trigger animation or other actions
        }
      });
    }
  });
});
```

### Use Case 3: State Change Monitoring

Watch for data-state attribute changes:

```json
{
  "name": "MonitorComponentState",
  "duration": { "start": 0, "end": 120 },
  "startOperations": [
    {
      "systemName": "selectElement",
      "operationData": { "selector": ".state-machine" }
    },
    {
      "systemName": "addControllerToElement",
      "operationData": {
        "controllerName": "MutationObserverController",
        "observeAttributes": true,
        "attributeFilter": ["data-state"],
        "attributeOldValue": true
      }
    }
  ]
}
```

```typescript
// React to state transitions
eventbus.on(TimelineEventNames.DOM_MUTATION, (payload) => {
  payload.mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
      const element = mutation.target as HTMLElement;
      const oldState = mutation.oldValue;
      const newState = element.getAttribute('data-state');

      console.log(`State transition: ${oldState} → ${newState}`);

      // Trigger actions based on state transitions
      if (newState === 'loading') {
        eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, ['ShowSpinner']);
      } else if (newState === 'loaded') {
        eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, ['HideSpinner']);
      }
    }
  });
});
```

## Programmatic Usage (Configuration API)

### Using ConfigurationFactory

```typescript
import { ConfigurationFactory } from 'eligius';

const factory = new ConfigurationFactory();

const config = factory
  .withEngine('EligiusEngine')
  .withContainerSelector('#app')
  .addTimeline('main')
    .withDuration(60)
    .addTimelineAction('ObserveMutations', 0, 60)
      .addStartOperation('selectElement', { selector: '#dynamic-content' })
      .addStartOperation('addControllerToElement', {
        controllerName: 'MutationObserverController',
        observeAttributes: true,
        observeChildList: true,
        observeCharacterData: false,
        observeSubtree: true
      })
    .end()
  .end()
  .build();
```

## Event Payload Structure

When mutations are detected, the controller broadcasts events with this structure:

```typescript
{
  mutations: [
    {
      type: 'attributes',           // or 'childList' or 'characterData'
      target: HTMLElement,          // Element that was mutated
      attributeName: 'class',       // For attribute mutations
      oldValue: 'old-class',        // If attributeOldValue: true
      addedNodes: NodeList,         // For childList mutations
      removedNodes: NodeList,       // For childList mutations
      previousSibling: Node | null,
      nextSibling: Node | null
    }
  ],
  target: HTMLElement,              // The observed element
  timestamp: 1699564832145          // When mutation was detected
}
```

## Best Practices

### 1. Filter to Specific Mutation Types

Only observe the mutation types you need to avoid unnecessary events:

```json
{
  "observeAttributes": true,
  "observeChildList": false,
  "observeCharacterData": false
}
```

### 2. Use Attribute Filters

When observing attributes, specify only the attributes you care about:

```json
{
  "observeAttributes": true,
  "attributeFilter": ["class", "data-status", "aria-expanded"]
}
```

### 3. Avoid Observing Subtree Unless Necessary

Subtree observation can generate many events for deeply nested structures:

```json
{
  "observeSubtree": false  // Only observe direct target element
}
```

### 4. Clean Up Listeners

Remove eventbus listeners when they're no longer needed:

```typescript
const removeListener = eventbus.on(TimelineEventNames.DOM_MUTATION, handler);

// Later, clean up
removeListener();
```

### 5. Batch Processing

Process multiple mutations together instead of handling each individually:

```typescript
eventbus.on(TimelineEventNames.DOM_MUTATION, (payload) => {
  // Process all mutations in batch
  const attributeChanges = payload.mutations.filter(m => m.type === 'attributes');
  const childListChanges = payload.mutations.filter(m => m.type === 'childList');

  // Handle each type efficiently
  if (attributeChanges.length > 0) {
    handleAttributeChanges(attributeChanges);
  }
  if (childListChanges.length > 0) {
    handleChildListChanges(childListChanges);
  }
});
```

## Troubleshooting

### No Mutations Detected

1. Verify the element exists: Check that `selectedElement` contains a valid DOM node
2. Check observation options: At least one of `observeAttributes`, `observeChildList`, or `observeCharacterData` must be `true`
3. Verify mutations are happening: Use browser DevTools to confirm changes are occurring

### Too Many Events

1. Use `attributeFilter` to limit which attributes trigger events
2. Set `observeSubtree: false` if you don't need to observe descendants
3. Disable unnecessary observation types (`observeCharacterData: false` if not needed)

### Memory Leaks

1. Ensure controller is properly detached when timeline action ends
2. Remove eventbus listeners when components are destroyed
3. Avoid creating closures in mutation handlers that capture large objects

## Performance Considerations

- **High-frequency mutations**: MutationObserver batches mutations automatically, but processing many mutations can still impact performance
- **Subtree observation**: Observing large DOM trees can generate many events
- **Event handler complexity**: Keep mutation handlers lightweight; offload heavy processing to requestAnimationFrame or setTimeout

## Next Steps

- Read the [Implementation Plan](plan.md) for technical details
- Review [Data Model](data-model.md) for interface specifications
- See [Contracts](contracts/mutation-observer-controller.ts) for TypeScript definitions
