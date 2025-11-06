# Research: Mutation Observer Controller

**Date**: 2025-11-06
**Context**: Phase 0 research for MutationObserverController implementation

## Research Questions

1. How to use MutationObserver API correctly?
2. How to unwrap jQuery elements to native DOM nodes?
3. How to test DOM observers with Vitest?
4. How to structure controller lifecycle (init/attach/detach)?

## Findings

### 1. MutationObserver API Patterns

**Documentation Source**: Context7 - `/mdn/content` (MDN Web Docs, Trust Score: 9.9)

**Decision**: Use native browser MutationObserver API with standard observer lifecycle pattern

**API Signatures**:
```typescript
// Constructor
const observer = new MutationObserver(callback);

// Callback signature
callback(mutations: MutationRecord[], observer: MutationObserver): void

// Start observing
observer.observe(target: Node, options: MutationObserverInit): void

// Stop observing
observer.disconnect(): void

// Get pending mutations before disconnect
observer.takeRecords(): MutationRecord[]
```

**MutationObserverInit Options**:
```typescript
interface MutationObserverInit {
  childList?: boolean;        // Watch for child node additions/removals
  attributes?: boolean;        // Watch for attribute changes
  characterData?: boolean;     // Watch for text content changes
  subtree?: boolean;          // Observe descendants as well
  attributeOldValue?: boolean; // Capture old attribute values
  characterDataOldValue?: boolean; // Capture old text values
  attributeFilter?: string[]; // Specific attributes to observe
}
```

**Best Practices from MDN**:
- At least one of `childList`, `attributes`, or `characterData` must be `true`
- `attributeOldValue` requires `attributes: true` (or will default to true)
- `characterDataOldValue` requires `characterData: true` (or will default to true)
- Call `disconnect()` to stop observation and release resources
- Optionally call `takeRecords()` before disconnect to process pending mutations

**Rationale**: Native browser API, well-supported, no polyfill needed. Standard pattern matches Eligius controller lifecycle.

### 2. jQuery Element Unwrapping

**Documentation Source**: Context7 - `/jquery/jquery` (jQuery, Trust Score: 8.9)

**Decision**: Use `.get(0)` or `[0]` to unwrap jQuery element to native DOM node

**Pattern**:
```typescript
// jQuery wrapped element
const $element: JQuery = $('#myElement');

// Unwrap to native DOM node (two equivalent approaches)
const nativeNode1: Element = $element.get(0);
const nativeNode2: Element = $element[0];

// For MutationObserver
const observer = new MutationObserver(callback);
observer.observe($element.get(0), options);
```

**Rationale**: MutationObserver requires native DOM Node, not jQuery wrapper. jQuery provides standard unwrapping via `.get(0)` or bracket notation `[0]`.

**Alternatives Considered**:
- Using jQuery directly with MutationObserver - Not possible, API requires native Node
- Converting entire codebase away from jQuery - Out of scope, jQuery is peer dependency

### 3. Vitest DOM Testing Patterns

**Documentation Source**: Context7 - `/vitest-dev/vitest` (Vitest v3.2.4, Trust Score: 8.3)

**Decision**: Use JSDOM environment with beforeEach/afterEach lifecycle hooks for clean test isolation

**Test Environment Configuration**:
```typescript
// vitest.config.ts (already configured in Eligius)
export default defineConfig({
  test: {
    environment: 'jsdom', // Enables DOM APIs in tests
  },
})
```

**Test Structure Pattern**:
```typescript
import { beforeEach, afterEach, describe, test, expect, vi } from 'vitest';

describe('MutationObserverController', () => {
  let controller: MutationObserverController;
  let mockEventbus: IEventbus;
  let testElement: HTMLElement;

  beforeEach(() => {
    // Setup clean DOM and mocks before each test
    testElement = document.createElement('div');
    document.body.appendChild(testElement);

    mockEventbus = {
      broadcast: vi.fn(),
      on: vi.fn(),
    };

    controller = new MutationObserverController();
  });

  afterEach(() => {
    // Cleanup after each test
    controller.detach(mockEventbus);
    document.body.removeChild(testElement);
  });

  test('observes attribute changes', () => {
    // Arrange
    const metadata = {
      selectedElement: $(testElement),
      observeAttributes: true,
      observeChildList: false,
      observeCharacterData: false,
    };

    controller.init(metadata);
    controller.attach(mockEventbus);

    // Act
    testElement.setAttribute('data-test', 'value');

    // Assert
    expect(mockEventbus.broadcast).toHaveBeenCalledWith(
      TimelineEventNames.DOM_MUTATION,
      expect.arrayContaining([
        expect.objectContaining({
          type: 'attributes',
          attributeName: 'data-test',
        })
      ])
    );
  });
});
```

**Async Testing with vi.waitFor**:
```typescript
test('handles async mutations', async () => {
  controller.init(metadata);
  controller.attach(mockEventbus);

  // Trigger async DOM change
  setTimeout(() => {
    testElement.appendChild(document.createElement('span'));
  }, 10);

  // Wait for mutation to be observed and broadcasted
  await vi.waitFor(() => {
    expect(mockEventbus.broadcast).toHaveBeenCalled();
  }, { timeout: 500, interval: 20 });
});
```

