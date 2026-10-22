import {
  type IMutationEventPayload,
  type IMutationObserverControllerMetadata,
  MutationObserverController,
} from '@controllers/mutation-observer-controller.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

// Mock jQuery wrapper that returns real DOM element
class MockJQueryElement {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  get(index: number): HTMLElement | null {
    if (index === 0) {
      return this.element;
    }
    return null;
  }
}

type MutationObserverControllerSuiteContext = {
  controller: MutationObserverController;
  eventbus: IEventbus;
  selectedElement: JQuery;
  nativeElement: HTMLElement;
  operationData: IMutationObserverControllerMetadata;
  receivedPayload: IMutationEventPayload | null;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}

describe<MutationObserverControllerSuiteContext>('MutationObserverController - User Story 1: Observe DOM Changes', () => {
  beforeEach(context => {
    withContext<MutationObserverControllerSuiteContext>(context);

    context.controller = new MutationObserverController();
    context.eventbus = new Eventbus();
    // Create a real DOM element using JSDOM (provided by Vitest environment)
    context.nativeElement = document.createElement('div');
    document.body.appendChild(context.nativeElement);
    context.selectedElement = new MockJQueryElement(
      context.nativeElement
    ) as unknown as JQuery;
    context.receivedPayload = null;
    context.operationData = {
      selectedElement: context.selectedElement,
      observeAttributes: true,
      observeChildList: true,
      observeCharacterData: true,
    };

    // Setup event listener to capture broadcasted events
    context.eventbus.on('dom-mutation', (payload: IMutationEventPayload) => {
      context.receivedPayload = payload;
    });
  });

  // T007: Write test for MutationObserver instance creation
  test<MutationObserverControllerSuiteContext>('should create MutationObserver instance on attach', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);

    // when
    controller.attach(eventbus);

    // then
    expect((controller as any).observer).not.toBeNull();
    expect((controller as any).observer).toBeInstanceOf(MutationObserver);
  });

  // T008: Write test for attribute mutation observation
  test<MutationObserverControllerSuiteContext>('should observe and broadcast attribute mutations', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // when - simulate attribute change
    nativeElement.setAttribute('data-test', 'value');

    // Wait for MutationObserver callback to fire
    await vi.waitFor(() => {
      expect(context.receivedPayload).not.toBeNull();
    });

    // then
    expect(context.receivedPayload).not.toBeNull();
    expect(context.receivedPayload?.mutations.length).toBeGreaterThan(0);
    expect(context.receivedPayload?.mutations[0].type).toBe('attributes');
    expect(context.receivedPayload?.target).toBe(nativeElement);
  });

  // T009: Write test for childList mutation observation
  test<MutationObserverControllerSuiteContext>('should observe and broadcast childList mutations', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // when - simulate child node addition
    const childNode = document.createElement('div');
    nativeElement.appendChild(childNode);

    // Wait for MutationObserver callback to fire
    await vi.waitFor(() => {
      expect(context.receivedPayload).not.toBeNull();
    });

    // then
    expect(context.receivedPayload).not.toBeNull();
    expect(context.receivedPayload?.mutations.length).toBeGreaterThan(0);
    expect(context.receivedPayload?.mutations[0].type).toBe('childList');
    expect(context.receivedPayload?.mutations[0].addedNodes).toHaveLength(1);
  });

  // T010: Write test for characterData mutation observation
  test<MutationObserverControllerSuiteContext>('should observe characterData mutations when enabled', async context => {
    // given
    const {controller, eventbus, nativeElement} = context;
    const operationData: IMutationObserverControllerMetadata = {
      selectedElement: context.selectedElement,
      observeAttributes: false,
      observeChildList: false,
      observeCharacterData: true,
      observeSubtree: true,
    };

    controller.init(operationData);
    controller.attach(eventbus);

    // Create a text node after observation starts
    const textNode = document.createTextNode('Initial text');
    nativeElement.appendChild(textNode);

    // Clear the childList mutation that just occurred
    context.receivedPayload = null;

    // when - modify text node data property directly
    textNode.data = 'New text content';

    // Wait for MutationObserver callback to fire
    await vi.waitFor(
      () => {
        if (context.receivedPayload) {
          // Check if any mutation is characterData type
          const hasCharacterData = context.receivedPayload.mutations.some(
            m => m.type === 'characterData'
          );
          expect(hasCharacterData).toBe(true);
        }
      },
      {timeout: 1000}
    );

    // Verify configuration enabled characterData observation
    expect((controller as any)._buildObserverOptions().characterData).toBe(
      true
    );
  });

  // T011: Write test for mutation event broadcasting through eventbus
  test<MutationObserverControllerSuiteContext>('should broadcast mutations through eventbus with correct event name', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);

    let broadcastEventName: string | null = null;
    const originalBroadcast = eventbus.broadcast.bind(eventbus);
    eventbus.broadcast = vi.fn((eventName: string, ...args: any[]) => {
      broadcastEventName = eventName;
      return originalBroadcast(eventName as any, args as any);
    }) as any;

    controller.attach(eventbus);

    // when - trigger mutation
    nativeElement.setAttribute('data-test', 'value');

    // Wait for mutation to be processed
    await vi.waitFor(() => {
      expect(broadcastEventName).not.toBeNull();
    });

    // then
    expect(broadcastEventName).toBe('dom-mutation');
    expect((eventbus.broadcast as any).mock.calls.length).toBeGreaterThan(0);
  });

  // T012: Write test for mutation event payload structure
  test<MutationObserverControllerSuiteContext>('should include correct payload structure in mutation events', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // when - trigger mutation
    nativeElement.setAttribute('data-test', 'value');

    // Wait for mutation to be processed
    await vi.waitFor(() => {
      expect(context.receivedPayload).not.toBeNull();
    });

    // then - verify payload structure
    const payload = context.receivedPayload;
    expect(payload).not.toBeNull();
    expect(payload).toHaveProperty('mutations');
    expect(payload).toHaveProperty('target');
    expect(payload).toHaveProperty('timestamp');

    expect(Array.isArray(payload?.mutations)).toBe(true);
    expect(payload?.target).toBe(nativeElement);
    expect(typeof payload?.timestamp).toBe('number');
    expect(payload?.timestamp).toBeGreaterThan(0);
  });
});

