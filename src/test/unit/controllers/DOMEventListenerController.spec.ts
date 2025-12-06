import {DOMEventListenerController} from '@controllers/dom-event-listener-controller.ts';
import type {IEventbus} from '@eventbus/index.ts';
import {createMockAction} from '@test/fixtures/action-factory.ts';
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

    // test
    controller.detach(eventbus as any as IEventbus);

    // expect
    expect(operationData.selectedElement.eventName).toBe('test');
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

    await new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });

    expect(
      (
        controller.actionInstanceInfos?.[0].action as unknown as ReturnType<
          typeof createMockAction
        >
      ).startOperationData
    ).toEqual(expectedOperatonData);
    expect(
      (
        controller.actionInstanceInfos?.[1].action as unknown as ReturnType<
          typeof createMockAction
        >
      ).startOperationData
    ).toEqual(expectedOperatonData);
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

    await new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });

    expect(
      (
        controller.actionInstanceInfos?.[0].action as unknown as ReturnType<
          typeof createMockAction
        >
      ).startOperationData
    ).toEqual(expectedOperatonData);
    expect(
      (
        controller.actionInstanceInfos?.[1].action as unknown as ReturnType<
          typeof createMockAction
        >
      ).startOperationData
    ).toEqual(expectedOperatonData);
  });
});