**Rationale**: Vitest with JSDOM provides full DOM API support. beforeEach/afterEach ensures test isolation. Mocking eventbus allows verification of broadcasted events without full Eligius engine.

### 4. Controller Lifecycle Pattern (from LabelController)

**Documentation Source**: Existing Eligius codebase - `src/controllers/label-controller.ts` and `src/controllers/base-controller.ts`

**Decision**: Follow established BaseController pattern with init/attach/detach lifecycle

**Pattern from LabelController**:
```typescript
export class LabelController extends BaseController<ILabelControllerMetadata> {
  name = 'LabelController';
  // Private instance variables
  currentLanguage: string | null = null;
  labelData: Record<string, string> = {};

  init(operationData: ILabelControllerMetadata) {
    this.operationData = Object.assign({}, operationData);
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    // Setup listeners using BaseController.addListener
    this.addListener(
      eventbus,
      TimelineEventNames.LANGUAGE_CHANGE,
      this._handleLanguageChange
    );

    // Initialize controller-specific logic
    this._setLabel();
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus); // Cleans up listeners automatically
    // Controller-specific cleanup
    this.requestLabelDataBound = undefined;
  }

  private _handleLanguageChange(code: string) {
    // Event handler logic
  }
}
```

**Applying to MutationObserverController**:
```typescript
export class MutationObserverController extends BaseController<IMutationObserverControllerMetadata> {
  name = 'MutationObserverController';
  private observer: MutationObserver | null = null;

  init(operationData: IMutationObserverControllerMetadata) {
    this.operationData = Object.assign({}, operationData);
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    // Create observer with bound callback
    this.observer = new MutationObserver(
      this._handleMutations.bind(this, eventbus)
    );

    // Start observing (unwrap jQuery element)
    const nativeElement = this.operationData.selectedElement.get(0);
    this.observer.observe(nativeElement, this._buildObserverOptions());
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus); // BaseController cleanup

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private _handleMutations(eventbus: IEventbus, mutations: MutationRecord[]) {
    // Broadcast each mutation through eventbus
    eventbus.broadcast(TimelineEventNames.DOM_MUTATION, [mutations]);
  }

  private _buildObserverOptions(): MutationObserverInit {
    // Build options from metadata with defaults
  }
}
```

**Rationale**: Extending BaseController provides automatic event listener cleanup via `super.detach()`. Pattern matches existing controllers (LabelController, LottieController, etc.). Keeps controller logic consistent across codebase.

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Observer API** | Native MutationObserver | Browser standard, well-supported, no dependencies |
| **jQuery Unwrapping** | `.get(0)` method | Standard jQuery pattern for accessing native node |
| **Test Framework** | Vitest with JSDOM | Already configured in Eligius, full DOM support |
| **Controller Pattern** | Extend BaseController | Matches existing Eligius patterns, automatic cleanup |
| **Event Broadcasting** | Via IEventbus.broadcast() | Standard Eligius event pattern |
| **Lifecycle Management** | init/attach/detach | Established Eligius controller lifecycle |

## Implementation Notes

### Observer Options Defaults

Based on spec requirements (FR-011), use these defaults if not specified:
```typescript
{
  attributes: true,
  childList: true,
  characterData: true,
  subtree: false,
  attributeOldValue: false,
  characterDataOldValue: false,
  // attributeFilter: undefined (observe all attributes)
}
```

### Event Payload Structure

Broadcast mutation events with this structure:
```typescript
eventbus.broadcast(TimelineEventNames.DOM_MUTATION, [
  {
    mutations: MutationRecord[], // Array of mutation records from observer
    target: Element,              // The observed element (for reference)
    timestamp: number             // When mutation was detected
  }
]);
```

### Edge Case Handling

1. **Element removed while observing**: Observer continues but no more mutations fire (natural behavior)
2. **Multiple attach() calls**: Guard with null check on `this.observer` to prevent duplicate observers
3. **Missing element**: Check `selectedElement.get(0)` exists before calling `observe()`
4. **Missing eventbus**: Cannot guard - eventbus is required parameter in attach()

## Dependencies Confirmed

- **MutationObserver API**: Native browser API (IE11+, all modern browsers) ✓
- **jQuery 3.7.1**: Peer dependency, already available ✓
- **BaseController**: Existing Eligius class ✓
- **IEventbus**: Existing Eligius interface ✓
- **Vitest 3.2.4**: Already configured with JSDOM ✓
- **TypeScript 5.9.3**: Already configured ✓

No new dependencies required.

## Next Steps (Phase 1)

1. Create `data-model.md` defining IMutationObserverControllerMetadata interface
2. Create `contracts/mutation-observer-controller.ts` with TypeScript interfaces
3. Create `quickstart.md` with usage examples
4. Update agent context files with MutationObserver research findings