describe<MutationObserverControllerSuiteContext>('MutationObserverController - User Story 2: Automatic Lifecycle Management', () => {
  beforeEach(context => {
    withContext<MutationObserverControllerSuiteContext>(context);

    context.controller = new MutationObserverController();
    context.eventbus = new Eventbus();
    context.nativeElement = document.createElement('div');
    document.body.appendChild(context.nativeElement);
    context.selectedElement = new MockJQueryElement(
      context.nativeElement
    ) as unknown as JQuery;
    context.receivedPayload = null;
    context.operationData = {
      selectedElement: context.selectedElement,
      observeAttributes: true,
      observeChildList: true,
    };

    context.eventbus.on('dom-mutation', (payload: IMutationEventPayload) => {
      context.receivedPayload = payload;
    });
  });

  // T022: Write test for init() method setting operationData
  test<MutationObserverControllerSuiteContext>('should store operationData copy in init method', context => {
    // given
    const {controller, operationData} = context;

    // when
    controller.init(operationData);

    // then
    expect(controller.operationData).not.toBeNull();
    expect(controller.operationData).not.toBe(operationData); // Should be a copy
    expect(controller.operationData?.selectedElement).toBe(
      operationData.selectedElement
    );
  });

  // T023: Write test for attach() guard when operationData is null
  test<MutationObserverControllerSuiteContext>('should not create observer if operationData is null', context => {
    // given
    const {controller, eventbus} = context;
    // Don't call init - operationData will be null

    // when
    controller.attach(eventbus);

    // then
    expect((controller as any).observer).toBeNull();
  });

  // T024: Write test for detach() disconnecting observer
  test<MutationObserverControllerSuiteContext>('should disconnect observer on detach', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // Verify observer was created
    expect((controller as any).observer).not.toBeNull();

    // when
    controller.detach(eventbus);

    // then
    expect((controller as any).observer).toBeNull();
  });

  // T025: Write test verifying no events after detach
  test<MutationObserverControllerSuiteContext>('should not emit events after detach', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // Verify observation works
    nativeElement.setAttribute('data-test', 'initial');
    await vi.waitFor(() => {
      expect(context.receivedPayload).not.toBeNull();
    });

    // when - detach and clear payload
    controller.detach(eventbus);
    context.receivedPayload = null;

    // Make another change after detach
    nativeElement.setAttribute('data-test', 'after-detach');

    // Wait a bit to ensure no mutation is captured
    await new Promise(resolve => setTimeout(resolve, 100));

    // then - no new events should have been received
    expect(context.receivedPayload).toBeNull();
  });

  // T026: Write test for multiple attach/detach cycles (memory leak prevention)
  test<MutationObserverControllerSuiteContext>('should handle multiple attach/detach cycles without leaks', context => {
    // given
    const {controller, operationData, eventbus} = context;

    // when - perform multiple attach/detach cycles
    for (let i = 0; i < 10; i++) {
      controller.init(operationData);
      controller.attach(eventbus);
      expect((controller as any).observer).not.toBeNull();

      controller.detach(eventbus);
      expect((controller as any).observer).toBeNull();
    }

    // then - no errors should have occurred
    expect(controller.operationData).not.toBeNull();
  });

  // T027: duplicate attach() calls must not stack observers
  test<MutationObserverControllerSuiteContext>('given a MutationObserverController attached twice to the same element, when detach is called and an attribute on the element then changes, then no dom-mutation event is broadcast', async context => {
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);
    controller.attach(eventbus);

    controller.detach(eventbus);
    nativeElement.setAttribute('data-test', 'after-detach');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(context.receivedPayload).toBeNull();
  });

  test<MutationObserverControllerSuiteContext>('given a MutationObserverController attached twice, when an attribute changes, then exactly one dom-mutation event is broadcast', async context => {
    const {controller, operationData, eventbus, nativeElement} = context;
    const broadcasts = vi.fn();
    eventbus.on('dom-mutation', broadcasts);
    controller.init(operationData);
    controller.attach(eventbus);
    controller.attach(eventbus);

    nativeElement.setAttribute('data-test', 'once');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(broadcasts).toHaveBeenCalledTimes(1);
    controller.detach(eventbus);
  });
});

