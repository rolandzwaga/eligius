import {DOMEventListenerController} from '@controllers/dom-event-listener-controller.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
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
  test<DOMEventListenerControllerSuiteContext>("given a DOMEventListenerController attached with actions ['a','b'] where action a's start rejects, when the element's click event fires, then the rejection is reported (no unhandled rejection) and action b's start is not called", async context => {
    const {eventbus} = context;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const button = $('<button/>').appendTo(document.body);
    const controller = new DOMEventListenerController();
    controller.init({
      selectedElement: button,
      eventName: 'click',
      actions: ['a', 'b'],
    });
    controller.attach(eventbus);
    const [infoA, infoB] = controller.actionInstanceInfos ?? [];
    const actionA = infoA.action as unknown as ReturnType<
      typeof createMockAction
    >;
    const actionB = infoB.action as unknown as ReturnType<
      typeof createMockAction
    >;
    const failure = new Error('boom');
    actionA.start.mockRejectedValueOnce(failure);

    try {
      button.trigger('click');

      await vi.waitFor(() =>
        expect(consoleError).toHaveBeenCalledWith(
          "DOMEventListenerController: action 'a' (start) failed for DOM event 'click'",
          failure
        )
      );
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(actionB.start).not.toHaveBeenCalled();
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
      button.remove();
    }
  });

  test('given an eventbus with reportError, when an action fails for a DOM event, then the failure goes to reportError naming the controller and keeps the original error as cause', async () => {
    const onHandlerError = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const eventbus = new Eventbus({onHandlerError});
    const failing = createMockAction('a');
    const failure = new Error('boom');
    failing.start.mockRejectedValueOnce(failure);
    eventbus.onRequest('request-action', () => failing as any);
    const reportError = vi.spyOn(eventbus, 'reportError');
    const button = $('<button/>').appendTo(document.body);
    const controller = new DOMEventListenerController();
    controller.init({
      selectedElement: button,
      eventName: 'click',
      actions: ['a'],
    });
    controller.attach(eventbus);

    try {
      button.trigger('click');

      await vi.waitFor(() => expect(reportError).toHaveBeenCalledTimes(1));
      const [reported, context] = reportError.mock.calls[0];
      expect(context).toEqual({source: 'DOMEventListenerController'});
      expect((reported as Error).message).toBe(
        "DOMEventListenerController: action 'a' (start) failed for DOM event 'click'"
      );
      expect((reported as Error).cause).toBe(failure);
      expect(onHandlerError).toHaveBeenCalledWith(
        reported,
        expect.objectContaining({
          source: 'reported',
          reporter: 'DOMEventListenerController',
        })
      );
      expect(consoleError).toHaveBeenCalledWith(
        'Error reported by DOMEventListenerController:',
        reported
      );
    } finally {
      button.remove();
    }
  });

  test('given request-action throws a did-you-mean hint, when attach is called, then the error names the controller, the action, the event and keeps the hint', () => {
    const hint = new Error("Unknown action 'Shwo'. Did you mean 'Show'?");
    const eventbus = {
      request: vi.fn(() => {
        throw hint;
      }),
    } as unknown as IEventbus;
    const controller = new DOMEventListenerController();
    controller.init({
      selectedElement: createMockElement() as any,
      eventName: 'click',
      actions: ['Shwo'],
    });

    let error: any;
    try {
      controller.attach(eventbus);
    } catch (thrown) {
      error = thrown;
    }

    expect(error.message).toBe(
      `DOMEventListenerController: unknown action "Shwo" for DOM event "click". Unknown action 'Shwo'. Did you mean 'Show'?`
    );
    expect(error.cause).toBe(hint);
  });

  test<DOMEventListenerControllerSuiteContext>("given actions ['a','end:b'] where b's end rejects, when the event fires, then that failure is reported too", async context => {
    const {eventbus} = context;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const button = $('<button/>').appendTo(document.body);
    const controller = new DOMEventListenerController();
    controller.init({
      selectedElement: button,
      eventName: 'click',
      actions: ['a', 'end:b'],
    });
    controller.attach(eventbus);
    const actionB = controller.actionInstanceInfos?.[1]
      .action as unknown as ReturnType<typeof createMockAction>;
    actionB.end.mockRejectedValueOnce(new Error('end failed'));

    button.trigger('click');

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "DOMEventListenerController: action 'b' (end) failed for DOM event 'click'",
        expect.any(Error)
      )
    );
    button.remove();
  });

  test<DOMEventListenerControllerSuiteContext>('given an action name that request-action does not know, when attach is called, then it throws an error naming the controller, the action and the event', context => {
    const {operationData} = context;
    const eventbus = {
      request: vi.fn((_topic: string, name: string) =>
        name === 'actionName2' ? undefined : createMockAction(name)
      ),
    } as unknown as IEventbus;
    const controller = new DOMEventListenerController();
    controller.init({
      ...operationData,
      actions: ['actionName1', 'end:actionName2'],
    });

    expect(() => controller.attach(eventbus)).toThrow(
      'DOMEventListenerController: unknown action "actionName2" for DOM event "test"'
    );
    expect(operationData.selectedElement.on).not.toHaveBeenCalled();
    expect(controller.actionInstanceInfos).toBeUndefined();
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
