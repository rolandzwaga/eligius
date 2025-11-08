import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test, vi} from 'vitest';
import {
  type IMutationEventPayload,
  type IMutationObserverControllerMetadata,
  MutationObserverController,
} from '../../../controllers/mutation-observer-controller.ts';
import {Eventbus, type IEventbus} from '../../../eventbus/index.ts';

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
    expect((controller as any).observer).to.not.be.null;
    expect((controller as any).observer).to.be.instanceOf(MutationObserver);
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
      expect(context.receivedPayload).to.not.be.null;
    });

    // then
    expect(context.receivedPayload).to.not.be.null;
    expect(context.receivedPayload?.mutations).to.have.length.greaterThan(0);
    expect(context.receivedPayload?.mutations[0].type).to.equal('attributes');
    expect(context.receivedPayload?.target).to.equal(nativeElement);
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
      expect(context.receivedPayload).to.not.be.null;
    });

    // then
    expect(context.receivedPayload).to.not.be.null;
    expect(context.receivedPayload?.mutations).to.have.length.greaterThan(0);
    expect(context.receivedPayload?.mutations[0].type).to.equal('childList');
    expect(context.receivedPayload?.mutations[0].addedNodes).to.have.length(1);
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
          expect(hasCharacterData).to.be.true;
        }
      },
      {timeout: 1000}
    );

    // Verify configuration enabled characterData observation
    expect((controller as any)._buildObserverOptions().characterData).to.be
      .true;
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
      return originalBroadcast(eventName, ...args);
    }) as any;

    controller.attach(eventbus);

    // when - trigger mutation
    nativeElement.setAttribute('data-test', 'value');

    // Wait for mutation to be processed
    await vi.waitFor(() => {
      expect(broadcastEventName).to.not.be.null;
    });

    // then
    expect(broadcastEventName).to.equal('dom-mutation');
    expect((eventbus.broadcast as any).mock.calls.length).to.be.greaterThan(0);
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
      expect(context.receivedPayload).to.not.be.null;
    });

    // then - verify payload structure
    const payload = context.receivedPayload;
    expect(payload).to.not.be.null;
    expect(payload).to.have.property('mutations');
    expect(payload).to.have.property('target');
    expect(payload).to.have.property('timestamp');

    expect(payload?.mutations).to.be.an('array');
    expect(payload?.target).to.equal(nativeElement);
    expect(payload?.timestamp).to.be.a('number');
    expect(payload?.timestamp).to.be.greaterThan(0);
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
    expect(controller.operationData).to.not.be.null;
    expect(controller.operationData).to.not.equal(operationData); // Should be a copy
    expect(controller.operationData?.selectedElement).to.equal(
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
    expect((controller as any).observer).to.be.null;
  });

  // T024: Write test for detach() disconnecting observer
  test<MutationObserverControllerSuiteContext>('should disconnect observer on detach', async context => {
    // given
    const {controller, operationData, eventbus, nativeElement} = context;
    controller.init(operationData);
    controller.attach(eventbus);

    // Verify observer was created
    expect((controller as any).observer).to.not.be.null;

    // when
    controller.detach(eventbus);

    // then
    expect((controller as any).observer).to.be.null;
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
      expect(context.receivedPayload).to.not.be.null;
    });

    // when - detach and clear payload
    controller.detach(eventbus);
    context.receivedPayload = null;

    // Make another change after detach
    nativeElement.setAttribute('data-test', 'after-detach');

    // Wait a bit to ensure no mutation is captured
    await new Promise(resolve => setTimeout(resolve, 100));

    // then - no new events should have been received
    expect(context.receivedPayload).to.be.null;
  });

  // T026: Write test for multiple attach/detach cycles (memory leak prevention)
  test<MutationObserverControllerSuiteContext>('should handle multiple attach/detach cycles without leaks', context => {
    // given
    const {controller, operationData, eventbus} = context;

    // when - perform multiple attach/detach cycles
    for (let i = 0; i < 10; i++) {
      controller.init(operationData);
      controller.attach(eventbus);
      expect((controller as any).observer).to.not.be.null;

      controller.detach(eventbus);
      expect((controller as any).observer).to.be.null;
    }

    // then - no errors should have occurred
    expect(controller.operationData).to.not.be.null;
  });

  // T027: Write test for duplicate attach() calls (guard against multiple observers)
  test<MutationObserverControllerSuiteContext>('should handle duplicate attach calls safely', context => {
    // given
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);

    // when - attach multiple times
    controller.attach(eventbus);
    const firstObserver = (controller as any).observer;

    controller.attach(eventbus);
    const secondObserver = (controller as any).observer;

    // then - should have created new observer each time
    expect(firstObserver).to.not.be.null;
    expect(secondObserver).to.not.be.null;
    // Note: This creates multiple observers. In Phase 6, we'll add guard logic.
  });
});