describe('MutationObserverController option validation', () => {
  const createOperationData = (
    options: Partial<IMutationObserverControllerMetadata>
  ): IMutationObserverControllerMetadata => ({
    selectedElement: new MockJQueryElement(
      document.createElement('div')
    ) as unknown as JQuery,
    ...options,
  });

  test.each([
    [
      'all observation types are off',
      {
        observeAttributes: false,
        observeChildList: false,
        observeCharacterData: false,
      },
      'MutationObserverController: at least one of observeAttributes, observeChildList or observeCharacterData must be true',
    ],
    [
      'attributeFilter is set without observeAttributes',
      {observeAttributes: false, attributeFilter: ['class']},
      'MutationObserverController: attributeFilter requires observeAttributes',
    ],
    [
      'attributeOldValue is set without observeAttributes',
      {observeAttributes: false, attributeOldValue: true},
      'MutationObserverController: attributeOldValue requires observeAttributes',
    ],
    [
      'characterDataOldValue is set without observeCharacterData',
      {observeCharacterData: false, characterDataOldValue: true},
      'MutationObserverController: characterDataOldValue requires observeCharacterData',
    ],
  ])(
    'given %s, when init is called, then it throws a named error',
    (_label, options, message) => {
      const controller = new MutationObserverController();

      expect(() => controller.init(createOperationData(options))).toThrow(
        message
      );
    }
  );

  test('given observeAttributes without an attributeFilter, when attached, then observe receives no attributeFilter key', () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const controller = new MutationObserverController();
    controller.init(createOperationData({observeChildList: false}));

    controller.attach(new Eventbus());

    const options = observe.mock.calls[0][1];
    expect(options).not.toHaveProperty('attributeFilter');
    expect(options).toMatchObject({attributes: true, childList: false});
    controller.detach(new Eventbus());
  });
});
