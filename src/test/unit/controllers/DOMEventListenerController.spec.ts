import {DOMEventListenerController} from '@controllers/dom-event-listener-controller.ts';
import type {IEventbus} from '@eventbus/index.ts';
import {createMockAction} from '@test/fixtures/action-factory.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

function createMockEventbusWithActionCallback() {
  return {
    request: vi.fn((_topic: string, actionName: string) => {
      return createMockAction(actionName);
    }),
  };
}

function createMockElement(tagName = 'select') {
  let storedEventName = '';
  let storedEventHandler: Function = () => '';

  return {
    tagName,
    get eventName() {
      return storedEventName;
    },
    get eventHandler() {
      return storedEventHandler;
    },
    on: vi.fn((eventName: string, eventHandler: Function) => {
      storedEventName = eventName;
      storedEventHandler = eventHandler;
    }),
    off: vi.fn((eventName: string) => {
      storedEventName = eventName;
    }),
  };
}

type DOMEventListenerControllerSuiteContext = {
  controller: DOMEventListenerController;
  eventbus: IEventbus;
  selectedElement: ReturnType<typeof createMockElement>;
  operationData: any;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<DOMEventListenerControllerSuiteContext>('DOMEventListenerController', () => {
  beforeEach(context => {
    withContext<DOMEventListenerControllerSuiteContext>(context);

    context.controller = new DOMEventListenerController();
    context.eventbus =
      createMockEventbusWithActionCallback() as unknown as IEventbus;
    context.selectedElement = createMockElement();
    context.operationData = {
      selectedElement: context.selectedElement,
      eventName: 'test',
      actions: ['actionName1', 'actionName2'],
      actionOperationData: {
        test: 'test',
      },
    };
  });
  test<DOMEventListenerControllerSuiteContext>('should create the DOMEventListenerController', context => {
    // given
    const {controller} = context;

    expect(controller.name).toBe('DOMEventListenerController');
    expect(controller.operationData).toBeUndefined();
    expect(controller.actionInstanceInfos).toBeUndefined();
  });
  test<DOMEventListenerControllerSuiteContext>('should initialize the DOMEventListenerController', context => {
    // given
    const {controller, operationData} = context;
    // test
    controller.init(operationData);

    // expect
    expect(controller.operationData?.selectedElement).toBe(
      operationData.selectedElement
    );
    expect(controller.operationData?.eventName).toBe(operationData.eventName);
    expect(controller.operationData?.actions.length).toBe(2);
    expect(controller.operationData?.actionOperationData?.test).toBe('test');
  });
  test<DOMEventListenerControllerSuiteContext>('should attach properly', context => {
    // given
    const {controller, operationData, eventbus} = context;

    controller.init(operationData);

    // test
    controller.attach(eventbus);

    // expect
    expect(controller.actionInstanceInfos?.length).toBe(2);
    expect(controller.actionInstanceInfos?.[0].action?.name).toBe(
      'actionName1'
    );
    expect(controller.actionInstanceInfos?.[1].action?.name).toBe(
      'actionName2'
    );
    expect(controller.actionInstanceInfos?.[0].start).toBe(true);
    expect(controller.actionInstanceInfos?.[1].start).toBe(true);
    expect(operationData.selectedElement.eventName).toBe('test');
  });
  test<DOMEventListenerControllerSuiteContext>('should detach properly', context => {
    // given
    const {controller, operationData, eventbus} = context;

    controller.init(operationData);
    controller.attach(eventbus);
    const handler = operationData.selectedElement.eventHandler;

    // test
    controller.detach(eventbus as any as IEventbus);

    // expect: only this controller's own handler is removed
    expect(operationData.selectedElement.off).toHaveBeenCalledWith(
      'test',
      handler
    );
    expect(controller.actionInstanceInfos).toBeUndefined();
  });

  test<DOMEventListenerControllerSuiteContext>('given a controller that was never attached, when detach is called, then no handlers are removed from the element', context => {
    const {controller, operationData, eventbus} = context;
    controller.init(operationData);

    controller.detach(eventbus);

    expect(operationData.selectedElement.off).not.toHaveBeenCalled();
  });

  test<DOMEventListenerControllerSuiteContext>('given two DOMEventListenerControllers listening for click on the same element, when one is detached, then a click still executes the other controller actions', async context => {
    const {eventbus} = context;
    const button = $('<button/>').appendTo(document.body);
    const hostHandler = vi.fn();
    button.on('click', hostHandler);

    const first = new DOMEventListenerController();
    const second = new DOMEventListenerController();
    first.init({selectedElement: button, eventName: 'click', actions: ['a1']});
    second.init({selectedElement: button, eventName: 'click', actions: ['a2']});
    first.attach(eventbus);
    second.attach(eventbus);

    first.detach(eventbus);
    button.trigger('click');

    const secondAction = second.actionInstanceInfos?.[0]
      .action as unknown as ReturnType<typeof createMockAction>;
    await vi.waitFor(() => expect(secondAction.start).toHaveBeenCalledTimes(1));
    expect(hostHandler).toHaveBeenCalledTimes(1);
    button.remove();
  });

  test<DOMEventListenerControllerSuiteContext>('given a detached controller, when attach is called again, then a click executes its actions once', async context => {
    const {eventbus} = context;
    const button = $('<button/>').appendTo(document.body);
    const controller = new DOMEventListenerController();
    controller.init({
      selectedElement: button,
      eventName: 'click',
      actions: ['a1'],
    });
    controller.attach(eventbus);
    controller.detach(eventbus);

    controller.attach(eventbus);
    button.trigger('click');

    const action = controller.actionInstanceInfos?.[0]
      .action as unknown as ReturnType<typeof createMockAction>;
    await vi.waitFor(() => expect(action.start).toHaveBeenCalledTimes(1));
    button.remove();
  });
  test<DOMEventListenerControllerSuiteContext>('should call the select event handler', async context => {
    // given
    const {controller, operationData, eventbus} = context;

    const event = {
      target: {
        value: 'test',
      },
    };
    controller.init(operationData);
    controller.attach(eventbus as any);

    // test
    operationData.selectedElement.eventHandler(event);

    // expect
    const expectedOperatonData = Object.assign(
      {
        eventTarget: {
          value: 'test',
        },
      },
      controller.operationData?.actionOperationData
    );

    // Wait for async action execution using vi.waitFor instead of setTimeout
    await vi.waitFor(() => {
      const action0 = controller.actionInstanceInfos?.[0]
        .action as unknown as ReturnType<typeof createMockAction>;
      expect(action0.startOperationData).toEqual(expectedOperatonData);
    });

    const action1 = controller.actionInstanceInfos?.[1]
      .action as unknown as ReturnType<typeof createMockAction>;
    expect(action1.startOperationData).toEqual(expectedOperatonData);
  });

  test<DOMEventListenerControllerSuiteContext>('should call the textinput event handler', async context => {
    // given
    const {controller, eventbus} = context;
    const inputElement = createMockElement('input');

    const event = {
      target: {
        value: 'testTextInput',
      },
    };
    const operationData = {
      selectedElement: inputElement as unknown as JQuery<HTMLElement>,
      eventName: 'test',
      actions: ['actionName1', 'actionName2'],
      actionOperationData: {
        test: 'test',
      },
    };
    controller.init(operationData);
    controller.attach(eventbus as any);

    // test
    inputElement.eventHandler(event);

    // expect
    const expectedOperatonData = Object.assign(
      {
        eventTarget: {
          value: 'testTextInput',
        },
      },
      controller.operationData?.actionOperationData
    );

    // Wait for async action execution using vi.waitFor instead of setTimeout
    await vi.waitFor(() => {
      const action0 = controller.actionInstanceInfos?.[0]
        .action as unknown as ReturnType<typeof createMockAction>;
      expect(action0.startOperationData).toEqual(expectedOperatonData);
    });

    const action1 = controller.actionInstanceInfos?.[1]
      .action as unknown as ReturnType<typeof createMockAction>;
    expect(action1.startOperationData).toEqual(expectedOperatonData);
  });
});
